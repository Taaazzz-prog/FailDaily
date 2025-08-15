const { executeQuery, executeTransaction } = require('../config/database');

/**
 * Contrôleur pour la gestion des fails
 */
class FailsController {

  /**
   * Créer un nouveau fail
   */
  static async createFail(req, res) {
    const connection = req.dbConnection;
    
    try {
      const {
        title,
        description,
        category = 'Général',
        tags = [],
        isPublic = true,
        imageUrl = null,
        location = null
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

      if (description && description.length > 2000) {
        return res.status(400).json({
          success: false,
          message: 'La description ne peut pas dépasser 2000 caractères'
        });
      }

      // Créer le fail
      const failQuery = `
        INSERT INTO fails (
          user_id, title, description, category, tags, 
          is_public, image_url, location, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const failValues = [
        userId,
        title.trim(),
        description ? description.trim() : null,
        category,
        JSON.stringify(tags),
        isPublic,
        imageUrl,
        location ? JSON.stringify(location) : null
      ];

      const result = await executeQuery(connection, failQuery, failValues);
      const failId = result.insertId;

      // Récupérer le fail créé avec les informations utilisateur
      const createdFail = await this.getFailById(failId, userId, connection);

      // Mettre à jour les statistiques utilisateur
      await this.updateUserStats(userId, 'fail_created', connection);

      // Vérifier les badges potentiels
      await this.checkBadgeProgress(userId, 'fail_created', connection);

      console.log(`✅ Fail créé: ${failId} par utilisateur ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Fail créé avec succès',
        fail: createdFail
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
    const connection = req.dbConnection;
    
    try {
      const {
        page = 1,
        limit = 20,
        category = null,
        search = null,
        userId = null,
        isPublic = true,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const currentUserId = req.user ? req.user.id : null;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Construction de la requête
      let whereConditions = [];
      let queryParams = [];

      // Filtres de base
      if (isPublic === 'true') {
        whereConditions.push('f.is_public = ?');
        queryParams.push(true);
      }

      if (category && category !== 'all') {
        whereConditions.push('f.category = ?');
        queryParams.push(category);
      }

      if (userId) {
        whereConditions.push('f.user_id = ?');
        queryParams.push(parseInt(userId));
      }

      if (search) {
        whereConditions.push('(f.title LIKE ? OR f.description LIKE ?)');
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm);
      }

      // Requête principale
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      const query = `
        SELECT 
          f.*,
          u.display_name,
          u.avatar_url,
          (SELECT COUNT(*) FROM fail_reactions fr WHERE fr.fail_id = f.id) as reactions_count,
          (SELECT COUNT(*) FROM fail_comments fc WHERE fc.fail_id = f.id) as comments_count,
          ${currentUserId ? `(SELECT reaction_type FROM fail_reactions WHERE fail_id = f.id AND user_id = ?) as user_reaction` : 'NULL as user_reaction'}
        FROM fails f
        JOIN users u ON f.user_id = u.id
        ${whereClause}
        ORDER BY f.${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `;

      // Paramètres de la requête
      const finalParams = currentUserId 
        ? [currentUserId, ...queryParams, parseInt(limit), offset]
        : [...queryParams, parseInt(limit), offset];

      const fails = await executeQuery(connection, query, finalParams);

      // Requête pour le total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM fails f
        JOIN users u ON f.user_id = u.id
        ${whereClause}
      `;

      const countParams = currentUserId 
        ? queryParams
        : queryParams;

      const countResult = await executeQuery(connection, countQuery, countParams);
      const total = countResult[0].total;

      // Traitement des données
      const processedFails = fails.map(fail => ({
        ...fail,
        tags: JSON.parse(fail.tags || '[]'),
        location: fail.location ? JSON.parse(fail.location) : null,
        created_at: new Date(fail.created_at).toISOString(),
        updated_at: new Date(fail.updated_at).toISOString()
      }));

      res.json({
        success: true,
        fails: processedFails,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
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
   * Récupérer un fail par ID
   */
  static async getFailById(failId, userId = null, connection = null) {
    const shouldCloseConnection = !connection;
    if (!connection) {
      connection = require('../config/database').getConnection();
    }

    try {
      const query = `
        SELECT 
          f.*,
          u.display_name,
          u.avatar_url,
          (SELECT COUNT(*) FROM fail_reactions fr WHERE fr.fail_id = f.id) as reactions_count,
          (SELECT COUNT(*) FROM fail_comments fc WHERE fc.fail_id = f.id) as comments_count,
          ${userId ? `(SELECT reaction_type FROM fail_reactions WHERE fail_id = f.id AND user_id = ?) as user_reaction` : 'NULL as user_reaction'}
        FROM fails f
        JOIN users u ON f.user_id = u.id
        WHERE f.id = ?
      `;

      const params = userId ? [userId, failId] : [failId];
      const results = await executeQuery(connection, query, params);

      if (results.length === 0) {
        return null;
      }

      const fail = results[0];
      return {
        ...fail,
        tags: JSON.parse(fail.tags || '[]'),
        location: fail.location ? JSON.parse(fail.location) : null,
        created_at: new Date(fail.created_at).toISOString(),
        updated_at: new Date(fail.updated_at).toISOString()
      };

    } finally {
      if (shouldCloseConnection && connection) {
        connection.end();
      }
    }
  }

  /**
   * Récupérer un fail par ID (endpoint)
   */
  static async getFailByIdEndpoint(req, res) {
    const connection = req.dbConnection;
    
    try {
      const { id } = req.params;
      const userId = req.user ? req.user.id : null;

      const fail = await this.getFailById(parseInt(id), userId, connection);

      if (!fail) {
        return res.status(404).json({
          success: false,
          message: 'Fail non trouvé'
        });
      }

      // Vérifier si l'utilisateur peut voir ce fail
      if (!fail.is_public && (!userId || fail.user_id !== userId)) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à ce fail'
        });
      }

      // Incrémenter le compteur de vues si ce n'est pas l'auteur
      if (userId && fail.user_id !== userId) {
        await this.incrementViewCount(parseInt(id), userId, connection);
      }

      res.json({
        success: true,
        fail
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
    const connection = req.dbConnection;
    
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      // Vérifier que le fail existe et appartient à l'utilisateur
      const existingFail = await this.getFailById(parseInt(id), userId, connection);
      
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

      // Construire la requête de mise à jour
      const allowedFields = ['title', 'description', 'category', 'tags', 'isPublic', 'imageUrl'];
      const updateFields = [];
      const updateValues = [];

      allowedFields.forEach(field => {
        if (updateData.hasOwnProperty(field)) {
          const dbField = field === 'isPublic' ? 'is_public' : 
                         field === 'imageUrl' ? 'image_url' : field;
          
          updateFields.push(`${dbField} = ?`);
          
          if (field === 'tags') {
            updateValues.push(JSON.stringify(updateData[field] || []));
          } else {
            updateValues.push(updateData[field]);
          }
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Aucune donnée valide à mettre à jour'
        });
      }

      updateFields.push('updated_at = NOW()');
      updateValues.push(parseInt(id));

      const updateQuery = `
        UPDATE fails 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      await executeQuery(connection, updateQuery, updateValues);

      // Récupérer le fail mis à jour
      const updatedFail = await this.getFailById(parseInt(id), userId, connection);

      console.log(`✅ Fail mis à jour: ${id}`);

      res.json({
        success: true,
        message: 'Fail mis à jour avec succès',
        fail: updatedFail
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
    const connection = req.dbConnection;
    
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Vérifier que le fail existe et appartient à l'utilisateur
      const existingFail = await this.getFailById(parseInt(id), userId, connection);
      
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

      // Supprimer en cascade (réactions, commentaires, etc.)
      await executeTransaction(connection, async (conn) => {
        // Supprimer les réactions
        await executeQuery(conn, 'DELETE FROM fail_reactions WHERE fail_id = ?', [parseInt(id)]);
        
        // Supprimer les commentaires
        await executeQuery(conn, 'DELETE FROM fail_comments WHERE fail_id = ?', [parseInt(id)]);
        
        // Supprimer le fail
        await executeQuery(conn, 'DELETE FROM fails WHERE id = ?', [parseInt(id)]);
      });

      console.log(`✅ Fail supprimé: ${id}`);

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
    const connection = req.dbConnection;
    
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
      const fail = await this.getFailById(parseInt(id), userId, connection);
      if (!fail) {
        return res.status(404).json({
          success: false,
          message: 'Fail non trouvé'
        });
      }

      // Vérifier/insérer la réaction
      const existingReaction = await executeQuery(
        connection,
        'SELECT * FROM fail_reactions WHERE fail_id = ? AND user_id = ?',
        [parseInt(id), userId]
      );

      if (existingReaction.length > 0) {
        // Mettre à jour la réaction existante
        await executeQuery(
          connection,
          'UPDATE fail_reactions SET reaction_type = ?, created_at = NOW() WHERE fail_id = ? AND user_id = ?',
          [reactionType, parseInt(id), userId]
        );
      } else {
        // Créer une nouvelle réaction
        await executeQuery(
          connection,
          'INSERT INTO fail_reactions (fail_id, user_id, reaction_type, created_at) VALUES (?, ?, ?, NOW())',
          [parseInt(id), userId, reactionType]
        );
      }

      // Mettre à jour les stats utilisateur
      await this.updateUserStats(userId, 'reaction_given', connection);
      if (fail.user_id !== userId) {
        await this.updateUserStats(fail.user_id, 'reaction_received', connection);
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
    const connection = req.dbConnection;
    
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await executeQuery(
        connection,
        'DELETE FROM fail_reactions WHERE fail_id = ? AND user_id = ?',
        [parseInt(id), userId]
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
   * Incrémenter le compteur de vues
   */
  static async incrementViewCount(failId, userId, connection) {
    try {
      // Vérifier si l'utilisateur a déjà vu ce fail récemment (dans les dernières 24h)
      const recentView = await executeQuery(
        connection,
        'SELECT * FROM fail_views WHERE fail_id = ? AND user_id = ? AND viewed_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)',
        [failId, userId]
      );

      if (recentView.length === 0) {
        // Ajouter ou mettre à jour la vue
        await executeQuery(
          connection,
          `INSERT INTO fail_views (fail_id, user_id, viewed_at) 
           VALUES (?, ?, NOW()) 
           ON DUPLICATE KEY UPDATE viewed_at = NOW()`,
          [failId, userId]
        );

        // Mettre à jour le compteur global
        await executeQuery(
          connection,
          'UPDATE fails SET view_count = view_count + 1 WHERE id = ?',
          [failId]
        );
      }
    } catch (error) {
      console.warn('⚠️ Erreur incrémentation vues:', error);
    }
  }

  /**
   * Mettre à jour les statistiques utilisateur
   */
  static async updateUserStats(userId, statType, connection) {
    try {
      const statMapping = {
        'fail_created': 'fails_count',
        'reaction_given': 'reactions_given',
        'reaction_received': 'reactions_received'
      };

      const statField = statMapping[statType];
      if (statField) {
        await executeQuery(
          connection,
          `UPDATE users SET ${statField} = ${statField} + 1 WHERE id = ?`,
          [userId]
        );
      }
    } catch (error) {
      console.warn('⚠️ Erreur mise à jour stats:', error);
    }
  }

  /**
   * Vérifier les progrès des badges
   */
  static async checkBadgeProgress(userId, actionType, connection) {
    try {
      // Implementation simplifiée - à développer selon les badges
      console.log(`🏆 Vérification badges pour utilisateur ${userId}, action: ${actionType}`);
    } catch (error) {
      console.warn('⚠️ Erreur vérification badges:', error);
    }
  }

  /**
   * Récupérer les statistiques des fails
   */
  static async getFailsStats(req, res) {
    const connection = req.dbConnection;
    
    try {
      const userId = req.user ? req.user.id : null;

      const stats = {};

      // Stats globales
      const globalStats = await executeQuery(connection, `
        SELECT 
          COUNT(*) as total_fails,
          COUNT(DISTINCT user_id) as total_users,
          SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public_fails,
          (SELECT COUNT(*) FROM fail_reactions) as total_reactions
        FROM fails
      `);

      stats.global = globalStats[0];

      // Stats par catégorie
      const categoryStats = await executeQuery(connection, `
        SELECT category, COUNT(*) as count
        FROM fails
        WHERE is_public = 1
        GROUP BY category
        ORDER BY count DESC
      `);

      stats.byCategory = categoryStats;

      // Stats utilisateur si connecté
      if (userId) {
        const userStats = await executeQuery(connection, `
          SELECT 
            COUNT(*) as my_fails,
            SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as my_public_fails,
            (SELECT COUNT(*) FROM fail_reactions WHERE fail_id IN 
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
}

module.exports = FailsController;