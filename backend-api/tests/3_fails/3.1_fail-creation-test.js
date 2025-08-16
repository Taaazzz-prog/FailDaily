/**
 * 📝 TEST 3.1 - CRÉATION DE FAILS
 * ==============================
 * 
 * Teste la création de fails avec différents scénarios
 */

const { API_CONFIG, TEST_FAILS, TEST_UTILS, DEFAULT_HEADERS } = require('../0_test-config');

async function testFailCreation() {
  TEST_UTILS.log('🔍', 'Début test création de fails...');
  
  let success = true;
  const results = {
    userCreated: false,
    tokenObtained: false,
    validFailCreation: false,
    missingTitle: false,
    publicFail: false,
    privateFail: false,
    categoryValidation: false,
    responseFormat: false,
    errors: []
  };

  const registerUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.auth.register;
  const loginUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.auth.login;
  const failsUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.fails.create;

  let authToken = null;
  let userId = null;

  try {
    // 1. Créer un utilisateur et obtenir un token
    TEST_UTILS.log('👤', 'Préparation utilisateur pour tests fails...');
    const testEmail = TEST_UTILS.generateTestEmail();
    const testPassword = 'password123';
    
    const userData = {
      email: testEmail,
      password: testPassword,
      displayName: 'Test Fails User'
    };

    const registerResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(userData)
    });

    if (registerResponse.status === 201) {
      const registerData = await registerResponse.json();
      results.userCreated = true;
      userId = registerData.user.id;
      authToken = registerData.token;
      results.tokenObtained = true;
      TEST_UTILS.log('✅', 'Utilisateur et token obtenus');
    } else {
      results.errors.push('Impossible de créer utilisateur de test');
      success = false;
      return { success, results };
    }

    // 2. Test création fail valide
    TEST_UTILS.log('📝', 'Test création fail valide...');
    const validFailData = {
      title: 'Mon premier échec de test',
      description: 'Ceci est une description détaillée de mon échec pour les tests',
      category: 'personnel',
      isPublic: true
    };

    const createResponse = await fetch(failsUrl, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(validFailData)
    });

    if (createResponse.status === 201) {
      const failData = await createResponse.json();
      
      // Vérifier la structure de la réponse
      if (failData.message && failData.fail) {
        results.validFailCreation = true;
        results.responseFormat = true;
        TEST_UTILS.log('✅', 'Création fail valide réussie');
        TEST_UTILS.log('ℹ️', `Fail ID: ${failData.fail.id}`);
        TEST_UTILS.log('ℹ️', `Titre: ${failData.fail.title}`);
        
        // Vérifier que l'user_id correspond
        if (failData.fail.user_id === userId) {
          TEST_UTILS.log('✅', 'User ID correct dans le fail');
        } else {
          results.errors.push('User ID incorrect dans le fail créé');
        }
      } else {
        results.errors.push('Format de réponse invalide pour création fail');
        success = false;
      }
    } else {
      const errorData = await createResponse.json();
      results.errors.push(`Création fail valide échouée: ${createResponse.status} - ${errorData.error || 'Erreur inconnue'}`);
      success = false;
    }

    // 3. Test fail sans titre (validation)
    TEST_UTILS.log('❌', 'Test fail sans titre...');
    const noTitleData = {
      description: 'Description sans titre',
      category: 'personnel',
      isPublic: true
    };

    const noTitleResponse = await fetch(failsUrl, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(noTitleData)
    });

    if (noTitleResponse.status === 400) {
      const data = await noTitleResponse.json();
      if (data.code === 'MISSING_TITLE' || data.error.includes('titre')) {
        results.missingTitle = true;
        TEST_UTILS.log('✅', 'Validation titre manquant fonctionne');
      }
    } else {
      results.errors.push(`Validation titre manquant devrait échouer: ${noTitleResponse.status}`);
    }

    // 4. Test fail public
    TEST_UTILS.log('🌍', 'Test fail public...');
    const publicFailData = {
      title: 'Échec public de test',
      description: 'Ceci est un échec visible par tous',
      category: 'professionnel',
      isPublic: true
    };

    const publicResponse = await fetch(failsUrl, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(publicFailData)
    });

    if (publicResponse.status === 201) {
      const data = await publicResponse.json();
      if (data.fail.isPublic === true) {
        results.publicFail = true;
        TEST_UTILS.log('✅', 'Fail public créé correctement');
      }
    } else {
      results.errors.push(`Création fail public échouée: ${publicResponse.status}`);
    }

    // 5. Test fail privé
    TEST_UTILS.log('🔒', 'Test fail privé...');
    const privateFailData = {
      title: 'Échec privé de test',
      description: 'Ceci est un échec privé',
      category: 'personnel',
      isPublic: false
    };

    const privateResponse = await fetch(failsUrl, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(privateFailData)
    });

    if (privateResponse.status === 201) {
      const data = await privateResponse.json();
      if (data.fail.isPublic === false) {
        results.privateFail = true;
        TEST_UTILS.log('✅', 'Fail privé créé correctement');
      }
    } else {
      results.errors.push(`Création fail privé échouée: ${privateResponse.status}`);
    }

    // 6. Test catégories valides
    TEST_UTILS.log('🏷️', 'Test catégories...');
    const categories = ['personnel', 'professionnel', 'relationnel', 'financier', 'sante', 'autre'];
    let categoriesOk = 0;

    for (const category of categories) {
      const categoryFailData = {
        title: `Échec ${category}`,
        description: `Test de la catégorie ${category}`,
        category: category,
        isPublic: true
      };

      const categoryResponse = await fetch(failsUrl, {
        method: 'POST',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(categoryFailData)
      });

      if (categoryResponse.status === 201) {
        categoriesOk++;
      }
    }

    if (categoriesOk === categories.length) {
      results.categoryValidation = true;
      TEST_UTILS.log('✅', `Toutes les catégories acceptées (${categoriesOk}/${categories.length})`);
    } else {
      results.errors.push(`Certaines catégories rejetées: ${categoriesOk}/${categories.length}`);
    }

    // 7. Test sans authentification
    TEST_UTILS.log('🚫', 'Test création sans authentification...');
    const noAuthResponse = await fetch(failsUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(validFailData)
    });

    if (noAuthResponse.status === 401) {
      TEST_UTILS.log('✅', 'Authentification requise pour création');
    } else {
      results.errors.push(`Création sans auth devrait être rejetée: ${noAuthResponse.status}`);
    }

  } catch (error) {
    TEST_UTILS.log('❌', `Erreur générale: ${error.message}`);
    results.errors.push(`Erreur réseau: ${error.message}`);
    success = false;
  }

  // Résultats
  console.log('\n📋 RÉSULTATS TEST 3.1 - CRÉATION FAILS');
  console.log('======================================');
  console.log(`Utilisateur créé: ${results.userCreated ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Token obtenu: ${results.tokenObtained ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Création valide: ${results.validFailCreation ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Format réponse: ${results.responseFormat ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Validation titre: ${results.missingTitle ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Fail public: ${results.publicFail ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Fail privé: ${results.privateFail ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Catégories: ${results.categoryValidation ? '✅ OK' : '❌ ÉCHEC'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERREURS:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  const allTestsPassed = results.userCreated && results.tokenObtained && 
                        results.validFailCreation && results.responseFormat &&
                        results.missingTitle && results.publicFail && 
                        results.privateFail && results.categoryValidation;
  
  console.log(`\n🎯 STATUT: ${allTestsPassed ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);
  
  return { success: allTestsPassed, results };
}

// Exécution si appelé directement
if (require.main === module) {
  testFailCreation()
    .then(({ success }) => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = testFailCreation;
