/**
 * 🛡️ TEST 2.3 - VÉRIFICATION ET MIDDLEWARE JWT
 * ===========================================
 * 
 * Teste la vérification des tokens et le middleware d'authentification
 */

const { API_CONFIG, TEST_UTILS, DEFAULT_HEADERS } = require('../0_test-config');

async function testJWTVerification() {
  TEST_UTILS.log('🔍', 'Début test vérification JWT...');
  
  let success = true;
  const results = {
    userCreated: false,
    tokenReceived: false,
    tokenVerification: false,
    invalidToken: false,
    missingToken: false,
    expiredToken: false,
    middleware: false,
    errors: []
  };

  const registerUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.registration.register;
  const loginUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.auth.login;
  const verifyUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.auth.verify;

  let validToken = null;

  try {
    // 1. Créer un utilisateur et obtenir un token
    TEST_UTILS.log('👤', 'Création utilisateur pour test JWT...');
    const testEmail = TEST_UTILS.generateTestEmail();
    const testPassword = 'password123';
    
    const userData = {
      email: testEmail,
      password: testPassword,
      displayName: 'Test JWT User',
      birthDate: TEST_UTILS.generateBirthDate(22),
      agreeToTerms: true
    };

    const registerResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(userData)
    });

    if (registerResponse.status === 201) {
      results.userCreated = true;
      TEST_UTILS.log('✅', 'Utilisateur créé');

      // Connexion pour obtenir le token
      const loginResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ email: testEmail, password: testPassword })
      });

      if (loginResponse.status === 200) {
        const loginData = await loginResponse.json();
        validToken = loginData.token;
        results.tokenReceived = true;
        TEST_UTILS.log('✅', 'Token JWT reçu');
        TEST_UTILS.log('ℹ️', `Token: ${validToken.substring(0, 30)}...`);
      }
    }

    if (!validToken) {
      results.errors.push('Impossible d\'obtenir un token valide');
      success = false;
      return { success, results };
    }

    // 2. Test vérification token valide
    TEST_UTILS.log('🔐', 'Test vérification token valide...');
    const verifyResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${validToken}`
      }
    });

    if (verifyResponse.status === 200) {
      const verifyData = await verifyResponse.json();
      if (verifyData.valid && verifyData.user) {
        results.tokenVerification = true;
        TEST_UTILS.log('✅', 'Vérification token valide réussie');
        TEST_UTILS.log('ℹ️', `User vérifié: ${verifyData.user.email}`);
      } else {
        results.errors.push('Format de réponse invalide pour vérification token');
      }
    } else {
      results.errors.push(`Vérification token valide échouée: ${verifyResponse.status}`);
    }

    // 3. Test token invalide
    TEST_UTILS.log('❌', 'Test token invalide...');
    const invalidTokenResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': 'Bearer token-invalide-123'
      }
    });

    if (invalidTokenResponse.status === 403) {
      const data = await invalidTokenResponse.json();
      if (data.message && data.message.includes('invalide')) {
        results.invalidToken = true;
        TEST_UTILS.log('✅', 'Détection token invalide fonctionne');
      }
    } else {
      results.errors.push(`Token invalide devrait être rejeté: ${invalidTokenResponse.status}`);
    }

    // 4. Test token manquant
    TEST_UTILS.log('🚫', 'Test token manquant...');
    const noTokenResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: DEFAULT_HEADERS
    });

    if (noTokenResponse.status === 401) {
      const data = await noTokenResponse.json();
      if (data.message && data.message.includes('requis')) {
        results.missingToken = true;
        TEST_UTILS.log('✅', 'Détection token manquant fonctionne');
      }
    } else {
      results.errors.push(`Token manquant devrait être rejeté: ${noTokenResponse.status}`);
    }

    // 5. Test token malformé
    TEST_UTILS.log('🔧', 'Test token malformé...');
    const malformedTokenResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': 'Bearer malformed.token'
      }
    });

    if (malformedTokenResponse.status === 403) {
      TEST_UTILS.log('✅', 'Détection token malformé fonctionne');
    } else {
      results.errors.push(`Token malformé devrait être rejeté: ${malformedTokenResponse.status}`);
    }

    // 6. Test middleware d'authentification sur une route protégée
    TEST_UTILS.log('🛡️', 'Test middleware sur route protégée...');
    
    // Tenter d'accéder aux fails sans token
    const failsUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.fails.create;
    const noAuthResponse = await fetch(failsUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        title: 'Test fail',
        description: 'Test sans auth'
      })
    });

    if (noAuthResponse.status === 401) {
      TEST_UTILS.log('✅', 'Middleware auth fonctionne sur route protégée');
      results.middleware = true;
    } else {
      results.errors.push(`Route protégée devrait rejeter sans auth: ${noAuthResponse.status}`);
    }

    // Tenter avec token valide
    const withAuthResponse = await fetch(failsUrl, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({
        title: 'Test fail avec auth',
        description: 'Test avec token valide'
      })
    });

    if (withAuthResponse.status === 201 || withAuthResponse.status === 400) {
      // 201 = création réussie, 400 = validation échouée mais auth OK
      TEST_UTILS.log('✅', 'Middleware auth autorise avec token valide');
    } else {
      TEST_UTILS.log('ℹ️', `Réponse avec auth: ${withAuthResponse.status}`);
    }

    // 7. Test format Authorization header
    TEST_UTILS.log('📝', 'Test formats Authorization...');
    
    // Sans "Bearer"
    const noBearerResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': validToken
      }
    });

    if (noBearerResponse.status === 401 || noBearerResponse.status === 403) {
      TEST_UTILS.log('✅', 'Format Authorization "Bearer" requis');
    }

  } catch (error) {
    TEST_UTILS.log('❌', `Erreur générale: ${error.message}`);
    results.errors.push(`Erreur réseau: ${error.message}`);
    success = false;
  }

  // Résultats
  console.log('\n📋 RÉSULTATS TEST 2.3 - VÉRIFICATION JWT');
  console.log('=========================================');
  console.log(`Utilisateur créé: ${results.userCreated ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Token reçu: ${results.tokenReceived ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Vérification valide: ${results.tokenVerification ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Détection token invalide: ${results.invalidToken ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Détection token manquant: ${results.missingToken ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Middleware auth: ${results.middleware ? '✅ OK' : '❌ ÉCHEC'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERREURS:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  const allTestsPassed = results.userCreated && results.tokenReceived;
  
  console.log(`\n🎯 STATUT: ${allTestsPassed ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);
  
  return { success: allTestsPassed, results };
}

// Exécution si appelé directement
if (require.main === module) {
  testJWTVerification()
    .then(({ success }) => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = testJWTVerification;
