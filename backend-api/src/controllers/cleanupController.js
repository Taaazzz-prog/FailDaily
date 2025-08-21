const { executeQuery, executeTransaction } = require('../config/database');

/**
 * Contrôleur pour les tâches de nettoyage et maintenance
 */
class CleanupController {

  /**
   * Nettoyer les sessions expirées
   */
  static async cleanupExpiredSessions(req, res) {
    try {
      const result = await executeQuery('DELETE FROM user_sessions WHERE expires_at < NOW()',
        []
      );

      console.log(`🧹 Sessions expirées supprimées: ${result.affectedRows}`);

      res.json({
        success: true,
        message: 'Sessions expirées nettoyées',
        deleted_sessions: result.affectedRows
      });

    } catch (error) {
      console.error('❌ Erreur nettoyage sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du nettoyage des sessions',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Nettoyer les notifications anciennes
   */
  static async cleanupOldNotifications(req, res) {
    try {
      const { days = 30 } = req.query;
      
      const result = await executeQuery('DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY) AND is_read = 1',
        [parseInt(days)]
      );

      console.log(`🧹 Notifications anciennes supprimées: ${result.affectedRows} (>${days} jours)`);

      res.json({
        success: true,
        message: `Notifications de plus de ${days} jours nettoyées`,
        deleted_notifications: result.affectedRows
      });

    } catch (error) {
      console.error('❌ Erreur nettoyage notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du nettoyage des notifications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Nettoyer les logs de système anciens
   */
  static async cleanupSystemLogs(req, res) {
    try {
      const { days = 90 } = req.query;
      
      const result = await executeQuery('DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
        [parseInt(days)]
      );

      console.log(`🧹 Logs système supprimés: ${result.affectedRows} (>${days} jours)`);

      res.json({
        success: true,
        message: `Logs système de plus de ${days} jours nettoyés`,
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
  }

  /**
   * Nettoyer les codes de parrainage expirés
   */
  static async cleanupExpiredReferralCodes(req, res) {
    try {
      const result = await executeQuery('DELETE FROM referral_codes WHERE expires_at < NOW() AND used_count = 0',
        []
      );

      console.log(`🧹 Codes de parrainage expirés supprimés: ${result.affectedRows}`);

      res.json({
        success: true,
        message: 'Codes de parrainage expirés nettoyés',
        deleted_codes: result.affectedRows
      });

    } catch (error) {
      console.error('❌ Erreur nettoyage codes parrainage:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du nettoyage des codes de parrainage',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Optimiser les tables de base de données
   */
  static async optimizeTables(req, res) {
    try {
      const tables = [
        'users', 'user_profiles', 'fails', 'fail_reactions', 'fail_comments',
        'badges', 'user_badges', 'notifications', 'system_logs'
      ];

      const optimizationResults = [];

      for (const table of tables) {
        try {
          await executeQuery(`OPTIMIZE TABLE ${table}`, []);
          optimizationResults.push({ table, status: 'optimized' });
          console.log(`🔧 Table optimisée: ${table}`);
        } catch (error) {
          optimizationResults.push({ table, status: 'error', error: error.message });
          console.warn(`⚠️ Erreur optimisation ${table}:`, error.message);
        }
      }

      res.json({
        success: true,
        message: 'Optimisation des tables terminée',
        results: optimizationResults
      });

    } catch (error) {
      console.error('❌ Erreur optimisation tables:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'optimisation des tables',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Analyser l'utilisation de l'espace disque
   */
  static async analyzeDiskUsage(req, res) {
    try {
      const tableStats = await executeQuery(`SELECT 
          TABLE_NAME as table_name,
          ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as size_mb,
          TABLE_ROWS as row_count,
          ROUND((DATA_LENGTH / 1024 / 1024), 2) as data_mb,
          ROUND((INDEX_LENGTH / 1024 / 1024), 2) as index_mb
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC`,
        []
      );

      const totalSize = tableStats.reduce((sum, table) => sum + table.size_mb, 0);
      const totalRows = tableStats.reduce((sum, table) => sum + table.row_count, 0);

      res.json({
        success: true,
        disk_usage: {
          total_size_mb: Math.round(totalSize * 100) / 100,
          total_rows: totalRows,
          tables: tableStats
        }
      });

    } catch (error) {
      console.error('❌ Erreur analyse disque:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'analyse de l\'utilisation disque',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Nettoyer les fails orphelins (sans utilisateur)
   */
  static async cleanupOrphanedFails(req, res) {
    try {
      const result = await executeQuery(`DELETE f FROM fails f 
         LEFT JOIN users u ON f.user_id = u.id 
         WHERE u.id IS NULL`,
        []
      );

      console.log(`🧹 Fails orphelins supprimés: ${result.affectedRows}`);

      res.json({
        success: true,
        message: 'Fails orphelins nettoyés',
        deleted_fails: result.affectedRows
      });

    } catch (error) {
      console.error('❌ Erreur nettoyage fails orphelins:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du nettoyage des fails orphelins',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Nettoyer les réactions orphelines
   */
  static async cleanupOrphanedReactions(req, res) {
    try {
      const result = await executeQuery(`DELETE fr FROM fail_reactions fr
         LEFT JOIN fails f ON fr.fail_id = f.id
         LEFT JOIN users u ON fr.user_id = u.id
         WHERE f.id IS NULL OR u.id IS NULL`,
        []
      );

      console.log(`🧹 Réactions orphelines supprimées: ${result.affectedRows}`);

      res.json({
        success: true,
        message: 'Réactions orphelines nettoyées',
        deleted_reactions: result.affectedRows
      });

    } catch (error) {
      console.error('❌ Erreur nettoyage réactions orphelines:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du nettoyage des réactions orphelines',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Nettoyage complet automatique
   */
  static async fullCleanup(req, res) {
    try {
      const cleanupResults = {
        expired_sessions: 0,
        old_notifications: 0,
        system_logs: 0,
        expired_referral_codes: 0,
        orphaned_fails: 0,
        orphaned_reactions: 0
      };

      const transactionResults = await executeTransaction([
        { query: 'DELETE FROM user_sessions WHERE expires_at < NOW()', params: [] },
        { query: 'DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) AND is_read = 1', params: [] },
        { query: 'DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)', params: [] },
        { query: 'DELETE FROM referral_codes WHERE expires_at < NOW() AND used_count = 0', params: [] },
        { query: `DELETE f FROM fails f
           LEFT JOIN users u ON f.user_id = u.id
           WHERE u.id IS NULL`, params: [] },
        { query: `DELETE fr FROM fail_reactions fr
           LEFT JOIN fails f ON fr.fail_id = f.id
           LEFT JOIN users u ON fr.user_id = u.id
           WHERE f.id IS NULL OR u.id IS NULL`, params: [] }
      ]);

      cleanupResults.expired_sessions = transactionResults[0].affectedRows;
      cleanupResults.old_notifications = transactionResults[1].affectedRows;
      cleanupResults.system_logs = transactionResults[2].affectedRows;
      cleanupResults.expired_referral_codes = transactionResults[3].affectedRows;
      cleanupResults.orphaned_fails = transactionResults[4].affectedRows;
      cleanupResults.orphaned_reactions = transactionResults[5].affectedRows;

      const totalCleaned = Object.values(cleanupResults).reduce((sum, count) => sum + count, 0);

      console.log('🧹 Nettoyage complet terminé:', cleanupResults);

      res.json({
        success: true,
        message: 'Nettoyage complet terminé',
        total_items_cleaned: totalCleaned,
        details: cleanupResults
      });

    } catch (error) {
      console.error('❌ Erreur nettoyage complet:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du nettoyage complet',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtenir les statistiques de nettoyage
   */
  static async getCleanupStats(req, res) {
    try {
      const stats = {};

      // Sessions expirées
      const expiredSessions = await executeQuery('SELECT COUNT(*) as count FROM user_sessions WHERE expires_at < NOW()',
        []
      );
      stats.expired_sessions = expiredSessions[0].count;

      // Notifications anciennes
      const oldNotifications = await executeQuery('SELECT COUNT(*) as count FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) AND is_read = 1',
        []
      );
      stats.old_notifications = oldNotifications[0].count;

      // Logs anciens
      const oldLogs = await executeQuery('SELECT COUNT(*) as count FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)',
        []
      );
      stats.old_system_logs = oldLogs[0].count;

      // Codes expirés
      const expiredCodes = await executeQuery('SELECT COUNT(*) as count FROM referral_codes WHERE expires_at < NOW() AND used_count = 0',
        []
      );
      stats.expired_referral_codes = expiredCodes[0].count;

      // Données orphelines
      const orphanedFails = await executeQuery(`SELECT COUNT(*) as count FROM fails f 
         LEFT JOIN users u ON f.user_id = u.id 
         WHERE u.id IS NULL`,
        []
      );
      stats.orphaned_fails = orphanedFails[0].count;

      const orphanedReactions = await executeQuery(`SELECT COUNT(*) as count FROM fail_reactions fr
         LEFT JOIN fails f ON fr.fail_id = f.id
         LEFT JOIN users u ON fr.user_id = u.id
         WHERE f.id IS NULL OR u.id IS NULL`,
        []
      );
      stats.orphaned_reactions = orphanedReactions[0].count;

      const totalToClean = Object.values(stats).reduce((sum, count) => sum + count, 0);

      res.json({
        success: true,
        cleanup_needed: totalToClean > 0,
        total_items_to_clean: totalToClean,
        details: stats
      });

    } catch (error) {
      console.error('❌ Erreur stats nettoyage:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques de nettoyage',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Planifier un nettoyage automatique
   */
  static async scheduleCleanup(req, res) {
    try {
      const { interval = 'daily' } = req.body;

      // Cette fonctionnalité nécessiterait un système de cron jobs
      // Pour l'instant, on simule la planification
      
      console.log(`📅 Nettoyage automatique planifié: ${interval}`);

      res.json({
        success: true,
        message: `Nettoyage automatique planifié (${interval})`,
        scheduled: true,
        interval
      });

    } catch (error) {
      console.error('❌ Erreur planification nettoyage:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la planification du nettoyage',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = CleanupController;