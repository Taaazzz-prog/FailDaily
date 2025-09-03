const mysql = require('mysql2/promise');
require('dotenv').config();

async function testModerationStatus() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'faildaily',
    charset: 'utf8mb4'
  });

  try {
    console.log('🔍 État actuel de la modération des fails:');
    
    // Récupérer tous les fails avec leur statut de modération
    const [fails] = await connection.execute(`
      SELECT 
        f.id, 
        f.title, 
        f.created_at,
        fm.status AS moderation_status,
        CASE 
          WHEN fm.status IS NULL THEN 'Pas de modération'
          WHEN fm.status = 'under_review' THEN 'En cours de modération'
          WHEN fm.status = 'approved' THEN 'Approuvé'
          WHEN fm.status = 'hidden' THEN 'Caché'
          ELSE 'Statut inconnu'
        END AS status_description
      FROM fails f
      LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
      ORDER BY f.created_at DESC
      LIMIT 10
    `);

    console.table(fails);

    // Compter les différents statuts
    const [counts] = await connection.execute(`
      SELECT 
        CASE 
          WHEN fm.status IS NULL THEN 'no_moderation'
          ELSE fm.status
        END AS status,
        COUNT(*) as count
      FROM fails f
      LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
      GROUP BY CASE 
        WHEN fm.status IS NULL THEN 'no_moderation'
        ELSE fm.status
      END
    `);

    console.log('\n📊 Répartition des statuts de modération:');
    console.table(counts);

    // Vérifier s'il y a des signalements
    const [reports] = await connection.execute(`
      SELECT COUNT(*) as total_reports FROM fail_reports
    `);

    console.log(`\n📢 Nombre total de signalements: ${reports[0].total_reports}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await connection.end();
  }
}

testModerationStatus();
