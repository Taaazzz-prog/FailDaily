const LogsService = require('../services/logsService');
const { v4: uuidv4 } = require('uuid');

/**
 * Insère un log dans la base logs séparée de façon robuste.
 * level: 'info' | 'warning' | 'error' | 'debug'
 * action: courte clé d'action (ex: 'user_register', 'fail_create')
 * message: message humain
 * details: objet libre sérialisé en JSON
 * userId: optionnel, identifiant de l'utilisateur à l'origine
 */
async function logSystem({ level = 'info', action = null, message = '', details = null, userId = null } = {}) {
  try {
    await LogsService.saveLog({
      id: uuidv4(),
      level: String(level || 'info').toLowerCase(),
      message: message || '',
      details: details || {},
      user_id: userId || null,
      action: action || 'unknown',
      ip_address: '',
      user_agent: ''
    });
  } catch (e) {
    // Ne jamais casser le flux applicatif pour un log
    console.warn('logSystem failure:', e?.message);
  }
}

module.exports = { logSystem };

