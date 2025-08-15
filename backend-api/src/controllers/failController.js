const { v4: uuidv4 } = require('uuid');
const { executeQuery, executeTransaction } = require('../config/database');

// Créer un fail
const createFail = async (req, res) => {
  try {
    const { title, description, category, isPublic } = req.body;
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

    // Créer le fail
    await executeQuery(`
      INSERT INTO fails (id, user_id, title, description, category, image_url, is_public, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [failId, userId, title, description, category, req.file?.filename || null, isPublic || false]);

    // Mettre à jour les statistiques du profil
    await executeQuery(
      'UPDATE profiles SET total_fails = total_fails + 1 WHERE user_id = ?',
      [userId]
    );

    // Attribution du badge "First Fail" si c'est le premier
    if (todayFails[0].count === 0) {
      const firstFailBadge = await executeQuery(
        'SELECT id FROM badges WHERE code = "first_fail"'
      );
      
      if (firstFailBadge.length > 0) {
        // Vérifier si l'utilisateur a déjà ce badge
        const existingBadge = await executeQuery(
          'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?',
          [userId, firstFailBadge[0].id]
        );

        if (existingBadge.length === 0) {
          await executeQuery(
            'INSERT INTO user_badges (id, user_id, badge_id, earned_at) VALUES (?, ?, ?, NOW())',
            [uuidv4(), userId, firstFailBadge[0].id]
          );

          await executeQuery(
            'UPDATE profiles SET total_badges = total_badges + 1, total_points = total_points + 10 WHERE user_id = ?',
            [userId]
          );
        }
      }
    }

    // Log de l'activité
    await executeQuery(
      'INSERT INTO user_activities (id, user_id, activity_type, description, created_at) VALUES (?, ?, ?, ?, NOW())',
      [uuidv4(), userId, 'create_fail', `Fail créé: ${title}`]
    );

    res.status(201).json({
      message: 'Fail créé avec succès',
      fail: {
        id: failId,
        title,
        description,
        category,
        isPublic: isPublic || false,
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

    let query = `
      SELECT f.id, f.title, f.description, f.category, f.image_url, f.is_public, f.created_at,
             p.display_name as author_name, p.avatar_url as author_avatar,
             u.id as author_id,
             (SELECT COUNT(*) FROM reactions r WHERE r.fail_id = f.id) as reactions_count
      FROM fails f
      JOIN profiles p ON f.user_id = p.user_id
      JOIN users u ON f.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    // Filtres
    if (!currentUserId) {
      query += ' AND f.is_public = 1';
    } else if (filterUserId) {
      query += ' AND f.user_id = ?';
      params.push(filterUserId);
    } else {
      query += ' AND (f.is_public = 1 OR f.user_id = ?)';
      params.push(currentUserId);
    }

    if (category) {
      query += ' AND f.category = ?';
      params.push(category);
    }

    query += ' ORDER BY f.created_at DESC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const fails = await executeQuery(query, params);

    // Compter le total pour la pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM fails f
      WHERE 1=1
    `;
    const countParams = [];

    if (!currentUserId) {
      countQuery += ' AND f.is_public = 1';
    } else if (filterUserId) {
      countQuery += ' AND f.user_id = ?';
      countParams.push(filterUserId);
    } else {
      countQuery += ' AND (f.is_public = 1 OR f.user_id = ?)';
      countParams.push(currentUserId);
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
        title: fail.title,
        description: fail.description,
        category: fail.category,
        imageUrl: fail.image_url,
        isPublic: fail.is_public,
        createdAt: fail.created_at,
        author: {
          id: fail.author_id,
          name: fail.author_name,
          avatar: fail.author_avatar
        },
        reactionsCount: fail.reactions_count
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
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
      SELECT f.id, f.title, f.description, f.category, f.image_url, f.is_public, f.created_at,
             p.display_name as author_name, p.avatar_url as author_avatar,
             u.id as author_id,
             (SELECT COUNT(*) FROM reactions r WHERE r.fail_id = f.id) as reactions_count
      FROM fails f
      JOIN profiles p ON f.user_id = p.user_id
      JOIN users u ON f.user_id = u.id
      WHERE f.id = ?
    `, [id]);

    if (fails.length === 0) {
      return res.status(404).json({
        error: 'Fail introuvable',
        code: 'FAIL_NOT_FOUND'
      });
    }

    const fail = fails[0];

    // Vérifier les permissions de lecture
    if (!fail.is_public && (!currentUserId || fail.author_id !== currentUserId)) {
      return res.status(403).json({
        error: 'Accès non autorisé',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({
      id: fail.id,
      title: fail.title,
      description: fail.description,
      category: fail.category,
      imageUrl: fail.image_url,
      isPublic: fail.is_public,
      createdAt: fail.created_at,
      author: {
        id: fail.author_id,
        name: fail.author_name,
        avatar: fail.author_avatar
      },
      reactionsCount: fail.reactions_count
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
      'UPDATE profiles SET total_fails = total_fails - 1 WHERE user_id = ?',
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

module.exports = {
  createFail,
  getFails,
  getFailById,
  deleteFail
};
