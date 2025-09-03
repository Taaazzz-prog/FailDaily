const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkBadgeDefinitions() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'faildaily',
      charset: 'utf8mb4'
    });

    console.log('🏆 Analyse des badges dans la base de données...');

    // 1. Lister tous les badges définis
    const [badges] = await connection.execute(`
      SELECT id, name, description, requirement_type, requirement_value, rarity
      FROM badge_definitions 
      WHERE requirement_type = 'fails_count'
      ORDER BY requirement_value ASC
    `);

    console.log('\n📋 Badges pour nombre de fails:');
    badges.forEach(badge => {
      console.log(`   ${badge.requirement_value} fails → "${badge.name}" (${badge.rarity})`);
      console.log(`      Description: ${badge.description}`);
      console.log(`      ID: ${badge.id}\n`);
    });

    // 2. Compter combien d'utilisateurs ont chaque badge
    console.log('📊 Attribution des badges:');
    for (const badge of badges) {
      const [userCount] = await connection.execute(`
        SELECT COUNT(*) as count FROM user_badges WHERE badge_id = ?
      `, [badge.id]);
      
      console.log(`   "${badge.name}": ${userCount[0].count} utilisateurs`);
    }

    // 3. Vérifier les fails créés récemment
    console.log('\n📝 Fails créés récemment:');
    const [recentFails] = await connection.execute(`
      SELECT u.id as user_id, p.display_name, COUNT(f.id) as fail_count
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      LEFT JOIN fails f ON u.id = f.user_id
      WHERE f.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      GROUP BY u.id, p.display_name
      ORDER BY fail_count DESC
    `);

    recentFails.forEach(user => {
      console.log(`   ${user.display_name}: ${user.fail_count} fails`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkBadgeDefinitions();
