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
    const { title, description, category, is_anonyme } = req.body;
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

    // Créer le fail - Conversion correcte du boolean is_anonyme
    const isAnonymeValue = is_anonyme === true || is_anonyme === 'true' || is_anonyme === 1 ? 1 : 0;
    
    await executeQuery(`
      INSERT INTO fails (id, user_id, title, description, category, image_url, is_anonyme, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [failId, userId, title, description, category, req.file?.filename || null, isAnonymeValue]);

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
        is_anonyme: !!is_anonyme,
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
    
    // Convertir en nombres et validation
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    // Requête simplifiée sans sous-requête complexe
    let query = `
      SELECT f.id, f.user_id, f.title, f.description, f.category, f.image_url, f.is_anonyme, f.created_at,
             COALESCE(f.comments_count, 0) as comments_count,
             COALESCE(f.reactions, '{"courage":0,"empathy":0,"laugh":0,"support":0}') as reactions
      FROM fails f
      WHERE f.user_id = ?
    `;

    const params = [currentUserId];

    // Filtres additionnels
    if (filterUserId && filterUserId !== currentUserId) {
      // Afficher aussi les fails d'autres utilisateurs (pas filtrés par anonymat)
      query += ' AND f.user_id = ?';
      params.push(filterUserId);
      // Remplacer le premier paramètre
      params[0] = filterUserId;
    }

    if (category) {
      query += ' AND f.category = ?';
      params.push(category);
    }

    query += ' ORDER BY f.created_at DESC LIMIT ? OFFSET ?';

    // Pagination sécurisée
    const offset = (pageNum - 1) * limitNum;
    params.push(limitNum, offset);

    console.log('🔍 Query getFails:', query);
    console.log('🔍 Params:', params);

    const fails = await executeQuery(query, params);

    // Compter le total pour la pagination (requête simplifiée)
    let countQuery = `SELECT COUNT(*) as total FROM fails f WHERE f.user_id = ?`;
    let countParams = [currentUserId];

    if (filterUserId && filterUserId !== currentUserId) {
      countQuery = `SELECT COUNT(*) as total FROM fails f WHERE f.user_id = ?`;
      countParams = [filterUserId];
    }

    if (category) {
      countQuery += ' AND f.category = ?';
      countParams.push(category);
    }

    const totalResult = await executeQuery(countQuery, countParams);
    const total = totalResult[0]?.total || 0;

    // Traitement des résultats
    const processedFails = Array.isArray(fails) ? fails.map(fail => ({
      id: fail.id,
      title: fail.title,
      description: fail.description,
      category: fail.category,
      imageUrl: fail.image_url,
      is_anonyme: !!fail.is_anonyme,
      commentsCount: fail.comments_count || 0,
      reactions: typeof fail.reactions === 'string' ? JSON.parse(fail.reactions) : (fail.reactions || { courage: 0, empathy: 0, laugh: 0, support: 0 }),
      createdAt: fail.created_at,
      userId: fail.user_id
    })) : [];

    console.log(`📊 getFails: ${processedFails.length} fails trouvés sur ${total} total`);

    res.json({
      success: true,
      fails: processedFails,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('❌ Erreur getFails:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des fails",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Récupérer un fail spécifique
const getFailById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    // Requête simplifiée sans sous-requête
    const fails = await executeQuery(`
      SELECT f.id, f.user_id, f.title, f.description, f.category, f.image_url, f.is_anonyme, f.created_at,
             COALESCE(f.comments_count, 0) as comments_count,
             COALESCE(f.reactions, '{"courage":0,"empathy":0,"laugh":0,"support":0}') as reactions
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
        is_anonyme: !!fail.is_anonyme,
        commentsCount: fail.comments_count || 0,
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
    const { title, description, category, is_anonyme } = req.body;
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

    if (is_anonyme !== undefined) {
      updateFields.push('is_anonyme = ?');
      updateValues.push(is_anonyme ? 1 : 0);
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    await executeQuery(
      `UPDATE fails SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Récupérer le fail mis à jour avec les informations de l'auteur
    const updatedFails = await executeQuery(`
      SELECT f.id, f.title, f.description, f.category, f.image_url, f.is_anonyme, f.created_at, f.updated_at,
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
