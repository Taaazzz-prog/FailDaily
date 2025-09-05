const mysql = require('mysql2/promise');

async function debugModerationIssue() {
  let connection;
  
  try {
    // Configuration de connexion à MySQL
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'faildaily_user',
      password: '@51008473@Alexia@',
      database: 'faildaily'
    });

    console.log('🔌 Connexion à MySQL établie');

    // 1. Vérifier les fails avec leur statut de modération
    console.log('\n📋 État des fails et de leur modération:');
    const [failsWithModeration] = await connection.execute(`
      SELECT f.id, f.title, f.created_at, fm.status as moderation_status
      FROM fails f 
      LEFT JOIN fail_moderation fm ON f.id = fm.fail_id 
      ORDER BY f.created_at DESC 
      LIMIT 10
    `);
    
    failsWithModeration.forEach(fail => {
      console.log(`  - ${fail.title} (${fail.id.substring(0,8)}...): ${fail.moderation_status || 'NULL'}`);
    });

    // 2. Compter les fails avec chaque statut
    console.log('\n📊 Statistiques des statuts de modération:');
    const [moderationStats] = await connection.execute(`
      SELECT 
        fm.status, 
        COUNT(*) as count
      FROM fail_moderation fm
      GROUP BY fm.status
    `);
    
    moderationStats.forEach(stat => {
      console.log(`  - ${stat.status}: ${stat.count} fails`);
    });

    // 3. Vérifier les fails sans entrée de modération
    const [failsWithoutModeration] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM fails f 
      LEFT JOIN fail_moderation fm ON f.id = fm.fail_id 
      WHERE fm.fail_id IS NULL
    `);
    console.log(`  - Fails sans modération: ${failsWithoutModeration[0].count}`);

    // 4. Voir un exemple de données retournées par la requête getFailById
    console.log('\n🔍 Exemple de données retournées par getFailById:');
    const [exampleFail] = await connection.execute(`
      SELECT
        f.*,
        fm.status AS moderation_status
      FROM fails f
      LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
      ORDER BY f.created_at DESC
      LIMIT 1
    `);
    
    if (exampleFail.length > 0) {
      const fail = exampleFail[0];
      console.log(`  Fail ID: ${fail.id}`);
      console.log(`  Titre: ${fail.title}`);
      console.log(`  moderation_status: ${fail.moderation_status || 'NULL'}`);
      console.log(`  Créé le: ${fail.created_at}`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

debugModerationIssue();
