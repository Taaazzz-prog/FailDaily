/**
 * Routes pour la gestion des logs - FailDaily Backend API
 * ======================================================
 * 
 * Endpoints pour consulter et gérer les logs système
 */

const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/logs/system
 * Récupère les logs système
 */
router.get('/system', authenticateToken, async (req, res) => {
  try {
    const { limit = 100, level = 'all' } = req.query;
    
    let query = `
      SELECT 
        id,
        level,
        message,
        details,
        user_id,
        action,
        created_at
      FROM system_logs
    `;
    
    const params = [];
    
    if (level !== 'all') {
      query += ' WHERE level = ?';
      params.push(level);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const logs = await executeQuery(query, params);
    
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
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    const query = `
      SELECT 
        id,
        level,
        message,
        details,
        action,
        created_at
      FROM system_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    
    const logs = await executeQuery(query, [userId, parseInt(limit)]);
    
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
 * POST /api/logs/system
 * Ajoute un log système
 */
router.post('/system', authenticateToken, async (req, res) => {
  try {
    const { level, message, details, action } = req.body;
    const userId = req.user?.id || null;
    
    const query = `
      INSERT INTO system_logs (id, level, message, details, user_id, action, created_at)
      VALUES (UUID(), ?, ?, ?, ?, ?, NOW())
    `;
    
    const result = await executeQuery(query, [
      String(level || 'info').toLowerCase(),
      message || '',
      details ? JSON.stringify(details) : null,
      userId,
      action || null
    ]);
    
    res.json({
      success: true,
      message: 'Log ajouté avec succès',
      logId: result.insertId
    });
    
  } catch (error) {
    console.error('❌ Erreur ajout log système:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'ajout du log',
      code: 'LOG_INSERT_ERROR'
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
      DELETE FROM system_logs 
      WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    
    const result = await executeQuery(query);
    
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
    let query = `SELECT id, level, message, details, user_id, action, created_at FROM system_logs WHERE 1=1`;
    const params = [];
    if (level) { query += ' AND level = ?'; params.push(level); }
    if (action) { query += ' AND action = ?'; params.push(action); }
    if (sinceHours) { query += ' AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)'; params.push(parseInt(sinceHours)); }
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    const logs = await executeQuery(query, params);
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
    const sql = `UPDATE system_logs SET ${fields.join(', ')} WHERE id = ?`;
    await executeQuery(sql, params);
    res.json({ success: true, message: 'Log mis à jour' });
  } catch (error) {
    console.error('❌ Erreur update comprehensive log:', error);
    res.status(500).json({ success: false, message: 'Erreur mise à jour log' });
  }
});

module.exports = router;
