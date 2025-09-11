const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'faildaily'
};

async function checkFails() {
  try {
    const connection = await mysql.createConnection(config);
    
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM fails');
    console.log('🔍 Nombre de fails dans la base:', rows[0].count);
    
    const [recent] = await connection.execute('SELECT id, title, created_at FROM fails ORDER BY created_at DESC LIMIT 5');
    console.log('📋 Derniers fails:');
    recent.forEach(fail => {
      console.log(`- ${fail.title} (${fail.created_at})`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkFails();
