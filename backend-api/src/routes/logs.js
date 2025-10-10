/**
 * Routes pour la gestion des logs - FailDaily Backend API
 * ======================================================
 * 
 * Endpoints pour consulter et gérer les logs système
 */

const express = require('express');
const router = express.Router();
const LogsService = require('../services/logsService');
const { logsPool } = require('../config/database-logs');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Helper pour exécuter des requêtes sur la base logs
async function executeLogsQuery(query, params = []) {
  let connection;
  try {
    connection = await logsPool.getConnection();
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error('❌ Erreur requête logs:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * GET /api/logs/system
 * Récupère les logs système
 */
router.get('/system', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 100, level = 'all', action, userId } = req.query;
    
    // Construction des filtres pour le nouveau service
    const filters = {
      limit: parseInt(limit) || 100,
      offset: 0
    };
    
    if (level !== 'all') {
      filters.level = level;
    }
    
    if (action) {
      filters.action = action;
    }
    
    if (userId) {
      filters.userId = userId;
    }
    
    // Utilisation du nouveau service de logs
    const logs = await LogsService.getLogs(filters);
    
    res.json({
      success: true,
      logs: logs,
      count: logs.length
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération logs système:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des logs',
      code: 'LOGS_FETCH_ERROR'
    });
  }
});

/**
 * GET /api/logs/user/:userId
 * Récupère les logs d'un utilisateur spécifique
 */
router.get('/user/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    // Utilisation du nouveau service avec filtre utilisateur
    const filters = {
      limit: parseInt(limit) || 50,
      offset: 0,
      userId: userId
    };
    
    const logs = await LogsService.getLogs(filters);
    
    res.json({
      success: true,
      logs: logs,
      userId: userId,
      count: logs.length
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération logs utilisateur:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des logs utilisateur',
      code: 'USER_LOGS_FETCH_ERROR'
    });
  }
});

/**
 * GET /api/logs/stats
 * Récupère les statistiques des logs
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    const stats = await LogsService.getLogStats(period);
    
    res.json({
      success: true,
      stats: stats,
      period: period
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération stats logs:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques',
      code: 'LOGS_STATS_ERROR'
    });
  }
});

/**
 * POST /api/logs/system
 * Ajoute un log système
 */
router.post('/system', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { level, message, details, action } = req.body;
    const userId = req.user?.id || null;
    
    // Utilisation du nouveau service de logs
    const logId = await LogsService.saveLog({
      id: require('uuid').v4(),
      level: level || 'info',
      message: message || '',
      details: details || {},
      user_id: userId,
      action: action || 'manual_log',
      ip_address: req.ip || '',
      user_agent: req.get('User-Agent') || ''
    });
    
    res.json({
      success: true,
      message: 'Log ajouté avec succès',
      logId: logId
    });
    
  } catch (error) {
    console.error('❌ Erreur ajout log manuel:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'ajout du log',
      code: 'LOG_ADD_ERROR'
    });
  }
});

/**
 * DELETE /api/logs/cleanup
 * Nettoie les anciens logs (plus de 30 jours)
 */
router.delete('/cleanup', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Accès refusé - droits administrateur requis',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    const query = `
      DELETE FROM activity_logs 
      WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    
    const result = await executeLogsQuery(query);
    
    res.json({
      success: true,
      message: 'Nettoyage des logs effectué',
      deletedCount: result.affectedRows
    });
    
  } catch (error) {
    console.error('❌ Erreur nettoyage logs:', error);
    res.status(500).json({
      error: 'Erreur lors du nettoyage des logs',
      code: 'LOGS_CLEANUP_ERROR'
    });
  }
});

/**
 * POST /api/logs/comprehensive
 * Endpoint pour les logs compréhensifs du frontend
 */
router.post('/comprehensive', (req, res) => {
  try {
    const logData = req.body;
    
    // Pour l'instant, on log juste dans la console
    // Plus tard on peut ajouter une vraie persistence
    console.log('📊 Frontend Log:', {
      timestamp: new Date().toISOString(),
      ...logData
    });
    
    res.json({
      success: true,
      message: 'Log reçu avec succès',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du traitement du log:', error);
    res.status(500).json({
      error: 'Erreur lors du traitement du log',
      code: 'LOG_PROCESSING_ERROR'
    });
  }
});

/**
 * GET /api/logs/comprehensive
 * Retourne des logs système avec filtres optionnels
 */
router.get('/comprehensive', authenticateToken, async (req, res) => {
  try {
    const { limit = 100, level = null, action = null, sinceHours = 24 } = req.query;
    let query = `SELECT id, level, message, details, user_id, action, created_at FROM activity_logs WHERE 1=1`;
    const params = [];
    if (level) { query += ' AND level = ?'; params.push(level); }
    if (action) { query += ' AND action = ?'; params.push(action); }
    if (sinceHours) { query += ' AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)'; params.push(parseInt(sinceHours)); }
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    const logs = await executeLogsQuery(query, params);
    res.json({ success: true, logs });
  } catch (error) {
    console.error('❌ Erreur GET comprehensive logs:', error);
    res.status(500).json({ success: false, message: 'Erreur récupération logs' });
  }
});

/**
 * PUT /api/logs/comprehensive/:id
 * Met à jour un log (message/details)
 */
router.put('/comprehensive/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, details } = req.body || {};
    if (!message && !details) {
      return res.status(400).json({ success: false, message: 'Aucune donnée à mettre à jour' });
    }
    const fields = [];
    const params = [];
    if (message) { fields.push('message = ?'); params.push(message); }
    if (details) { fields.push('details = ?'); params.push(JSON.stringify(details)); }
    params.push(id);
    const sql = `UPDATE activity_logs SET ${fields.join(', ')} WHERE id = ?`;
    await executeLogsQuery(sql, params);
    res.json({ success: true, message: 'Log mis à jour' });
  } catch (error) {
    console.error('❌ Erreur update comprehensive log:', error);
    res.status(500).json({ success: false, message: 'Erreur mise à jour log' });
  }
});

module.exports = router;
