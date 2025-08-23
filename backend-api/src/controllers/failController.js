const { v4: uuidv4 } = require('uuid');
const { executeQuery, executeTransaction } = require('../config/database');

// Fonction utilitaire pour obtenir les informations de l'utilisateur et de la requête
const getUserActivityData = (req, userId, userEmail, userName = null) => {
  const ip = req.headers['x-forwarded-for'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             (req.connection.socket ? req.connection.socket.remoteAddress : '');
  
  const userAgent = req.headers['user-agent'] || '';
  
  return {
    id: uuidv4(),
    user_id: userId,
    user_email: userEmail,
    user_name: userName,
    ip_address: ip,
    user_agent: userAgent,
    created_at: new Date()
  };
};

// Créer un fail
const createFail = async (req, res) => {
  try {
    const { title, description, category, is_public } = req.body;
    const userId = req.user.id;

    // Validation
    if (!title || !description || !category) {
      return res.status(400).json({
        error: 'Titre, description et catégorie requis',
        code: 'MISSING_FIELDS'
      });
    }

    // Vérifier la limite quotidienne
    const today = new Date().toISOString().split('T')[0];
    const todayFails = await executeQuery(
      'SELECT COUNT(*) as count FROM fails WHERE user_id = ? AND DATE(created_at) = ?',
      [userId, today]
    );

    const maxFailsPerDay = 10; // Limite configurable
    if (todayFails[0].count >= maxFailsPerDay) {
      return res.status(429).json({
        error: `Limite de ${maxFailsPerDay} fails par jour atteinte`,
        code: 'DAILY_LIMIT_REACHED'
      });
    }

    const failId = uuidv4();

    // Créer le fail - Conversion correcte du boolean is_public
    const isPublicValue = is_public === true || is_public === 'true' || is_public === 1 ? 1 : 0;
    
    await executeQuery(`
      INSERT INTO fails (id, user_id, title, description, category, image_url, is_public, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [failId, userId, title, description, category, req.file?.filename || null, isPublicValue]);

  // (Optionnel) Mise à jour des stats utilisateur ou attribution de badges
  // Désactivé car les colonnes/tables attendues ne sont pas standardisées dans le schéma actuel.

    // Log de l'activité avec toutes les données utilisateur
    const activityData = getUserActivityData(req, userId, req.user.email, req.user.displayName);
    await executeQuery(
      'INSERT INTO user_activities (id, user_id, user_email, user_name, action, details, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [activityData.id, activityData.user_id, activityData.user_email, activityData.user_name, 'create_fail', JSON.stringify({ title }), activityData.ip_address, activityData.user_agent]
    );

    res.status(201).json({
      message: 'Fail créé avec succès',
      fail: {
        id: failId,
        user_id: userId,
        title,
        description,
        category,
        is_public: !!is_public,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur création fail:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Récupérer les fails
const getFails = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, userId: filterUserId } = req.query;
    const currentUserId = req.user?.id;
    
    // Convertir en nombres
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    // Sélection minimale pour respecter l'anonymat et le format attendu
    let query = `
      SELECT f.id, f.user_id, f.title, f.description, f.category, f.image_url, f.is_public, f.created_at,
             (SELECT COUNT(*) FROM reactions r WHERE r.fail_id = f.id) as reactions_count
      FROM fails f
      WHERE 1=1
    `;

    const params = [];

    // Filtres
    if (filterUserId) {
      query += ' AND f.user_id = ?';
      params.push(filterUserId);
    }

    if (category) {
      query += ' AND f.category = ?';
      params.push(category);
    }

    query += ' ORDER BY f.created_at DESC';

    // Pagination
    const offset = (pageNum - 1) * limitNum;
    query += ` LIMIT ${limitNum} OFFSET ${offset}`;

  const fails = await executeQuery(query, params);

    // Compter le total pour la pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM fails f
      WHERE 1=1
    `;
    const countParams = [];

    if (filterUserId) {
      countQuery += ' AND f.user_id = ?';
      countParams.push(filterUserId);
    }

    if (category) {
      countQuery += ' AND f.category = ?';
      countParams.push(category);
    }

    const totalResult = await executeQuery(countQuery, countParams);
    const total = totalResult[0].total;

    res.json({
      fails: fails.map(fail => ({
        id: fail.id,
        user_id: fail.user_id,
        title: fail.title,
        description: fail.description,
        category: fail.category,
        imageUrl: fail.image_url,
        is_public: !!fail.is_public,
        createdAt: fail.created_at,
        reactionsCount: fail.reactions_count
      })),
      pagination: {
        currentPage: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Erreur récupération fails:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Récupérer un fail spécifique
const getFailById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    const fails = await executeQuery(`
      SELECT f.id, f.user_id, f.title, f.description, f.category, f.image_url, f.is_public, f.created_at,
             (SELECT COUNT(*) FROM reactions r WHERE r.fail_id = f.id) as reactions_count
      FROM fails f
      WHERE f.id = ?
    `, [id]);

    if (fails.length === 0) {
      return res.status(404).json({
        error: 'Fail introuvable',
        code: 'FAIL_NOT_FOUND'
      });
    }

    const fail = fails[0];

    res.json({
      fail: {
        id: fail.id,
        user_id: fail.user_id,
        title: fail.title,
        description: fail.description,
        category: fail.category,
        imageUrl: fail.image_url,
        is_public: !!fail.is_public,
        createdAt: fail.created_at,
        reactionsCount: fail.reactions_count
      }
    });

  } catch (error) {
    console.error('Erreur récupération fail:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Supprimer un fail
const deleteFail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Vérifier si le fail existe et appartient à l'utilisateur (ou si admin)
    const fails = await executeQuery(
      'SELECT user_id FROM fails WHERE id = ?',
      [id]
    );

    if (fails.length === 0) {
      return res.status(404).json({
        error: 'Fail introuvable',
        code: 'FAIL_NOT_FOUND'
      });
    }

    const fail = fails[0];

    if (fail.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        error: 'Vous ne pouvez supprimer que vos propres fails',
        code: 'ACCESS_DENIED'
      });
    }

    // Supprimer le fail (les réactions seront supprimées par CASCADE)
    await executeQuery('DELETE FROM fails WHERE id = ?', [id]);

    // Mettre à jour les statistiques du profil
    await executeQuery(
      // Ne pas mettre à jour les compteurs car les colonnes n'existent pas
      // 'UPDATE profiles SET total_fails = total_fails - 1 WHERE user_id = ?',
      [fail.user_id]
    );

    res.json({
      message: 'Fail supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression fail:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Modifier un fail
const updateFail = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, is_public } = req.body;
    const userId = req.user.id;

    // Validation des données
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        error: 'Le titre est requis',
        code: 'TITLE_REQUIRED'
      });
    }

    if (title.length > 200) {
      return res.status(400).json({
        error: 'Le titre ne peut pas dépasser 200 caractères',
        code: 'TITLE_TOO_LONG'
      });
    }

    if (description && description.length > 2000) {
      return res.status(400).json({
        error: 'La description ne peut pas dépasser 2000 caractères',
        code: 'DESCRIPTION_TOO_LONG'
      });
    }

    // Vérifier que le fail existe et appartient à l'utilisateur
    const existingFails = await executeQuery(
      'SELECT id, user_id FROM fails WHERE id = ?',
      [id]
    );

    if (existingFails.length === 0) {
      return res.status(404).json({
        error: 'Fail introuvable',
        code: 'FAIL_NOT_FOUND'
      });
    }

    const fail = existingFails[0];

    if (fail.user_id !== userId) {
      return res.status(403).json({
        error: 'Vous ne pouvez modifier que vos propres fails',
        code: 'ACCESS_DENIED'
      });
    }

    // Mettre à jour le fail
    const updateFields = [];
    const updateValues = [];

    if (title) {
      updateFields.push('title = ?');
      updateValues.push(title.trim());
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    if (category) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }

    if (is_public !== undefined) {
      updateFields.push('is_public = ?');
      updateValues.push(is_public ? 1 : 0);
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    await executeQuery(
      `UPDATE fails SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Récupérer le fail mis à jour avec les informations de l'auteur
    const updatedFails = await executeQuery(`
      SELECT f.id, f.title, f.description, f.category, f.image_url, f.is_public, f.created_at, f.updated_at,
             p.display_name as author_name, p.avatar_url as author_avatar,
             u.id as author_id,
             (SELECT COUNT(*) FROM reactions r WHERE r.fail_id = f.id) as reactions_count
      FROM fails f
      JOIN profiles p ON f.user_id = p.user_id
      JOIN users u ON f.user_id = u.id
      WHERE f.id = ?
    `, [id]);

    res.json({
      message: 'Fail mis à jour avec succès',
      fail: updatedFails[0]
    });

  } catch (error) {
    console.error('Erreur modification fail:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  createFail,
  getFails,
  getFailById,
  updateFail,
  deleteFail
};
