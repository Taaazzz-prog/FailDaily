const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

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
    
    // Récupérer les statistiques de base
    const stats = await executeQuery(`
      SELECT 
        u.id,
        COALESCE(p.courage_points, 0) as courage_points,
        COALESCE(p.streak, 0) as streak,
        COALESCE(fail_stats.total_fails, 0) as total_fails,
        COALESCE(badge_stats.total_badges, 0) as total_badges,
        COALESCE(reactions_given.total_reactions_given, 0) as total_reactions_given,
        COALESCE(reactions_received.total_reactions_received, 0) as total_reactions_received,
        DATE(u.created_at) as join_date
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as total_fails
        FROM fails 
        WHERE user_id = ?
        GROUP BY user_id
      ) fail_stats ON u.id = fail_stats.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as total_badges
        FROM badges 
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
    console.log('🏆 Récupération des badges pour l\'utilisateur:', userId);
    
    // Récupérer les badges de l'utilisateur depuis la table badges
    const badges = await executeQuery(`
      SELECT 
        b.id,
        b.name,
        b.description,
        b.icon,
        b.category,
        b.rarity,
        b.badge_type,
        b.unlocked_at
      FROM badges b
      WHERE b.user_id = ?
      ORDER BY b.unlocked_at DESC
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
    
    // Récupérer uniquement les IDs des badges de l'utilisateur
    const result = await executeQuery(`
      SELECT id
      FROM badges 
      WHERE user_id = ?
    `, [userId]);
    
    const badgeIds = result.map(row => row.id);
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

module.exports = router;
