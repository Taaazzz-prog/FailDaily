// Service de gestion des logs avec base de données séparée
const { logsPool } = require('../config/database-logs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

class LogsService {
  
  /**
   * Sauvegarde un log dans la base dédiée
   */
  static async saveLog(logData) {
    const logId = logData.id || uuidv4();
    
    const query = `
      INSERT INTO activity_logs 
      (id, level, message, details, user_id, action, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    try {
      if (!logsPool) {
        console.warn('⚠️ Logs database disabled, writing log to fallback file only.');
        await this.saveToFile({ ...logData, id: logId });
        return logId;
      }

      const params = [
        logId,
        String(logData.level || 'info'),
        String(logData.message || ''),
        logData.details ? JSON.stringify(logData.details) : null,
        logData.user_id || null,
        String(logData.action || 'unknown'),
        String(logData.ip_address || ''),
        String(logData.user_agent || '')
      ];
      
      await logsPool.execute(query, params);
      
      console.log(`📝 Log sauvé [${logData.level}] ${logData.action}: ${logData.message}`);
      return logId;
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde log en base:', error);
      
      // Fallback vers fichier si base logs indisponible
      await this.saveToFile(logData);
      throw error;
    }
  }
  
  /**
   * Fallback : sauvegarde dans un fichier
   */
  static async saveToFile(logData) {
    try {
      const logsDir = path.join(__dirname, '../../logs');
      await fs.mkdir(logsDir, { recursive: true });
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: logData.level,
        action: logData.action,
        message: logData.message,
        details: logData.details,
        user_id: logData.user_id,
        ip_address: logData.ip_address
      };
      
      const logFile = path.join(logsDir, `fallback-${new Date().toISOString().split('T')[0]}.log`);
      await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
      
      console.log('📁 Log sauvé en fallback fichier');
      
    } catch (fileError) {
      console.error('❌ Erreur sauvegarde fallback:', fileError);
    }
  }
  
  /**
   * Récupération des logs avec filtres
   */
  static async getLogs(filters = {}) {
    if (!logsPool) {
      console.warn('⚠️ Logs database disabled, returning empty logs list.');
      return [];
    }

    const { 
      limit = 50, 
      offset = 0, 
      level, 
      action, 
      userId, 
      dateFrom, 
      dateTo 
    } = filters;
    
    let query = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = [];
    
    if (level) {
      query += ' AND level = ?';
      params.push(level);
    }
    
    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }
    
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    if (dateFrom) {
      query += ' AND created_at >= ?';
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ' AND created_at <= ?';
      params.push(dateTo);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    try {
      const [rows] = await logsPool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('❌ Erreur récupération logs:', error);
      throw error;
    }
  }
  
  /**
   * Statistiques des logs
   */
  static async getLogStats(period = '24h') {
    if (!logsPool) {
      console.warn('⚠️ Logs database disabled, no stats available.');
      return [];
    }

    let timeCondition = '';
    
    switch (period) {
      case '1h':
        timeCondition = 'created_at >= NOW() - INTERVAL 1 HOUR';
        break;
      case '24h':
        timeCondition = 'created_at >= NOW() - INTERVAL 1 DAY';
        break;
      case '7d':
        timeCondition = 'created_at >= NOW() - INTERVAL 7 DAY';
        break;
      default:
        timeCondition = 'created_at >= NOW() - INTERVAL 1 DAY';
    }
    
    const query = `
      SELECT 
        level,
        action,
        COUNT(*) as count
      FROM activity_logs 
      WHERE ${timeCondition}
      GROUP BY level, action
      ORDER BY count DESC
    `;
    
    try {
      const [rows] = await logsPool.execute(query, []);
      return rows;
    } catch (error) {
      console.error('❌ Erreur stats logs:', error);
      throw error;
    }
  }
  
  /**
   * Nettoyage des logs anciens
   */
  static async cleanOldLogs(retentionDays = 90) {
    if (!logsPool) {
      console.warn('⚠️ Logs database disabled, nothing to clean.');
      return 0;
    }

    const query = `
      DELETE FROM activity_logs 
      WHERE created_at < NOW() - INTERVAL ? DAY
    `;
    
    try {
      const [result] = await logsPool.execute(query, [retentionDays]);
      console.log(`🗑️ ${result.affectedRows} logs supprimés (> ${retentionDays} jours)`);
      return result.affectedRows;
    } catch (error) {
      console.error('❌ Erreur nettoyage logs:', error);
      throw error;
    }
  }

  /**
   * Migration des logs existants vers la nouvelle base
   */
  static async migrateLogs(sourcePool) {
    if (!logsPool) {
      console.warn('⚠️ Logs database disabled, migration skipped.');
      return { migrated: 0 };
    }

    try {
      console.log('🔄 Début migration logs...');
      
      // Récupérer logs de l'ancienne base
      const [oldLogs] = await sourcePool.execute(
        'SELECT * FROM activity_logs ORDER BY created_at DESC'
      );
      
      let migrated = 0;
      
      for (const log of oldLogs) {
        try {
          await this.saveLog({
            id: log.id,
            level: log.level,
            message: log.message,
            details: JSON.parse(log.details || '{}'),
            user_id: log.user_id,
            action: log.action,
            ip_address: log.ip_address,
            user_agent: log.user_agent
          });
          migrated++;
        } catch (error) {
          console.error(`❌ Erreur migration log ${log.id}:`, error);
        }
      }
      
      console.log(`✅ Migration terminée: ${migrated}/${oldLogs.length} logs migrés`);
      return migrated;
      
    } catch (error) {
      console.error('❌ Erreur migration logs:', error);
      throw error;
    }
  }
}

module.exports = LogsService;
