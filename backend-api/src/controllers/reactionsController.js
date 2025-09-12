const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Contrôleur pour la gestion des réactions aux fails
 */
class ReactionsController {

  /**
   * Ajouter ou modifier une réaction à un fail
   */
  static async addReaction(req, res) {
    try {
      const { id: failId } = req.params;
      const { reactionType } = req.body;
      const userId = req.user.id;

      // Validation du type de réaction
      const validReactions = ['courage', 'laugh', 'empathy', 'support'];
      if (!reactionType || !validReactions.includes(reactionType)) {
        return res.status(400).json({
          success: false,
          message: 'Type de réaction invalide',
          code: 'INVALID_REACTION_TYPE'
        });
      }

      // Vérifier que le fail existe et est accessible
      const fails = await executeQuery(`
        SELECT f.id, f.user_id, f.title, f.is_anonyme, p.display_name
        FROM fails f
        LEFT JOIN profiles p ON p.user_id = f.user_id
        WHERE f.id = ?
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

      // Vérifier si une réaction existe déjà
      const existingReactions = await executeQuery(`
        SELECT id, reaction_type 
        FROM reactions 
        WHERE fail_id = ? AND user_id = ?
      `, [failId, userId]);

      if (existingReactions.length > 0) {
        const existingReaction = existingReactions[0];
        
        // Si c'est la même réaction, la supprimer (toggle)
        if (existingReaction.reaction_type === reactionType) {
          // Retrancher les points liés à cette réaction
          const revoked = await awardReactionPoints(req, { fail, reactionType, reactorUserId: userId, revoke: true });
          await executeQuery(`
            DELETE FROM reactions 
            WHERE id = ?
          `, [existingReaction.id]);
          // Log suppression
          await logReaction(req, {
            userId,
            fail,
            reactionType,
            points: -Math.abs(revoked || 0)
          });
          await require('../utils/logger').logSystem({ level: 'info', action: 'reaction_remove', message: 'Reaction removed (toggle)', details: { failId, reactionType }, userId });

          // Débloquer badges potentiels (donneur et auteur du fail)
          try {
            const svc = require('../services/badgesService');
            await Promise.all([
              svc.checkAndUnlockBadges(userId),
              svc.checkAndUnlockBadges(fail.user_id)
            ]);
          } catch {}
          const summary = await getReactionSummary(failId, userId);
          return res.json({
            success: true,
            message: 'Réaction supprimée',
            data: {
              action: 'removed',
              reactionType: null,
              summary
            }
          });
        } else {
          // Sinon, la modifier
          await executeQuery(`
            UPDATE reactions 
            SET reaction_type = ?, created_at = NOW() 
            WHERE id = ?
          `, [reactionType, existingReaction.id]);
          // Calcul points pour l'auteur (update considéré comme un nouvel apport)
          const awarded = await awardReactionPoints(req, { fail, reactionType, reactorUserId: userId });
          // Log modification (comme ajout du nouveau type)
          await logReaction(req, {
            userId,
            fail,
            reactionType,
            points: awarded
          });
          await require('../utils/logger').logSystem({ level: 'info', action: 'reaction_update', message: 'Reaction updated', details: { failId, reactionType }, userId });

          // Débloquer badges potentiels
          try {
            const svc = require('../services/badgesService');
            await Promise.all([
              svc.checkAndUnlockBadges(userId),
              svc.checkAndUnlockBadges(fail.user_id)
            ]);
          } catch {}
          const summary = await getReactionSummary(failId, userId);
          return res.json({
            success: true,
            message: 'Réaction modifiée',
            data: {
              action: 'updated',
              reactionType: reactionType,
              summary
            }
          });
        }
      } else {
        // Ajouter une nouvelle réaction
        const reactionId = uuidv4();
        
        await executeQuery(`
          INSERT INTO reactions (id, fail_id, user_id, reaction_type, created_at) 
          VALUES (?, ?, ?, ?, NOW())
        `, [reactionId, failId, userId, reactionType]);
        // Calcul points pour l'auteur
        const awarded = await awardReactionPoints(req, { fail, reactionType, reactorUserId: userId });
        // Log ajout
        await logReaction(req, {
          userId,
          fail,
          reactionType,
          points: awarded
        });
        await require('../utils/logger').logSystem({ level: 'info', action: 'reaction_add', message: 'Reaction added', details: { failId, reactionType }, userId });

        // Débloquer badges potentiels
        try {
          const svc = require('../services/badgesService');
          await Promise.all([
            svc.checkAndUnlockBadges(userId),
            svc.checkAndUnlockBadges(fail.user_id)
          ]);
        } catch {}
        const summary = await getReactionSummary(failId, userId);
        return res.json({
          success: true,
          message: 'Réaction ajoutée',
          data: {
            action: 'added',
            reactionType: reactionType,
            summary
          }
        });
      }

    } catch (error) {
      console.error('❌ Erreur ajout réaction:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout de la réaction',
        code: 'REACTION_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Supprimer une réaction
   */
  static async removeReaction(req, res) {
    try {
      const { id: failId, reactionType } = req.params;
      const userId = req.user.id;

      // Préparer log et lecture du fail
      const fails = await executeQuery(`
        SELECT f.id, f.user_id, f.title, f.is_anonyme, p.display_name
        FROM fails f
        LEFT JOIN profiles p ON p.user_id = f.user_id
        WHERE f.id = ?
      `, [failId]);
      const fail = fails[0] || null;

      // Lire les réactions existantes à supprimer (pour connaître leur type)
      const existing = await executeQuery(
        `SELECT id, reaction_type FROM reactions WHERE fail_id = ? AND user_id = ? ${reactionType ? 'AND reaction_type = ?' : ''}`,
        reactionType ? [failId, userId, reactionType] : [failId, userId]
      );

      // Supprimer la/les réactions
      const result = await executeQuery(
        `DELETE FROM reactions WHERE fail_id = ? AND user_id = ? ${reactionType ? 'AND reaction_type = ?' : ''}`,
        reactionType ? [failId, userId, reactionType] : [failId, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Aucune réaction trouvée à supprimer',
          code: 'NO_REACTION_FOUND'
        });
      }

      // Décrémenter points pour chaque type supprimé et logger
      for (const r of existing) {
        const revoked = await awardReactionPoints(req, { fail, reactionType: r.reaction_type, reactorUserId: userId, revoke: true });
        await logReaction(req, {
          userId,
          fail,
          reactionType: r.reaction_type,
          points: -Math.abs(revoked || 0)
        });
      }
      await require('../utils/logger').logSystem({ level: 'info', action: 'reaction_remove', message: 'Reaction removed', details: { failId, reactionType: reactionType || null }, userId });

      const summary = await getReactionSummary(failId, userId);
      res.json({
        success: true,
        message: 'Réaction supprimée avec succès',
        data: { summary }
      });

    } catch (error) {
      console.error('❌ Erreur suppression réaction:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la réaction',
        code: 'REACTION_DELETE_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Récupérer toutes les réactions d'un fail
   */
  static async getReactions(req, res) {
    try {
      const { id: failId } = req.params;
      const userId = req.user ? req.user.id : null;

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

      // const fail = fails[0]; // Pas de restriction d'accès pour le moment

      // Aucune restriction d'accès basée sur l'anonymat

      // Récupérer toutes les réactions avec les informations des utilisateurs
      const reactions = await executeQuery(`
        SELECT 
          r.id,
          r.reaction_type,
          r.created_at,
          p.display_name,
          p.avatar_url,
          u.id as user_id
        FROM reactions r
        JOIN users u ON r.user_id = u.id
        JOIN profiles p ON u.id = p.user_id
        WHERE r.fail_id = ?
        ORDER BY r.created_at DESC
      `, [failId]);

      // Compter les réactions par type
      const reactionCounts = await executeQuery(`
        SELECT 
          reaction_type,
          COUNT(*) as count
        FROM reactions 
        WHERE fail_id = ?
        GROUP BY reaction_type
      `, [failId]);

      // Récupérer la réaction de l'utilisateur actuel s'il est connecté
      let userReaction = null;
      if (userId) {
        const userReactions = await executeQuery(`
          SELECT reaction_type 
          FROM reactions 
          WHERE fail_id = ? AND user_id = ?
        `, [failId, userId]);
        
        userReaction = userReactions.length > 0 ? userReactions[0].reaction_type : null;
      }

      // Formater les compteurs
      const counts = {};
      reactionCounts.forEach(rc => {
        counts[rc.reaction_type] = rc.count;
      });

      res.json({
        success: true,
        data: {
          reactions: reactions.map(r => ({
            id: r.id,
            type: r.reaction_type,
            user: {
              id: r.user_id,
              displayName: r.display_name,
              avatarUrl: r.avatar_url
            },
            createdAt: r.created_at
          })),
          counts: counts,
          totalCount: reactions.length,
          userReaction: userReaction
        }
      });

    } catch (error) {
      console.error('❌ Erreur récupération réactions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des réactions',
        code: 'REACTIONS_FETCH_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Récupérer les statistiques des réactions d'un utilisateur
   */
  static async getUserReactionStats(req, res) {
    try {
      const userId = req.user.id;

      // Compter les réactions données par l'utilisateur
      const givenReactions = await executeQuery(`
        SELECT 
          reaction_type,
          COUNT(*) as count
        FROM reactions 
        WHERE user_id = ?
        GROUP BY reaction_type
      `, [userId]);

      // Compter les réactions reçues sur les fails de l'utilisateur
      const receivedReactions = await executeQuery(`
        SELECT 
          r.reaction_type,
          COUNT(*) as count
        FROM reactions r
        JOIN fails f ON r.fail_id = f.id
        WHERE f.user_id = ? AND r.user_id != ?
        GROUP BY r.reaction_type
      `, [userId, userId]);

      const givenStats = {};
      givenReactions.forEach(gr => {
        givenStats[gr.reaction_type] = gr.count;
      });

      const receivedStats = {};
      receivedReactions.forEach(rr => {
        receivedStats[rr.reaction_type] = rr.count;
      });

      res.json({
        success: true,
        data: {
          given: givenStats,
          received: receivedStats,
          totalGiven: givenReactions.reduce((sum, gr) => sum + gr.count, 0),
          totalReceived: receivedReactions.reduce((sum, rr) => sum + rr.count, 0)
        }
      });

    } catch (error) {
      console.error('❌ Erreur stats réactions utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        code: 'USER_STATS_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = ReactionsController;

/**
 * Logger basique vers reaction_logs et user_activities
 */
async function logReaction(req, { userId, fail, reactionType, points }) {
  try {
    if (!fail) return;
    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // Récup info utilisateur (email/display)
    const userRows = await executeQuery(
      'SELECT email FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    const userEmail = userRows[0]?.email || null;

    await executeQuery(
      `INSERT INTO reaction_logs (id, user_id, user_email, user_name, fail_id, fail_title, fail_author_name, reaction_type, points_awarded, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        uuidv4(),
        userId,
        userEmail,
        req.user?.displayName || null,
        fail.id,
        fail.title || null,
        fail.display_name || null,
        reactionType,
        Number(points) || 0,
        ip,
        userAgent
      ]
    );

    // User activity mirror
    await executeQuery(
      `INSERT INTO user_activities (id, user_id, user_email, user_name, action, details, fail_id, reaction_type, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, 'reaction', ?, ?, ?, ?, ?, NOW())`,
      [
        uuidv4(),
        userId,
        userEmail,
        req.user?.displayName || null,
        JSON.stringify({ reactionType }),
        fail.id,
        reactionType,
        ip,
        userAgent
      ]
    );
  } catch (e) {
    console.warn('⚠️ logReaction: impossible de journaliser la réaction:', e?.message);
  }
}

/**
 * Retourne un résumé des réactions d'un fail (counts, total, userReaction)
 */
async function getReactionSummary(failId, userId = null) {
  const rows = await executeQuery(
    `SELECT reaction_type, COUNT(*) AS c FROM reactions WHERE fail_id = ? GROUP BY reaction_type`,
    [failId]
  );
  const counts = { courage: 0, laugh: 0, empathy: 0, support: 0 };
  for (const r of rows) {
    if (Object.prototype.hasOwnProperty.call(counts, r.reaction_type)) counts[r.reaction_type] = Number(r.c) || 0;
  }
  let userReaction = null;
  if (userId) {
    const ur = await executeQuery(
      `SELECT reaction_type FROM reactions WHERE fail_id = ? AND user_id = ? LIMIT 1`,
      [failId, userId]
    );
    userReaction = ur[0]?.reaction_type || null;
  }
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  return { counts, totalCount, userReaction };
}

/**
 * Attribue des points au propriétaire du fail selon la config.
 * - Lit app_config.reaction_points (ou valeurs par défaut)
 * - Ignore si l'auteur réagit à son propre fail
 * - Met à jour user_points et trace user_point_events
 * Retourne le nombre de points attribués
 */
async function awardReactionPoints(req, { fail, reactionType, reactorUserId, revoke = false }) {
  try {
    if (!fail || !fail.user_id) return 0;
    const authorId = fail.user_id;
    // Ne pas attribuer si réaction de l'auteur à son propre fail
    if (authorId === reactorUserId) return 0;

    // Charger la config
    const rows = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['reaction_points']);
    let cfg = { courage: 5, laugh: 3, empathy: 2, support: 3 };
    if (rows && rows[0] && rows[0].value) {
      try { cfg = { ...cfg, ...JSON.parse(rows[0].value) }; } catch {}
    }

    const base = Number(cfg[reactionType]) || 0;
    if (base === 0) return 0;
    const amount = revoke ? -Math.abs(base) : Math.abs(base);

    const { v4: uuidv4 } = require('uuid');

    // Upsert total
    await executeQuery(
      `INSERT INTO user_points (user_id, points_total, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE points_total = points_total + VALUES(points_total), updated_at = NOW()`,
      [authorId, amount]
    );

    // Trace event
    await executeQuery(
      `INSERT INTO user_point_events (id, user_id, amount, source, fail_id, reaction_type, meta, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [uuidv4(), authorId, amount, revoke ? 'reaction_remove' : 'reaction', fail.id, reactionType, JSON.stringify({ fromUser: reactorUserId })]
    );

    return amount;
  } catch (e) {
    console.warn('⚠️ awardReactionPoints error:', e?.message);
    return 0;
  }
}
