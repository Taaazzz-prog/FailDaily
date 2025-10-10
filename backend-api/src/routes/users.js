const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// ====== ROUTES UTILISATEURS (4 endpoints manquants) ======

// GET /api/users/me/badges - Badges de l'utilisateur connecté (AVANT /:userId/badges)
router.get('/me/badges', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🏆 Récupération des badges pour l\'utilisateur connecté:', userId);
    
    // Récupérer les badges de l'utilisateur depuis user_badges avec jointure sur badge_definitions
    const badges = await executeQuery(`
      SELECT 
        bd.id,
        bd.name,
        bd.description,
        bd.icon,
        bd.category,
        bd.rarity,
        bd.requirement_type as badge_type,
        ub.unlocked_at,
        ub.created_at
      FROM user_badges ub
      JOIN badge_definitions bd ON ub.badge_id = bd.id
      WHERE ub.user_id = ?
      ORDER BY ub.unlocked_at DESC
    `, [userId]);
    
    console.log(`✅ ${badges.length} badges trouvés pour l'utilisateur connecté`);
    
    res.json({
      success: true,
      badges: badges || []
    });
  } catch (error) {
    console.error('❌ Erreur récupération badges utilisateur connecté:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des badges'
    });
  }
});

// ====== ROUTES UTILISATEURS (4 endpoints manquants) ======

// GET /api/users/:userId/stats - Statistiques utilisateur
router.get('/:userId/stats', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📊 Récupération des stats pour l\'utilisateur:', userId);
    
    // Vérifier que l'utilisateur existe
    const userExists = await executeQuery(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );
    
    if (!userExists || userExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Récupérer les statistiques de base (requête corrigée)
    const stats = await executeQuery(`
      SELECT 
        u.id,
        COALESCE(up.points_total, 0) as courage_points,
        0 as streak,
        COALESCE(fail_stats.total_fails, 0) as total_fails,
        COALESCE(badge_stats.total_badges, 0) as total_badges,
        COALESCE(reactions_given.total_reactions_given, 0) as total_reactions_given,
        COALESCE(reactions_received.total_reactions_received, 0) as total_reactions_received,
        DATE(u.created_at) as join_date
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN user_points up ON up.user_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as total_fails
        FROM fails 
        WHERE user_id = ?
        GROUP BY user_id
      ) fail_stats ON u.id = fail_stats.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as total_badges
        FROM user_badges 
        WHERE user_id = ?
        GROUP BY user_id
      ) badge_stats ON u.id = badge_stats.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as total_reactions_given
        FROM reactions 
        WHERE user_id = ?
        GROUP BY user_id
      ) reactions_given ON u.id = reactions_given.user_id
      LEFT JOIN (
        SELECT 
          f.user_id,
          COUNT(r.id) as total_reactions_received
        FROM fails f
        LEFT JOIN reactions r ON f.id = r.fail_id
        WHERE f.user_id = ?
        GROUP BY f.user_id
      ) reactions_received ON u.id = reactions_received.user_id
      WHERE u.id = ?
    `, [userId, userId, userId, userId, userId]);
    
    const userStats = stats[0] || {
      courage_points: 0,
      streak: 0,
      total_fails: 0,
      total_reactions_given: 0,
      total_reactions_received: 0,
      total_badges: 0
    };
    
    res.json({
      success: true,
      stats: userStats
    });
  } catch (error) {
    console.error('❌ Erreur récupération stats utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// GET /api/users/:userId/badges - Badges de l'utilisateur
router.get('/:userId/badges', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🏆 Récupération des badges pour l\'utilisateur connecté:', userId);
    
    // Récupérer les badges de l'utilisateur depuis user_badges + badge_definitions
    const badges = await executeQuery(`
      SELECT 
        bd.id,
        bd.name,
        bd.description,
        bd.icon,
        bd.category,
        bd.rarity,
        bd.requirement_type as badge_type,
        ub.unlocked_at
      FROM user_badges ub
      JOIN badge_definitions bd ON ub.badge_id = bd.id
      WHERE ub.user_id = ?
      ORDER BY ub.unlocked_at DESC
    `, [userId]);
    
    console.log(`✅ ${badges.length} badges trouvés pour l'utilisateur ${userId}`);
    
    res.json({
      success: true,
      badges: badges || []
    });
  } catch (error) {
    console.error('❌ Erreur récupération badges utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des badges'
    });
  }
});

