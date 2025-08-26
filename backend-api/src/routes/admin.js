const express = require('express');
const os = require('os');
const router = express.Router();
const { executeQuery, testConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Require admin role helper
function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({ success: false, message: 'Accès administrateur requis' });
  }
  next();
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

// GET /api/admin/fails/reported?threshold=10
router.get('/fails/reported', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const reported = await executeQuery(`
      SELECT JSON_UNQUOTE(JSON_EXTRACT(details, '$.failId')) AS fail_id,
             COUNT(*) AS reports
      FROM system_logs
      WHERE action = 'fail_report'
      GROUP BY JSON_UNQUOTE(JSON_EXTRACT(details, '$.failId'))
      HAVING reports >= ?
      ORDER BY reports DESC
    `, [threshold]);

    // Join with fails for context
    const results = [];
    for (const row of reported) {
      const [fail] = await executeQuery(
        'SELECT id, user_id, title, description, category, is_anonyme, created_at FROM fails WHERE id = ? LIMIT 1',
        [row.fail_id]
      );
      results.push({ fail, reports: row.reports });
    }

    res.json({ success: true, items: results, threshold });
  } catch (error) {
    console.error('❌ /admin/fails/reported error:', error);
    res.status(500).json({ success: false, message: 'Erreur récupération fails signalés' });
  }
});

// GET /api/admin/comments/reported?threshold=10
router.get('/comments/reported', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    // Count reports per comment
    const reported = await executeQuery(`
      SELECT cr.comment_id, COUNT(*) AS reports
      FROM comment_reports cr
      GROUP BY cr.comment_id
      HAVING reports >= ?
      ORDER BY reports DESC
    `, [threshold]);

    const results = [];
    for (const row of reported) {
      const [comment] = await executeQuery(
        'SELECT c.id, c.fail_id, c.user_id, c.content, c.created_at FROM comments c WHERE c.id = ? LIMIT 1',
        [row.comment_id]
      );
      results.push({ comment, reports: row.reports });
    }

    res.json({ success: true, items: results, threshold });
  } catch (error) {
    console.error('❌ /admin/comments/reported error:', error);
    res.status(500).json({ success: false, message: 'Erreur récupération commentaires signalés' });
  }
});

// POST /api/admin/comments/:id/moderate { action }
router.post('/comments/:id/moderate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body || {};
    if (!action) return res.status(400).json({ success: false, message: 'Action requise' });

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

    res.json({ success: true, message: 'Décision de modération appliquée' });
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
    const { id } = req.params;
    const { status } = req.body || {};
    if (!['approved','hidden','under_review'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }
    await executeQuery(
      'INSERT INTO comment_moderation (comment_id, status, created_at, updated_at) VALUES (?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()',
      [id, status]
    );
    res.json({ success: true, message: 'Statut de modération du commentaire mis à jour' });
  } catch (e) {
    console.error('admin set comment moderation error:', e);
    res.status(500).json({ success: false, message: 'Erreur MAJ modération commentaire' });
  }
});
