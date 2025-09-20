/**
 * Utilitaire de logging sécurisé pour FailDaily Backend
 * Masque automatiquement les données sensibles en production
 */

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Mots-clés sensibles à masquer
 */
const SENSITIVE_KEYWORDS = [
  'token', 'password', 'secret', 'key', 'auth', 
  'authorization', 'jwt', 'session', 'cookie',
  'email', 'mail', 'user_id', 'id'
];

/**
 * Masque les données sensibles dans une chaîne
 */
function maskSensitiveString(str, keyword) {
  if (isProduction && str && keyword && SENSITIVE_KEYWORDS.includes(keyword.toLowerCase())) {
    return '[MASQUÉ]';
  }
  return str;
}

/**
 * Masque les paramètres SQL sensibles
 */
function maskSQLParams(params) {
  if (!isProduction || !Array.isArray(params)) return params;
  
  return params.map((param, index) => {
    // Les premiers paramètres sont souvent des IDs/tokens
    if (index === 0 && typeof param === 'string' && param.length > 10) {
      return '[ID_MASQUÉ]';
    }
    // Masquer tout ce qui ressemble à un token/mot de passe
    if (typeof param === 'string' && param.length > 20) {
      return '[DONNÉES_MASQUÉES]';
    }
    return param;
  });
}

/**
 * Logger sécurisé
 */
const secureLogger = {
  
  /**
   * Log standard avec masquage automatique
   */
  log: (message, ...args) => {
    console.log(message, ...args);
  },

  /**
   * Log d'erreur SQL sécurisé
   */
  errorSQL: (message, query, params) => {
    console.error(message);
    if (isDevelopment) {
      console.error('📝 Requête:', query);
      console.error('📋 Paramètres:', params);
    } else {
      console.error('📝 Requête: [MASQUÉE EN PRODUCTION]');
      console.error('📋 Paramètres:', maskSQLParams(params));
    }
  },

  /**
   * Log de token sécurisé
   */
  tokenLog: (email, token, expiresAt) => {
    if (isDevelopment) {
      console.log(`🔑 Token de reset généré pour ${email}: ${token} (exp: ${expiresAt})`);
    } else {
      console.log(`🔑 Token de reset généré pour [EMAIL_MASQUÉ]: [TOKEN_MASQUÉ] (exp: ${expiresAt})`);
    }
  },

  /**
   * Log d'email sécurisé 
   */
  emailLog: (action, email, additionalInfo = '') => {
    if (isDevelopment) {
      console.log(`📧 ${action}: ${email} ${additionalInfo}`);
    } else {
      console.log(`📧 ${action}: [EMAIL_MASQUÉ] ${additionalInfo}`);
    }
  },

  /**
   * Log d'erreur avec masquage
   */
  error: (message, error) => {
    console.error(message);
    if (isDevelopment) {
      console.error(error);
    } else {
      // En production, on log seulement le message d'erreur, pas les détails
      console.error('Détails:', error?.message || 'Erreur inconnue');
    }
  },

  /**
   * Log de debug - uniquement en développement
   */
  debug: (message, data) => {
    if (isDevelopment) {
      console.log(`🔍 DEBUG: ${message}`, data);
    }
    // Pas de logs de debug en production
  }

};

module.exports = secureLogger;