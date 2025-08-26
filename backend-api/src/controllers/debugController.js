const { executeQuery } = require('../config/database');

/**
 * Contrôleur pour les fonctions de debug et diagnostic
 */
class DebugController {

  /**
   * Test de connexion à la base de données
   */
  static async testDatabaseConnection(req, res) {
    try {
      const startTime = Date.now();
      
      const result = await executeQuery(
        req.dbConnection,
        'SELECT 1 as test, NOW() as server_time, VERSION() as mysql_version',
        []
      );

      const responseTime = Date.now() - startTime;

      console.log('🔍 Test connexion DB réussi:', result[0]);

      res.json({
        success: true,
        message: 'Connexion base de données OK',
        database_info: {
          server_time: result[0].server_time,
          mysql_version: result[0].mysql_version,
          response_time_ms: responseTime
        }
      });

    } catch (error) {
      console.error('❌ Erreur test connexion DB:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur de connexion à la base de données',
        error: error.message
      });
    }
  }

  /**
   * Informations sur les tables de la base
   */
  static async getDatabaseInfo(req, res) {
    try {
      const tables = await executeQuery(
        req.dbConnection,
        `SELECT 
          TABLE_NAME,
          TABLE_ROWS,
          ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'SIZE_MB',
          CREATE_TIME
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME`,
        []
      );

      const dbInfo = await executeQuery(
        req.dbConnection,
        `SELECT 
          SCHEMA_NAME as database_name,
          DEFAULT_CHARACTER_SET_NAME as charset,
          DEFAULT_COLLATION_NAME as collation
        FROM information_schema.SCHEMATA 
        WHERE SCHEMA_NAME = DATABASE()`,
        []
      );

      res.json({
        success: true,
        database_info: dbInfo[0],
        tables: tables,
        total_tables: tables.length
      });

    } catch (error) {
      console.error('❌ Erreur info DB:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des informations de la base',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Statistiques détaillées du système
   */
  static async getSystemStats(req, res) {
    try {
      const stats = {};

      // Statistiques utilisateurs
      const userStats = await executeQuery(
        req.dbConnection,
        `SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN email_confirmed = 1 THEN 1 END) as verified_users,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as users_24h,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as users_7d,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as users_30d
        FROM users`,
        []
      );
      stats.users = userStats[0];

      // Statistiques fails
      const failStats = await executeQuery(
        req.dbConnection,
        `SELECT 
          COUNT(*) as total_fails,
          COUNT(CASE WHEN is_anonyme = 0 THEN 1 END) as public_fails,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as fails_24h,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as fails_7d,
          AVG(view_count) as avg_views
        FROM fails`,
        []
      );
      stats.fails = failStats[0];

      // Statistiques réactions
      const reactionStats = await executeQuery(
        req.dbConnection,
        `SELECT 
          COUNT(*) as total_reactions,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as reactions_24h,
          COUNT(DISTINCT user_id) as users_who_reacted,
          COUNT(DISTINCT fail_id) as fails_with_reactions
        FROM fail_reactions`,
        []
      );
      stats.reactions = reactionStats[0];

      // Statistiques badges
      const badgeStats = await executeQuery(
        req.dbConnection,
        `SELECT 
          COUNT(DISTINCT b.id) as total_badges,
          COUNT(ub.id) as total_earned,
          COUNT(CASE WHEN ub.earned_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as earned_24h
        FROM badges b
        LEFT JOIN user_badges ub ON b.id = ub.badge_id`,
        []
      );
      stats.badges = badgeStats[0];

      // Performance de la base
      const performanceStats = await executeQuery(
        req.dbConnection,
        `SHOW STATUS WHERE Variable_name IN (
          'Connections', 'Threads_connected', 'Uptime', 
          'Questions', 'Slow_queries', 'Table_locks_waited'
        )`,
        []
      );

      const performance = {};
      performanceStats.forEach(stat => {
        performance[stat.Variable_name.toLowerCase()] = stat.Value;
      });
      stats.performance = performance;

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        system_stats: stats
      });

    } catch (error) {
      console.error('❌ Erreur stats système:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques système',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Logs d'erreurs récents
   */
  static async getErrorLogs(req, res) {
    try {
      const { limit = 50 } = req.query;

      const errors = await executeQuery(
        req.dbConnection,
        `SELECT 
          level, message, error_details, user_id, ip_address, 
          user_agent, created_at
        FROM system_logs 
        WHERE level IN ('ERROR', 'CRITICAL')
        ORDER BY created_at DESC 
        LIMIT ?`,
        [parseInt(limit)]
      );

      const errorSummary = await executeQuery(
        req.dbConnection,
        `SELECT 
          level,
          COUNT(*) as count,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as count_24h
        FROM system_logs 
        WHERE level IN ('ERROR', 'CRITICAL')
        GROUP BY level`,
        []
      );

      res.json({
        success: true,
        error_logs: errors,
        summary: errorSummary,
        total_errors: errors.length
      });

    } catch (error) {
      console.error('❌ Erreur récupération logs:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des logs d\'erreur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Test des fonctionnalités principales
   */
  static async runHealthCheck(req, res) {
    try {
      const healthChecks = {
        database_connection: false,
        user_table_access: false,
        fail_table_access: false,
        authentication_ready: false,
        badges_system: false
      };

      const issues = [];

      // Test connexion DB
      try {
        await executeQuery(req.dbConnection, 'SELECT 1', []);
        healthChecks.database_connection = true;
      } catch (error) {
        issues.push('Connexion base de données échouée');
      }

      // Test table users
      try {
        await executeQuery(req.dbConnection, 'SELECT COUNT(*) FROM users LIMIT 1', []);
        healthChecks.user_table_access = true;
      } catch (error) {
        issues.push('Accès table users échoué');
      }

      // Test table fails
      try {
        await executeQuery(req.dbConnection, 'SELECT COUNT(*) FROM fails LIMIT 1', []);
        healthChecks.fail_table_access = true;
      } catch (error) {
        issues.push('Accès table fails échoué');
      }

      // Test système d'authentification
      try {
        const jwt = require('jsonwebtoken');
        const testToken = jwt.sign({ test: true }, process.env.JWT_SECRET || 'fallback-secret');
        jwt.verify(testToken, process.env.JWT_SECRET || 'fallback-secret');
        healthChecks.authentication_ready = true;
      } catch (error) {
        issues.push('Système d\'authentification non configuré');
      }

      // Test système de badges
      try {
        await executeQuery(req.dbConnection, 'SELECT COUNT(*) FROM badges LIMIT 1', []);
        healthChecks.badges_system = true;
      } catch (error) {
        issues.push('Système de badges non accessible');
      }

      const allHealthy = Object.values(healthChecks).every(check => check === true);

      res.json({
        success: true,
        overall_health: allHealthy ? 'healthy' : 'issues_detected',
        health_checks: healthChecks,
        issues: issues,
        checked_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erreur health check:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du health check',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Informations sur l'environnement serveur
   */
  static async getServerInfo(req, res) {
    try {
      const serverInfo = {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime_seconds: Math.floor(process.uptime()),
        memory_usage: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid
      };

      // Informations sur les variables d'environnement (sécurisées)
      const envVars = {
        has_jwt_secret: !!process.env.JWT_SECRET,
        has_db_config: !!(process.env.DB_HOST || process.env.DATABASE_URL),
        node_env: process.env.NODE_ENV,
        port: process.env.PORT || 3001
      };

      res.json({
        success: true,
        server_info: serverInfo,
        environment_vars: envVars,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erreur info serveur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des informations serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Test de charge simple
   */
  static async performLoadTest(req, res) {
    try {
      const { queries = 10 } = req.query;
      const results = [];
      const startTime = Date.now();

      for (let i = 0; i < parseInt(queries); i++) {
        const queryStart = Date.now();
        await executeQuery(req.dbConnection, 'SELECT SLEEP(0.001), ? as query_num', [i + 1]);
        const queryTime = Date.now() - queryStart;
        results.push(queryTime);
      }

      const totalTime = Date.now() - startTime;
      const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;
      const maxTime = Math.max(...results);
      const minTime = Math.min(...results);

      res.json({
        success: true,
        load_test: {
          queries_executed: parseInt(queries),
          total_time_ms: totalTime,
          average_query_time_ms: Math.round(avgTime * 100) / 100,
          max_query_time_ms: maxTime,
          min_query_time_ms: minTime,
          queries_per_second: Math.round((parseInt(queries) / totalTime) * 1000 * 100) / 100
        }
      });

    } catch (error) {
      console.error('❌ Erreur test de charge:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du test de charge',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Nettoyage des logs de debug
   */
  static async clearDebugLogs(req, res) {
    try {
      const result = await executeQuery(
        req.dbConnection,
        'DELETE FROM system_logs WHERE level = "DEBUG" AND created_at < DATE_SUB(NOW(), INTERVAL 1 DAY)',
        []
      );

      console.log(`🧹 Logs de debug nettoyés: ${result.affectedRows}`);

      res.json({
        success: true,
        message: 'Logs de debug nettoyés',
        deleted_logs: result.affectedRows
      });

    } catch (error) {
      console.error('❌ Erreur nettoyage logs debug:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du nettoyage des logs de debug',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = DebugController;
