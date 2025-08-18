/**
 * 🔑 TEST 2.2 - CONNEXION UTILISATEUR
 * ==================================
 * 
 * Teste l'endpoint de connexion avec différents scénarios
 */

const { API_CONFIG, TEST_USERS, TEST_UTILS, DEFAULT_HEADERS } = require('../0_test-config');

async function testUserLogin() {
  TEST_UTILS.log('🔍', 'Début test connexion utilisateur...');
  
  let success = true;
  const results = {
    userCreated: false,
    validLogin: false,
    invalidPassword: false,
    invalidEmail: false,
    missingFields: false,
    tokenFormat: false,
    errors: []
  };

  const registerUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.registration.register;
  const loginUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.auth.login;

  try {
    // 1. Créer un utilisateur pour les tests
    TEST_UTILS.log('👤', 'Création utilisateur de test...');
    const testEmail = TEST_UTILS.generateTestEmail();
    const testPassword = 'password123';
    
    const userData = {
      email: testEmail,
      password: testPassword,
      displayName: 'Test Login User ' + Date.now(),
      birthDate: TEST_UTILS.generateBirthDate(25),
      agreeToTerms: true
    };

    const registerResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(userData)
    });

    if (registerResponse.status === 201) {
      results.userCreated = true;
      TEST_UTILS.log('✅', 'Utilisateur de test créé');
    } else {
      results.errors.push('Impossible de créer utilisateur de test');
      success = false;
      return { success, results };
    }

    // 2. Test connexion valide
    TEST_UTILS.log('🔑', 'Test connexion valide...');
    const validLoginData = {
      email: testEmail,
      password: testPassword
    };

    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(validLoginData)
    });

    if (loginResponse.status === 200) {
      const loginData = await loginResponse.json();
      
      // Vérifier la structure de la réponse
      if (loginData.message && loginData.user && loginData.token) {
        results.validLogin = true;
        TEST_UTILS.log('✅', 'Connexion valide réussie');
        
        // Vérifier le format du token JWT
        const tokenParts = loginData.token.split('.');
        if (tokenParts.length === 3) {
          results.tokenFormat = true;
          TEST_UTILS.log('✅', 'Format token JWT valide');
          
          // Décoder le payload pour vérifier les claims
          try {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            if (payload.userId && payload.email && payload.exp) {
              TEST_UTILS.log('✅', 'Claims JWT valides');
              TEST_UTILS.log('ℹ️', `User ID: ${payload.userId}`);
              TEST_UTILS.log('ℹ️', `Email: ${payload.email}`);
            }
          } catch (e) {
            results.errors.push('Payload JWT invalide');
          }
        } else {
          results.errors.push('Format token JWT invalide');
        }
      } else {
        results.errors.push('Format de réponse invalide pour connexion valide');
        success = false;
      }
    } else {
      const errorData = await loginResponse.json();
      results.errors.push(`Connexion valide échouée: ${loginResponse.status} - ${errorData.error || 'Erreur inconnue'}`);
      success = false;
    }

    // 3. Test mot de passe incorrect
    TEST_UTILS.log('🔒', 'Test mot de passe incorrect...');
    const wrongPasswordData = {
      email: testEmail,
      password: 'mauvais-password'
    };

    const wrongPasswordResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(wrongPasswordData)
    });

    if (wrongPasswordResponse.status === 401) {
      const data = await wrongPasswordResponse.json();
      if (data.code === 'INVALID_CREDENTIALS') {
        results.invalidPassword = true;
        TEST_UTILS.log('✅', 'Détection mot de passe incorrect fonctionne');
      }
    } else {
      results.errors.push(`Validation mot de passe incorrect devrait échouer: ${wrongPasswordResponse.status}`);
    }

    // 4. Test email inexistant
    TEST_UTILS.log('📧', 'Test email inexistant...');
    const wrongEmailData = {
      email: 'inexistant@example.com',
      password: testPassword
    };

    const wrongEmailResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(wrongEmailData)
    });

    if (wrongEmailResponse.status === 401) {
      const data = await wrongEmailResponse.json();
      if (data.code === 'INVALID_CREDENTIALS') {
        results.invalidEmail = true;
        TEST_UTILS.log('✅', 'Détection email inexistant fonctionne');
      }
    } else {
      results.errors.push(`Validation email inexistant devrait échouer: ${wrongEmailResponse.status}`);
    }

    // 5. Test champs manquants
    TEST_UTILS.log('📝', 'Test champs manquants...');
    const incompleteData = {
      email: testEmail
      // password manquant
    };

    const incompleteResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(incompleteData)
    });

    if (incompleteResponse.status === 400) {
      const data = await incompleteResponse.json();
      if (data.code === 'MISSING_FIELDS') {
        results.missingFields = true;
        TEST_UTILS.log('✅', 'Validation champs manquants fonctionne');
      }
    } else {
      results.errors.push(`Validation champs manquants devrait échouer: ${incompleteResponse.status}`);
    }

    // 6. Test rate limiting (optionnel)
    TEST_UTILS.log('⏱️', 'Test rate limiting...');
    for (let i = 0; i < 3; i++) {
      await fetch(loginUrl, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(wrongPasswordData)
      });
    }
    TEST_UTILS.log('ℹ️', 'Rate limiting testé (3 tentatives rapides)');

  } catch (error) {
    TEST_UTILS.log('❌', `Erreur générale: ${error.message}`);
    results.errors.push(`Erreur réseau: ${error.message}`);
    success = false;
  }

  // Résultats
  console.log('\n📋 RÉSULTATS TEST 2.2 - CONNEXION');
  console.log('=================================');
  console.log(`Utilisateur créé: ${results.userCreated ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Connexion valide: ${results.validLogin ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Format token: ${results.tokenFormat ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Validation mot de passe: ${results.invalidPassword ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Validation email: ${results.invalidEmail ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Validation champs: ${results.missingFields ? '✅ OK' : '❌ ÉCHEC'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERREURS:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  const allTestsPassed = results.userCreated && results.validLogin && results.tokenFormat;
  
  console.log(`\n🎯 STATUT: ${allTestsPassed ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);
  
  return { success: allTestsPassed, results };
}

// Exécution si appelé directement
if (require.main === module) {
  testUserLogin()
    .then(({ success }) => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = testUserLogin;
