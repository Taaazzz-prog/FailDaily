const express = require('express');
const { executeQuery } = require('../src/config/database');
const authenticateToken = require('../src/middleware/auth');

const router = express.Router();

/**
 * Routes pour la gestion des logs système
 */

/**
 * Route pour le logging des connexions utilisateur (appelée par le frontend)
 */
router.post('/user-login', async (req, res) => {
  try {
    console.log('📊 Réception log connexion utilisateur:', req.body);
    
    // Cette route accepte les logs du frontend mais ne fait rien
    // car le logging est déjà géré côté backend dans authController
    res.json({
      success: true,
      message: 'Log reçu avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur log connexion utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du logging de la connexion'
    });
  }
});

/**
 * Récupérer les logs récents
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      limit = 50, 
      level = null, 
      user_id = null,
      start_date = null,
      end_date = null
    } = req.query;

    let whereConditions = [];
    let queryParams = [];

    // Filtrer par niveau
    if (level) {
      whereConditions.push('level = ?');
      queryParams.push(level.toUpperCase());
    }

    // Filtrer par utilisateur
    if (user_id) {
      whereConditions.push('user_id = ?');
      queryParams.push(parseInt(user_id));
    }

    // Filtrer par date de début
    if (start_date) {
      whereConditions.push('created_at >= ?');
      queryParams.push(start_date);
    }

    // Filtrer par date de fin
    if (end_date) {
      whereConditions.push('created_at <= ?');
      queryParams.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const query = `
      SELECT 
        sl.*,
        u.display_name
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      ${whereClause}
      ORDER BY sl.created_at DESC
      LIMIT ?
    `;

    queryParams.push(parseInt(limit));

    const logs = await executeQuery(req.dbConnection, query, queryParams);

    res.json({
      success: true,
      logs: logs,
      count: logs.length,
      filters: {
        level,
        user_id,
        start_date,
        end_date,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Créer un nouveau log
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      level = 'INFO',
      message,
      error_details = null,
      ip_address = null,
      user_agent = null
    } = req.body;

    const userId = req.user ? req.user.id : null;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Le message du log est obligatoire'
      });
    }

    const validLevels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
    if (!validLevels.includes(level.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Niveau de log invalide',
        valid_levels: validLevels
      });
    }

    await executeQuery(
      req.dbConnection,
      `INSERT INTO system_logs (
        level, message, error_details, user_id, 
        ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        level.toUpperCase(),
        message,
        error_details,
        userId,
        ip_address || req.ip,
        user_agent || req.get('User-Agent')
      ]
    );

    console.log(`📝 Log créé: [${level}] ${message}`);

    res.status(201).json({
      success: true,
      message: 'Log créé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur création log:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Statistiques des logs
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;

    // Stats générales
    const generalStats = await executeQuery(
      req.dbConnection,
      `SELECT 
        COUNT(*) as total_logs,
        COUNT(CASE WHEN level = 'ERROR' THEN 1 END) as error_count,
        COUNT(CASE WHEN level = 'WARNING' THEN 1 END) as warning_count,
        COUNT(CASE WHEN level = 'INFO' THEN 1 END) as info_count,
        COUNT(CASE WHEN level = 'DEBUG' THEN 1 END) as debug_count,
        COUNT(CASE WHEN level = 'CRITICAL' THEN 1 END) as critical_count,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN 1 END) as recent_logs
      FROM system_logs`,
      [parseInt(days)]
    );

    // Stats par jour
    const dailyStats = await executeQuery(
      req.dbConnection,
      `SELECT 
        DATE(created_at) as log_date,
        COUNT(*) as count,
        COUNT(CASE WHEN level IN ('ERROR', 'CRITICAL') THEN 1 END) as errors
      FROM system_logs 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY log_date DESC`,
      [parseInt(days)]
    );

    // Top utilisateurs qui génèrent des logs
    const topUsers = await executeQuery(
      req.dbConnection,
      `SELECT 
        u.display_name,
        COUNT(*) as log_count,
        COUNT(CASE WHEN sl.level IN ('ERROR', 'CRITICAL') THEN 1 END) as error_count
      FROM system_logs sl
      JOIN users u ON sl.user_id = u.id
      WHERE sl.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY sl.user_id, u.display_name
      ORDER BY log_count DESC
      LIMIT 10`,
      [parseInt(days)]
    );

    res.json({
      success: true,
      statistics: {
        general: generalStats[0],
        daily: dailyStats,
        top_users: topUsers,
        period_days: parseInt(days)
      }
    });

  } catch (error) {
    console.error('❌ Erreur stats logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques des logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Logs d'erreur récents
 */
