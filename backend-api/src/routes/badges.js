const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkAndUnlockBadges } = require('../services/badgesService');

// GET /api/badges/available - Tous les badges disponibles
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const badges = await executeQuery(`
      SELECT id, name, description, icon, category, rarity, requirement_type, requirement_value, created_at
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

    const mapped = badges.map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      rarity: badge.rarity,
      requirements: { type: badge.requirement_type, value: badge.requirement_value },
      created_at: badge.created_at
    }));
    res.json({ success: true, badges: mapped });
  } catch (error) {
    console.error('badges/available error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des badges' });
  }
});

// GET /api/badges/definitions - Alias pour /available
router.get('/definitions', authenticateToken, async (req, res) => {
  try {
    const badges = await executeQuery(`
      SELECT id, name, description, icon, category, rarity, requirement_type, requirement_value, created_at
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
    const mapped = badges.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      category: b.category,
      rarity: b.rarity,
      requirements: { type: b.requirement_type, value: b.requirement_value },
      created_at: b.created_at
    }));
    res.json({ success: true, badges: mapped, total: mapped.length });
  } catch (error) {
    console.error('badges/definitions error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des définitions de badges' });
  }
});

// GET /api/badges - Alias /available
router.get('/', authenticateToken, async (req, res) => {
  try {
    const badges = await executeQuery(`
      SELECT id, name, description, icon, category, rarity, requirement_type, requirement_value, created_at
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
    const mapped = badges.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      category: b.category,
      rarity: b.rarity,
      requirements: { type: b.requirement_type, value: b.requirement_value },
      created_at: b.created_at
    }));
    res.json({ success: true, badges: mapped });
  } catch (error) {
    console.error('badges(/) error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des badges' });
  }
});

// POST /api/badges/check-unlock/:userId - Vérifier et débloquer automatiquement
router.post('/check-unlock/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const newBadges = await checkAndUnlockBadges(userId);
    res.json({ success: true, newBadges, message: `${newBadges.length} nouveaux badges débloqués` });
  } catch (error) {
    console.error('badges/check-unlock error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la vérification des badges' });
  }
});

module.exports = router;

