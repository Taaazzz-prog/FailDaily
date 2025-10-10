// Configuration connexion base de données logs séparée
const mysql = require('mysql2/promise');

// Configuration base logs
const logsDbConfig = {
  host: process.env.LOGS_DB_HOST || 'localhost',
  port: process.env.LOGS_DB_PORT || 3309,
  user: process.env.LOGS_DB_USER || 'logs_user', 
  password: process.env.LOGS_DB_PASSWORD || '@51008473@Alexia@Logs',
  database: process.env.LOGS_DB_NAME || 'faildaily_logs',
  charset: 'utf8mb4',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  supportBigNumbers: true,
  bigNumberStrings: true
};

// Pool de connexions dédié aux logs
const logsPool = mysql.createPool(logsDbConfig);

// Test de connexion
const testLogsConnection = async () => {
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