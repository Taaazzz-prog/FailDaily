// Debug des badges pour comprendre le problème des "prochains défis"
const fetch = require('node-fetch');

async function debugBadges() {
  console.log('🔍 Debug des badges - Prochains défis...');
  
  const userId = '9f92d99e-5f70-427e-aebd-68ca8b727bd4';
  const apiUrl = 'http://localhost:3000/api';
  
  try {
    // 1. Récupérer les IDs des badges utilisateur
    console.log('\n1️⃣ Badges utilisateur (IDs):');
    const userBadgesResponse = await fetch(`${apiUrl}/users/${userId}/badges/ids`);
    const userBadgesData = await userBadgesResponse.json();
    
    console.log('Status:', userBadgesResponse.status);
    console.log('Data:', JSON.stringify(userBadgesData, null, 2));
    
    if (!userBadgesData.success) {
      console.log('❌ Erreur récupération badges utilisateur');
      return;
    }
    
    const userBadgeIds = userBadgesData.badgeIds;
    console.log(`👤 Utilisateur a ${userBadgeIds.length} badge(s):`, userBadgeIds);
    
    // 2. Récupérer tous les badges disponibles
    console.log('\n2️⃣ Tous les badges disponibles:');
    const allBadgesResponse = await fetch(`${apiUrl}/badges/available`);
    const allBadgesData = await allBadgesResponse.json();
    
    console.log('Status:', allBadgesResponse.status);
    console.log(`📚 Total badges disponibles: ${allBadgesData.badges?.length || 0}`);
    
    if (!allBadgesData.success || !allBadgesData.badges) {
      console.log('❌ Erreur récupération badges disponibles');
      return;
    }
    
    // 3. Analyser les badges non débloqués
    const unlockedBadges = allBadgesData.badges.filter(badge =>
      !userBadgeIds.includes(badge.id)
    );
    
    console.log(`🔓 Badges non débloqués: ${unlockedBadges.length}`);
    
    // 4. Analyser les badges liés au nombre de fails
    const failCountBadges = unlockedBadges.filter(badge => 
      badge.requirements?.type === 'fail_count'
    );
    
    console.log(`📊 Badges basés sur fail_count: ${failCountBadges.length}`);
    
    if (failCountBadges.length > 0) {
      console.log('\n📋 Badges fail_count non débloqués:');
      failCountBadges.slice(0, 5).forEach(badge => {
        console.log(`  - ${badge.name}: ${badge.requirements.value} fails requis (${badge.rarity})`);
      });
    }
    
    // 5. Vérifier les badges débloqués
    const unlockedUserBadges = allBadgesData.badges.filter(badge =>
      userBadgeIds.includes(badge.id)
    );
    
    console.log(`\n🏆 Badges débloqués: ${unlockedUserBadges.length}`);
    unlockedUserBadges.forEach(badge => {
      console.log(`  ✅ ${badge.name}: ${badge.description} (${badge.rarity})`);
    });
    
    // 6. Diagnostic
    console.log('\n🩺 Diagnostic:');
    if (userBadgeIds.length === 0) {
      console.log('❌ Aucun badge trouvé - vérifiez la base de données');
    } else if (unlockedBadges.length === 0) {
      console.log('🎉 Tous les badges sont débloqués (peu probable avec 70 badges)');
    } else {
      console.log(`✅ ${unlockedBadges.length} badges restent à débloquer`);
      console.log('💡 Le problème pourrait être dans le calcul du progress (badges avec progress > 0)');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

debugBadges();
