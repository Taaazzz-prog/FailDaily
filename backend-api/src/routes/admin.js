const express = require('express');
const os = require('os');
const router = express.Router();
const { executeQuery, testConnection } = require('../config/database');
const LogsService = require('../services/logsService');
const { logToSeparateDatabase } = require('../utils/logsHelper');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

// Require admin role helper (moderators allowed for legacy endpoints)
function requireAdmin(req, res, next) {
  if (!req.user || !['admin','super_admin','moderator'].includes(String(req.user.role || '').toLowerCase())) {
    return res.status(403).json({ success: false, message: 'Accès administrateur requis' });
  }
  next();
}

// Strict admin-only helper (no moderators)
function requireStrictAdmin(req, res, next) {
  if (!req.user || !['admin','super_admin'].includes(String(req.user.role || '').toLowerCase())) {
    return res.status(403).json({ success: false, message: 'Accès strictement réservé aux administrateurs' });
  }
  next();
}

// Ensure moderation table exists (defensive, in case migrations not applied)
async function ensureCommentModerationTable() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS comment_moderation (
      comment_id CHAR(36) NOT NULL,
      status ENUM('under_review','hidden','approved','rejected') NOT NULL DEFAULT 'under_review',
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (comment_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

// Ensure fail moderation table exists (defensive)
async function ensureFailModerationTable() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS fail_moderation (
      fail_id CHAR(36) NOT NULL,
      status ENUM('under_review','hidden','approved','rejected') NOT NULL DEFAULT 'under_review',
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (fail_id)
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
    const status = String(req.query.status || '').toLowerCase();
    const role = String(req.query.role || '').toLowerCase();
    const consent = String(req.query.consent || '').toLowerCase();
    const reg = req.query.reg; // '0' | '1'
    const q = String(req.query.q || '').trim();
    const createdFrom = req.query.createdFrom; // ISO date
    const createdTo = req.query.createdTo;     // ISO date

    const allowedStatus = ['pending', 'active', 'suspended', 'deleted'];
    const allowedRoles = ['user','admin','super_admin','moderator'];

    const whereClauses = [];
    const params = [];

    if (allowedStatus.includes(status)) {
      whereClauses.push('u.account_status = ?');
      params.push(status);
    }

    if (allowedRoles.includes(role)) {
      whereClauses.push('LOWER(u.role) = ?');
      params.push(role);
    }

    if (reg === '0' || reg === '1') {
      whereClauses.push('COALESCE(p.registration_completed, 0) = ?');
      params.push(parseInt(reg, 10));
    }

    if (q) {
      whereClauses.push('(u.email LIKE ? OR p.display_name LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }

    if (createdFrom) {
      whereClauses.push('u.created_at >= ?');
      params.push(createdFrom);
    }
    if (createdTo) {
      whereClauses.push('u.created_at <= ?');
      params.push(createdTo);
    }

    // Consent filters using JSON fields from age_verification
    if (consent) {
      if (consent === 'needed') {
        whereClauses.push("JSON_EXTRACT(p.age_verification, '$.needsParentalConsent') = true");
      } else if (['approved','revoked','rejected','pending'].includes(consent)) {
        whereClauses.push("JSON_UNQUOTE(JSON_EXTRACT(p.age_verification, '$.parentalConsentStatus')) = ?");
        params.push(consent);
      } else if (consent === 'none') {
        whereClauses.push("(p.age_verification IS NULL OR JSON_EXTRACT(p.age_verification, '$.needsParentalConsent') IS NULL)");
      }
    }

    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Infinite scroll: offset + limit (default limit=50, cap 200)
    const rawLimit = Number(req.query.limit);
    const rawOffset = Number(req.query.offset);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 50;
    const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

    // Fetch limit+1 rows to determine hasMore
    const rows = await executeQuery(
      `SELECT u.id, u.email, u.role, u.account_status, u.created_at,
              p.display_name, p.avatar_url,
              p.registration_completed, p.age_verification
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       ${where}
       ORDER BY u.created_at DESC, u.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit + 1, offset],
      { textProtocol: true }
    );

    const hasMore = rows.length > limit;
    const users = hasMore ? rows.slice(0, limit) : rows;
    const nextOffset = hasMore ? offset + users.length : null;

    res.json({ success: true, users, pagination: { offset, limit, hasMore, nextOffset } });
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
    await ensureFailModerationTable();
    const { id } = req.params;
    const { action } = req.body || {};
    if (!action) return res.status(400).json({ success: false, message: 'Action requise' });

    if (action === 'hide') {
      // Masquer le fail (optionnel: anonymiser) et marquer la modération
      await executeQuery('UPDATE fails SET is_anonyme = 1, updated_at = NOW() WHERE id = ?', [id]);
      await executeQuery(
        `INSERT INTO fail_moderation (fail_id, status, created_at, updated_at)
         VALUES (?, 'hidden', NOW(), NOW())
         ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()`,
        [id]
      );
    } else if (action === 'approve') {
      // Approuver le fail pour qu'il soit listé
      await executeQuery(
        `INSERT INTO fail_moderation (fail_id, status, created_at, updated_at)
         VALUES (?, 'approved', NOW(), NOW())
         ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()`,
        [id]
      );
    } else if (action === 'under_review') {
      await executeQuery(
        `INSERT INTO fail_moderation (fail_id, status, created_at, updated_at)
         VALUES (?, 'under_review', NOW(), NOW())
         ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()`,
        [id]
      );
    } else if (action === 'delete') {
      // Supprimer le fail et ses données annexes
      await executeQuery('DELETE FROM reactions WHERE fail_id = ?', [id]);
      await executeQuery('DELETE FROM comments WHERE fail_id = ?', [id]);
      await executeQuery('DELETE FROM fail_reports WHERE fail_id = ?', [id]);
      await executeQuery('DELETE FROM fail_moderation WHERE fail_id = ?', [id]);
      await executeQuery('DELETE FROM fails WHERE id = ?', [id]);
    } else {
      return res.status(400).json({ success: false, message: 'Action inconnue' });
    }

    // Log vers la base logs séparée
    await LogsService.saveLog({
      id: uuidv4(),
      level: 'info',
      message: 'Moderation decision on fail',
      details: { failId: id, action },
      user_id: req.user.id,
      action: 'moderation_decision',
      ip_address: req.ip || '',
      user_agent: req.get('User-Agent') || ''
    });

    res.json({ success: true, message: 'Décision de modération appliquée', failId: id, action });
  } catch (error) {
    console.error('❌ /admin/fails/:id/moderate error:', error);
    res.status(500).json({ success: false, message: 'Erreur modération' });
  }
});

// Supprimer tous les utilisateurs (sauf super_admin)
router.post('/users/delete-all', authenticateToken, requireStrictAdmin, async (req, res) => {
  try {
    // Vérifier qu'il existe au moins un super_admin sinon refuser
    const supers = await executeQuery("SELECT id FROM users WHERE LOWER(role) = 'super_admin'");
    if (!supers || supers.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun super_admin présent; opération refusée' });
    }

    await executeQuery('SET FOREIGN_KEY_CHECKS = 0');
    try {
      // Supprimer tous les utilisateurs qui ne sont pas super_admin
      await executeQuery("DELETE FROM users WHERE LOWER(role) <> 'super_admin'");
      // Nettoyer les profils orphelins
      await executeQuery("DELETE FROM profiles WHERE user_id NOT IN (SELECT id FROM users)");
      await executeQuery('SET FOREIGN_KEY_CHECKS = 1');

      await logToSeparateDatabase(
        'warning', 
        'Tous les utilisateurs non super_admin supprimés',
        { by: req.user.id }, 
        req.user.id, 
        'auth_delete_all',
        req
      );

      res.json({ success: true, message: 'Utilisateurs supprimés (hors super_admin)' });
    } catch (e) {
      await executeQuery('SET FOREIGN_KEY_CHECKS = 1');
      throw e;
    }
  } catch (e) {
    console.error('❌ /admin/users/delete-all error:', e);
    res.status(500).json({ success: false, message: 'Erreur suppression utilisateurs' });
  }
});
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
 * ====================== PARENTAL APPROVAL (COPPA) =======================
 */
// PUT /api/admin/users/:id/parental-approve
router.put('/users/:id/parental-approve', authenticateToken, requireStrictAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || id.length < 10) {
      return res.status(400).json({ success: false, message: 'User ID invalide' });
    }

    // Fetch user + profile with age_verification
    const rows = await executeQuery(`
      SELECT u.id, u.email, u.role, u.account_status,
             p.registration_completed, p.age_verification
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = ?
      LIMIT 1
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    const user = rows[0];

    // If already active and completed, no-op
    if (String(user.account_status) === 'active' && Number(user.registration_completed) === 1) {
      return res.json({ success: true, message: 'Utilisateur déjà actif', userId: id });
    }

    // Merge age_verification JSON
    let av = {};
    try { av = user.age_verification ? JSON.parse(user.age_verification) : {}; } catch {}
    av.needsParentalConsent = false;
    av.parentalConsentStatus = 'approved';
    av.parentalApprovedAt = new Date().toISOString();

    // Apply updates
    await executeQuery('UPDATE users SET account_status = ? WHERE id = ?', ['active', id]);
    await executeQuery(
      'UPDATE profiles SET registration_completed = 1, age_verification = ?, updated_at = NOW() WHERE user_id = ?',
      [JSON.stringify(av), id]
    );

    // Log action
    await logToSeparateDatabase(
      'info',
      'Parental approval granted',
      { targetUserId: id },
      req.user.id,
      'parental_approve',
      req
    );

    res.json({ success: true, message: 'Compte activé suite à validation parentale', userId: id });
  } catch (e) {
    console.error('❌ /admin/users/:id/parental-approve error:', e);
    res.status(500).json({ success: false, message: 'Erreur validation parentale' });
  }
});

// PUT /api/admin/users/:id/parental-revoke
router.put('/users/:id/parental-revoke', authenticateToken, requireStrictAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || id.length < 10) {
      return res.status(400).json({ success: false, message: 'User ID invalide' });
    }

    const rows = await executeQuery(`
      SELECT u.id, u.email, u.role, u.account_status, p.registration_completed, p.age_verification
      FROM users u LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = ? LIMIT 1
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });

    let av = {};
    try { av = rows[0].age_verification ? JSON.parse(rows[0].age_verification) : {}; } catch {}
    av.needsParentalConsent = true;
    av.parentalConsentStatus = 'revoked';
    av.parentalRevokedAt = new Date().toISOString();

    await executeQuery('UPDATE users SET account_status = ? WHERE id = ?', ['pending', id]);
    await executeQuery('UPDATE profiles SET registration_completed = 0, age_verification = ?, updated_at = NOW() WHERE user_id = ?', [JSON.stringify(av), id]);

    await logToSeparateDatabase(
      'warning',
      'Parental approval revoked',
      { targetUserId: id },
      req.user.id,
      'parental_revoke',
      req
    );

    res.json({ success: true, message: 'Validation parentale révoquée: compte repassé en attente', userId: id });
  } catch (e) {
    console.error('❌ /admin/users/:id/parental-revoke error:', e);
    res.status(500).json({ success: false, message: 'Erreur révocation parentale' });
  }
});

// PUT /api/admin/users/:id/parental-reject
router.put('/users/:id/parental-reject', authenticateToken, requireStrictAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || id.length < 10) {
      return res.status(400).json({ success: false, message: 'User ID invalide' });
    }

    const rows = await executeQuery(`
      SELECT u.id, u.email, u.role, u.account_status, p.registration_completed, p.age_verification
      FROM users u LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = ? LIMIT 1
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });

    let av = {};
    try { av = rows[0].age_verification ? JSON.parse(rows[0].age_verification) : {}; } catch {}
    av.needsParentalConsent = true;
    av.parentalConsentStatus = 'rejected';
    av.parentalRejectedAt = new Date().toISOString();

    await executeQuery('UPDATE users SET account_status = ? WHERE id = ?', ['pending', id]);
    await executeQuery('UPDATE profiles SET registration_completed = 0, age_verification = ?, updated_at = NOW() WHERE user_id = ?', [JSON.stringify(av), id]);

    await logToSeparateDatabase(
      'warning',
      'Parental approval rejected',
      { targetUserId: id },
      req.user.id,
      'parental_reject',
      req
    );

    res.json({ success: true, message: 'Validation parentale refusée: compte en attente', userId: id });
  } catch (e) {
    console.error('❌ /admin/users/:id/parental-reject error:', e);
    res.status(500).json({ success: false, message: 'Erreur refus parentale' });
  }
});

