const mysql = require('mysql2/promise');

async function checkModerationStatus() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '@51008473@Alexia@',
    database: 'faildaily'
  });

  try {
    console.log('📊 Vérification des statuts de modération des fails...\n');
    
    // Vérifier les fails et leur statut de modération
    const [fails] = await connection.execute(`
      SELECT f.id, f.title, f.created_at, fm.status as moderation_status
      FROM fails f
      LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
      ORDER BY f.created_at DESC
      LIMIT 10
    `);
    
    console.log('Fails et leur statut de modération:');
    fails.forEach(fail => {
      console.log(`- ${fail.id}: "${fail.title}" -> Modération: ${fail.moderation_status || 'NULL'}`);
    });
    
    console.log('\n📊 Statistiques des statuts:');
    const [stats] = await connection.execute(`
      SELECT fm.status, COUNT(*) as count
      FROM fails f
      LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
      GROUP BY fm.status
    `);
    
    stats.forEach(stat => {
      console.log(`- ${stat.status || 'NULL'}: ${stat.count} fails`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await connection.end();
  }
}

checkModerationStatus();