router.get('/errors', authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const errorLogs = await executeQuery(
      req.dbConnection,
      `SELECT 
        sl.*,
        u.display_name
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      WHERE sl.level IN ('ERROR', 'CRITICAL')
      ORDER BY sl.created_at DESC
      LIMIT ?`,
      [parseInt(limit)]
    );

    res.json({
      success: true,
      error_logs: errorLogs,
      count: errorLogs.length
    });

  } catch (error) {
    console.error('❌ Erreur récupération logs erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des logs d\'erreur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Nettoyer les anciens logs
 */
router.delete('/cleanup', authenticateToken, async (req, res) => {
  try {
    const { days = 90, level = null } = req.query;

    let query = 'DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)';
    let params = [parseInt(days)];

    if (level && level !== 'all') {
      query += ' AND level = ?';
      params.push(level.toUpperCase());
    }

    const result = await executeQuery(req.dbConnection, query, params);

    console.log(`🧹 Logs nettoyés: ${result.affectedRows} logs supprimés (>${days} jours)`);

    res.json({
      success: true,
      message: `Logs de plus de ${days} jours nettoyés`,
      deleted_logs: result.affectedRows
    });

  } catch (error) {
    console.error('❌ Erreur nettoyage logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage des logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Export des logs
 */
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const { 
      start_date = null, 
      end_date = null, 
      level = null,
      format = 'json'
    } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (start_date) {
      whereConditions.push('created_at >= ?');
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push('created_at <= ?');
      queryParams.push(end_date);
    }

    if (level) {
      whereConditions.push('level = ?');
      queryParams.push(level.toUpperCase());
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const logs = await executeQuery(
      req.dbConnection,
      `SELECT 
        sl.*,
        u.display_name
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      ${whereClause}
      ORDER BY sl.created_at DESC`,
      queryParams
    );

    if (format === 'csv') {
      // Format CSV
      let csv = 'ID,Level,Message,User,IP,Created At\n';
      logs.forEach(log => {
        csv += `${log.id},"${log.level}","${log.message}","${log.display_name || 'System'}","${log.ip_address || ''}","${log.created_at}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="logs-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      // Format JSON
      res.json({
        success: true,
        export_date: new Date().toISOString(),
        filters: {
          start_date,
          end_date,
          level
        },
        logs: logs,
        count: logs.length
      });
    }

  } catch (error) {
    console.error('❌ Erreur export logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export des logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Recherche dans les logs
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { 
      query = '',
      level = null,
      limit = 50
    } = req.query;

    if (!query || query.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'La recherche doit contenir au moins 3 caractères'
      });
    }

    let whereConditions = ['(message LIKE ? OR error_details LIKE ?)'];
    let queryParams = [`%${query}%`, `%${query}%`];

    if (level) {
      whereConditions.push('level = ?');
      queryParams.push(level.toUpperCase());
    }

    queryParams.push(parseInt(limit));

    const searchResults = await executeQuery(
      req.dbConnection,
      `SELECT 
        sl.*,
        u.display_name
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY sl.created_at DESC
      LIMIT ?`,
      queryParams
    );

    res.json({
      success: true,
      search_query: query,
      results: searchResults,
      count: searchResults.length
    });

  } catch (error) {
    console.error('❌ Erreur recherche logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche dans les logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;