const axios = require('axios');

async function testBadgesAPIDocker() {
  try {
    console.log('🧪 Test API Badges via Docker (port 8000)');
    
    // 1. Connexion via Traefik
    const loginResponse = await axios.post('http://localhost:8000/api/auth/login', {
      email: 'bruno@taaazzz.be',
      password: '@51008473@'
    });
    
    console.log('✅ Connexion réussie');
    const token = loginResponse.data.token;
    
    // 2. Test /users/me/badges via Traefik
    const badgesResponse = await axios.get('http://localhost:8000/api/users/me/badges', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('🏆 Badges utilisateur (via Docker):');
    console.log(`Nombre de badges: ${badgesResponse.data.badges.length}`);
    badgesResponse.data.badges.forEach(badge => {
      console.log(`- ${badge.name} (${badge.category}) - ${badge.rarity}`);
    });
    
    // 3. Test /badges/available via Traefik
    const availableResponse = await axios.get('http://localhost:8000/api/badges/available', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n📋 Badges disponibles (via Docker):');
    console.log(`Nombre total: ${availableResponse.data.badges.length}`);
    
    // 4. Test /auth/profile via Traefik
    const profileResponse = await axios.get('http://localhost:8000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n👤 Stats utilisateur (via Docker):');
    console.log('Fails count:', profileResponse.data.profile.failsCount);
    console.log('Badges count:', profileResponse.data.profile.badgesCount);
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

testBadgesAPIDocker();