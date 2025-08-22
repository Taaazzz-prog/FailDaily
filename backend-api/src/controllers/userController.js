const { executeQuery } = require('../config/database');

/**
 * Contrôleur pour la gestion des utilisateurs et leurs statistiques
 */
class UserController {

  /**
   * Récupérer les statistiques complètes d'un utilisateur
   */
  static async getUserStats(req, res) {
    try {
      const userId = req.user.id;

      // Statistiques des fails
      const failsStats = await executeQuery(`
        SELECT 
          COUNT(*) as total_fails,
          SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public_fails,
          SUM(CASE WHEN is_public = 0 THEN 1 ELSE 0 END) as private_fails,
          SUM(views_count) as total_views
        FROM fails 
        WHERE user_id = ?
      `, [userId]);

      // Statistiques des réactions données
      const givenReactions = await executeQuery(`
        SELECT 
          reaction_type,
          COUNT(*) as count
        FROM fail_reactions 
        WHERE user_id = ?
        GROUP BY reaction_type
      `, [userId]);

      // Statistiques des réactions reçues
      const receivedReactions = await executeQuery(`
        SELECT 
          fr.reaction_type,
          COUNT(*) as count
        FROM fail_reactions fr
        JOIN fails f ON fr.fail_id = f.id
        WHERE f.user_id = ? AND fr.user_id != ?
        GROUP BY fr.reaction_type
      `, [userId, userId]);

      // Statistiques des commentaires
      const commentsStats = await executeQuery(`
        SELECT 
          (SELECT COUNT(*) FROM fail_comments WHERE user_id = ?) as comments_written,
          (SELECT COUNT(*) 
           FROM fail_comments fc
           JOIN fails f ON fc.fail_id = f.id
           WHERE f.user_id = ? AND fc.user_id != ?) as comments_received
      `, [userId, userId, userId]);

      // Répartition par catégorie
      const categoryStats = await executeQuery(`
        SELECT 
          category,
          COUNT(*) as count
        FROM fails 
        WHERE user_id = ?
        GROUP BY category
        ORDER BY count DESC
      `, [userId]);

      // Activité mensuelle (derniers 12 mois)
      const monthlyActivity = await executeQuery(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as fails_count
        FROM fails 
        WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
      `, [userId]);

      // Formater les réactions
      const givenReactionsMap = {};
      givenReactions.forEach(gr => {
        givenReactionsMap[gr.reaction_type] = gr.count;
      });

      const receivedReactionsMap = {};
      receivedReactions.forEach(rr => {
        receivedReactionsMap[rr.reaction_type] = rr.count;
      });

      res.json({
        success: true,
        data: {
          fails: {
            total: failsStats[0].total_fails,
            public: failsStats[0].public_fails,
            private: failsStats[0].private_fails,
            totalViews: failsStats[0].total_views
          },
          reactions: {
            given: {
              ...givenReactionsMap,
              total: givenReactions.reduce((sum, gr) => sum + gr.count, 0)
            },
            received: {
              ...receivedReactionsMap,
              total: receivedReactions.reduce((sum, rr) => sum + rr.count, 0)
            }
          },
          comments: {
            written: commentsStats[0].comments_written,
            received: commentsStats[0].comments_received
          },
          categories: categoryStats,
          monthlyActivity: monthlyActivity
        }
      });

    } catch (error) {
      console.error('❌ Erreur récupération stats utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        code: 'USER_STATS_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Récupérer le profil public d'un utilisateur
   */
  static async getUserProfile(req, res) {
    try {
      const { id: targetUserId } = req.params;
      const currentUserId = req.user ? req.user.id : null;

      // Récupérer les informations du profil
      const userProfile = await executeQuery(`
        SELECT 
          u.id, u.created_at,
          p.display_name, p.avatar_url, p.bio
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = ?
      `, [targetUserId]);

      if (userProfile.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND'
        });
      }

      const profile = userProfile[0];

      // Statistiques publiques de l'utilisateur
      const publicStats = await executeQuery(`
        SELECT 
          COUNT(*) as public_fails,
          SUM(views_count) as total_views
        FROM fails 
        WHERE user_id = ? AND is_public = 1
      `, [targetUserId]);

      // Compter les réactions reçues sur les fails publics
      const totalReactions = await executeQuery(`
        SELECT COUNT(*) as total_reactions
        FROM fail_reactions fr
        JOIN fails f ON fr.fail_id = f.id
        WHERE f.user_id = ? AND f.is_public = 1
      `, [targetUserId]);

      res.json({
        success: true,
        data: {
          id: profile.id,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          bio: profile.bio,
          memberSince: profile.created_at,
          stats: {
            publicFails: publicStats[0].public_fails,
            totalViews: publicStats[0].total_views || 0,
            totalReactions: totalReactions[0].total_reactions
          },
          isOwnProfile: currentUserId === targetUserId
        }
      });

    } catch (error) {
      console.error('❌ Erreur récupération profil utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil',
        code: 'USER_PROFILE_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Récupérer les fails d'un utilisateur spécifique
   */
  static async getUserFails(req, res) {
    try {
      const { id: targetUserId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const currentUserId = req.user ? req.user.id : null;

      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      const offset = (pageNum - 1) * limitNum;

      // Vérifier que l'utilisateur cible existe
      const targetUser = await executeQuery(`
        SELECT id FROM users WHERE id = ?
      `, [targetUserId]);

      if (targetUser.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND'
        });
      }

      // Construire la requête selon les permissions
      let query = `
        SELECT 
          f.*,
          u.display_name,
          u.avatar_url,
          (SELECT COUNT(*) FROM fail_reactions fr WHERE fr.fail_id = f.id) as reactions_count,
          (SELECT COUNT(*) FROM fail_comments fc WHERE fc.fail_id = f.id) as comments_count,
          ${currentUserId ? `(SELECT reaction_type FROM fail_reactions WHERE fail_id = f.id AND user_id = ?) as user_reaction` : 'NULL as user_reaction'}
        FROM fails f
        JOIN users u ON f.user_id = u.id
        WHERE f.user_id = ?
      `;

      const params = [];
      if (currentUserId) {
        params.push(currentUserId);
      }
      params.push(targetUserId);

      // Si ce n'est pas le propriétaire, ne montrer que les fails publics
      if (currentUserId !== targetUserId) {
        query += ' AND f.is_public = 1';
      }

      query += ' ORDER BY f.created_at DESC LIMIT ? OFFSET ?';
      params.push(limitNum, offset);

      const fails = await executeQuery(query, params);

      // Compter le total pour la pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM fails 
        WHERE user_id = ?
      `;
      const countParams = [targetUserId];

      if (currentUserId !== targetUserId) {
        countQuery += ' AND is_public = 1';
      }

      const totalResult = await executeQuery(countQuery, countParams);
      const total = totalResult[0].total;
      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        data: {
          fails: fails.map(fail => ({
            ...fail,
            tags: JSON.parse(fail.tags || '[]'),
            location: fail.location ? JSON.parse(fail.location) : null,
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
          userId: targetUserId,
          isOwnProfile: currentUserId === targetUserId
        }
      });

    } catch (error) {
      console.error('❌ Erreur récupération fails utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des fails',
        code: 'USER_FAILS_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = UserController;