/**
 * ============================ POINTS (GÉNÉRAUX) ===========================
 */
// GET /api/admin/points/config
router.get('/points/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [pointsRow, reactionPointsRow] = await Promise.all([
      executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['points']),
      executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['reaction_points'])
    ]);
    
    let cfg = { failCreate: 10, commentCreate: 2, reactionRemovePenalty: true };
    let reactionCfg = { courage: 5, laugh: 3, empathy: 2, support: 3 };
    
    if (pointsRow && pointsRow[0] && pointsRow[0].value) {
      try { cfg = { ...cfg, ...JSON.parse(pointsRow[0].value) }; } catch {}
    }
    
    if (reactionPointsRow && reactionPointsRow[0] && reactionPointsRow[0].value) {
      try { reactionCfg = { ...reactionCfg, ...JSON.parse(reactionPointsRow[0].value) }; } catch {}
    }
    
    const completeConfig = {
      ...cfg,
      reactionCourage: reactionCfg.courage || 5,
      reactionLaugh: reactionCfg.laugh || 3,
      reactionEmpathy: reactionCfg.empathy || 2,
      reactionSupport: reactionCfg.support || 3,
      dailyBonus: cfg.dailyBonus || 0
    };
    
    res.json({ success: true, config: completeConfig });
  } catch (e) {
    console.error('❌ /admin/points/config error:', e);
    res.status(500).json({ success: false, message: 'Erreur lecture config points' });
  }
});

