const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// ====== ROUTES BADGES (6 endpoints) ======

// GET /api/badges/available - Tous les badges disponibles
router.get('/available', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Récupération des badges disponibles depuis badge_definitions');
    
    // Récupérer TOUS les badges depuis la table badge_definitions
    const badges = await executeQuery(`
      SELECT 
        id,
        name,
        description,
        icon,
        category,
        rarity,
        requirement_type,
        requirement_value,
        created_at
      FROM badge_definitions 
      ORDER BY 
        CASE rarity 
          WHEN 'common' THEN 1 
          WHEN 'rare' THEN 2 
          WHEN 'epic' THEN 3 
          WHEN 'legendary' THEN 4 
        END,
        category,
        requirement_value
    `);
    
    console.log(`✅ ${badges.length} badges récupérés depuis badge_definitions`);
    
    // Mapper les données pour le frontend
    const mappedBadges = badges.map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      rarity: badge.rarity,
      requirements: {
        type: badge.requirement_type,
        value: badge.requirement_value
      },
      created_at: badge.created_at
    }));
    
    res.json({
      success: true,
      badges: mappedBadges
    });
  } catch (error) {
    console.error('❌ Erreur récupération badges disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des badges'
    });
  }
});

// GET /api/badges/definitions - Alias pour /available (compatibilité)
router.get('/definitions', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Récupération des définitions de badges (alias /available)');
    
    // Récupérer TOUS les badges depuis la table badge_definitions
    const badges = await executeQuery(`
      SELECT 
        id,
        name,
        description,
        icon,
        category,
        rarity,
        requirement_type,
        requirement_value,
        created_at
      FROM badge_definitions 
      ORDER BY 
        CASE rarity 
          WHEN 'common' THEN 1 
          WHEN 'rare' THEN 2 
          WHEN 'epic' THEN 3 
          WHEN 'legendary' THEN 4 
          ELSE 5 
        END,
        name ASC
    `);
    
    const mappedBadges = badges.map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      rarity: badge.rarity,
      requirements: {
        type: badge.requirement_type,
        value: badge.requirement_value
      },
      created_at: badge.created_at
    }));
    
    res.json({
      success: true,
      badges: mappedBadges,
      total: mappedBadges.length
    });
  } catch (error) {
    console.error('❌ Erreur récupération définitions badges:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des définitions de badges'
    });
  }
});

// GET /api/badges - Tous les badges (alias pour /available)
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Récupération tous les badges (alias /available)');
    
    // Utiliser la même requête que /available
    const badges = await executeQuery(`
      SELECT 
        id,
        name,
        description,
        icon,
        category,
        rarity,
        requirement_type,
        requirement_value,
        created_at
      FROM badge_definitions 
      ORDER BY 
        CASE rarity 
          WHEN 'common' THEN 1 
          WHEN 'rare' THEN 2 
          WHEN 'epic' THEN 3 
          WHEN 'legendary' THEN 4 
        END,
        category,
        requirement_value
    `);
    
    console.log(`✅ ${badges.length} badges récupérés depuis badge_definitions (route /)`);
    
    // Mapper les données pour le frontend
    const mappedBadges = badges.map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      rarity: badge.rarity,
      requirements: {
        type: badge.requirement_type,
        value: badge.requirement_value
      },
      created_at: badge.created_at
    }));
    
    res.json({
      success: true,
      badges: mappedBadges
    });
  } catch (error) {
    console.error('❌ Erreur récupération tous les badges:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des badges'
    });
  }
});

// POST /api/badges/check-unlock/:userId - Vérifier et débloquer les badges automatiquement
router.post('/check-unlock/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🔍 Vérification des badges à débloquer pour l\'utilisateur:', userId);
    
    const newBadges = await checkAndUnlockBadges(userId);
    
    res.json({
      success: true,
      newBadges: newBadges,
      message: `${newBadges.length} nouveaux badges débloqués`
    });
  } catch (error) {
    console.error('❌ Erreur vérification badges:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des badges'
    });
  }
});

/**
 * Fonction pour vérifier et débloquer automatiquement les badges
 */
async function checkAndUnlockBadges(userId) {
  try {
    console.log(`🎯 Vérification des badges pour l'utilisateur ${userId}`);
    
    // Récupérer toutes les définitions de badges
    const badgeDefinitions = await executeQuery(`
      SELECT id, name, description, icon, category, rarity, requirement_type, requirement_value
      FROM badge_definitions
    `);
    
    // Récupérer les badges déjà débloqués par l'utilisateur
    const userBadges = await executeQuery(`
      SELECT id FROM badges WHERE user_id = ?
    `, [userId]);
    
    const userBadgeIds = userBadges.map(b => b.id);
    const newBadges = [];
    
    // Vérifier chaque badge
    for (const badgeDefinition of badgeDefinitions) {
      // Si l'utilisateur a déjà ce badge, passer au suivant
      if (userBadgeIds.includes(badgeDefinition.id)) {
        continue;
      }
      
      const shouldUnlock = await checkBadgeRequirement(userId, badgeDefinition);
      
      if (shouldUnlock) {
        // Débloquer le badge
        await executeQuery(`
          INSERT INTO badges (id, user_id, name, description, icon, category, rarity, badge_type, unlocked_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'achievement', NOW())
        `, [
          badgeDefinition.id,
          userId,
          badgeDefinition.name,
          badgeDefinition.description,
          badgeDefinition.icon,
          badgeDefinition.category,
          badgeDefinition.rarity
        ]);
        
        console.log(`🏆 Badge débloqué: ${badgeDefinition.name} pour l'utilisateur ${userId}`);
        newBadges.push(badgeDefinition);
      }
    }
    
    return newBadges;
  } catch (error) {
    console.error('❌ Erreur dans checkAndUnlockBadges:', error);
    return [];
  }
}

/**
 * Vérifier si un badge doit être débloqué selon ses critères
 */
async function checkBadgeRequirement(userId, badgeDefinition) {
  try {
    const { requirement_type, requirement_value } = badgeDefinition;
    
    switch (requirement_type) {
      case 'fail_count':
        const failCount = await executeQuery(`
          SELECT COUNT(*) as count FROM fails WHERE user_id = ?
        `, [userId]);
        return failCount[0].count >= requirement_value;
        
      case 'reactions_received':
        const reactionsReceived = await executeQuery(`
          SELECT COUNT(r.id) as count
          FROM fails f
          LEFT JOIN reactions r ON f.id = r.fail_id
          WHERE f.user_id = ? AND r.reaction_type = 'courage'
        `, [userId]);
        return reactionsReceived[0].count >= requirement_value;
        
      case 'streak_days':
        const profile = await executeQuery(`
          SELECT streak FROM profiles WHERE user_id = ?
        `, [userId]);
        return profile[0]?.streak >= requirement_value;
        
      case 'reaction_given':
        const reactionsGiven = await executeQuery(`
          SELECT COUNT(*) as count FROM reactions WHERE user_id = ?
        `, [userId]);
        return reactionsGiven[0].count >= requirement_value;
        
      case 'login_days':
        // Pour l'instant, supposer que c'est lié aux jours depuis la création
        const user = await executeQuery(`
          SELECT DATEDIFF(NOW(), created_at) as days FROM users WHERE id = ?
        `, [userId]);
        return user[0]?.days >= requirement_value;
        
      default:
        console.log(`⚠️ Type de critère non supporté: ${badgeDefinition.requirement_type}`);
        return false;
    }
  } catch (error) {
    console.error(`❌ Erreur vérification critère ${badgeDefinition.requirement_type}:`, error);
    return false;
  }
}

module.exports = router;
