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
    is_anonyme: !!fail.is_anonyme,
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
        is_anonyme = false,
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
          is_anonyme, image_url, location, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const failValues = [
        userId,
        title.trim(),
        description ? description.trim() : null,
        category,
        JSON.stringify(tags),
        is_anonyme,
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
        // is_anonyme is not a visibility filter; no filter here
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const currentUserId = req.user ? req.user.id : null;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Construction de la requête
      let whereConditions = [];
      let queryParams = [];

      // Filtres de base
      // No filter on anonymity

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
          p.display_name,
          p.avatar_url,
          (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id) as reactions_count,
          (SELECT COUNT(*) FROM comments fc WHERE fc.fail_id = f.id) as comments_count,
          ${currentUserId ? `(SELECT reaction_type FROM reactions WHERE fail_id = f.id AND user_id = ?) as user_reaction` : 'NULL as user_reaction'}
        FROM fails f
        JOIN users u ON f.user_id = u.id
        JOIN profiles p ON u.id = p.user_id
        LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
        ${whereClause ? whereClause + ' AND ' : 'WHERE '} (fm.status IS NULL OR fm.status = 'approved')
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
        LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
        ${whereClause ? whereClause + ' AND ' : 'WHERE '} (fm.status IS NULL OR fm.status = 'approved')
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
 * Récupérer tous les fails avec anonymisation conditionnelle
 * - Scroll infini supporté via ?offset=
 * - Pagination classique via ?page=
 */
  static async getPublicFails(req, res) {
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
    const sql = `
      SELECT f.*, p.display_name, p.avatar_url
      FROM fails f
      JOIN users u    ON f.user_id = u.id
      JOIN profiles p ON u.id = p.user_id
      LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
      WHERE (fm.status IS NULL OR fm.status = 'approved')
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
    console.error('❌ Erreur récupération fails publics:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des fails publics'
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
          p.display_name,
          p.avatar_url,
          (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id) as reactions_count,
          (SELECT COUNT(*) FROM comments fc WHERE fc.fail_id = f.id) as comments_count,
          ${userId ? `(SELECT reaction_type FROM reactions WHERE fail_id = f.id AND user_id = ?) as user_reaction` : 'NULL as user_reaction'}
        FROM fails f
        JOIN users u ON f.user_id = u.id
        JOIN profiles p ON u.id = p.user_id
        LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
        WHERE f.id = ? AND (fm.status IS NULL OR fm.status = 'approved')
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

      const fail = await this.getFailById(parseInt(id), userId);

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
      const allowedFields = ['title', 'description', 'category', 'tags', 'is_anonyme', 'imageUrl'];
      const updateFields = [];
      const updateValues = [];

      allowedFields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(updateData, field)) {
          const dbField = field === 'is_anonyme' ? 'is_anonyme' :
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
        { query: 'DELETE FROM reactions WHERE fail_id = ?', params: [parseInt(id)] },
        { query: 'DELETE FROM comments WHERE fail_id = ?', params: [parseInt(id)] },
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
      const existingReaction = await executeQuery('SELECT * FROM reactions WHERE fail_id = ? AND user_id = ?',
        [parseInt(id), userId]
      );

      if (existingReaction.length > 0) {
        // Mettre à jour la réaction existante
        await executeQuery('UPDATE reactions SET reaction_type = ?, created_at = NOW() WHERE fail_id = ? AND user_id = ?',
          [reactionType, parseInt(id), userId]
        );
      } else {
        // Créer une nouvelle réaction
        await executeQuery('INSERT INTO reactions (fail_id, user_id, reaction_type, created_at) VALUES (?, ?, ?, NOW())',
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

      await executeQuery('DELETE FROM reactions WHERE fail_id = ? AND user_id = ?',
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
          p.display_name,
          p.avatar_url,
          (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id) as reactions_count,
          (SELECT COUNT(*) FROM comments fc WHERE fc.fail_id = f.id) as comments_count,
          ${userId ? `(SELECT reaction_type FROM reactions WHERE fail_id = f.id AND user_id = ?) as user_reaction` : 'NULL as user_reaction'}
        FROM fails f
        JOIN users u ON f.user_id = u.id
        JOIN profiles p ON u.id = p.user_id
        LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
        WHERE (f.title LIKE ? OR f.description LIKE ? OR f.tags LIKE ?)
          AND (fm.status IS NULL OR fm.status = 'approved')
      `;

      const params = [];
      if (userId) {
        params.push(userId);
      }

      const searchTerm = `%${searchQuery}%`;
      params.push(searchTerm, searchTerm, searchTerm);

      // Aucun filtre de visibilité basé sur l'anonymat (is_anonyme)

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
        LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
        WHERE (f.title LIKE ? OR f.description LIKE ? OR f.tags LIKE ?)
          AND (fm.status IS NULL OR fm.status = 'approved')
      `;
      const countParams = [searchTerm, searchTerm, searchTerm];

      // Aucun filtre de visibilité basé sur l'anonymat (is_anonyme)

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
      const { limit = 50 } = req.query;
      const limitNum = parseInt(limit) || 50;

      // Récupérer tous les tags depuis les fails publics
      const tagsResults = await executeQuery(`
        SELECT tags 
        FROM fails 
        WHERE is_anonyme = 0 AND tags IS NOT NULL AND tags != '[]'
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
        status ENUM('under_review','hidden','approved') NOT NULL DEFAULT 'under_review',
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (fail_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  static async reportFail(req, res) {
    try {
      await this.ensureModerationTables();
      const { id } = req.params;
      const userId = req.user.id;
      const reason = (req.body && req.body.reason) || null;

      // Existence
      const rows = await executeQuery('SELECT id FROM fails WHERE id = ? LIMIT 1', [id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Fail non trouvé' });

      // Insert report (ignore duplicate)
      try {
        const rid = require('uuid').v4();
        await executeQuery(
          'INSERT INTO fail_reports (id, fail_id, user_id, reason, created_at) VALUES (?, ?, ?, ?, NOW())',
          [rid, id, userId, reason]
        );
      } catch (_) { /* duplicate ok */ }
      // Threshold logic from app_config.moderation (default 1)
      const [{ reports }] = await executeQuery('SELECT COUNT(*) AS reports FROM fail_reports WHERE fail_id = ?', [id]);
      let threshold = 1;
      try {
        const row = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['moderation']);
        if (row && row[0]) {
          const cfg = JSON.parse(row[0].value || '{}');
          threshold = Number(cfg.failReportThreshold) || 1;
        }
      } catch {}

      if (reports >= threshold) {
        await executeQuery(
          'INSERT INTO fail_moderation (fail_id, status, created_at, updated_at) VALUES (?, "hidden", NOW(), NOW()) ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()',
          [id]
        );
      }

      return res.json({ success: true, message: 'Fail signalé' });
    } catch (error) {
      console.error('❌ reportFail error:', error);
      return res.status(500).json({ success: false, message: 'Erreur signalement fail' });
    }
  }
}

module.exports = FailsController;
