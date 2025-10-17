// Configuration connexion base de données logs séparée
const mysql = require('mysql2/promise');

const LOGS_DB_DISABLED =
  String(process.env.LOGS_DB_DISABLED || '').toLowerCase() === 'true' ||
  process.env.NODE_ENV === 'test';

let logsDbConfig = null;
let logsPool = null;

if (!LOGS_DB_DISABLED) {
  const REQUIRED_ENV = [
    'LOGS_DB_HOST',
    'LOGS_DB_PORT',
    'LOGS_DB_USER',
    'LOGS_DB_PASSWORD',
    'LOGS_DB_NAME'
  ];

  const missing = REQUIRED_ENV.filter(
    (key) => !process.env[key] || String(process.env[key]).trim() === ''
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing logs database configuration: ${missing.join(', ')}. Please set them in your environment.`
    );
  }

  const logsDbPort = Number(process.env.LOGS_DB_PORT);
  if (!Number.isFinite(logsDbPort)) {
    throw new Error('LOGS_DB_PORT must be a valid number.');
  }

  // Configuration base logs
  logsDbConfig = {
    host: process.env.LOGS_DB_HOST,
    port: logsDbPort,
    user: process.env.LOGS_DB_USER,
    password: process.env.LOGS_DB_PASSWORD,
    database: process.env.LOGS_DB_NAME,
    charset: 'utf8mb4',
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    supportBigNumbers: true,
    bigNumberStrings: true
  };

  // Pool de connexions dédié aux logs
  logsPool = mysql.createPool(logsDbConfig);
} else {
  console.warn('⚠️ Logs database disabled (LOGS_DB_DISABLED=true or NODE_ENV=test). Using fallback logging.');
}

// Test de connexion
const testLogsConnection = async () => {
  if (!logsPool) {
    console.warn('⚠️ testLogsConnection: logs database disabled, skipping connection attempt.');
    return false;
  }
  try {
    const connection = await logsPool.getConnection();
    console.log('✅ Connexion base logs réussie:', logsDbConfig.host);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur connexion base logs:', error.message);
    return false;
  }
};

module.exports = { 
  logsPool, 
  testLogsConnection,
  logsDbConfig
};
