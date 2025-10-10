const { executeQuery, executeTransaction } = require('../config/database');
const { logSystem } = require('../utils/logger');

/**
 * Map a raw database fail row to the API contract
 */
function mapFailRow(fail) {
  return {
    id: fail.id,
    title: fail.title,
    description: fail.description,
    category: fail.category,
    imageUrl: fail.image_url,
    authorId: fail.user_id,
    authorName: fail.display_name,
    authorAvatar: fail.avatar_url,
    reactions: {
      courage: Number(fail.courage_count || 0),
      empathy: Number(fail.empathy_count || 0),
      laugh:   Number(fail.laugh_count   || 0),
      support: Number(fail.support_count || 0)
    },
    commentsCount: fail.comments_count,
    is_anonyme: !!fail.is_anonyme,
    createdAt: new Date(fail.created_at).toISOString(),
    updatedAt: new Date(fail.updated_at).toISOString(),
    userReaction: fail.user_reaction,
    moderationStatus: fail.moderation_status // null par défaut, approved seulement si validé après signalement
  };
}

/**
 * Contrôleur pour la gestion des fails
 */
class FailsController {

  /**
   * Créer un nouveau fail
   */
  static async createFail(req, res) {
    try {
      const {
        title,
        description,
        category = 'Général',
        is_anonyme = false,
        imageUrl = null
      } = req.body;

      const userId = req.user.id;

      // Validation
      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Le titre est obligatoire'
        });
      }

      if (title.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Le titre ne peut pas dépasser 200 caractères'
        });
      }

      const normalizedDescription = typeof description === 'string' ? description.trim() : '';

      if (normalizedDescription.length > 2000) {
        return res.status(400).json({
          success: false,
          message: 'La description ne peut pas dépasser 2000 caractères'
        });
      }

      // Générer un UUID pour le fail
      const { v4: uuidv4 } = require('uuid');
      const failId = uuidv4();

      // Créer le fail
      // Déterminer le pays depuis headers (cf-ipcountry/x-country-code) si disponible
      const countryHeader = (req.headers['cf-ipcountry'] || req.headers['x-country-code'] || req.headers['x-app-country'] || '').toString().trim().toUpperCase();
      const countryCode = /^[A-Z]{2}$/.test(countryHeader) ? countryHeader : null;
      const failQuery = `
        INSERT INTO fails (
          id, user_id, title, description, category, country_code,
          is_anonyme, image_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const failValues = [
        failId,
        userId,
        title.trim(),
        normalizedDescription,
        category,
        countryCode,
        is_anonyme,
        imageUrl
      ];

      await executeQuery(failQuery, failValues);

      // Par défaut: aucun enregistrement de modération -> visible jusqu'à signalements suffisants.

      // Award points to author (configurable)
      try {
        const rows = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['points']);
        let cfg = { failCreate: 10 };
        if (rows && rows[0] && rows[0].value) { try { cfg = { ...cfg, ...JSON.parse(rows[0].value) }; } catch {} }
        const amount = Number(cfg.failCreate) || 0;
        if (amount > 0) {
          await executeQuery(
            `INSERT INTO user_points (user_id, points_total, created_at, updated_at)
             VALUES (?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE points_total = points_total + VALUES(points_total), updated_at = NOW()`,
            [userId, amount]
          );
          await executeQuery(
            `INSERT INTO user_point_events (id, user_id, amount, source, fail_id, reaction_type, meta, created_at)
             VALUES (?, ?, ?, 'fail_create', ?, NULL, NULL, NOW())`,
            [uuidv4(), userId, amount, failId]
          );
        }
      } catch (e) {
        console.warn('⚠️ Award failCreate points (ignore):', e?.message);
      }

      // Récupérer le fail créé avec les informations utilisateur
      const createdFail = await FailsController.getFailById(failId, userId);
      const createdFailMapped = mapFailRow(createdFail);

      // Mettre à jour les statistiques utilisateur
      await FailsController.updateUserStats(userId, 'fail_created');

      // Vérifier les badges potentiels
      console.log(`🏆 APPEL checkBadgeProgress pour utilisateur ${userId}`);
      await FailsController.checkBadgeProgress(userId, 'fail_created');
      console.log(`🏆 FIN checkBadgeProgress pour utilisateur ${userId}`);

      console.log(`✅ Fail créé: ${failId} par utilisateur ${userId}`);
      await logSystem({ level: 'info', action: 'fail_create', message: 'Fail created', details: { failId, title, category, is_anonyme }, userId });

      res.status(201).json({
        success: true,
        message: 'Fail créé avec succès',
        fail: createdFailMapped
      });

    } catch (error) {
      console.error('❌ Erreur création fail:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du fail',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Récupérer les fails avec pagination et filtres
   */
  static async getFails(req, res) {
    try {
      // Version simplifiée copiant getPublicFails qui fonctionne
      const rawLimit  = Number(req.query.limit);
      const rawPage   = Number(req.query.page);
      const rawOffset = Number(req.query.offset);

      const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;

      const useOffset = Number.isFinite(rawOffset) && rawOffset >= 0;
      const offset = useOffset
        ? rawOffset
        : ((Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1) - 1) * limit;
      const page = useOffset ? Math.floor(offset / limit) + 1
                             : (Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1);

      // Requête SANS paramètres préparés pour LIMIT (problème MySQL 9.1.0)
      const sql = `
      SELECT f.*, p.display_name, p.avatar_url, fm.status AS moderation_status,
             (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id) as reactions_count,
             (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'courage') as courage_count,
             (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'empathy') as empathy_count,
             (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'laugh')   as laugh_count,
             (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'support') as support_count
      FROM fails f
      JOIN users u    ON f.user_id = u.id
      JOIN profiles p ON u.id = p.user_id
      LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
      WHERE (fm.status IS NULL OR fm.status NOT IN ('hidden','rejected'))
      ORDER BY f.created_at DESC, f.id DESC
      LIMIT ${offset}, ${limit}`;

      const rows = await executeQuery(sql);

      // Mapping identique à getPublicFails
      const processed = rows.map((row) => {
        const mapped = mapFailRow(row);
        const isAnon = !!row.is_anonyme;
        mapped.is_anonyme = isAnon;

        if (isAnon) {
          mapped.authorName   = 'Anonyme';
          mapped.authorAvatar = 'assets/profil/anonymous.png';
        } else {
          mapped.authorName   = mapped.authorName   ?? row.display_name;
          mapped.authorAvatar = mapped.authorAvatar ?? row.avatar_url;
        }
        return mapped;
      });

      const hasMore   = processed.length === limit;
      const nextOffset = offset + processed.length;

      res.json({
        success: true,
        fails: processed,
        pagination: {
          page,
          limit,
          offset,
          hasMore,
          nextOffset: hasMore ? nextOffset : null
        }
      });

    } catch (error) {
      console.error('❌ Erreur récupération fails:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des fails',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

/**
 * Récupérer tous les fails avec anonymisation conditionnelle
 * - Scroll infini supporté via ?offset=
 * - Pagination classique via ?page=
 */
  static async getAnonymeFails(req, res) {
  try {
    // 1) Params robustes
    const rawLimit  = Number(req.query.limit);
    const rawPage   = Number(req.query.page);
    const rawOffset = Number(req.query.offset);

    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;

    const useOffset = Number.isFinite(rawOffset) && rawOffset >= 0;
    const offset = useOffset
      ? rawOffset
      : ((Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1) - 1) * limit;
    const page = useOffset ? Math.floor(offset / limit) + 1
                           : (Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1);

    // 2) Requête : pas de filtre sur is_anonyme (tout est visible)
    //    Ordre stable pour éviter doublons/manqués si nouveaux posts arrivent
    //    N'afficher publiquement que les fails approuvés (ou anciens sans enregistrement de modération)
    const sql = `
      SELECT f.*, p.display_name, p.avatar_url, fm.status AS moderation_status,
             (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id) as reactions_count,
             (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'courage') as courage_count,
             (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'empathy') as empathy_count,
             (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'laugh')   as laugh_count,
             (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'support') as support_count
      FROM fails f
      JOIN users u    ON f.user_id = u.id
      JOIN profiles p ON u.id = p.user_id
      LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
      WHERE (fm.status IS NULL OR fm.status NOT IN ('hidden','rejected'))
      ORDER BY f.created_at DESC, f.id DESC
      LIMIT ?, ?`;

    const rows = await executeQuery(sql, [offset, limit], { textProtocol: true });

    // 3) Mapping + anonymisation (si is_anonyme = 1)
    const processed = rows.map((row) => {
      const mapped = mapFailRow(row);
      const isAnon = !!row.is_anonyme; // tinyint -> bool
      mapped.is_anonyme = isAnon;

      if (isAnon) {
        mapped.authorName   = 'Anonyme';
        mapped.authorAvatar = 'assets/profil/anonymous.png';
      } else {
        // si mapFailRow ne les renseigne pas déjà :
        mapped.authorName   = mapped.authorName   ?? row.display_name;
        mapped.authorAvatar = mapped.authorAvatar ?? row.avatar_url;
      }
      return mapped;
    });

    // 4) Infinite scroll : pas besoin de COUNT (perf)
    const hasMore   = processed.length === limit;
    const nextOffset = offset + processed.length;

    res.json({
      success: true,
      fails: processed,
      pagination: {
        page,
        limit,
        offset,
        hasMore,
        nextOffset: hasMore ? nextOffset : null
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération fails anonymes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des fails anonymes'
    });
  }
}

  // Compat: ancien nom
  static async getPublicFails(req, res) {
    return FailsController.getAnonymeFails(req, res);
  }


  /**
   * Récupérer un fail par ID
   */
  static async getFailById(failId, userId = null) {
    try {
      console.log('🔍 getFailById called with:', { failId, userId });
      
      const query = `
        SELECT
          f.*,
          p.display_name,
          p.avatar_url,
          fm.status AS moderation_status,
          (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id) as reactions_count,
          (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'courage') as courage_count,
          (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'empathy') as empathy_count,
          (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'laugh')   as laugh_count,
          (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'support') as support_count,
          (SELECT COUNT(*) FROM comments fc WHERE fc.fail_id = f.id) as comments_count,
          ${userId ? `(SELECT reaction_type FROM reactions WHERE fail_id = f.id AND user_id = ?) as user_reaction` : 'NULL as user_reaction'}
        FROM fails f
        JOIN users u ON f.user_id = u.id
        JOIN profiles p ON u.id = p.user_id
        LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
        WHERE f.id = ? AND (fm.status IS NULL OR fm.status NOT IN ('hidden','rejected') OR f.user_id = ?)
      `;

      const params = userId ? [userId, failId, userId] : [failId, null];
      console.log('🔍 Query:', query);
      console.log('🔍 Params:', params);
      
      const results = await executeQuery(query, params);

      if (results.length === 0) {
        return null;
      }

      const fail = results[0];
      return {
        ...fail,
        is_anonyme: !!fail.is_anonyme,
        created_at: new Date(fail.created_at).toISOString(),
        updated_at: new Date(fail.updated_at).toISOString()
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer un fail par ID (endpoint)
   */
  static async getFailByIdEndpoint(req, res) {    
    try {
      const { id } = req.params;
      const userId = req.user ? req.user.id : null;

      const fail = await FailsController.getFailById(id, userId);

      if (!fail) {
        return res.status(404).json({
          success: false,
          message: 'Fail non trouvé'
        });
      }

      // Vérifier si l'utilisateur peut voir ce fail
      // No visibility restriction based on anonymity

      // Incrémenter le compteur de vues si ce n'est pas l'auteur
      if (userId && fail.user_id !== userId) {
        await FailsController.incrementViewCount(id, userId);
      }

      const mappedFail = mapFailRow(fail);

      res.json({
        success: true,
        fail: mappedFail
      });

    } catch (error) {
      console.error('❌ Erreur récupération fail:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du fail',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Mettre à jour un fail
   */
  static async updateFail(req, res) {
    
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      // Vérifier que le fail existe et appartient à l'utilisateur
      const existingFail = await FailsController.getFailById(id, userId);
      
      if (!existingFail) {
        return res.status(404).json({
          success: false,
          message: 'Fail non trouvé'
        });
      }

      if (existingFail.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez modifier que vos propres fails'
        });
      }

      const sanitizedUpdate = { ...updateData };

      if (Object.prototype.hasOwnProperty.call(sanitizedUpdate, 'title')) {
        if (!sanitizedUpdate.title || sanitizedUpdate.title.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Le titre est obligatoire'
          });
        }
        if (sanitizedUpdate.title.length > 200) {
          return res.status(400).json({
            success: false,
            message: 'Le titre ne peut pas dépasser 200 caractères'
          });
        }
        sanitizedUpdate.title = sanitizedUpdate.title.trim();
      }

      if (Object.prototype.hasOwnProperty.call(sanitizedUpdate, 'description')) {
        const desc = typeof sanitizedUpdate.description === 'string'
          ? sanitizedUpdate.description.trim()
          : '';
        if (desc.length > 2000) {
          return res.status(400).json({
            success: false,
            message: 'La description ne peut pas dépasser 2000 caractères'
          });
        }
        sanitizedUpdate.description = desc;
      }

      // Construire la requête de mise à jour
      const allowedFields = ['title', 'description', 'category', 'is_anonyme', 'imageUrl'];
      const updateFields = [];
      const updateValues = [];

      allowedFields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(sanitizedUpdate, field)) {
          const dbField = field === 'is_anonyme' ? 'is_anonyme' :
                         field === 'imageUrl' ? 'image_url' : field;
          
          updateFields.push(`${dbField} = ?`);
          updateValues.push(sanitizedUpdate[field]);
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Aucune donnée valide à mettre à jour'
        });
      }

      updateFields.push('updated_at = NOW()');
      updateValues.push(id);

      const updateQuery = `
        UPDATE fails 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      await executeQuery(updateQuery, updateValues);

      // Récupérer le fail mis à jour
      const updatedFail = await FailsController.getFailById(id, userId);
      const mappedFail = mapFailRow(updatedFail);

      console.log(`✅ Fail mis à jour: ${id}`);
      await logSystem({ level: 'info', action: 'fail_update', message: 'Fail updated', details: { failId: id, fields: Object.keys(sanitizedUpdate || {}) }, userId });

      res.json({
        success: true,
        message: 'Fail mis à jour avec succès',
        fail: mappedFail
      });

    } catch (error) {
      console.error('❌ Erreur mise à jour fail:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du fail',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Supprimer un fail
   */
  static async deleteFail(req, res) {
    
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Vérifier que le fail existe et appartient à l'utilisateur
      const existingFail = await FailsController.getFailById(id, userId);
      
      if (!existingFail) {
        return res.status(404).json({
          success: false,
          message: 'Fail non trouvé'
        });
      }

      if (existingFail.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez supprimer que vos propres fails'
        });
      }

      // Avant suppression: révoquer les points liés aux réactions sur ce fail (attribués à l'auteur)
      try {
        // Charger config des points de réactions
        const rows = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['reaction_points']);
        let cfg = { courage: 5, laugh: 3, empathy: 2, support: 3 };
        if (rows && rows[0] && rows[0].value) { try { cfg = { ...cfg, ...JSON.parse(rows[0].value) }; } catch {} }

        // Compter les réactions par type (hors réactions de l'auteur sur son propre fail)
        const counts = await executeQuery(
          `SELECT reaction_type, COUNT(*) AS cnt
             FROM reactions
            WHERE fail_id = ? AND user_id <> ?
            GROUP BY reaction_type`,
          [id, userId]
        );

        // Calcul du total à révoquer
        let totalToRevoke = 0;
        for (const r of counts) {
          const per = Number(cfg[r.reaction_type]) || 0;
          totalToRevoke += per * (Number(r.cnt) || 0);
        }

        if (totalToRevoke > 0) {
          const { v4: uuidv4 } = require('uuid');
          await executeQuery(
            `INSERT INTO user_points (user_id, points_total, created_at, updated_at)
             VALUES (?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE points_total = points_total + VALUES(points_total), updated_at = NOW()`,
            [userId, -totalToRevoke]
          );
          await executeQuery(
            `INSERT INTO user_point_events (id, user_id, amount, source, fail_id, reaction_type, meta, created_at)
             VALUES (?, ?, ?, 'fail_deleted_revoke', ?, NULL, ?, NOW())`,
            [uuidv4(), userId, -totalToRevoke, id, JSON.stringify({ reason: 'Fail deleted: revoke reaction points' })]
          );
        }

        // Décrémenter les user_points pour chaque commentateur (symétrique à addComment)
        try {
          const pcfgRows = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['points']);
          let cCfg = { commentCreate: 2 };
          if (pcfgRows && pcfgRows[0] && pcfgRows[0].value) { try { cCfg = { ...cCfg, ...JSON.parse(pcfgRows[0].value) }; } catch {} }
          const perComment = Math.max(0, Number(cCfg.commentCreate) || 0);
          if (perComment > 0) {
            const commenters = await executeQuery(
              `SELECT user_id, COUNT(*) AS cnt FROM comments WHERE fail_id = ? GROUP BY user_id`,
              [id]
            );
            const { v4: uuidv4 } = require('uuid');
            for (const c of commenters) {
              const u = c.user_id;
              const toDec = perComment * (Number(c.cnt) || 0);
              if (toDec > 0) {
                await executeQuery(
                  `INSERT INTO user_points (user_id, points_total, created_at, updated_at)
                   VALUES (?, ?, NOW(), NOW())
                   ON DUPLICATE KEY UPDATE points_total = points_total + VALUES(points_total), updated_at = NOW()`,
                  [u, -toDec]
                );
                await executeQuery(
                  `INSERT INTO user_point_events (id, user_id, amount, source, fail_id, reaction_type, meta, created_at)
                   VALUES (?, ?, ?, 'fail_deleted_revoke_comment', ?, NULL, NULL, NOW())`,
                  [uuidv4(), u, -toDec, id]
                );
              }
            }
          }
        } catch (e) {
          console.warn('⚠️ Décrément user_points commentaires (ignore):', e?.message);
        }
      } catch (e) {
        console.warn('⚠️ Révocation points lors suppression fail (ignore):', e?.message);
      }

      // Supprimer en cascade (réactions, commentaires, etc.)
      await executeTransaction([
        { query: 'DELETE FROM reactions WHERE fail_id = ?', params: [id] },
        { query: 'DELETE FROM comments WHERE fail_id = ?', params: [id] },
        { query: 'DELETE FROM fails WHERE id = ?', params: [id] }
      ]);

      console.log(`✅ Fail supprimé: ${id}`);
      await logSystem({ level: 'warning', action: 'fail_delete', message: 'Fail deleted', details: { failId: id }, userId });

      res.json({
        success: true,
        message: 'Fail supprimé avec succès'
      });

    } catch (error) {
      console.error('❌ Erreur suppression fail:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du fail',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Ajouter/modifier une réaction à un fail
   */
  static async reactToFail(req, res) {
    
    try {
      const { id } = req.params;
      const { reactionType } = req.body; // 'like', 'love', 'laugh', 'support'
      const userId = req.user.id;

      const validReactions = ['like', 'love', 'laugh', 'support'];
      if (!validReactions.includes(reactionType)) {
        return res.status(400).json({
          success: false,
          message: 'Type de réaction invalide'
        });
      }

      // Vérifier que le fail existe
      const fail = await FailsController.getFailById(id, userId);
      if (!fail) {
        return res.status(404).json({
          success: false,
          message: 'Fail non trouvé'
        });
      }

      // Vérifier/insérer la réaction
      const existingReaction = await executeQuery('SELECT * FROM reactions WHERE fail_id = ? AND user_id = ?',
        [id, userId]
      );

      if (existingReaction.length > 0) {
        // Mettre à jour la réaction existante
        await executeQuery('UPDATE reactions SET reaction_type = ?, created_at = NOW() WHERE fail_id = ? AND user_id = ?',
          [reactionType, id, userId]
        );
      } else {
        // Créer une nouvelle réaction
        await executeQuery('INSERT INTO reactions (fail_id, user_id, reaction_type, created_at) VALUES (?, ?, ?, NOW())',
          [id, userId, reactionType]
        );
      }

      // Mettre à jour les stats utilisateur
      await FailsController.updateUserStats(userId, 'reaction_given');
      if (fail.user_id !== userId) {
        await FailsController.updateUserStats(fail.user_id, 'reaction_received');
      }

      console.log(`👍 Réaction ${reactionType} ajoutée au fail ${id} par ${userId}`);

      res.json({
        success: true,
        message: 'Réaction ajoutée avec succès'
      });

    } catch (error) {
      console.error('❌ Erreur ajout réaction:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout de la réaction',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Supprimer une réaction
   */
  static async removeReaction(req, res) {
    
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await executeQuery('DELETE FROM reactions WHERE fail_id = ? AND user_id = ?',
        [id, userId]
      );

      res.json({
        success: true,
        message: 'Réaction supprimée avec succès'
      });

    } catch (error) {
      console.error('❌ Erreur suppression réaction:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la réaction',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Mettre à jour les statistiques utilisateur
   */
  static async updateUserStats(userId, statType) {
    // Schéma actuel ne stocke pas ces compteurs dans `users`.
    // Les stats sont agrégées à la volée via SELECT.
    // On garde une fonction no-op pour compatibilité.
    return;
  }

  /**
   * Vérifier les progrès des badges
   */
  static async checkBadgeProgress(userId, actionType) {
    try {
      console.log(`🏆 ========== VERIFICATION BADGES ==========`);
      console.log(`🏆 Utilisateur: ${userId}, Action: ${actionType}`);
      
      if (actionType === 'fail_created') {
        console.log(`🏆 Traitement action fail_created...`);
        
        // Compter le nombre de fails de l'utilisateur
        const failCount = await executeQuery(
          'SELECT COUNT(*) as count FROM fails WHERE user_id = ?',
          [userId]
        );
        
        const totalFails = failCount[0]?.count || 0;
        console.log(`🏆 📊 Utilisateur ${userId} a ${totalFails} fails au total`);
        
        // Vérifier les badges basés sur le nombre de fails
        const badgestoCheck = [
          { requirement_type: 'fail_count', requirement_value: 1, name: 'Premier Pas' },
          { requirement_type: 'fail_count', requirement_value: 5, name: 'Apprenti' },
          { requirement_type: 'fail_count', requirement_value: 5, name: 'Apprenti Courage' },
          { requirement_type: 'fail_count', requirement_value: 10, name: 'Collectionneur' },
          { requirement_type: 'fail_count', requirement_value: 10, name: 'Courageux' },
          { requirement_type: 'fail_count', requirement_value: 25, name: 'Narrateur' },
          { requirement_type: 'fail_count', requirement_value: 25, name: 'Maître du Courage' },
          { requirement_type: 'fail_count', requirement_value: 50, name: 'Grand Collectionneur' },
          { requirement_type: 'fail_count', requirement_value: 50, name: 'Vétéran du Courage' },
          { requirement_type: 'fail_count', requirement_value: 100, name: 'Maître des Fails' },
          { requirement_type: 'fail_count', requirement_value: 100, name: 'Légende du Courage' }
        ];
        
        for (const badgeCheck of badgestoCheck) {
          if (totalFails >= badgeCheck.requirement_value) {
            await this.awardBadgeIfNotExists(userId, badgeCheck.requirement_type, badgeCheck.requirement_value);
          }
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Erreur vérification badges:', error);
    }
  }

  /**
   * Attribuer un badge si l'utilisateur ne l'a pas déjà
   */
  static async awardBadgeIfNotExists(userId, requirementType, requirementValue) {
    try {
      // Trouver le badge correspondant
      const badges = await executeQuery(
        'SELECT id, name FROM badge_definitions WHERE requirement_type = ? AND requirement_value = ?',
        [requirementType, requirementValue]
      );

      if (!badges || badges.length === 0) {
        console.log(`⚠️ Aucun badge trouvé pour ${requirementType}:${requirementValue}`);
        return;
      }

      for (const candidate of badges) {
        const badgeId = candidate.id;
        const badgeName = candidate.name;

        const existingBadge = await executeQuery(
          'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ? LIMIT 1',
          [userId, badgeId]
        );

        if (existingBadge.length > 0) {
          console.log(`ℹ️ Badge "${badgeName}" déjà possédé par l'utilisateur ${userId}`);
          continue;
        }

        const { v4: uuidv4 } = require('uuid');
        await executeQuery(
          'INSERT INTO user_badges (id, user_id, badge_id, unlocked_at, created_at) VALUES (?, ?, ?, NOW(), NOW())',
          [uuidv4(), userId, badgeId]
        );

        console.log(`🎉 Badge "${badgeName}" attribué à l'utilisateur ${userId}!`);

        try {
          const { sendPushToUser } = require('../utils/push');
          await sendPushToUser(userId, {
            title: '🏆 Badge débloqué',
            body: `${badgeName}`,
            data: { type: 'badge_unlocked', badgeId }
          });
        } catch (e) { /* ignorer erreur push */ }
      }
      
    } catch (error) {
      console.error('❌ Erreur attribution badge:', error);
    }
  }

  /**
   * Récupérer les statistiques des fails
   */
  static async getFailsStats(req, res) {
    
    try {
      const userId = req.user ? req.user.id : null;

      const stats = {};

      // Stats globales
      const globalStats = await executeQuery(`
        SELECT 
          COUNT(*) as total_fails,
          COUNT(DISTINCT user_id) as total_users,
          SUM(CASE WHEN is_anonyme = 0 THEN 1 ELSE 0 END) as public_fails,
          (SELECT COUNT(*) FROM reactions) as total_reactions
        FROM fails
      `);

      stats.global = globalStats[0];

      // Stats par catégorie
      const categoryStats = await executeQuery(`
        SELECT category, COUNT(*) as count
        FROM fails
        WHERE is_anonyme = 0
        GROUP BY category
        ORDER BY count DESC
      `);

      stats.byCategory = categoryStats;

      // Stats utilisateur si connecté
      if (userId) {
        const userStats = await executeQuery(`
          SELECT 
            COUNT(*) as my_fails,
            SUM(CASE WHEN is_anonyme = 0 THEN 1 ELSE 0 END) as my_public_fails,
            (SELECT COUNT(*) FROM reactions WHERE fail_id IN 
              (SELECT id FROM fails WHERE user_id = ?)) as reactions_on_my_fails
          FROM fails
          WHERE user_id = ?
        `, [userId, userId]);

        stats.user = userStats[0];
      }

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('❌ Erreur récupération stats fails:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Rechercher des fails
   */
  static async searchFails(req, res) {
    
    try {
      const { 
        q: searchQuery, 
        category, 
        // tags, // Non implémenté pour le moment
        page = 1, 
        limit = 20 
      } = req.query;

      const userId = req.user ? req.user.id : null;
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      const offset = (pageNum - 1) * limitNum;

      if (!searchQuery || searchQuery.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Terme de recherche requis',
          code: 'MISSING_SEARCH_QUERY'
        });
      }

      let query = `
        SELECT 
          f.*,
          p.display_name,
          p.avatar_url,
          fm.status AS moderation_status,
          (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id) as reactions_count,
          (SELECT COUNT(*) FROM comments fc WHERE fc.fail_id = f.id) as comments_count,
          ${userId ? `(SELECT reaction_type FROM reactions WHERE fail_id = f.id AND user_id = ?) as user_reaction` : 'NULL as user_reaction'}
        FROM fails f
        JOIN users u ON f.user_id = u.id
        JOIN profiles p ON u.id = p.user_id
        LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
        WHERE (f.title LIKE ? OR f.description LIKE ?)
          AND (fm.status IS NULL OR fm.status NOT IN ('hidden','rejected'))
      `;

      const params = [];
      if (userId) {
        params.push(userId);
      }

      const searchTerm = `%${searchQuery}%`;
      params.push(searchTerm, searchTerm);

      // Aucun filtre de visibilité basé sur l'anonymat (is_anonyme)

      // Filtre par catégorie
      if (category) {
        query += ' AND f.category = ?';
        params.push(category);
      }

      query += ' ORDER BY f.created_at DESC LIMIT ? OFFSET ?';
      params.push(limitNum, offset);

      const fails = await executeQuery(query, params);

      // Compter le total pour la pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM fails f
        LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
        WHERE (f.title LIKE ? OR f.description LIKE ?)
          AND (fm.status IS NULL OR fm.status NOT IN ('hidden','rejected'))
      `;
      const countParams = [searchTerm, searchTerm];

      // Aucun filtre de visibilité basé sur l'anonymat (is_anonyme)

      if (category) {
        countQuery += ' AND f.category = ?';
        countParams.push(category);
      }

      const totalResult = await executeQuery(countQuery, countParams);
      const total = totalResult[0].total;
      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        data: {
          fails: fails.map(fail => ({
            ...fail,
            created_at: new Date(fail.created_at).toISOString(),
            updated_at: new Date(fail.updated_at).toISOString()
          })),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: total,
            totalPages: totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
          },
          searchQuery: searchQuery
        }
      });

    } catch (error) {
      console.error('❌ Erreur recherche fails:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche',
        code: 'SEARCH_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Récupérer les catégories disponibles
   */
  static async getCategories(req, res) {
    
    try {
      const categories = await executeQuery(`
        SELECT 
          category,
          COUNT(*) as count
        FROM fails 
        WHERE is_anonyme = 0
        GROUP BY category
        ORDER BY count DESC, category ASC
      `);

      res.json({
        success: true,
        data: categories.map(cat => ({
          name: cat.category,
          count: cat.count
        }))
      });

    } catch (error) {
      console.error('❌ Erreur récupération catégories:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des catégories',
        code: 'CATEGORIES_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Récupérer les tags populaires
   */
  static async getPopularTags(req, res) {
    
    try {
      // const { limit = 50 } = req.query; // Non utilisé car fonctionnalité non implémentée
      // const limitNum = parseInt(limit) || 50; // Non utilisé car fonctionnalité non implémentée

      // Temporaire : retourner un tableau vide car le champ tags n'existe pas dans la table fails
      // TODO: Ajouter le champ tags à la table ou implémenter une table tags séparée
      
      res.json({
        success: true,
        data: []
      });

    } catch (error) {
      console.error('❌ Erreur récupération tags populaires:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des tags',
        code: 'TAGS_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Incrémenter le compteur de vues
   */
  static async incrementViewCount(failId, userId) {
    try {
      // Vérifier si l'utilisateur a déjà vu ce fail récemment (dans les dernières 24h)
      if (userId) {
        const recentViews = await executeQuery(`
          SELECT id FROM fail_views 
          WHERE fail_id = ? AND user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
        `, [failId, userId]);

        if (recentViews.length > 0) {
          return; // Ne pas compter la vue si déjà vue récemment
        }

        // Enregistrer la vue
        const { v4: uuidv4 } = require('uuid');
        await executeQuery(`
          INSERT INTO fail_views (id, fail_id, user_id, created_at) 
          VALUES (?, ?, ?, NOW())
        `, [uuidv4(), failId, userId]);
      }

      // Incrémenter le compteur global de vues
      await executeQuery(`
        UPDATE fails 
        SET views_count = views_count + 1 
        WHERE id = ?
      `, [failId]);

    } catch (error) {
      console.error('❌ Erreur incrémentation vues:', error);
      // Ne pas faire échouer la requête principale
    }
  }
  static async ensureModerationTables() {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS fail_reports (
        id CHAR(36) NOT NULL,
        fail_id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        reason TEXT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_fail_report (fail_id, user_id),
        KEY idx_fail (fail_id),
        KEY idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS fail_moderation (
        fail_id CHAR(36) NOT NULL,
        status ENUM('under_review','hidden','approved','rejected') NOT NULL DEFAULT 'under_review',
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (fail_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  /**
   * Signaler un fail (pour modération)
   */
  static async reportFail(req, res) {
    try {
      // S'assure que les tables de modération existent
      await FailsController.ensureModerationTables();
      const { id } = req.params; // failId
      const userId = req.user.id;
      const reason = (req.body && req.body.reason) || null;

      // Vérifier l'existence du fail
      const rows = await executeQuery('SELECT id, user_id, title FROM fails WHERE id = ? LIMIT 1', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Fail non trouvé' });
      }

      // Insérer un report (unique par user/fail)
      try {
        const { v4: uuidv4 } = require('uuid');
        await executeQuery(
          'INSERT INTO fail_reports (id, fail_id, user_id, reason, created_at) VALUES (?, ?, ?, ?, NOW())',
          [uuidv4(), id, userId, reason]
        );
      } catch { /* duplicate, ignore */ }

      // Compter reports et comparer au seuil
      const [{ reports }] = await executeQuery('SELECT COUNT(*) AS reports FROM fail_reports WHERE fail_id = ?', [id]);
      let threshold = 1;
      try {
        const row = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['moderation']);
        if (row && row[0] && row[0].value) {
          const cfg = JSON.parse(row[0].value || '{}');
          threshold = Number(cfg.failReportThreshold) || 1;
        }
      } catch {}

      let autoHidden = false;
      if (reports >= threshold) {
        await executeQuery(
          'INSERT INTO fail_moderation (fail_id, status, created_at, updated_at) VALUES (?, "hidden", NOW(), NOW()) ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()',
          [id]
        );
        autoHidden = true;
      }

      await logSystem({ level: 'warning', action: 'fail_report', message: 'Fail reported', details: { failId: id, reason, reports, threshold, autoHidden }, userId });

      res.json({ success: true, reports, autoHidden, threshold });
    } catch (error) {
      console.error('❌ report fail error:', error);
      res.status(500).json({ success: false, message: 'Erreur signalement fail' });
    }
  }
}

module.exports = FailsController;
