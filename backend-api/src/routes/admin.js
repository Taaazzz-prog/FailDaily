const express = require('express');
const os = require('os');
const router = express.Router();
const { executeQuery, testConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Require admin role helper
function requireAdmin(req, res, next) {
  if (!req.user || !['admin','super_admin','moderator'].includes(String(req.user.role || '').toLowerCase())) {
    return res.status(403).json({ success: false, message: 'Accès administrateur requis' });
  }
  next();
}

// Ensure moderation table exists (defensive, in case migrations not applied)
async function ensureCommentModerationTable() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS comment_moderation (
      comment_id CHAR(36) NOT NULL,
      status ENUM('under_review','hidden','approved') NOT NULL DEFAULT 'under_review',
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (comment_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

// GET /api/admin/dashboard/stats
router.get('/dashboard/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const dbOk = await testConnection();

    const [[usersCount]] = await Promise.all([
      executeQuery('SELECT COUNT(*) as c FROM users'),
    ]).then(results => [results[0]]);

    const [failsCount] = await executeQuery('SELECT COUNT(*) as c FROM fails');
    const [reactionsCount] = await executeQuery('SELECT COUNT(*) as c FROM reactions');
    const [todayActivity] = await executeQuery(
      "SELECT COUNT(*) as c FROM system_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)"
    );

    const mem = process.memoryUsage();
    const stats = {
      totalUsers: usersCount.c || 0,
      totalFails: failsCount.c || 0,
      totalReactions: reactionsCount.c || 0,
      todayActivity: todayActivity.c || 0,
      systemStatus: dbOk ? 'healthy' : 'warning',
      server: {
        uptimeSec: Math.round(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
        loadAvg: os.loadavg(),
        memory: {
          rss: mem.rss,
          heapTotal: mem.heapTotal,
          heapUsed: mem.heapUsed,
          external: mem.external,
          total: os.totalmem(),
          free: os.freemem()
        },
        cpuCount: os.cpus().length
      }
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('❌ /admin/dashboard/stats error:', error);
    res.status(500).json({ success: false, message: 'Erreur récupération stats admin' });
  }
});

// GET /api/admin/users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await executeQuery(`
      SELECT u.id, u.email, u.role, u.account_status, u.created_at,
             p.display_name, p.avatar_url
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      ORDER BY u.created_at DESC
      LIMIT 200
    `);
    res.json({ success: true, users });
  } catch (error) {
    console.error('❌ /admin/users error:', error);
    res.status(500).json({ success: false, message: 'Erreur récupération utilisateurs' });
  }
});

// GET /api/admin/moderation/config
router.get('/moderation/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const row = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['moderation']);
    let cfg = { failReportThreshold: 1, commentReportThreshold: 1, panelAutoRefreshSec: 20 };
    if (row && row[0] && row[0].value) {
      try { cfg = { ...cfg, ...JSON.parse(row[0].value) }; } catch {}
    }
    res.json({ success: true, config: cfg });
  } catch (e) {
    console.error('❌ /admin/moderation/config error:', e);
    res.status(500).json({ success: false, message: 'Erreur lecture config modération' });
  }
});

// PUT /api/admin/moderation/config
router.put('/moderation/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const input = req.body || {};
    // Load existing to preserve unknown keys
    let currentCfg = { failReportThreshold: 1, commentReportThreshold: 1, panelAutoRefreshSec: 20 };
    try {
      const row = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['moderation']);
      if (row && row[0] && row[0].value) currentCfg = { ...currentCfg, ...JSON.parse(row[0].value) };
    } catch {}

    const nextCfg = {
      ...currentCfg,
      failReportThreshold: Number(input.failReportThreshold ?? currentCfg.failReportThreshold) || 1,
      commentReportThreshold: Number(input.commentReportThreshold ?? currentCfg.commentReportThreshold) || 1,
      panelAutoRefreshSec: Math.max(5, Number(input.panelAutoRefreshSec ?? currentCfg.panelAutoRefreshSec) || 20)
    };

    await executeQuery(
      `INSERT INTO app_config (id, \`key\`, value, created_at, updated_at)
       VALUES (UUID(), 'moderation', ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
      [JSON.stringify(nextCfg)]
    );
    res.json({ success: true, config: nextCfg });
  } catch (e) {
    console.error('❌ /admin/moderation/config update error:', e);
    res.status(500).json({ success: false, message: 'Erreur mise à jour config modération' });
  }
});

// GET /api/admin/fails/reported?threshold=10
router.get('/fails/reported', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 1;
    const items = await executeQuery(`
      SELECT fr.fail_id, COUNT(*) AS reports,
             f.title, f.description, f.category, f.user_id, f.created_at,
             p.display_name, p.avatar_url,
             fm.status AS moderation_status
      FROM fail_reports fr
      JOIN fails f ON f.id = fr.fail_id
      JOIN profiles p ON p.user_id = f.user_id
      LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
      GROUP BY fr.fail_id
      HAVING reports >= ? AND (moderation_status IS NULL OR moderation_status <> 'approved')
      ORDER BY reports DESC, f.created_at DESC
    `, [threshold]);

    res.json({ success: true, items, threshold });
  } catch (error) {
    console.error('❌ /admin/fails/reported error:', error);
    res.status(500).json({ success: false, message: 'Erreur récupération fails signalés' });
  }
});

// GET /api/admin/comments/reported?threshold=10
router.get('/comments/reported', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 1;
    const items = await executeQuery(`
      SELECT cr.comment_id, COUNT(*) AS reports,
             c.fail_id, c.user_id, c.content, c.created_at,
             p.display_name, p.avatar_url,
             cm.status AS moderation_status
      FROM comment_reports cr
      JOIN comments c ON c.id = cr.comment_id
      JOIN profiles p ON p.user_id = c.user_id
      LEFT JOIN comment_moderation cm ON cm.comment_id = c.id
      GROUP BY cr.comment_id
      HAVING reports >= ? AND (moderation_status IS NULL OR moderation_status <> 'approved')
      ORDER BY reports DESC, c.created_at DESC
    `, [threshold]);

    res.json({ success: true, items, threshold });
  } catch (error) {
    console.error('❌ /admin/comments/reported error:', error);
    res.status(500).json({ success: false, message: 'Erreur récupération commentaires signalés' });
  }
});

// GET /api/admin/fails/by-status?status=approved|hidden
router.get('/fails/by-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const status = String(req.query.status || '').toLowerCase();
    if (!['approved','hidden'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }

    const items = await executeQuery(`
      SELECT f.id          AS fail_id,
             f.title, f.description, f.category,
             f.user_id, f.created_at,
             p.display_name, p.avatar_url,
             fm.status      AS moderation_status
      FROM fail_moderation fm
      JOIN fails f   ON f.id = fm.fail_id
      JOIN profiles p ON p.user_id = f.user_id
      WHERE fm.status = ?
      ORDER BY f.created_at DESC
      LIMIT 500
    `, [status]);

    res.json({ success: true, items, status });
  } catch (error) {
    console.error('❌ /admin/fails/by-status error:', error);
    res.status(500).json({ success: false, message: 'Erreur récupération fails par statut' });
  }
});

// GET /api/admin/comments/by-status?status=approved|hidden
router.get('/comments/by-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const status = String(req.query.status || '').toLowerCase();
    if (!['approved','hidden'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }

    const items = await executeQuery(`
      SELECT cm.comment_id,
             cm.status            AS moderation_status,
             c.content,
             c.fail_id, c.user_id, c.created_at,
             p.display_name, p.avatar_url
      FROM comment_moderation cm
      JOIN comments c ON c.id = cm.comment_id
      JOIN profiles p ON p.user_id = c.user_id
      WHERE cm.status = ?
      ORDER BY c.created_at DESC
      LIMIT 1000
    `, [status]);

    res.json({ success: true, items, status });
  } catch (error) {
    console.error('❌ /admin/comments/by-status error:', error);
    res.status(500).json({ success: false, message: 'Erreur récupération commentaires par statut' });
  }
});

// POST /api/admin/comments/:id/moderate { action }
router.post('/comments/:id/moderate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await ensureCommentModerationTable();
    const { id } = req.params;
    const { action } = req.body || {};
    if (!action) return res.status(400).json({ success: false, message: 'Action requise' });
    if (!id || typeof id !== 'string' || id.length < 10) {
      return res.status(400).json({ success: false, message: 'Comment ID invalide' });
    }

    // Validate comment exists
    const rows = await executeQuery('SELECT id FROM comments WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Commentaire non trouvé' });

    if (action === 'hide') {
      await executeQuery('INSERT INTO comment_moderation (comment_id, status, created_at, updated_at) VALUES (?, "hidden", NOW(), NOW()) ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()', [id]);
    } else if (action === 'approve') {
      await executeQuery('INSERT INTO comment_moderation (comment_id, status, created_at, updated_at) VALUES (?, "approved", NOW(), NOW()) ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()', [id]);
    } else if (action === 'delete') {
      await executeQuery('DELETE FROM comment_reactions WHERE comment_id = ?', [id]);
      await executeQuery('DELETE FROM comment_reports WHERE comment_id = ?', [id]);
      await executeQuery('DELETE FROM comments WHERE id = ?', [id]);
      await executeQuery('DELETE FROM comment_moderation WHERE comment_id = ?', [id]);
    } else {
      return res.status(400).json({ success: false, message: 'Action inconnue' });
    }

    res.json({ success: true, message: 'Décision de modération appliquée', commentId: id, action });
  } catch (error) {
    console.error('❌ /admin/comments/:id/moderate error:', error);
    res.status(500).json({ success: false, message: 'Erreur modération commentaire' });
  }
});

// POST /api/admin/fails/:id/moderate { action }
router.post('/fails/:id/moderate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body || {};
    if (!action) return res.status(400).json({ success: false, message: 'Action requise' });

    if (action === 'hide') {
      await executeQuery('UPDATE fails SET is_anonyme = 1, updated_at = NOW() WHERE id = ?', [id]);
    } else if (action === 'delete') {
      await executeQuery('DELETE FROM reactions WHERE fail_id = ?', [id]);
      await executeQuery('DELETE FROM comments WHERE fail_id = ?', [id]);
      await executeQuery('DELETE FROM fails WHERE id = ?', [id]);
    } else if (action === 'approve') {
      // no-op, but could clear report logs in future
    } else {
      return res.status(400).json({ success: false, message: 'Action inconnue' });
    }

    await executeQuery(
      'INSERT INTO system_logs (level, message, details, user_id, action, created_at) VALUES (?,?,?,?,?,NOW())',
      ['info', 'Moderation decision on fail', JSON.stringify({ failId: id, action }), req.user.id, 'moderation_decision']
    );

    res.json({ success: true, message: 'Décision de modération appliquée' });
  } catch (error) {
    console.error('❌ /admin/fails/:id/moderate error:', error);
    res.status(500).json({ success: false, message: 'Erreur modération' });
  }
});

module.exports = router;
/**
 * ======================== REACTIONS/POINTS CONFIG =========================
 */
// GET /api/admin/reactions/config
router.get('/reactions/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const row = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['reaction_points']);
    let cfg = { courage: 5, laugh: 3, empathy: 2, support: 3 };
    if (row && row[0] && row[0].value) {
      try { cfg = { ...cfg, ...JSON.parse(row[0].value) }; } catch {}
    }
    res.json({ success: true, config: cfg });
  } catch (e) {
    console.error('❌ /admin/reactions/config error:', e);
    res.status(500).json({ success: false, message: 'Erreur lecture config réactions/points' });
  }
});

// PUT /api/admin/reactions/config
router.put('/reactions/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const input = req.body || {};
    let currentCfg = { courage: 5, laugh: 3, empathy: 2, support: 3 };
    try {
      const row = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['reaction_points']);
      if (row && row[0] && row[0].value) currentCfg = { ...currentCfg, ...JSON.parse(row[0].value) };
    } catch {}

    const nextCfg = {
      courage: Number.isFinite(Number(input.courage)) ? Number(input.courage) : currentCfg.courage,
      laugh: Number.isFinite(Number(input.laugh)) ? Number(input.laugh) : currentCfg.laugh,
      empathy: Number.isFinite(Number(input.empathy)) ? Number(input.empathy) : currentCfg.empathy,
      support: Number.isFinite(Number(input.support)) ? Number(input.support) : currentCfg.support
    };

    await executeQuery(
      `INSERT INTO app_config (id, \`key\`, value, created_at, updated_at)
       VALUES (UUID(), 'reaction_points', ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
      [JSON.stringify(nextCfg)]
    );
    res.json({ success: true, config: nextCfg });
  } catch (e) {
    console.error('❌ /admin/reactions/config update error:', e);
    res.status(500).json({ success: false, message: 'Erreur mise à jour config réactions/points' });
  }
});

/**
 * ============================= USER POINTS API ============================
 */
// GET /api/admin/users/:userId/points
router.get('/users/:userId/points', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const rows = await executeQuery('SELECT points_total, updated_at, created_at FROM user_points WHERE user_id = ? LIMIT 1', [userId]);
    const points = rows[0] || { points_total: 0, updated_at: null, created_at: null };
    res.json({ success: true, points });
  } catch (e) {
    console.error('❌ /admin/users/:userId/points error:', e);
    res.status(500).json({ success: false, message: 'Erreur lecture points utilisateur' });
  }
});

// POST /api/admin/users/:userId/points { delta, reason }
router.post('/users/:userId/points', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { delta = 0, reason = 'manual_adjust' } = req.body || {};
    const amount = Number(delta) || 0;
    const { v4: uuidv4 } = require('uuid');

    await executeQuery(
      `INSERT INTO user_points (user_id, points_total, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE points_total = points_total + VALUES(points_total), updated_at = NOW()`,
      [userId, amount]
    );

    await executeQuery(
      `INSERT INTO user_point_events (id, user_id, amount, source, fail_id, reaction_type, meta, created_at)
       VALUES (?, ?, ?, 'admin', NULL, NULL, ?, NOW())`,
      [uuidv4(), userId, amount, JSON.stringify({ reason })]
    );

    res.json({ success: true, message: 'Points mis à jour' });
  } catch (e) {
    console.error('❌ /admin/users/:userId/points update error:', e);
    res.status(500).json({ success: false, message: 'Erreur MAJ points utilisateur' });
  }
});

/**
 * ============================ POINTS (GÉNÉRAUX) ===========================
 */
// GET /api/admin/points/config
router.get('/points/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const row = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['points']);
    let cfg = { failCreate: 10, commentCreate: 2, reactionRemovePenalty: true };
    if (row && row[0] && row[0].value) {
      try { cfg = { ...cfg, ...JSON.parse(row[0].value) }; } catch {}
    }
    res.json({ success: true, config: cfg });
  } catch (e) {
    console.error('❌ /admin/points/config error:', e);
    res.status(500).json({ success: false, message: 'Erreur lecture config points' });
  }
});

// PUT /api/admin/points/config
router.put('/points/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const input = req.body || {};
    let current = { failCreate: 10, commentCreate: 2, reactionRemovePenalty: true };
    try {
      const row = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['points']);
      if (row && row[0] && row[0].value) current = { ...current, ...JSON.parse(row[0].value) };
    } catch {}

    const nextCfg = {
      failCreate: Number.isFinite(Number(input.failCreate)) ? Number(input.failCreate) : current.failCreate,
      commentCreate: Number.isFinite(Number(input.commentCreate)) ? Number(input.commentCreate) : current.commentCreate,
      reactionRemovePenalty: typeof input.reactionRemovePenalty === 'boolean' ? input.reactionRemovePenalty : current.reactionRemovePenalty
    };

    await executeQuery(
      `INSERT INTO app_config (id, \`key\`, value, created_at, updated_at)
       VALUES (UUID(), 'points', ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
      [JSON.stringify(nextCfg)]
    );
    res.json({ success: true, config: nextCfg });
  } catch (e) {
    console.error('❌ /admin/points/config update error:', e);
    res.status(500).json({ success: false, message: 'Erreur mise à jour config points' });
  }
});

/**
 * =========================== CONFIG CONSOLIDÉE ===========================
 */
// GET /api/admin/config
router.get('/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [pointsRow, reactRow, modRow] = await Promise.all([
      executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['points']),
      executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['reaction_points']),
      executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['moderation'])
    ]);
    let points = { failCreate: 10, commentCreate: 2, reactionRemovePenalty: true };
    let reaction_points = { courage: 5, laugh: 3, empathy: 2, support: 3 };
    let moderation = { failReportThreshold: 1, commentReportThreshold: 1, panelAutoRefreshSec: 20 };
    try { if (pointsRow[0]?.value) points = { ...points, ...JSON.parse(pointsRow[0].value) }; } catch {}
    try { if (reactRow[0]?.value) reaction_points = { ...reaction_points, ...JSON.parse(reactRow[0].value) }; } catch {}
    try { if (modRow[0]?.value) moderation = { ...moderation, ...JSON.parse(modRow[0].value) }; } catch {}
    res.json({ success: true, config: { points, reaction_points, moderation } });
  } catch (e) {
    console.error('❌ /api/admin/config error:', e);
    res.status(500).json({ success: false, message: 'Erreur lecture config consolidée' });
  }
});
// PUT /api/admin/fails/:id/moderation { status }
router.put('/fails/:id/moderation', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!['approved','hidden','under_review'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }
    await executeQuery(
      'INSERT INTO fail_moderation (fail_id, status, created_at, updated_at) VALUES (?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()',
      [id, status]
    );
    res.json({ success: true, message: 'Statut de modération du fail mis à jour' });
  } catch (e) {
    console.error('admin set fail moderation error:', e);
    res.status(500).json({ success: false, message: 'Erreur MAJ modération fail' });
  }
});

// PUT /api/admin/comments/:id/moderation { status }
router.put('/comments/:id/moderation', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await ensureCommentModerationTable();
    const { id } = req.params;
    const { status } = req.body || {};
    if (!id || typeof id !== 'string' || id.length < 10) {
      return res.status(400).json({ success: false, message: 'Comment ID invalide' });
    }
    if (!['approved','hidden','under_review'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }
    // Validate comment exists for safety and to avoid orphan rows
    const exists = await executeQuery('SELECT id FROM comments WHERE id = ? LIMIT 1', [id]);
    if (exists.length === 0) return res.status(404).json({ success: false, message: 'Commentaire non trouvé' });

    await executeQuery(
      'INSERT INTO comment_moderation (comment_id, status, created_at, updated_at) VALUES (?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()',
      [id, status]
    );
    res.json({ success: true, message: 'Statut de modération du commentaire mis à jour', commentId: id, status });
  } catch (e) {
    console.error('admin set comment moderation error:', e);
    res.status(500).json({ success: false, message: 'Erreur MAJ modération commentaire' });
  }
});
