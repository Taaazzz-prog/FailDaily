const mysql = require('mysql2/promise');

async function cleanTestAccounts() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '@51008473@Alexia@',
    database: 'faildaily'
  });
  
  console.log('🧹 Suppression des comptes de test...');
  
  // Supprimer tous les utilisateurs avec email contenant e2e ou test.local
  const [testUsers] = await connection.execute(`SELECT id, email FROM users WHERE email LIKE "%e2e%" OR email LIKE "%test.local%" OR email LIKE "%push.%"`);
  
  for (const user of testUsers) {
    console.log('❌ Suppression en cours:', user.email);
    
    // Supprimer toutes les données liées
    await connection.execute('DELETE FROM user_badges WHERE user_id = ?', [user.id]);
    await connection.execute('DELETE FROM fails WHERE user_id = ?', [user.id]);
    await connection.execute('DELETE FROM profiles WHERE user_id = ?', [user.id]);
    await connection.execute('DELETE FROM users WHERE id = ?', [user.id]);
    
    console.log('✅ Supprimé:', user.email);
  }
  
  console.log('✅ Nettoyage terminé');
  await connection.end();
}

cleanTestAccounts().catch(console.error);