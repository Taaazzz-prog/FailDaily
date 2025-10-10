const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const BadgeTestingSystem = require('../../tests/badge-system-complete-test');
const NextChallengesValidator = require('../../tests/next-challenges-validator');

// Ces endpoints sont dispos uniquement en NODE_ENV=test
function ensureTestEnv(req, res, next) {
  if (process.env.NODE_ENV !== 'test') {
    return res.status(403).json({ success: false, message: 'Test-only endpoint' });
  }
  next();
}

// S’élève soi-même en admin
router.post('/elevate', authenticateToken, ensureTestEnv, async (req, res) => {
  try {
    await executeQuery('UPDATE users SET role = "admin" WHERE id = ?', [req.user.id]);
    res.json({ success: true, role: 'admin' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur elevate', error: e?.message });
  }
});

// Approuve un fail donné
router.post('/approve/:failId', authenticateToken, ensureTestEnv, async (req, res) => {
  try {
    const { failId } = req.params;
    await executeQuery(
      `INSERT INTO fail_moderation (fail_id, status, created_at, updated_at)
       VALUES (?, 'approved', NOW(), NOW())
       ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()`,
      [failId]
    );
    res.json({ success: true, failId, status: 'approved' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur approve', error: e?.message });
  }
});

// Award points arbitraires au user courant (facilite déblocage badges pendant tests)
router.post('/points', authenticateToken, ensureTestEnv, async (req, res) => {
  try {
    const amount = Number(req.body?.amount || 0);
    if (!Number.isFinite(amount) || amount === 0) return res.status(400).json({ success: false, message: 'Montant invalide' });
    await executeQuery(
      `INSERT INTO user_points (user_id, points_total, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE points_total = points_total + VALUES(points_total), updated_at = NOW()`,
      [req.user.id, amount]
    );
    res.json({ success: true, awarded: amount });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur award points', error: e?.message });
  }
});

module.exports = router;
// Test-only moderation helpers
router.post('/reject/:failId', authenticateToken, ensureTestEnv, async (req, res) => {
  try {
    const { failId } = req.params;
    await executeQuery(
      `INSERT INTO fail_moderation (fail_id, status, created_at, updated_at)
       VALUES (?, 'rejected', NOW(), NOW())
       ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()`,
      [failId]
    );
    res.json({ success: true, failId, status: 'rejected' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur reject', error: e?.message });
  }
});

router.post('/hide/:failId', authenticateToken, ensureTestEnv, async (req, res) => {
  try {
    const { failId } = req.params;
    await executeQuery(
      `INSERT INTO fail_moderation (fail_id, status, created_at, updated_at)
       VALUES (?, 'hidden', NOW(), NOW())
       ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()`,
      [failId]
    );
    res.json({ success: true, failId, status: 'hidden' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur hide', error: e?.message });
  }
});

/**
 * GET /api/test/badges/complete
 * Test complet du système de badges pour l'utilisateur connecté
 */
router.get('/badges/complete', authenticateToken, async (req, res) => {
  try {
    const tester = new BadgeTestingSystem();
    const results = await tester.runCompleteTest(req.user.id);
    
    res.json({
      success: true,
      message: 'Tests badges terminés',
      results: results
    });
    
  } catch (error) {
    console.error('Erreur test badges:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors des tests badges',
      error: error.message
    });
  }
});

/**
 * GET /api/test/badges/next-challenges
 * Validation spécifique "Prochains défis"
 */
router.get('/badges/next-challenges', authenticateToken, async (req, res) => {
  try {
    const validator = new NextChallengesValidator();
    const validation = await validator.validateNextChallenges(req.user.id);
    
    res.json({
      success: true,
      message: 'Validation "Prochains défis" terminée',
      validation: validation
    });
    
  } catch (error) {
    console.error('Erreur validation prochains défis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation',
      error: error.message
    });
  }
});

/**
 * POST /api/test/badges/simulate
 * Simuler le déblocage de badges (développement uniquement)
 */
router.post('/badges/simulate', authenticateToken, async (req, res) => {
  try {
    // Seulement en mode développement
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        message: 'Simulation disponible en mode développement uniquement'
      });
    }
    
    const { badgeType, count } = req.body;
    const userId = req.user.id;
    
    const tester = new BadgeTestingSystem();
    
    // Simuler selon le type demandé
    switch (badgeType) {
      case 'fails':
        await tester.simulateFailsCount(userId, count || 1);
        break;
      case 'reactions':
        await tester.simulateReactionsGiven(userId, count || 1);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Type de simulation non supporté'
        });
    }
    
    // Vérifier les nouveaux badges débloqués
    const { checkAndUnlockBadges } = require('../services/badgesService');
    const result = await checkAndUnlockBadges(userId);
    
    res.json({
      success: true,
      message: `Simulation ${badgeType} terminée`,
      unlockedBadges: result.unlockedBadges || []
    });
    
  } catch (error) {
    console.error('Erreur simulation badges:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la simulation',
      error: error.message
    });
  }
});
