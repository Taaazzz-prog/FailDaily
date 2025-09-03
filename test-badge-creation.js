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

async function testBadgeCreation() {
  try {
    console.log('🏆 Test de création de fail pour déclencher les badges...');

    // 1. Connexion avec un utilisateur simple
    console.log('\n🔐 Test de connexion...');
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'user@example.com',
      password: 'password123'
    });

    let token;
    if (loginResponse.status === 200) {
      token = loginResponse.data.token;
      console.log('✅ Connexion réussie');
    } else {
      console.log('❌ Échec de connexion, essayons avec admin...');
      const adminLogin = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        email: 'admin@example.com',
        password: 'admin123'
      });

      if (adminLogin.status === 200) {
        token = adminLogin.data.token;
        console.log('✅ Connexion admin réussie');
      } else {
        console.log('❌ Impossible de se connecter');
        return;
      }
    }

    // 2. Créer un fail pour déclencher les badges
    console.log('\n➕ Création d\'un nouveau fail...');
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
      title: `Test Badge ${Date.now()}`,
      description: 'Test pour vérifier que les badges se débloquent maintenant',
      category: 'travail',
      is_anonyme: false
    });

    if (newFailResponse.status === 201) {
      console.log(`✅ Nouveau fail créé: ${newFailResponse.data.fail.id}`);
      console.log('📋 Vérifiez les logs du serveur pour voir si les badges ont été attribués');
    } else {
      console.log(`❌ Erreur création fail: ${newFailResponse.status}`);
      console.log(newFailResponse.data);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testBadgeCreation();
