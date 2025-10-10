// Helper pour migrer tous les logs vers la base séparée
const LogsService = require('../services/logsService');
const { v4: uuidv4 } = require('uuid');

/**
 * Fonction helper pour remplacer les INSERT INTO system_logs
 * Cette fonction reproduit exactement la signature de l'ancien système
 */
async function logToSeparateDatabase(level, message, details, userId, action, req = null) {
  try {
    await LogsService.saveLog({
      id: uuidv4(),
      level: level || 'info',
      message: message || '',
      details: typeof details === 'string' ? JSON.parse(details) : (details || {}),
      user_id: userId || null,
      action: action || 'unknown',
      ip_address: req?.ip || '',
      user_agent: req?.get('User-Agent') || ''
    });
  } catch (error) {
    console.warn('🚨 Erreur log vers base séparée:', error.message);
  }
}

/**
 * Fonction helper pour remplacer executeQuery avec system_logs
 */
async function replaceSystemLogsQuery(query, params, req = null) {
  // Extraire les paramètres de l'ancienne requête
  const [level, message, details, userId, action] = params;
  
  await logToSeparateDatabase(level, message, details, userId, action, req);
}

module.exports = {
  logToSeparateDatabase,
  replaceSystemLogsQuery
};