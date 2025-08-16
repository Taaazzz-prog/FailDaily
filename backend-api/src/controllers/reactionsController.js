const { executeQuery, executeTransaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Contrôleur pour la gestion des réactions aux fails
 */
class ReactionsController {

  /**
   * Ajouter ou modifier une réaction à un fail
   */
  static async addReaction(req, res) {
    const connection = req.dbConnection;
    
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
      const fails = await executeQuery(connection, `
        SELECT id, user_id, is_public 
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

      // Vérifier les permissions (fail public ou propriétaire)
      if (!fail.is_public && fail.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à ce fail',
          code: 'ACCESS_DENIED'
        });
      }

      // Vérifier si une réaction existe déjà
      const existingReactions = await executeQuery(connection, `
        SELECT id, reaction_type 
        FROM fail_reactions 
        WHERE fail_id = ? AND user_id = ?
      `, [failId, userId]);

      if (existingReactions.length > 0) {
        const existingReaction = existingReactions[0];
        
        // Si c'est la même réaction, la supprimer (toggle)
        if (existingReaction.reaction_type === reactionType) {
          await executeQuery(connection, `
            DELETE FROM fail_reactions 
            WHERE id = ?
          `, [existingReaction.id]);

          return res.json({
            success: true,
            message: 'Réaction supprimée',
            data: {
              action: 'removed',
              reactionType: null
            }
          });
        } else {
          // Sinon, la modifier
          await executeQuery(connection, `
            UPDATE fail_reactions 
            SET reaction_type = ?, updated_at = NOW() 
            WHERE id = ?
          `, [reactionType, existingReaction.id]);

          return res.json({
            success: true,
            message: 'Réaction modifiée',
            data: {
              action: 'updated',
              reactionType: reactionType
            }
          });
        }
      } else {
        // Ajouter une nouvelle réaction
        const reactionId = uuidv4();
        
        await executeQuery(connection, `
          INSERT INTO fail_reactions (id, fail_id, user_id, reaction_type, created_at) 
          VALUES (?, ?, ?, ?, NOW())
        `, [reactionId, failId, userId, reactionType]);

        return res.json({
          success: true,
          message: 'Réaction ajoutée',
          data: {
            action: 'added',
            reactionType: reactionType
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
    const connection = req.dbConnection;
    
    try {
      const { id: failId } = req.params;
      const userId = req.user.id;

      // Supprimer la réaction de l'utilisateur pour ce fail
      const result = await executeQuery(connection, `
        DELETE FROM fail_reactions 
        WHERE fail_id = ? AND user_id = ?
      `, [failId, userId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Aucune réaction trouvée à supprimer',
          code: 'NO_REACTION_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Réaction supprimée avec succès'
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
    const connection = req.dbConnection;
    
    try {
      const { id: failId } = req.params;
      const userId = req.user ? req.user.id : null;

      // Vérifier que le fail existe et est accessible
      const fails = await executeQuery(connection, `
        SELECT id, user_id, is_public 
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

      // Vérifier les permissions (fail public ou propriétaire)
      if (!fail.is_public && (!userId || fail.user_id !== userId)) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à ce fail',
          code: 'ACCESS_DENIED'
        });
      }

      // Récupérer toutes les réactions avec les informations des utilisateurs
      const reactions = await executeQuery(connection, `
        SELECT 
          fr.id,
          fr.reaction_type,
          fr.created_at,
          p.display_name,
          p.avatar_url,
          u.id as user_id
        FROM fail_reactions fr
        JOIN users u ON fr.user_id = u.id
        JOIN profiles p ON u.id = p.user_id
        WHERE fr.fail_id = ?
        ORDER BY fr.created_at DESC
      `, [failId]);

      // Compter les réactions par type
      const reactionCounts = await executeQuery(connection, `
        SELECT 
          reaction_type,
          COUNT(*) as count
        FROM fail_reactions 
        WHERE fail_id = ?
        GROUP BY reaction_type
      `, [failId]);

      // Récupérer la réaction de l'utilisateur actuel s'il est connecté
      let userReaction = null;
      if (userId) {
        const userReactions = await executeQuery(connection, `
          SELECT reaction_type 
          FROM fail_reactions 
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
    const connection = req.dbConnection;
    
    try {
      const userId = req.user.id;

      // Compter les réactions données par l'utilisateur
      const givenReactions = await executeQuery(connection, `
        SELECT 
          reaction_type,
          COUNT(*) as count
        FROM fail_reactions 
        WHERE user_id = ?
        GROUP BY reaction_type
      `, [userId]);

      // Compter les réactions reçues sur les fails de l'utilisateur
      const receivedReactions = await executeQuery(connection, `
        SELECT 
          fr.reaction_type,
          COUNT(*) as count
        FROM fail_reactions fr
        JOIN fails f ON fr.fail_id = f.id
        WHERE f.user_id = ? AND fr.user_id != ?
        GROUP BY fr.reaction_type
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
