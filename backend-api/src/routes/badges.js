const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Charge la configuration des seuils de badges depuis app_config.badge_thresholds (JSON)
async function getBadgeThresholds() {
  try {
    const row = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['badge_thresholds']);
    if (row && row[0] && row[0].value) {
      try { return JSON.parse(row[0].value); } catch {}
    }
  } catch {}
  // Valeurs par défaut
  return {
    funny_fails: { laughsPerFail: 5 },
    trends_created: { reactionsPerFail: 20 },
    popular_discussions: { commentsPerFail: 25 }
  };
}

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
    
    // Récupérer les badges déjà débloqués par l'utilisateur (via user_badges)
    const userBadges = await executeQuery(`
      SELECT badge_id FROM user_badges WHERE user_id = ?
    `, [userId]);
    
    const userBadgeIds = userBadges.map(b => b.badge_id);
    const newBadges = [];
    
    // Vérifier chaque badge
    for (const badgeDefinition of badgeDefinitions) {
      // Si l'utilisateur a déjà ce badge, passer au suivant
      if (userBadgeIds.includes(badgeDefinition.id)) {
        continue;
      }
      
      const shouldUnlock = await checkBadgeRequirement(userId, badgeDefinition);
      
      if (shouldUnlock) {
        // Débloquer le badge (via user_badges)
        const { v4: uuidv4 } = require('uuid');
        await executeQuery(`
          INSERT INTO user_badges (id, user_id, badge_id, unlocked_at, created_at)
          VALUES (?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE unlocked_at = COALESCE(unlocked_at, NOW())
        `, [
          uuidv4(),
          userId,
          badgeDefinition.id
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
        // Schéma actuel: pas de colonne streak. Approximer par jours depuis création du compte
        const u = await executeQuery(`
          SELECT DATEDIFF(NOW(), created_at) as days FROM users WHERE id = ?
        `, [userId]);
        return (u[0]?.days || 0) >= requirement_value;
        
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
      
      case 'total_laughs':
      case 'laugh_reactions': {
        const rows = await executeQuery(`
          SELECT COUNT(r.id) as count
          FROM fails f
          LEFT JOIN reactions r ON f.id = r.fail_id
          WHERE f.user_id = ? AND r.reaction_type = 'laugh'
        `, [userId]);
        return (rows[0]?.count || 0) >= requirement_value;
      }
      
      case 'support_given': {
        const rows = await executeQuery(`
          SELECT COUNT(*) as count FROM reactions WHERE user_id = ? AND reaction_type = 'support'
        `, [userId]);
        return (rows[0]?.count || 0) >= requirement_value;
      }
      
      case 'help_count':
      case 'helpful_comments': {
        const rows = await executeQuery(`
          SELECT COUNT(*) as count FROM comments WHERE user_id = ?
        `, [userId]);
        return (rows[0]?.count || 0) >= requirement_value;
      }
      
      case 'unique_interactions': {
        const rows = await executeQuery(`
          SELECT COUNT(DISTINCT r.user_id) as count
          FROM reactions r
          JOIN fails f ON f.id = r.fail_id
          WHERE f.user_id = ?
        `, [userId]);
        return (rows[0]?.count || 0) >= requirement_value;
      }
        
      case 'categories_used': {
        const rows = await executeQuery(`
          SELECT COUNT(DISTINCT category) AS count FROM fails WHERE user_id = ?
        `, [userId]);
        return (rows[0]?.count || 0) >= requirement_value;
      }

      case 'beta_participation': {
        const rows = await executeQuery(`
          SELECT created_at FROM users WHERE id = ?
        `, [userId]);
        if (!rows[0]?.created_at) return false;
        return new Date(rows[0].created_at) < new Date('2025-01-01T00:00:00Z');
      }

      case 'anniversary_participation': {
        // Présence/activité le 11 septembre (anniversaire app)
        const rows = await executeQuery(`
          SELECT COUNT(*) AS count FROM user_activities
          WHERE user_id = ? AND DATE_FORMAT(created_at, '%m-%d') = '09-11'
        `, [userId]);
        return (rows[0]?.count || 0) >= requirement_value;
      }

      case 'bounce_back_count': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS cnt FROM (
            SELECT created_at,
                   LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at) AS prev_created
            FROM fails WHERE user_id = ?
          ) t
          WHERE prev_created IS NOT NULL AND TIMESTAMPDIFF(DAY, prev_created, created_at) > 30
        `, [userId]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'comeback_count': {
        // alias
        return await checkBadgeRequirement(userId, { ...badgeDefinition, requirement_type: 'bounce_back_count' });
      }

      case 'active_months': {
        const rows = await executeQuery(`
          SELECT COUNT(DISTINCT DATE_FORMAT(created_at, '%Y-%m')) AS cnt
          FROM fails WHERE user_id = ?
        `, [userId]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'popular_discussions': {
        const th = await getBadgeThresholds();
        const perFail = Number(th?.popular_discussions?.commentsPerFail) || 25;
        const rows = await executeQuery(`
          SELECT COUNT(*) AS cnt FROM fails WHERE user_id = ? AND comments_count >= ?
        `, [userId, perFail]);
        // besoin d'au moins N fails populaires (N = requirement_value)
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'user_rank': {
        // Classement par points_total si disponible
        const rows = await executeQuery(`
          SELECT rn FROM (
            SELECT user_id, ROW_NUMBER() OVER (ORDER BY points_total DESC) AS rn
            FROM user_points
          ) ranked WHERE user_id = ?
        `, [userId]);
        if (!rows[0]?.rn) return false;
        return rows[0].rn <= requirement_value;
      }

      case 'empathy_given': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS cnt FROM reactions WHERE user_id = ? AND reaction_type = 'empathy'
        `, [userId]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'first_reaction': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS cnt FROM reactions r1
          WHERE r1.user_id = ? AND NOT EXISTS (
            SELECT 1 FROM reactions r2
            WHERE r2.fail_id = r1.fail_id AND r2.created_at < r1.created_at
          )
        `, [userId]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'countries_count': {
        // Non implémenté: pas de géolocalisation en base
        return false;
      }

      case 'positive_reactions': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS cnt
          FROM reactions r
          JOIN fails f ON f.id = r.fail_id
          WHERE f.user_id = ? AND r.reaction_type IN ('courage','support','empathy')
        `, [userId]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'holiday_fails': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS cnt FROM fails
          WHERE user_id = ? AND (
            (MONTH(created_at) = 12 AND DAY(created_at) BETWEEN 20 AND 31) OR
            (MONTH(created_at) = 1 AND DAY(created_at) BETWEEN 1 AND 10) OR
            (MONTH(created_at) = 7 AND DAY(created_at) = 14) OR
            (MONTH(created_at) = 10 AND DAY(created_at) = 31)
          )
        `, [userId]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'inspired_users': {
        const rows = await executeQuery(`
          SELECT COUNT(DISTINCT r.user_id) AS cnt
          FROM reactions r JOIN fails f ON r.fail_id = f.id
          WHERE f.user_id = ? AND r.user_id <> ?
        `, [userId, userId]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'resilience_count': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS cnt FROM fails
          WHERE user_id = ? AND (
            description LIKE '%après%' OR description LIKE '%malgré%' OR description LIKE '%encore%'
            OR category = 'professional'
          )
        `, [userId]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'advice_given': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS cnt FROM comments
          WHERE user_id = ? AND (
            is_encouragement = 1 OR content LIKE '%conseil%' OR content LIKE '%suggestion%' OR content LIKE '%astuce%'
          )
        `, [userId]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'midnight_fail': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS cnt FROM fails
          WHERE user_id = ? AND (HOUR(created_at) >= 23 OR HOUR(created_at) <= 1)
        `, [userId]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'laugh_reactions': {
        const rows = await executeQuery(`
          SELECT COUNT(r.id) AS cnt
          FROM fails f LEFT JOIN reactions r ON f.id = r.fail_id
          WHERE f.user_id = ? AND r.reaction_type = 'laugh'
        `, [userId]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'new_year_fail': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS cnt FROM fails
          WHERE user_id = ? AND MONTH(created_at) = 1 AND DAY(created_at) = 1
        `, [userId]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'major_comebacks': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS cnt FROM (
            SELECT created_at,
                   LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at) AS prev_created
            FROM fails WHERE user_id = ?
          ) t
          WHERE prev_created IS NOT NULL AND TIMESTAMPDIFF(DAY, prev_created, created_at) > 90
        `, [userId]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'features_used': {
        const rows = await executeQuery(`
          SELECT (
            (EXISTS(SELECT 1 FROM fails WHERE user_id = ?)            ) +
            (EXISTS(SELECT 1 FROM comments WHERE user_id = ?)         ) +
            (EXISTS(SELECT 1 FROM reactions WHERE user_id = ?)        ) +
            (EXISTS(SELECT 1 FROM profiles WHERE user_id = ? AND avatar_url IS NOT NULL AND avatar_url <> ''))
          ) AS cnt
        `, [userId, userId, userId, userId]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'resilience_fails': {
        return await checkBadgeRequirement(userId, { ...badgeDefinition, requirement_type: 'resilience_count' });
      }

      case 'challenges_overcome': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS cnt FROM fails
          WHERE user_id = ? AND (
            description LIKE '%défi%' OR description LIKE '%challenge%' OR description LIKE '%objectif%' OR category = 'sport'
          )
        `, [userId]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'trends_created': {
        const th = await getBadgeThresholds();
        const perFail = Number(th?.trends_created?.reactionsPerFail) || 20;
        const rows = await executeQuery(`
          SELECT COUNT(*) AS cnt FROM fails f
          WHERE f.user_id = ? AND (
            (SELECT COUNT(*) FROM reactions r WHERE r.fail_id = f.id) >= ?
          )
        `, [userId, perFail]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'positive_days': {
        const rows = await executeQuery(`
          SELECT COUNT(DISTINCT DATE(created_at)) AS cnt FROM fails WHERE user_id = ?
        `, [userId]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'weekend_fails': {
        const rows = await executeQuery(`
          SELECT COUNT(*) AS cnt FROM fails WHERE user_id = ? AND DAYOFWEEK(created_at) IN (1,7)
        `, [userId]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'funny_fails': {
        const th = await getBadgeThresholds();
        const perFail = Number(th?.funny_fails?.laughsPerFail) || 5;
        const rows = await executeQuery(`
          SELECT COUNT(*) AS cnt FROM fails f
          WHERE f.user_id = ? AND (
            SELECT COUNT(*) FROM reactions r
            WHERE r.fail_id = f.id AND r.reaction_type = 'laugh'
          ) >= ?
        `, [userId, perFail]);
        return (rows[0]?.cnt || 0) >= requirement_value;
      }

      case 'long_streaks': {
        // Longueur maximale d'une série de jours consécutifs avec activité (au moins 1 fail par jour)
        const rows = await executeQuery(`
          SELECT COALESCE(MAX(streak_length), 0) AS max_streak FROM (
            SELECT COUNT(*) AS streak_length FROM (
              SELECT DATE(created_at) AS d,
                     ROW_NUMBER() OVER (ORDER BY DATE(created_at)) AS rn
              FROM fails
              WHERE user_id = ?
              GROUP BY DATE(created_at)
            ) x
            GROUP BY DATE_SUB(d, INTERVAL rn DAY)
          ) s
        `, [userId]);
        return (rows[0]?.max_streak || 0) >= requirement_value;
      }

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
