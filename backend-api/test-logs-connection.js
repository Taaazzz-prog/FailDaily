// Test direct de la base logs
const mysql = require('mysql2/promise');

const testConnection = async () => {
  const logsDbConfig = {
    host: 'logs_db',
    port: 3306,
    user: 'logs_user',
    password: '@51008473@Alexia@Logs',
    database: 'faildaily_logs',
    charset: 'utf8mb4'
  };

  console.log('🔍 Test connexion base logs...');
  
  try {
    const connection = await mysql.createConnection(logsDbConfig);
    console.log('✅ Connexion établie');
    
    // Test simple
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM activity_logs');
    console.log('📊 Nombre de logs:', rows[0].count);
    
    // Test avec paramètres
    const [logs] = await connection.execute('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?', [3]);
    console.log('📝 Logs récupérés:', logs.length);
    
    await connection.end();
    console.log('✅ Test réussi');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
};

testConnection();