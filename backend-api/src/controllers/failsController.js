const { executeQuery, executeTransaction } = require('../config/database');

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
    reactions: fail.reactions ? JSON.parse(fail.reactions) : {},
    commentsCount: fail.comments_count,
    is_public: !!fail.is_public,
    createdAt: new Date(fail.created_at).toISOString(),
    updatedAt: new Date(fail.updated_at).toISOString(),
    tags: fail.tags ? JSON.parse(fail.tags) : [],
    location: fail.location ? JSON.parse(fail.location) : null,
    userReaction: fail.user_reaction
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
        tags = [],
        is_public = true,
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
        is_public,
        imageUrl,
        location ? JSON.stringify(location) : null
      ];

      const result = await executeQuery(failQuery, failValues);
      const failId = result.insertId;

      // Récupérer le fail créé avec les informations utilisateur
      const createdFail = await this.getFailById(failId, userId);
      const createdFailMapped = mapFailRow(createdFail);

      // Mettre à jour les statistiques utilisateur
      await this.updateUserStats(userId, 'fail_created');

      // Vérifier les badges potentiels
      await this.checkBadgeProgress(userId, 'fail_created');

      console.log(`✅ Fail créé: ${failId} par utilisateur ${userId}`);

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
      const {
        page = 1,
        limit = 20,
        category = null,
        search = null,
        userId = null,
        is_public = true,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const currentUserId = req.user ? req.user.id : null;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Construction de la requête
      let whereConditions = [];
      let queryParams = [];

      // Filtres de base
      if (is_public === 'true') {
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

      const fails = await executeQuery(query, finalParams);

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

      const countResult = await executeQuery(countQuery, countParams);
      const total = countResult[0].total;

      // Traitement des données selon le contrat API
      const processedFails = fails.map(mapFailRow);

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
   * Récupérer uniquement les fails publics
   */
  static async getPublicFails(req, res) {
    try {
      const { page = 1, limit = 20, offset = null } = req.query;
      const limitNum = parseInt(limit);
      const pageNum = offset !== null ? Math.floor(parseInt(offset) / limitNum) + 1 : parseInt(page);
      const offsetNum = offset !== null ? parseInt(offset) : (pageNum - 1) * limitNum;

      const query = `
        SELECT f.*, u.display_name, u.avatar_url
        FROM fails f
        JOIN users u ON f.user_id = u.id
        WHERE f.is_public = 1
        ORDER BY f.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const fails = await executeQuery(query, [limitNum, offsetNum]);
      const processed = fails.map(mapFailRow);

      const countResult = await executeQuery('SELECT COUNT(*) as total FROM fails WHERE is_public = 1');
      const total = countResult[0].total;

      res.json({
        success: true,
        fails: processed,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('❌ Erreur récupération fails publics:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des fails publics",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Récupérer un fail par ID
   */
  static async getFailById(failId, userId = null) {
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
      const results = await executeQuery(query, params);

      if (results.length === 0) {
        return null;
      }

      const fail = results[0];
      return {
        ...fail,
        tags: JSON.parse(fail.tags || '[]'),
        location: fail.location ? JSON.parse(fail.location) : null,
        is_public: !!fail.is_public,
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

      const fail = await this.getFailById(parseInt(id), userId);

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
        await this.incrementViewCount(parseInt(id), userId);
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
      const existingFail = await this.getFailById(parseInt(id), userId);
      
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
      const allowedFields = ['title', 'description', 'category', 'tags', 'is_public', 'imageUrl'];
      const updateFields = [];
      const updateValues = [];

      allowedFields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(updateData, field)) {
          const dbField = field === 'is_public' ? 'is_public' :
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

      await executeQuery(updateQuery, updateValues);

      // Récupérer le fail mis à jour
      const updatedFail = await this.getFailById(parseInt(id), userId);
      const mappedFail = mapFailRow(updatedFail);

      console.log(`✅ Fail mis à jour: ${id}`);

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
      const existingFail = await this.getFailById(parseInt(id), userId);
      
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
      await executeTransaction([
        { query: 'DELETE FROM fail_reactions WHERE fail_id = ?', params: [parseInt(id)] },
        { query: 'DELETE FROM fail_comments WHERE fail_id = ?', params: [parseInt(id)] },
        { query: 'DELETE FROM fails WHERE id = ?', params: [parseInt(id)] }
      ]);

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
      const fail = await this.getFailById(parseInt(id), userId);
      if (!fail) {
        return res.status(404).json({
          success: false,
          message: 'Fail non trouvé'
        });
      }

      // Vérifier/insérer la réaction
      const existingReaction = await executeQuery('SELECT * FROM fail_reactions WHERE fail_id = ? AND user_id = ?',
        [parseInt(id), userId]
      );

      if (existingReaction.length > 0) {
        // Mettre à jour la réaction existante
        await executeQuery('UPDATE fail_reactions SET reaction_type = ?, created_at = NOW() WHERE fail_id = ? AND user_id = ?',
          [reactionType, parseInt(id), userId]
        );
      } else {
        // Créer une nouvelle réaction
        await executeQuery('INSERT INTO fail_reactions (fail_id, user_id, reaction_type, created_at) VALUES (?, ?, ?, NOW())',
          [parseInt(id), userId, reactionType]
        );
      }

      // Mettre à jour les stats utilisateur
      await this.updateUserStats(userId, 'reaction_given');
      if (fail.user_id !== userId) {
        await this.updateUserStats(fail.user_id, 'reaction_received');
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

      await executeQuery('DELETE FROM fail_reactions WHERE fail_id = ? AND user_id = ?',
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
   * Mettre à jour les statistiques utilisateur
   */
  static async updateUserStats(userId, statType) {
    try {
      const statMapping = {
        'fail_created': 'fails_count',
        'reaction_given': 'reactions_given',
        'reaction_received': 'reactions_received'
      };

      const statField = statMapping[statType];
      if (statField) {
        await executeQuery(`UPDATE users SET ${statField} = ${statField} + 1 WHERE id = ?`,
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
  static async checkBadgeProgress(userId, actionType) {
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
    
    try {
      const userId = req.user ? req.user.id : null;

      const stats = {};

      // Stats globales
      const globalStats = await executeQuery(`
        SELECT 
          COUNT(*) as total_fails,
          COUNT(DISTINCT user_id) as total_users,
          SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public_fails,
          (SELECT COUNT(*) FROM fail_reactions) as total_reactions
        FROM fails
      `);

      stats.global = globalStats[0];

      // Stats par catégorie
      const categoryStats = await executeQuery(`
        SELECT category, COUNT(*) as count
        FROM fails
        WHERE is_public = 1
        GROUP BY category
        ORDER BY count DESC
      `);

      stats.byCategory = categoryStats;

      // Stats utilisateur si connecté
      if (userId) {
        const userStats = await executeQuery(`
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

  /**
   * Rechercher des fails
   */
  static async searchFails(req, res) {
    
    try {
      const { 
        q: searchQuery, 
        category, 
        tags,
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
          u.display_name,
          u.avatar_url,
          (SELECT COUNT(*) FROM fail_reactions fr WHERE fr.fail_id = f.id) as reactions_count,
          (SELECT COUNT(*) FROM fail_comments fc WHERE fc.fail_id = f.id) as comments_count,
          ${userId ? `(SELECT reaction_type FROM fail_reactions WHERE fail_id = f.id AND user_id = ?) as user_reaction` : 'NULL as user_reaction'}
        FROM fails f
        JOIN users u ON f.user_id = u.id
        WHERE (f.title LIKE ? OR f.description LIKE ? OR f.tags LIKE ?)
      `;

      const params = [];
      if (userId) {
        params.push(userId);
      }

      const searchTerm = `%${searchQuery}%`;
      params.push(searchTerm, searchTerm, searchTerm);

      // Filtres de visibilité
      if (!userId) {
        query += ' AND f.is_public = 1';
      } else {
        query += ' AND (f.is_public = 1 OR f.user_id = ?)';
        params.push(userId);
      }

      // Filtre par catégorie
      if (category) {
        query += ' AND f.category = ?';
        params.push(category);
      }

      // Filtre par tags
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        tagArray.forEach(tag => {
          query += ' AND f.tags LIKE ?';
          params.push(`%"${tag}"%`);
        });
      }

      query += ' ORDER BY f.created_at DESC LIMIT ? OFFSET ?';
      params.push(limitNum, offset);

      const fails = await executeQuery(query, params);

      // Compter le total pour la pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM fails f
        WHERE (f.title LIKE ? OR f.description LIKE ? OR f.tags LIKE ?)
      `;
      const countParams = [searchTerm, searchTerm, searchTerm];

      if (!userId) {
        countQuery += ' AND f.is_public = 1';
      } else {
        countQuery += ' AND (f.is_public = 1 OR f.user_id = ?)';
        countParams.push(userId);
      }

      if (category) {
        countQuery += ' AND f.category = ?';
        countParams.push(category);
      }

      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        tagArray.forEach(tag => {
          countQuery += ' AND f.tags LIKE ?';
          countParams.push(`%"${tag}"%`);
        });
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
        WHERE is_public = 1
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
      const { limit = 50 } = req.query;
      const limitNum = parseInt(limit) || 50;

      // Récupérer tous les tags depuis les fails publics
      const tagsResults = await executeQuery(`
        SELECT tags 
        FROM fails 
        WHERE is_public = 1 AND tags IS NOT NULL AND tags != '[]'
      `);

      // Compter la fréquence de chaque tag
      const tagCounts = {};

      tagsResults.forEach(result => {
        try {
          const tags = JSON.parse(result.tags);
          if (Array.isArray(tags)) {
            tags.forEach(tag => {
              if (typeof tag === 'string' && tag.trim().length > 0) {
                const normalizedTag = tag.trim().toLowerCase();
                tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
              }
            });
          }
        } catch (parseError) {
          console.warn('⚠️ Erreur parsing tags:', parseError);
        }
      });

      // Trier par popularité et limiter
      const sortedTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limitNum)
        .map(([tag, count]) => ({ name: tag, count }));

      res.json({
        success: true,
        data: sortedTags
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
}

module.exports = FailsController;