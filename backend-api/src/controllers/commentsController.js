const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Contrôleur pour la gestion des commentaires aux fails
 */
class CommentsController {
  static async ensureAuxTables() {
    // Create auxiliary tables if missing for reactions/reports/moderation
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS comment_reactions (
        id CHAR(36) NOT NULL,
        comment_id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'like',
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_comment_user (comment_id, user_id),
        KEY idx_comment (comment_id),
        KEY idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS comment_reports (
        id CHAR(36) NOT NULL,
        comment_id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        reason TEXT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_report_comment_user (comment_id, user_id),
        KEY idx_comment (comment_id),
        KEY idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS comment_moderation (
        comment_id CHAR(36) NOT NULL,
        status ENUM('under_review','hidden','approved') NOT NULL DEFAULT 'under_review',
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (comment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  static async getPointsConfig() {
    try {
      const rows = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['points']);
      if (rows.length > 0) {
        const cfg = JSON.parse(rows[0].value || '{}');
        return {
          commentCreate: Number(cfg.commentCreate) || 2,
          commentLikeReward: Number(cfg.commentLikeReward) || 1,
          commentReportThreshold: Number(cfg.commentReportThreshold) || 10
        };
      }
    } catch (_) {}
    return { commentCreate: 2, commentLikeReward: 1, commentReportThreshold: 10 };
  }

  // profiles.stats.couragePoints deprecated — use user_points

  /**
   * Ajouter un commentaire à un fail
   */
  static async addComment(req, res) {
    try {

      const { id: failId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      // Validation du contenu
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Le contenu du commentaire est requis',
          code: 'MISSING_CONTENT'
        });
      }

      if (content.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Le commentaire ne peut pas dépasser 1000 caractères',
          code: 'CONTENT_TOO_LONG'
        });
      }

      // Vérifier que le fail existe et est accessible
      const fails = await executeQuery(`
        SELECT id, user_id, is_anonyme
        FROM fails
        WHERE id = ?
      `, [failId]);

      if (fails.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Fail non trouvé',
          code: 'FAIL_NOT_FOUND'
        });
      }

      const fail = fails[0];
      // Aucune restriction d'accès basée sur l'anonymat

      // Créer le commentaire
      const commentId = uuidv4();
      
      await executeQuery(`
        INSERT INTO comments (
          id, fail_id, user_id, content, is_encouragement, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 1, NOW(), NOW())
      `, [commentId, failId, userId, content.trim()]);

      // Mettre à jour le compteur de commentaires du fail
      await executeQuery(`
        UPDATE fails SET comments_count = COALESCE(comments_count, 0) + 1, updated_at = NOW() WHERE id = ?
      `, [failId]);

      // Award user_points for comment creation
      const pointsCfg = await CommentsController.getPointsConfig();
      if (pointsCfg.commentCreate > 0) {
        try {
          const { v4: uuidv4 } = require('uuid');
          await executeQuery(
            `INSERT INTO user_points (user_id, points_total, created_at, updated_at)
             VALUES (?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE points_total = points_total + VALUES(points_total), updated_at = NOW()`,
            [userId, pointsCfg.commentCreate]
          );
          await executeQuery(
            `INSERT INTO user_point_events (id, user_id, amount, source, fail_id, reaction_type, meta, created_at)
             VALUES (?, ?, ?, 'comment_create', ?, NULL, NULL, NOW())`,
            [uuidv4(), userId, pointsCfg.commentCreate, failId]
          );
        } catch (e) {
          console.warn('⚠️ Award user_points on comment create (ignore):', e?.message);
        }
      }

      // Récupérer le commentaire créé avec les infos de l'utilisateur
      const newComment = await executeQuery(`
        SELECT 
          c.id,
          c.content,
          c.fail_id,
          c.created_at,
          c.updated_at,
          p.display_name,
          p.avatar_url,
          u.id as user_id
        FROM comments c
        JOIN users u ON c.user_id = u.id
        JOIN profiles p ON u.id = p.user_id
        WHERE c.id = ?
      `, [commentId]);

