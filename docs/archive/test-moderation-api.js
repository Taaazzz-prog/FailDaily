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

async function testModerationViaAPI() {
  try {
    console.log('🔍 Test du système de modération via l\'API...');

    // 1. Test de connectivité
    console.log('\n🔌 Test de connectivité API...');
    const categoriesResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/fails/categories',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (categoriesResponse.status !== 200) {
      console.log(`❌ Le serveur API ne répond pas correctement: ${categoriesResponse.status}`);
      return;
    }
    console.log('✅ API accessible');

    // 2. Créer un utilisateur de test pour l'authentification
    console.log('\n👤 Création d\'un utilisateur de test...');
    const timestamp = Date.now();
    const testUser = {
      email: `test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      displayName: `TestUser${timestamp}`
    };

    const registerResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, testUser);

    if (registerResponse.status !== 201) {
      console.log(`❌ Erreur lors de la création de l'utilisateur: ${registerResponse.status}`);
      console.log(registerResponse.data);
      return;
    }

    const token = registerResponse.data.token;
    console.log('✅ Utilisateur créé et connecté');

    // 3. Récupérer les fails publics avec le token
    console.log('\n📝 Récupération des fails publics...');
    const failsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/fails?limit=5',
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (failsResponse.status === 200) {
      const fails = failsResponse.data.fails || [];
      console.log(`✅ ${fails.length} fails récupérés`);
      
      fails.forEach((fail, index) => {
        console.log(`\n🗂️  Fail ${index + 1}:`);
        console.log(`   ID: ${fail.id}`);
        console.log(`   Titre: ${fail.title}`);
        console.log(`   Statut modération: ${fail.moderationStatus || 'null (pas de modération)'}`);
        console.log(`   Créé le: ${new Date(fail.createdAt).toLocaleString('fr-FR')}`);
        
        if (fail.moderationStatus === 'approved') {
          console.log(`   ⚠️  Ce fail affichera "Contenu validé par modération"`);
        } else {
          console.log(`   ✅ Ce fail n'affichera PAS le message de validation`);
        }
      });

      // Statistiques
      const withModeration = fails.filter(f => f.moderationStatus === 'approved').length;
      const withoutModeration = fails.filter(f => !f.moderationStatus).length;
      
      console.log(`\n📊 Statistiques:`);
      console.log(`   - Fails avec statut "approved": ${withModeration}`);
      console.log(`   - Fails sans modération: ${withoutModeration}`);
      
      if (withModeration === 0) {
        console.log(`\n✅ EXCELLENT! Aucun fail n'affiche automatiquement le message de validation.`);
        console.log(`   Le problème de modération automatique est RÉSOLU!`);
      } else {
        console.log(`\n⚠️  PROBLÈME: ${withModeration} fail(s) affichent le message de validation alors qu'ils ne devraient pas.`);
      }

    } else {
      console.log(`❌ Erreur lors de la récupération des fails: ${failsResponse.status}`);
      console.log(failsResponse.data);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testModerationViaAPI();
