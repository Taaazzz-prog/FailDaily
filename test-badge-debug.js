const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testBadgeSystem() {
  try {
    console.log('🏆 Test du système de badges...');

    // 1. Connexion avec un utilisateur existant
    console.log('\n🔐 Connexion avec un utilisateur existant...');
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'test@example.com',
      password: 'password'
    });

    let token;
    let userId;

    if (loginResponse.status === 200) {
      token = loginResponse.data.token;
      userId = loginResponse.data.user.id;
      console.log(`✅ Connecté avec utilisateur ID: ${userId}`);
    } else {
      console.log('❌ Échec de connexion, création d\'un nouvel utilisateur...');
      const timestamp = Date.now();
      const registerResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        email: `test-badge-${timestamp}@example.com`,
        password: 'TestPassword123!',
        displayName: `BadgeTest${timestamp}`
      });

      if (registerResponse.status !== 201) {
        console.log(`❌ Erreur création utilisateur: ${registerResponse.status}`);
        console.log(registerResponse.data);
        return;
      }

      token = registerResponse.data.token;
      userId = registerResponse.data.user.id;
      console.log(`✅ Nouvel utilisateur créé ID: ${userId}`);
    }

    // 2. Vérifier les badges actuels de l'utilisateur
    console.log('\n🏅 Vérification des badges actuels...');
    const badgesResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/users/${userId}/badges`,
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (badgesResponse.status === 200) {
      console.log(`✅ ${badgesResponse.data.length} badges obtenus:`);
      badgesResponse.data.forEach(badge => {
        console.log(`   - ${badge.name} (${badge.rarity}): ${badge.description}`);
      });
    } else {
      console.log(`❌ Erreur récupération badges: ${badgesResponse.status}`);
      console.log(badgesResponse.data);
    }

    // 3. Compter les fails de l'utilisateur
    console.log('\n📊 Vérification des fails de l\'utilisateur...');
    const failsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/users/${userId}/fails`,
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (failsResponse.status === 200) {
      const failsCount = failsResponse.data.length;
      console.log(`✅ L'utilisateur a créé ${failsCount} fails`);
      
      if (failsCount >= 5) {
        console.log(`✅ L'utilisateur devrait avoir le badge "Apprenti" (5 fails)`);
      } else {
        console.log(`⚠️  L'utilisateur n'a que ${failsCount} fails, le badge "Apprenti" nécessite 5 fails`);
      }
    } else {
      console.log(`❌ Erreur récupération fails: ${failsResponse.status}`);
      console.log(failsResponse.data);
    }

    // 4. Tester la création d'un nouveau fail pour déclencher les badges
    console.log('\n➕ Création d\'un nouveau fail pour tester les badges...');
    const newFailResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/fails',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      title: `Test Badge Fail ${Date.now()}`,
      description: 'Test pour vérifier le système de badges',
      category: 'travail',
      is_anonyme: false
    });

    if (newFailResponse.status === 201) {
      console.log(`✅ Nouveau fail créé: ${newFailResponse.data.fail.id}`);
      
      // Vérifier à nouveau les badges après création
      console.log('\n🔄 Vérification des badges après création du fail...');
      const updatedBadgesResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: `/api/users/${userId}/badges`,
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (updatedBadgesResponse.status === 200) {
        console.log(`✅ ${updatedBadgesResponse.data.length} badges obtenus après création:`);
        updatedBadgesResponse.data.forEach(badge => {
          console.log(`   - ${badge.name} (${badge.rarity}): ${badge.description}`);
        });
      }
    } else {
      console.log(`❌ Erreur création fail: ${newFailResponse.status}`);
      console.log(newFailResponse.data);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testBadgeSystem();
