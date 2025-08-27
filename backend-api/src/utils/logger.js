const { executeQuery } = require('../config/database');

/**
 * Insère un log dans system_logs de façon robuste.
 * level: 'info' | 'warning' | 'error' | 'debug'
 * action: courte clé d'action (ex: 'user_register', 'fail_create')
 * message: message humain
 * details: objet libre sérialisé en JSON
 * userId: optionnel, identifiant de l'utilisateur à l'origine
 */
async function logSystem({ level = 'info', action = null, message = '', details = null, userId = null } = {}) {
  try {
    await executeQuery(
      `INSERT INTO system_logs (id, level, message, details, user_id, action, created_at)
       VALUES (UUID(), ?, ?, ?, ?, ?, NOW())`,
      [String(level || 'info').toLowerCase(), message || '', details ? JSON.stringify(details) : null, userId || null, action || null]
    );
  } catch (e) {
    // Ne jamais casser le flux applicatif pour un log
    // eslint-disable-next-line no-console
    console.warn('logSystem failure:', e?.message);
  }
}

module.exports = { logSystem };

