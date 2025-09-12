const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { getPushConfig, sendPushToUser } = require('../utils/push');

async function ensurePushTable() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS user_push_tokens (
      user_id CHAR(36) NOT NULL,
      token VARCHAR(255) NOT NULL,
      platform ENUM('web','android','ios') DEFAULT 'web',
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (token),
      KEY idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

// POST /api/push/register { token, platform }
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { token, platform = 'web' } = req.body || {};
    if (!token || typeof token !== 'string' || token.length < 10) {
      return res.status(400).json({ success: false, message: 'Token invalide' });
    }
    await ensurePushTable();
    await executeQuery(
      `INSERT INTO user_push_tokens (user_id, token, platform, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), platform = VALUES(platform), last_seen_at = NOW()`,
      [req.user.id, token, platform]
    );
    try { await require('../services/badgesService').checkAndUnlockBadges(req.user.id); } catch {}
    res.json({ success: true });
  } catch (e) {
    console.error('❌ push/register error:', e);
    res.status(500).json({ success: false, message: 'Erreur enregistrement push token' });
  }
});

// POST /api/push/test { title, body }
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const cfg = await getPushConfig();
    const title = req.body?.title || 'FailDaily';
    const body = req.body?.body || 'Notification de test';
    const result = await sendPushToUser(req.user.id, { title, body });
    if (cfg.enabled && result.sent) return res.json({ success: true, sent: true });
    return res.json({ success: true, sent: false, details: result });
  } catch (e) {
    console.error('❌ push/test error:', e);
    res.status(500).json({ success: false, message: 'Erreur envoi notification test' });
  }
});

module.exports = router;
