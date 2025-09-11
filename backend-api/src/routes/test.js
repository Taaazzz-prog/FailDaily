const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

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