      res.status(201).json({
        success: true,
        message: 'Commentaire ajouté avec succès',
        data: {
          id: newComment[0].id,
          content: newComment[0].content,
          failId: newComment[0].fail_id,
          author: {
            id: newComment[0].user_id,
            displayName: newComment[0].display_name,
            avatarUrl: newComment[0].avatar_url
          },
          createdAt: newComment[0].created_at,
          updatedAt: newComment[0].updated_at
        }
      });

    } catch (error) {
      console.error('❌ Erreur ajout commentaire:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout du commentaire',
        code: 'COMMENT_CREATE_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Récupérer tous les commentaires d'un fail
   */
  static async getComments(req, res) {
    try {
      const { id: failId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const userId = req.user ? req.user.id : null;

      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      const offset = (pageNum - 1) * limitNum;

      // Vérifier que le fail existe et est accessible
      const fails = await executeQuery(`
        SELECT id, user_id, is_anonyme
        FROM fails
        WHERE id = ?
      `, [failId]);

      if (fails.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Fail non trouvé',
          code: 'FAIL_NOT_FOUND'
        });
      }

      const fail = fails[0];
      // Aucune restriction d'accès basée sur l'anonymat

      // Récupérer les commentaires avec pagination
      const comments = await executeQuery(`
        SELECT 
          c.id,
          c.content,
          c.fail_id,
          c.created_at,
          c.updated_at,
          p.display_name,
          p.avatar_url,
          u.id as user_id,
          cm.status as moderation_status
        FROM comments c
        JOIN users u ON c.user_id = u.id
        JOIN profiles p ON u.id = p.user_id
        LEFT JOIN comment_moderation cm ON cm.comment_id = c.id
        WHERE c.fail_id = ?
          AND (cm.status IS NULL OR cm.status = 'approved')
        ORDER BY c.created_at ASC
        LIMIT ? OFFSET ?
      `, [failId, limitNum, offset], { textProtocol: true });

      // Compter le total de commentaires
      const totalResult = await executeQuery(`
        SELECT COUNT(*) as total
        FROM comments
        WHERE fail_id = ?
      `, [failId]);

      const total = totalResult[0].total;
      const totalPages = Math.ceil(total / limitNum);

      // Construire une liste plate (pas de fil de discussion dans le schéma actuel)
      const flat = comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        failId: comment.fail_id,
        author: {
          id: comment.user_id,
          displayName: comment.display_name,
          avatarUrl: comment.avatar_url
        },
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        repliesCount: 0,
        likesCount: 0,
        replies: [],
        moderationStatus: comment.moderation_status || null
      }));

      res.json({
        success: true,
        data: {
          comments: flat,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: total,
            totalPages: totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
          }
        }
      });

    } catch (error) {
      console.error('❌ Erreur récupération commentaires:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des commentaires',
        code: 'COMMENTS_FETCH_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Modifier un commentaire
   */
  static async updateComment(req, res) {
    try {
      const { id: failId, commentId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      // Validation du contenu
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Le contenu du commentaire est requis',
          code: 'MISSING_CONTENT'
        });
      }

      if (content.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Le commentaire ne peut pas dépasser 1000 caractères',
          code: 'CONTENT_TOO_LONG'
        });
      }

      // Vérifier que le commentaire existe et appartient à l'utilisateur
      const comments = await executeQuery(`
        SELECT id, user_id, fail_id
        FROM comments
        WHERE id = ? AND fail_id = ?
      `, [commentId, failId]);

      if (comments.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Commentaire non trouvé',
          code: 'COMMENT_NOT_FOUND'
        });
      }

      const comment = comments[0];

      if (comment.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez modifier que vos propres commentaires',
          code: 'ACCESS_DENIED'
        });
      }

      // Mettre à jour le commentaire
      await executeQuery(`
        UPDATE comments
        SET content = ?, updated_at = NOW()
        WHERE id = ?
      `, [content.trim(), commentId]);

      // Récupérer le commentaire mis à jour
      const updatedComment = await executeQuery(`
        SELECT 
          c.id,
          c.content,
          c.fail_id,
          c.created_at,
          c.updated_at,
          p.display_name,
          p.avatar_url,
          u.id as user_id
        FROM comments c
        JOIN users u ON c.user_id = u.id
        JOIN profiles p ON u.id = p.user_id
        WHERE c.id = ?
      `, [commentId]);

      res.json({
        success: true,
        message: 'Commentaire mis à jour avec succès',
        data: {
          id: updatedComment[0].id,
          content: updatedComment[0].content,
          failId: updatedComment[0].fail_id,
          author: {
            id: updatedComment[0].user_id,
            displayName: updatedComment[0].display_name,
            avatarUrl: updatedComment[0].avatar_url
          },
          createdAt: updatedComment[0].created_at,
          updatedAt: updatedComment[0].updated_at
        }
      });

    } catch (error) {
      console.error('❌ Erreur modification commentaire:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la modification du commentaire',
        code: 'COMMENT_UPDATE_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Supprimer un commentaire
   */
  static async deleteComment(req, res) {
    try {
      await CommentsController.ensureAuxTables();
      const { id: failId, commentId } = req.params;
      const userId = req.user.id;

      // Vérifier que le commentaire existe et appartient à l'utilisateur
      const comments = await executeQuery(`
        SELECT id, user_id, fail_id
        FROM comments 
        WHERE id = ? AND fail_id = ?
      `, [commentId, failId]);

      if (comments.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Commentaire non trouvé',
          code: 'COMMENT_NOT_FOUND'
        });
      }

      const comment = comments[0];

      if (comment.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez supprimer que vos propres commentaires',
          code: 'ACCESS_DENIED'
        });
      }

      // Supprimer le commentaire
      const result = await executeQuery(`
        DELETE FROM comments
        WHERE id = ?
      `, [commentId]);

      // Mettre à jour le compteur (décrémenter sans passer sous 0)
      await executeQuery(`
        UPDATE fails SET comments_count = GREATEST(COALESCE(comments_count,0) - 1, 0), updated_at = NOW() WHERE id = ?
      `, [failId]);

      // Décrémenter les user_points du commentateur (symétrique à addComment)
      try {
        const pointsCfg = await CommentsController.getPointsConfig();
        const delta = Math.max(0, Number(pointsCfg.commentCreate) || 0);
        if (delta > 0) {
          // Décrémenter aussi user_points et tracer l'event
          const { v4: uuidv4 } = require('uuid');
          await executeQuery(
            `INSERT INTO user_points (user_id, points_total, created_at, updated_at)
             VALUES (?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE points_total = points_total + VALUES(points_total), updated_at = NOW()`,
            [userId, -delta]
          );
          await executeQuery(
            `INSERT INTO user_point_events (id, user_id, amount, source, fail_id, reaction_type, meta, created_at)
             VALUES (?, ?, ?, 'comment_delete_revoke', ?, NULL, NULL, NOW())`,
            [uuidv4(), userId, -delta, failId]
          );
        }
      } catch (e) {
        console.warn('⚠️ Décrément points commentaire (ignore):', e?.message);
      }

      res.json({
        success: true,
        message: `Commentaire supprimé avec succès (${result.affectedRows} éléments)`,
        data: {
          deletedCount: result.affectedRows
        }
      });

    } catch (error) {
      console.error('❌ Erreur suppression commentaire:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du commentaire',
        code: 'COMMENT_DELETE_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Récupérer les statistiques des commentaires d'un utilisateur
   */
  static async getUserCommentStats(req, res) {
    
    try {
      const userId = req.user.id;

      // Compter les commentaires écrits par l'utilisateur
      const writtenComments = await executeQuery(`
        SELECT COUNT(*) as count
        FROM comments 
        WHERE user_id = ?
      `, [userId]);

      // Compter les commentaires reçus sur les fails de l'utilisateur
      const receivedComments = await executeQuery(`
        SELECT COUNT(*) as count
        FROM comments c
        JOIN fails f ON c.fail_id = f.id
        WHERE f.user_id = ? AND c.user_id != ?
      `, [userId, userId]);
      
      res.json({
        success: true,
        data: {
          written: writtenComments[0].count,
          received: receivedComments[0].count
        }
      });

    } catch (error) {
      console.error('❌ Erreur stats commentaires utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        code: 'USER_STATS_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = CommentsController;
