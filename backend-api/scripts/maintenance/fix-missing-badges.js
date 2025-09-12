// Script pour attribuer rétroactivement les badges manquants
const { executeQuery } = require('./src/config/database');

async function fixMissingBadges() {
  console.log('🔧 Attribution rétroactive des badges...');
  
  try {
    // Récupérer tous les utilisateurs avec des fails
    const users = await executeQuery(`
      SELECT u.id, u.email, COUNT(f.id) as fail_count 
      FROM users u 
      LEFT JOIN fails f ON u.id = f.user_id 
      GROUP BY u.id, u.email 
      HAVING fail_count > 0
    `);
    
    console.log(`👥 ${users.length} utilisateurs avec des fails trouvés`);
    
    for (const user of users) {
      console.log(`\n👤 Traitement utilisateur: ${user.email} (${user.fail_count} fails)`);
      
      // Vérifier chaque badge potentiel
      const badgestoCheck = [
        { requirement_type: 'fails_count', requirement_value: 1 },
        { requirement_type: 'fails_count', requirement_value: 5 },
        { requirement_type: 'fails_count', requirement_value: 10 },
        { requirement_type: 'fails_count', requirement_value: 25 },
        { requirement_type: 'fails_count', requirement_value: 50 }
      ];
      
      for (const badgeCheck of badgestoCheck) {
        if (user.fail_count >= badgeCheck.requirement_value) {
          await awardBadgeIfNotExists(user.id, badgeCheck.requirement_type, badgeCheck.requirement_value);
        }
      }
    }
    
    console.log('\n✅ Attribution rétroactive terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

async function awardBadgeIfNotExists(userId, requirementType, requirementValue) {
  try {
    // Trouver le badge correspondant
    const badge = await executeQuery(
      'SELECT id, name FROM badge_definitions WHERE requirement_type = ? AND requirement_value = ?',
      [requirementType, requirementValue]
    );
    
    if (badge.length === 0) {
      console.log(`   ⚠️ Aucun badge trouvé pour ${requirementType}:${requirementValue}`);
      return;
    }
    
    const badgeId = badge[0].id;
    const badgeName = badge[0].name;
    
    // Vérifier si l'utilisateur a déjà ce badge
    const existingBadge = await executeQuery(
      'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?',
      [userId, badgeId]
    );
    
    if (existingBadge.length > 0) {
      console.log(`   ℹ️ Badge "${badgeName}" déjà possédé`);
      return;
    }
    
    // Générer un UUID pour user_badges
    const { v4: uuidv4 } = require('uuid');
    const userBadgeId = uuidv4();
    
    // Attribuer le badge
    await executeQuery(
      'INSERT INTO user_badges (id, user_id, badge_id, unlocked_at, created_at) VALUES (?, ?, ?, NOW(), NOW())',
      [userBadgeId, userId, badgeId]
    );
    
    console.log(`   🎉 Badge "${badgeName}" attribué !`);
    
  } catch (error) {
    console.error('   ❌ Erreur attribution badge:', error);
  }
}

// Lancer le script
fixMissingBadges().then(() => {
  console.log('\n🏁 Script terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
