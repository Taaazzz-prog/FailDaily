const axios = require('axios');

async function testBadgesAPI() {
  try {
    console.log('🧪 Test API Badges');
    
    // 1. Connexion
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'bruno@taaazzz.be',
      password: '@51008473@'
    });
    
    console.log('✅ Connexion réussie');
    const token = loginResponse.data.token;
    
    // 2. Test /users/me/badges
    const badgesResponse = await axios.get('http://localhost:3000/api/users/me/badges', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('🏆 Badges utilisateur:');
    console.log(`Nombre de badges: ${badgesResponse.data.badges.length}`);
    badgesResponse.data.badges.forEach(badge => {
      console.log(`- ${badge.name} (${badge.category}) - ${badge.rarity}`);
    });
    
    // 3. Test /badges/available
    const availableResponse = await axios.get('http://localhost:3000/api/badges/available', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n📋 Badges disponibles:');
    console.log(`Nombre total: ${availableResponse.data.badges.length}`);
    
    // 4. Test /auth/profile
    const profileResponse = await axios.get('http://localhost:3000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n👤 Stats utilisateur:');
    console.log('Stats:', profileResponse.data.profile.stats);
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

testBadgesAPI();