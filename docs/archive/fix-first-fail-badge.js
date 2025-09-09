// Script simple pour attribuer le badge du premier fail
console.log('🔧 Attribution du badge Premier Fail...');

const mysql = require('mysql2/promise');

async function fixFirstFailBadge() {
  let connection;
  
  try {
    // Connexion avec les bonnes infos (récupérées du backend)
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '@51008473@Alexia@',
      database: 'faildaily'
    });
    
    console.log('✅ Connexion réussie');
    
    const userId = '9f92d99e-5f70-427e-aebd-68ca8b727bd4'; // Votre ID
    
    // 1. Vérifier le nombre de fails
    const [failCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM fails WHERE user_id = ?',
      [userId]
    );
    
    console.log(`📊 Vous avez ${failCount[0].count} fails`);
    
    if (failCount[0].count === 0) {
      console.log('❌ Aucun fail trouvé, pas de badge à attribuer');
      return;
    }
    
    // 2. Trouver le badge "first-fail" 
    const [badge] = await connection.execute(
      'SELECT id, name FROM badge_definitions WHERE requirement_type = ? AND requirement_value = ?',
      ['fail_count', 1]
    );
    
    if (badge.length === 0) {
      console.log('❌ Badge "Premier Fail" non trouvé dans badge_definitions');
      return;
    }
    
    const badgeId = badge[0].id;
    const badgeName = badge[0].name;
    console.log(`🏆 Badge trouvé: ${badgeName} (ID: ${badgeId})`);
    
    // 3. Vérifier si l'utilisateur a déjà ce badge
    const [existingBadge] = await connection.execute(
      'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?',
      [userId, badgeId]
    );
    
    if (existingBadge.length > 0) {
      console.log('ℹ️ Vous avez déjà ce badge');
      return;
    }
    
    // 4. Attribuer le badge
    const { v4: uuidv4 } = require('uuid');
    const userBadgeId = uuidv4();
    
    await connection.execute(
      'INSERT INTO user_badges (id, user_id, badge_id, unlocked_at, created_at) VALUES (?, ?, ?, NOW(), NOW())',
      [userBadgeId, userId, badgeId]
    );
    
    console.log(`🎉 Badge "${badgeName}" attribué avec succès !`);
    console.log(`🆔 ID user_badge: ${userBadgeId}`);
    
    // 5. Vérifier l'attribution
    const [verification] = await connection.execute(
      'SELECT COUNT(*) as count FROM user_badges WHERE user_id = ?',
      [userId]
    );
    
    console.log(`✅ Vous avez maintenant ${verification[0].count} badge(s) au total`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixFirstFailBadge();