// PUT /api/admin/points/config
router.put('/points/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const input = req.body || {};
    
    // Récupérer les configurations actuelles
    let currentPoints = { failCreate: 10, commentCreate: 2, reactionRemovePenalty: true };
    let currentReactionPoints = { courage: 5, laugh: 3, empathy: 2, support: 3 };
    
    try {
      const pointsRow = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['points']);
      if (pointsRow && pointsRow[0] && pointsRow[0].value) {
        currentPoints = { ...currentPoints, ...JSON.parse(pointsRow[0].value) };
      }
    } catch {}
    
    try {
      const reactionRow = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['reaction_points']);
      if (reactionRow && reactionRow[0] && reactionRow[0].value) {
        currentReactionPoints = { ...currentReactionPoints, ...JSON.parse(reactionRow[0].value) };
      }
    } catch {}

    // Mise à jour configuration points
    const nextPointsCfg = {
      failCreate: Number.isFinite(Number(input.failCreate)) ? Number(input.failCreate) : currentPoints.failCreate,
      commentCreate: Number.isFinite(Number(input.commentCreate)) ? Number(input.commentCreate) : currentPoints.commentCreate,
      reactionRemovePenalty: typeof input.reactionRemovePenalty === 'boolean' ? input.reactionRemovePenalty : currentPoints.reactionRemovePenalty,
      dailyBonus: Number.isFinite(Number(input.dailyBonus)) ? Number(input.dailyBonus) : (currentPoints.dailyBonus || 5)
    };

    // Mise à jour configuration reaction points
    const nextReactionCfg = {
      courage: Number.isFinite(Number(input.reactionCourage)) ? Number(input.reactionCourage) : currentReactionPoints.courage,
      laugh: Number.isFinite(Number(input.reactionLaugh)) ? Number(input.reactionLaugh) : currentReactionPoints.laugh,
      empathy: Number.isFinite(Number(input.reactionEmpathy)) ? Number(input.reactionEmpathy) : currentReactionPoints.empathy,
      support: Number.isFinite(Number(input.reactionSupport)) ? Number(input.reactionSupport) : currentReactionPoints.support
    };

    // Sauvegarder les deux configurations
    await executeQuery(
      `INSERT INTO app_config (id, \`key\`, value, created_at, updated_at)
       VALUES (UUID(), 'points', ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
      [JSON.stringify(nextPointsCfg)]
    );
    
    await executeQuery(
      `INSERT INTO app_config (id, \`key\`, value, created_at, updated_at)
       VALUES (UUID(), 'reaction_points', ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
      [JSON.stringify(nextReactionCfg)]
    );

    // Retourner la configuration complète
    const fullConfig = {
      failCreate: nextPointsCfg.failCreate,
      commentCreate: nextPointsCfg.commentCreate,
      reactionRemovePenalty: nextPointsCfg.reactionRemovePenalty,
      dailyBonus: nextPointsCfg.dailyBonus,
      reactionCourage: nextReactionCfg.courage,
      reactionLaugh: nextReactionCfg.laugh,
      reactionEmpathy: nextReactionCfg.empathy,
      reactionSupport: nextReactionCfg.support
    };
    
    res.json({ success: true, config: fullConfig });
  } catch (e) {
    console.error('❌ /admin/points/config update error:', e);
    res.status(500).json({ success: false, message: 'Erreur mise à jour config points' });
  }
});

// POST /api/admin/restore-configs - réinitialise les configurations essentielles
router.post('/restore-configs', authenticateToken, requireStrictAdmin, async (req, res) => {
  try {
    const defaults = {
      points: {
        failCreate: 10,
        commentCreate: 2,
        reactionRemovePenalty: true,
        dailyBonus: 5
      },
      reaction_points: {
        courage: 5,
        laugh: 3,
        empathy: 2,
        support: 3
      },
      moderation: {
        failReportThreshold: 3,
        commentReportThreshold: 2,
        panelAutoRefreshSec: 20
      }
    };

    await executeQuery(
      `INSERT INTO app_config (id, \`key\`, value, created_at, updated_at)
       VALUES 
         (UUID(), 'points', ?, NOW(), NOW()),
         (UUID(), 'reaction_points', ?, NOW(), NOW()),
         (UUID(), 'moderation', ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
      [
        JSON.stringify(defaults.points),
        JSON.stringify(defaults.reaction_points),
        JSON.stringify(defaults.moderation)
      ]
    );

    res.json({ success: true, restoredKeys: Object.keys(defaults) });
  } catch (error) {
    console.error('❌ /admin/restore-configs error:', error);
    res.status(500).json({ success: false, message: 'Erreur restauration configurations' });
  }
});

/**
 * =========================== CONFIG CONSOLIDÉE ===========================
 */
// GET /api/admin/config
router.get('/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [pointsRow, reactRow, modRow, emailRow, pushRow] = await Promise.all([
      executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['points']),
      executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['reaction_points']),
      executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['moderation']),
      executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['email']),
      executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['push'])
    ]);
    let points = { failCreate: 10, commentCreate: 2, reactionRemovePenalty: true };
    let reaction_points = { courage: 5, laugh: 3, empathy: 2, support: 3 };
    let moderation = { failReportThreshold: 1, commentReportThreshold: 1, panelAutoRefreshSec: 20 };
    let email = { enabled: false };
    let push = { enabled: false, provider: 'fcm' };
    try { if (pointsRow[0]?.value) points = { ...points, ...JSON.parse(pointsRow[0].value) }; } catch {}
    try { if (reactRow[0]?.value) reaction_points = { ...reaction_points, ...JSON.parse(reactRow[0].value) }; } catch {}
    try { if (modRow[0]?.value) moderation = { ...moderation, ...JSON.parse(modRow[0].value) }; } catch {}
    try { if (emailRow[0]?.value) email = { ...email, ...JSON.parse(emailRow[0].value) }; } catch {}
    try { if (pushRow[0]?.value) push = { ...push, ...JSON.parse(pushRow[0].value) }; } catch {}
    res.json({ success: true, config: { points, reaction_points, moderation, email, push } });
  } catch (e) {
    console.error('❌ /api/admin/config error:', e);
    res.status(500).json({ success: false, message: 'Erreur lecture config consolidée' });
  }
});

// PUT /api/admin/config
// Met à jour en une fois: points, reaction_points, moderation
router.put('/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};

    // Lire existants
    const [pointsRow, reactRow, modRow, emailRow, pushRow] = await Promise.all([
      executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['points']),
      executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['reaction_points']),
      executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['moderation']),
      executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['email']),
      executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['push'])
    ]);

    let points = { failCreate: 10, commentCreate: 2, reactionRemovePenalty: true };
    let reaction_points = { courage: 5, laugh: 3, empathy: 2, support: 3 };
    let moderation = { failReportThreshold: 1, commentReportThreshold: 1, panelAutoRefreshSec: 20 };
    let email = { enabled: false };
    let push = { enabled: false, provider: 'fcm' };

    try { if (pointsRow[0]?.value) points = { ...points, ...JSON.parse(pointsRow[0].value) }; } catch {}
    try { if (reactRow[0]?.value) reaction_points = { ...reaction_points, ...JSON.parse(reactRow[0].value) }; } catch {}
    try { if (modRow[0]?.value) moderation = { ...moderation, ...JSON.parse(modRow[0].value) }; } catch {}
    try { if (emailRow[0]?.value) email = { ...email, ...JSON.parse(emailRow[0].value) }; } catch {}
    try { if (pushRow[0]?.value) push = { ...push, ...JSON.parse(pushRow[0].value) }; } catch {}

    // Merge with payload
    if (body.points && typeof body.points === 'object') {
      const p = body.points;
      points = {
        ...points,
        ...(p.failCreate !== undefined ? { failCreate: Number(p.failCreate) || 0 } : {}),
        ...(p.commentCreate !== undefined ? { commentCreate: Number(p.commentCreate) || 0 } : {}),
        ...(p.reactionRemovePenalty !== undefined ? { reactionRemovePenalty: !!p.reactionRemovePenalty } : {})
      };
    }
    if (body.reaction_points && typeof body.reaction_points === 'object') {
      const rp = body.reaction_points;
      reaction_points = {
        ...reaction_points,
        ...(rp.courage !== undefined ? { courage: Number(rp.courage) || 0 } : {}),
        ...(rp.laugh !== undefined ? { laugh: Number(rp.laugh) || 0 } : {}),
        ...(rp.empathy !== undefined ? { empathy: Number(rp.empathy) || 0 } : {}),
        ...(rp.support !== undefined ? { support: Number(rp.support) || 0 } : {})
      };
    }
    if (body.moderation && typeof body.moderation === 'object') {
      const m = body.moderation;
      moderation = {
        ...moderation,
        ...(m.failReportThreshold !== undefined ? { failReportThreshold: Math.max(1, Number(m.failReportThreshold) || 1) } : {}),
        ...(m.commentReportThreshold !== undefined ? { commentReportThreshold: Math.max(1, Number(m.commentReportThreshold) || 1) } : {}),
        ...(m.panelAutoRefreshSec !== undefined ? { panelAutoRefreshSec: Math.max(5, Number(m.panelAutoRefreshSec) || 20) } : {})
      };
    }
    if (body.email && typeof body.email === 'object') {
      const em = body.email;
      email = {
        ...email,
        ...(em.enabled !== undefined ? { enabled: !!em.enabled } : {})
      };
    }
    if (body.push && typeof body.push === 'object') {
      const pv = body.push;
      push = {
        ...push,
        ...(pv.enabled !== undefined ? { enabled: !!pv.enabled } : {}),
        ...(pv.provider ? { provider: String(pv.provider) } : {})
      };
    }

    // Upserts
    await executeQuery(
      `INSERT INTO app_config (id, \`key\`, value, created_at, updated_at)
       VALUES (UUID(), 'points', ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
      [JSON.stringify(points)]
    );
    await executeQuery(
      `INSERT INTO app_config (id, \`key\`, value, created_at, updated_at)
       VALUES (UUID(), 'reaction_points', ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
      [JSON.stringify(reaction_points)]
    );
    await executeQuery(
      `INSERT INTO app_config (id, \`key\`, value, created_at, updated_at)
       VALUES (UUID(), 'moderation', ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
      [JSON.stringify(moderation)]
    );
    await executeQuery(
      `INSERT INTO app_config (id, \`key\`, value, created_at, updated_at)
       VALUES (UUID(), 'email', ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
      [JSON.stringify(email)]
    );
    await executeQuery(
      `INSERT INTO app_config (id, \`key\`, value, created_at, updated_at)
       VALUES (UUID(), 'push', ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
      [JSON.stringify(push)]
    );

    res.json({ success: true, config: { points, reaction_points, moderation, email, push } });
  } catch (e) {
    console.error('❌ /api/admin/config PUT error:', e);
    res.status(500).json({ success: false, message: 'Erreur mise à jour config' });
  }
});

// Email config dedicated endpoints
router.get('/email/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const row = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['email']);
    let email = { enabled: false };
    if (row && row[0] && row[0].value) { try { email = { ...email, ...JSON.parse(row[0].value) }; } catch {} }
    res.json({ success: true, email });
  } catch (e) {
    console.error('❌ /admin/email/config get error:', e);
    res.status(500).json({ success: false, message: 'Erreur lecture config email' });
  }
});

router.put('/email/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    let email = { enabled: false };
    if (body && typeof body === 'object' && body.enabled !== undefined) {
      email.enabled = !!body.enabled;
    }
    await executeQuery(
      `INSERT INTO app_config (id, \`key\`, value, created_at, updated_at)
       VALUES (UUID(), 'email', ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
      [JSON.stringify(email)]
    );
    res.json({ success: true, email });
  } catch (e) {
    console.error('❌ /admin/email/config put error:', e);
    res.status(500).json({ success: false, message: 'Erreur mise à jour config email' });
  }
});

/**
 * ============================== ADMIN LOGS ================================
 * Vue claire des logs: par jour, par utilisateur, actions, et liste filtrée
 * Réservé strictement aux admins (hors modérateurs)
 */
// GET /api/admin/logs/summary?days=7
router.get('/logs/summary', authenticateToken, requireStrictAdmin, async (req, res) => {
  try {
    const days = Math.max(1, parseInt(req.query.days || '7'));
    const [totals, actions] = await Promise.all([
      executeQuery(
        `SELECT 
            COUNT(*) AS total,
            SUM(level='error')   AS errors,
            SUM(level='warning') AS warnings,
            SUM(level='info')    AS infos,
            SUM(level='debug')   AS debugs
         FROM system_logs
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [days]
      ),
      executeQuery(
        `SELECT action, COUNT(*) AS count
           FROM system_logs
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          GROUP BY action
          ORDER BY count DESC
          LIMIT 50`,
        [days]
      )
    ]);
    res.json({ success: true, periodDays: days, totals: totals[0] || {}, topActions: actions });
  } catch (e) {
    console.error('❌ admin logs summary error:', e);
    res.status(500).json({ success: false, message: 'Erreur summary logs' });
  }
});

// GET /api/admin/logs/by-day?days=7
router.get('/logs/by-day', authenticateToken, requireStrictAdmin, async (req, res) => {
  try {
    const days = Math.max(1, parseInt(req.query.days || '7'));
    const rows = await executeQuery(
      `SELECT DATE(created_at) AS day,
              COUNT(*) AS total,
              SUM(level='error')   AS errors,
              SUM(level='warning') AS warnings,
              SUM(level='info')    AS infos,
              SUM(level='debug')   AS debugs
         FROM system_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY day DESC`,
      [days]
    );
    res.json({ success: true, periodDays: days, days: rows });
  } catch (e) {
    console.error('❌ admin logs by-day error:', e);
    res.status(500).json({ success: false, message: 'Erreur logs par jour' });
  }
});

// GET /api/admin/logs/by-user?days=7
router.get('/logs/by-user', authenticateToken, requireStrictAdmin, async (req, res) => {
  try {
    const days = Math.max(1, parseInt(req.query.days || '7'));
    const rows = await executeQuery(
      `SELECT sl.user_id, p.display_name, u.email,
              COUNT(*) AS total,
              SUM(sl.level='error')   AS errors,
              SUM(sl.level='warning') AS warnings,
              SUM(sl.level='info')    AS infos,
              SUM(sl.level='debug')   AS debugs
         FROM system_logs sl
         LEFT JOIN users u ON u.id = sl.user_id
         LEFT JOIN profiles p ON p.user_id = sl.user_id
        WHERE sl.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY sl.user_id, p.display_name, u.email
        ORDER BY total DESC
        LIMIT 200`,
      [days]
    );
    res.json({ success: true, periodDays: days, users: rows });
  } catch (e) {
    console.error('❌ admin logs by-user error:', e);
    res.status(500).json({ success: false, message: 'Erreur logs par utilisateur' });
  }
});

// GET /api/admin/logs/actions?days=7
router.get('/logs/actions', authenticateToken, requireStrictAdmin, async (req, res) => {
  try {
    const days = Math.max(1, parseInt(req.query.days || '7'));
    const rows = await executeQuery(
      `SELECT action, COUNT(*) AS count
         FROM system_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY action
        ORDER BY count DESC
        LIMIT 200`,
      [days]
    );
    res.json({ success: true, periodDays: days, actions: rows });
  } catch (e) {
    console.error('❌ admin logs actions error:', e);
    res.status(500).json({ success: false, message: 'Erreur logs par action' });
  }
});

// GET /api/admin/logs/list?limit=200&offset=0&level=&action=&userId=&start=&end=
router.get('/logs/list', authenticateToken, requireStrictAdmin, async (req, res) => {
  try {
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit || '200')));
    const offset = Math.max(0, parseInt(req.query.offset || '0'));
    const level = req.query.level || null;
    const action = req.query.action || null;
    const userId = req.query.userId || null;
    const start = req.query.start || null;
    const end = req.query.end || null;

    let sql = `SELECT sl.*, p.display_name, u.email
                 FROM system_logs sl
                 LEFT JOIN users u ON u.id = sl.user_id
                 LEFT JOIN profiles p ON p.user_id = sl.user_id
                WHERE 1=1`;
    const params = [];
    if (level) { sql += ' AND sl.level = ?'; params.push(level); }
    if (action) { sql += ' AND sl.action = ?'; params.push(action); }
    if (userId) { sql += ' AND sl.user_id = ?'; params.push(userId); }
    if (start) { sql += ' AND sl.created_at >= ?'; params.push(start); }
    if (end) { sql += ' AND sl.created_at <= ?'; params.push(end); }
    sql += ` ORDER BY sl.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const rows = await executeQuery(sql, params);
    res.json({ success: true, logs: rows, pagination: { limit, offset, count: rows.length } });
  } catch (e) {
    console.error('❌ admin logs list error:', e);
    res.status(500).json({ success: false, message: 'Erreur liste des logs' });
  }
});

// GET /api/admin/logs/by-type?type=all|auth|user_action|admin|security|error&limit=20&periodHours=24
// Compat avec ancien frontend: renvoie une liste homogène avec activity_type/description/user_name/email/created_at/level
router.get('/logs/by-type', authenticateToken, requireStrictAdmin, async (req, res) => {
  try {
    const type = String(req.query.type || 'all').toLowerCase();
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit || '20')));
    const hours = Math.max(1, Math.min(168, parseInt(req.query.periodHours || '24'))); // Max 7 jours

    // Récupérer un lot, filtrer ensuite côté serveur pour catégoriser
    const rows = await executeQuery(
      `SELECT sl.*, p.display_name, u.email
         FROM system_logs sl
         LEFT JOIN users u ON u.id = sl.user_id
         LEFT JOIN profiles p ON p.user_id = sl.user_id
        WHERE sl.timestamp >= DATE_SUB(NOW(), INTERVAL ${hours} HOUR)
        ORDER BY sl.timestamp DESC
        LIMIT ?`,
      [Math.min(limit * 5, 1000)]
    );

    function categorize(row) {
      const action = String(row.action || '').toLowerCase();
      const level = String(row.level || '').toLowerCase();
      if (level === 'error') return 'error';
      if (/^user_(register|login|logout|password|password_reset)/.test(action)) return 'auth';
      if (/^(fail_|comment_|reaction_)/.test(action)) return 'user_action';
      if (/^moderation|^admin|config/.test(action)) return 'admin';
      if (/security|token|permission/.test(action)) return 'security';
      return 'general';
    }

    const mapped = rows.map((r) => ({
      id: r.id,
      activity_type: categorize(r),
      description: r.message,
      user_id: r.user_id,
      user_name: r.display_name || null,
      user_email: r.email || null,
      ip_address: null,
      user_agent: null,
      created_at: r.timestamp || r.created_at,
      level: r.level,
      action: r.action || null,
      details: r.details ? (() => { try { return JSON.parse(r.details); } catch { return null; } })() : null
    }));

    const filtered = type === 'all' ? mapped : mapped.filter(m => m.activity_type === type || (type === 'error' && m.level === 'error'));
    res.json({ success: true, logs: filtered.slice(0, limit), count: Math.min(filtered.length, limit) });
  } catch (e) {
    console.error('❌ admin logs by-type error:', e);
    res.status(500).json({ success: false, message: 'Erreur logs by-type' });
  }
});
// PUT /api/admin/fails/:id/moderation { status }
router.put('/fails/:id/moderation', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!['approved','hidden','under_review','rejected'].includes(status)) {
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
    if (!['approved','hidden','under_review','rejected'].includes(status)) {
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

// POST /api/admin/tables/:tableName/truncate - Vider une table
router.post('/tables/:tableName/truncate', authenticateToken, requireStrictAdmin, async (req, res) => {
  try {
    const { tableName } = req.params;
    const { isAuthTable } = req.body;

    // Liste des tables autorisées (basée sur faildaily.sql)
    const allowedTables = [
      // Tables principales de l'application
      'fails', 'reactions', 'comments', 'profiles', 
      'user_badges', 'user_activities', 'activity_logs', 'system_logs', 
      'reaction_logs', 'app_config',
      'badges', 'user_points', 'user_point_events', 'user_management_logs',
      'user_legal_acceptances',
      // Nouvelles tables utilitaires et erreurs
      'error_logs', 'push_errors', 'user_push_tokens', 'email_verification_tokens', 'password_reset_tokens',
      // Tables de modération et signalements
      'fail_moderation', 'fail_reports', 'fail_reactions_archive',
      'comment_moderation', 'comment_reactions', 'comment_reports',
      // Tables auth (nécessitent confirmation spéciale)
      'users', 'user_preferences', 'parental_consents'
    ];

    // Tables sensibles nécessitant confirmation spéciale
    const authTables = ['users', 'user_preferences', 'parental_consents'];

    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ 
        success: false, 
        message: `Table '${tableName}' non autorisée pour cette opération` 
      });
    }

    // Vérification supplémentaire pour les tables auth
    if (authTables.includes(tableName) && !isAuthTable) {
      return res.status(400).json({ 
        success: false, 
        message: `La table '${tableName}' nécessite une confirmation spéciale` 
      });
    }

    // Désactiver les contraintes de clés étrangères temporairement
    await executeQuery('SET FOREIGN_KEY_CHECKS = 0');
    
    try {
      // Vider la table
      await executeQuery(`TRUNCATE TABLE ${tableName}`);
      
      // Réactiver les contraintes
      await executeQuery('SET FOREIGN_KEY_CHECKS = 1');
      
      // Logger l'action (sauf si on vide les tables de logs elles-mêmes)
      if (!['system_logs', 'activity_logs'].includes(tableName)) {
        await logToSeparateDatabase(
          'warning',
          `Table ${tableName} vidée par admin`,
          { tableName, isAuthTable },
          req.user.id,
          'table_truncate',
          req
        );
      }

      res.json({ 
        success: true, 
        message: `Table '${tableName}' vidée avec succès` 
      });

    } catch (truncateError) {
      // Réactiver les contraintes même en cas d'erreur
      await executeQuery('SET FOREIGN_KEY_CHECKS = 1');
      throw truncateError;
    }

  } catch (error) {
    console.error('❌ Erreur truncate table:', error);
    res.status(500).json({ 
      success: false, 
      message: `Erreur lors du vidage de la table: ${error.message}` 
    });
  }
});

// POST /api/admin/tables/bulk-truncate - Vider plusieurs tables
router.post('/tables/bulk-truncate', authenticateToken, requireStrictAdmin, async (req, res) => {
  try {
    const { tables, isAuthTables } = req.body;

    if (!Array.isArray(tables) || tables.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Liste des tables requise' 
      });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Désactiver les contraintes de clés étrangères
    await executeQuery('SET FOREIGN_KEY_CHECKS = 0');

    try {
      for (const tableName of tables) {
        try {
          await executeQuery(`TRUNCATE TABLE ${tableName}`);
          results.push({ table: tableName, success: true });
          successCount++;
        } catch (error) {
          results.push({ table: tableName, success: false, error: error.message });
          errorCount++;
        }
      }

      // Réactiver les contraintes
      await executeQuery('SET FOREIGN_KEY_CHECKS = 1');

      // Logger l'action (sauf si on a vidé les tables de logs)
      const logTablesInvolved = tables.some(table => ['system_logs', 'activity_logs'].includes(table));
      if (!logTablesInvolved) {
        await logToSeparateDatabase(
          'warning',
          `Vidage en masse de ${successCount}/${tables.length} tables`,
          { tables, results, isAuthTables },
          req.user.id,
          'bulk_truncate',
          req
        );
      }

      res.json({ 
        success: errorCount === 0, 
        message: `${successCount} tables vidées avec succès, ${errorCount} erreurs`,
        results 
      });

    } catch (error) {
      // Réactiver les contraintes même en cas d'erreur
      await executeQuery('SET FOREIGN_KEY_CHECKS = 1');
      throw error;
    }

  } catch (error) {
    console.error('❌ Erreur bulk truncate:', error);
    res.status(500).json({ 
      success: false, 
      message: `Erreur lors du vidage en masse: ${error.message}` 
    });
  }
});

// GET /api/admin/db/counts - Compte les lignes par table (sanity check reset)
router.get('/db/counts', authenticateToken, requireStrictAdmin, async (req, res) => {
  try {
    const tables = [
      // Core app
      'fails','reactions','comments','profiles','user_badges','user_activities',
      'activity_logs','system_logs','reaction_logs',
      // Moderation
      'fail_moderation','fail_reports','fail_reactions_archive',
      'comment_moderation','comment_reactions','comment_reports',
      // Utils/errors/push/tokens
      'error_logs','push_errors','user_push_tokens','email_verification_tokens','password_reset_tokens',
      // Points & legal
      'user_points','user_point_events','user_management_logs','user_legal_acceptances',
      // Auth
      'users','user_preferences','parental_consents','legal_documents'
    ];

    const counts = {};
    for (const t of tables) {
      try {
        const rows = await executeQuery(`SELECT COUNT(*) as c FROM ${t}`);
        counts[t] = rows && rows[0] ? Number(rows[0].c) : 0;
      } catch (e) {
        counts[t] = null; // table peut ne pas exister
      }
    }

    // Ne pas compter badge_definitions (préservée), app_config (config)
    res.json({ success: true, counts });
  } catch (e) {
    console.error('❌ /admin/db/counts error:', e);
    res.status(500).json({ success: false, message: 'Erreur comptage tables' });
  }
});

// Reset complet robuste
router.post('/reset/complete', authenticateToken, requireStrictAdmin, async (req, res) => {
  try {
    const dbName = process.env.DB_NAME || 'faildaily';
    const preserve = new Set(['badge_definitions','app_config','legal_documents','users']);
    const tables = await executeQuery(
      `SELECT TABLE_NAME as name FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
      [dbName]
    );

    await executeQuery('SET FOREIGN_KEY_CHECKS = 0');
    const results = [];
    try {
      for (const row of tables) {
        const t = row.name;
        if (preserve.has(t)) continue;
        try { await executeQuery(`TRUNCATE TABLE ${t}`); results.push({ table: t, success: true }); }
        catch (e) { results.push({ table: t, success: false, error: e.message }); }
      }
      // Supprimer tous les utilisateurs qui ne sont pas super_admin
      await executeQuery("DELETE FROM users WHERE LOWER(role) <> 'super_admin'");
      // Nettoyer profils orphelins
      try { await executeQuery("DELETE FROM profiles WHERE user_id NOT IN (SELECT id FROM users)"); } catch {}
      await executeQuery('SET FOREIGN_KEY_CHECKS = 1');

      await logToSeparateDatabase(
        'warning',
        'Reset complet effectué',
        { results },
        req.user.id,
        'reset_complete',
        req
      );

      res.json({ success: true, message: 'Reset complet terminé', results });
    } catch (e) {
      await executeQuery('SET FOREIGN_KEY_CHECKS = 1');
      throw e;
    }
  } catch (e) {
    console.error('❌ /admin/reset/complete error:', e);
    res.status(500).json({ success: false, message: 'Erreur reset complet' });
  }
});

module.exports = router;
// Push config dedicated endpoints
router.get('/push/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const row = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['push']);
    let push = { enabled: false, provider: 'fcm' };
    if (row && row[0] && row[0].value) { try { push = { ...push, ...JSON.parse(row[0].value) }; } catch {} }
    res.json({ success: true, push });
  } catch (e) {
    console.error('❌ /admin/push/config get error:', e);
    res.status(500).json({ success: false, message: 'Erreur lecture config push' });
  }
});

router.put('/push/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    let push = { enabled: false, provider: 'fcm' };
    if (body && typeof body === 'object') {
      if (body.enabled !== undefined) push.enabled = !!body.enabled;
      if (body.provider) push.provider = String(body.provider);
    }
    await executeQuery(
      `INSERT INTO app_config (id, \`key\`, value, created_at, updated_at)
       VALUES (UUID(), 'push', ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
      [JSON.stringify(push)]
    );
    res.json({ success: true, push });
  } catch (e) {
    console.error('❌ /admin/push/config put error:', e);
    res.status(500).json({ success: false, message: 'Erreur mise à jour config push' });
  }
});
