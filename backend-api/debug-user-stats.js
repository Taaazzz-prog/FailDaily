const { executeQuery } = require('./src/config/database');

async function testUserStats() {
  try {
    const userId = 'e10fbd52-b906-4504-8e13-7c7b7c451afa';
    console.log('🧪 Test des statistiques utilisateur pour:', userId);
    
    // Test simple d'abord
    const userExists = await executeQuery('SELECT id FROM users WHERE id = ?', [userId]);
    console.log('👤 Utilisateur existe:', userExists.length > 0);
    
    if (userExists.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    // Test requête complexe
    const stats = await executeQuery(`
      SELECT 
        u.id,
        COALESCE(up.points_total, 0) as courage_points,
        COALESCE(p.streak, 0) as streak,
        COALESCE(fail_stats.total_fails, 0) as total_fails,
        COALESCE(badge_stats.total_badges, 0) as total_badges,
        COALESCE(reactions_given.total_reactions_given, 0) as total_reactions_given,
        COALESCE(reactions_received.total_reactions_received, 0) as total_reactions_received,
        DATE(u.created_at) as join_date
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN user_points up ON up.user_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as total_fails
        FROM fails 
        WHERE user_id = ?
        GROUP BY user_id
      ) fail_stats ON u.id = fail_stats.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as total_badges
        FROM badges 
        WHERE user_id = ?
        GROUP BY user_id
      ) badge_stats ON u.id = badge_stats.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as total_reactions_given
        FROM reactions 
        WHERE user_id = ?
        GROUP BY user_id
      ) reactions_given ON u.id = reactions_given.user_id
      LEFT JOIN (
        SELECT 
          f.user_id,
          COUNT(r.id) as total_reactions_received
        FROM fails f
        LEFT JOIN reactions r ON f.id = r.fail_id
        WHERE f.user_id = ?
        GROUP BY f.user_id
      ) reactions_received ON u.id = reactions_received.user_id
      WHERE u.id = ?
    `, [userId, userId, userId, userId, userId]);
    
    console.log('✅ Statistiques récupérées:', stats[0]);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    process.exit();
  }
}

testUserStats();