// GET /api/users/:userId/badges/ids - IDs des badges de l'utilisateur
router.get('/:userId/badges/ids', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🏆 Récupération des IDs badges pour l\'utilisateur:', userId);
    
    // Récupérer uniquement les IDs des badges de l'utilisateur depuis user_badges
    const result = await executeQuery(`
      SELECT badge_id
      FROM user_badges 
      WHERE user_id = ?
    `, [userId]);
    
    const badgeIds = result.map(row => row.badge_id);
    console.log(`✅ ${badgeIds.length} badges IDs trouvés pour l'utilisateur ${userId}`);
    
    res.json({
      success: true,
      badgeIds: badgeIds
    });
  } catch (error) {
    console.error('❌ Erreur récupération IDs badges:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des IDs badges'
    });
  }
});

// GET /api/users/:userId/fails - Fails de l'utilisateur
router.get('/:userId/fails', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📝 Récupération des fails pour l\'utilisateur:', userId);
    
    const fails = await executeQuery(`
      SELECT 
        f.id,
        f.title,
        f.description,
        f.category,
        f.image_url,
        f.is_anonyme,
        f.created_at,
        f.updated_at,
        u.email,
        COALESCE(p.display_name, p.username, 'Utilisateur') as authorName,
        COALESCE(p.avatar_url, 'assets/profil/face.png') as authorAvatar
      FROM fails f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN profiles p ON f.user_id = p.user_id
      LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
      WHERE f.user_id = ? AND (fm.status IS NULL OR fm.status = 'approved')
      ORDER BY f.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      fails: fails || []
    });
  } catch (error) {
    console.error('❌ Erreur récupération fails utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des fails'
    });
  }
});

// POST /api/users/:userId/courage-points - Ajouter des points de courage
router.post('/:userId/courage-points', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { points, reason } = req.body;
    const requesterId = req.user?.id;
    const requesterRole = String(req.user?.role || '').toLowerCase();

    const isSelf = requesterId === userId;
    const isPrivileged = ['admin', 'super_admin'].includes(requesterRole);

    if (!isSelf && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }
    
    console.log(`🏆 Ajout de ${points} points pour l'utilisateur ${userId} - Raison: ${reason}`);
    
    // Validation
    if (!points || typeof points !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Le nombre de points est requis et doit être un nombre'
      });
    }
    
    // Vérifier que l'utilisateur existe
    const userExists = await executeQuery(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );
    
    if (!userExists || userExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier si l'utilisateur a déjà des points
    const existingPoints = await executeQuery(
      'SELECT points_total FROM user_points WHERE user_id = ?',
      [userId]
    );
    
    if (existingPoints && existingPoints.length > 0) {
      // Mettre à jour les points existants
      await executeQuery(
        'UPDATE user_points SET points_total = points_total + ?, updated_at = NOW() WHERE user_id = ?',
        [points, userId]
      );
    } else {
      // Créer un nouvel enregistrement de points
      await executeQuery(
        'INSERT INTO user_points (user_id, points_total, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        [userId, points]
      );
    }
    
    // Enregistrer l'événement si la table existe
    try {
      await executeQuery(
        'INSERT INTO user_point_events (user_id, points_change, reason, created_at) VALUES (?, ?, ?, NOW())',
        [userId, points, reason || 'Points ajoutés']
      );
    } catch (eventError) {
      console.warn('⚠️ Impossible d\'enregistrer l\'événement de points:', eventError.message);
    }
    
    res.json({
      success: true,
      message: `${points} points ajoutés avec succès`,
      points_added: points
    });
    
  } catch (error) {
    console.error('❌ Erreur ajout points de courage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout des points'
    });
  }
});

module.exports = router;
