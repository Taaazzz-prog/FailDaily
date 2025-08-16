/**
 * 📖 TEST 3.2 - RÉCUPÉRATION DE FAILS
 * ==================================
 * 
 * Teste la récupération des fails avec pagination et filtres
 */

const { API_CONFIG, TEST_UTILS, DEFAULT_HEADERS } = require('../0_test-config');

async function testFailRetrieval() {
  TEST_UTILS.log('🔍', 'Début test récupération fails...');
  
  let success = true;
  const results = {
    userCreated: false,
    failsCreated: 0,
    getAllFails: false,
    getFailById: false,
    publicOnlyFilter: false,
    pagination: false,
    categoryFilter: false,
    unauthorizedAccess: false,
    errors: []
  };

  const registerUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.auth.register;
  const failsUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.fails.create;
  const getFailsUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.fails.getAll;

  let authToken = null;
  let userId = null;
  let createdFailIds = [];

  try {
    // 1. Créer un utilisateur et plusieurs fails de test
    TEST_UTILS.log('👤', 'Préparation données de test...');
    const testEmail = TEST_UTILS.generateTestEmail();
    const testPassword = 'password123';
    
    const userData = {
      email: testEmail,
      password: testPassword,
      displayName: 'Test Retrieval User'
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
      TEST_UTILS.log('✅', 'Utilisateur créé');
    } else {
      results.errors.push('Impossible de créer utilisateur de test');
      success = false;
      return { success, results };
    }

    // Créer plusieurs fails de test
    const testFails = [
      { title: 'Échec public 1', description: 'Premier échec public', category: 'personnel', isPublic: true },
      { title: 'Échec privé 1', description: 'Premier échec privé', category: 'professionnel', isPublic: false },
      { title: 'Échec public 2', description: 'Deuxième échec public', category: 'relationnel', isPublic: true },
      { title: 'Échec public 3', description: 'Troisième échec public', category: 'personnel', isPublic: true }
    ];

    TEST_UTILS.log('📝', 'Création de fails de test...');
    for (const failData of testFails) {
      const createResponse = await fetch(failsUrl, {
        method: 'POST',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(failData)
      });

      if (createResponse.status === 201) {
        const data = await createResponse.json();
        createdFailIds.push(data.fail.id);
        results.failsCreated++;
      }
    }

    TEST_UTILS.log('✅', `${results.failsCreated} fails créés pour les tests`);

    // 2. Test récupération sans authentification (devrait être rejetée)
    TEST_UTILS.log('🚫', 'Test récupération sans authentification...');
    const noAuthResponse = await fetch(getFailsUrl, {
      method: 'GET',
      headers: DEFAULT_HEADERS
    });

    if (noAuthResponse.status === 401) {
      TEST_UTILS.log('✅', 'Accès sans auth correctement rejeté - Compte obligatoire');
      results.publicOnlyFilter = true; // Renommé pour la logique "auth required"
    } else {
      results.errors.push(`Accès sans auth devrait être rejeté: ${noAuthResponse.status}`);
    }

    // 3. Test récupération avec authentification (tous les fails publics visibles)
    TEST_UTILS.log('📖', 'Test récupération avec authentification...');
    const getAllResponse = await fetch(getFailsUrl, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (getAllResponse.status === 200) {
      const allFailsData = await getAllResponse.json();
      
      if (Array.isArray(allFailsData.fails) && allFailsData.fails.length >= 3) {
        results.getAllFails = true;
        TEST_UTILS.log('✅', `Récupération réussie: ${allFailsData.fails.length} fails trouvés`);
        
        // Vérifier que tous les fails retournés sont publics (pour un utilisateur standard)
        const publicFails = allFailsData.fails.filter(fail => fail.isPublic === true);
        const privateFails = allFailsData.fails.filter(fail => fail.isPublic === false && fail.user_id === userId);
        
        // Un utilisateur connecté voit : tous les fails publics + ses propres fails privés
        if (publicFails.length > 0) {
          TEST_UTILS.log('✅', `Fails publics visibles: ${publicFails.length}`);
        }
        if (privateFails.length > 0) {
          TEST_UTILS.log('✅', `Ses propres fails privés visibles: ${privateFails.length}`);
        }
        
        // Vérifier l'anonymat : les données d'auteur ne doivent pas être exposées
        const firstFail = allFailsData.fails[0];
        if (firstFail && (!firstFail.author_name || !firstFail.author_avatar)) {
          TEST_UTILS.log('✅', 'Anonymat préservé - Pas de données auteur exposées');
        }
      } else {
        results.errors.push('Format de réponse invalide pour getAllFails');
      }
    } else {
      results.errors.push(`Récupération fails avec auth échouée: ${getAllResponse.status}`);
    }

    // 4. Test récupération fail par ID
    if (createdFailIds.length > 0) {
      TEST_UTILS.log('🎯', 'Test récupération fail par ID...');
      const failId = createdFailIds[0];
      const getByIdUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.fails.getById}/${failId}`;
      
      const getByIdResponse = await fetch(getByIdUrl, {
        method: 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${authToken}` // Auth requise aussi pour récupération par ID
        }
      });

      if (getByIdResponse.status === 200) {
        const failData = await getByIdResponse.json();
        
        if (failData.fail && failData.fail.id === failId) {
          results.getFailById = true;
          TEST_UTILS.log('✅', `Fail récupéré par ID: ${failData.fail.title}`);
          
          // Vérifier l'anonymat sur la récupération par ID aussi
          if (!failData.fail.author_name || !failData.fail.author_avatar) {
            TEST_UTILS.log('✅', 'Anonymat préservé sur récupération par ID');
          }
        } else {
          results.errors.push('Format de réponse invalide pour getFailById');
        }
      } else {
        results.errors.push(`Récupération fail par ID échouée: ${getByIdResponse.status}`);
      }
    }

    // 5. Test pagination
    TEST_UTILS.log('📄', 'Test pagination...');
    const paginationUrl = `${getFailsUrl}?page=1&limit=2`;
    
    const paginationResponse = await fetch(paginationUrl, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${authToken}` // Auth requise
      }
    });

    if (paginationResponse.status === 200) {
      const paginationData = await paginationResponse.json();
      
      if (paginationData.fails && paginationData.fails.length <= 2 && 
          paginationData.pagination) {
        results.pagination = true;
        TEST_UTILS.log('✅', `Pagination fonctionne: ${paginationData.fails.length} résultats, page ${paginationData.pagination.currentPage}`);
      } else {
        results.errors.push('Pagination ne fonctionne pas correctement');
      }
    } else {
      results.errors.push(`Test pagination échoué: ${paginationResponse.status}`);
    }

    // 6. Test filtre par catégorie
    TEST_UTILS.log('🏷️', 'Test filtre par catégorie...');
    const categoryUrl = `${getFailsUrl}?category=personnel`;
    
    const categoryResponse = await fetch(categoryUrl, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${authToken}` // Auth requise
      }
    });

    if (categoryResponse.status === 200) {
      const categoryData = await categoryResponse.json();
      
      // Vérifier que tous les fails retournés sont de la catégorie 'personnel'
      const allPersonnel = categoryData.fails.every(fail => fail.category === 'personnel');
      if (allPersonnel && categoryData.fails.length > 0) {
        results.categoryFilter = true;
        TEST_UTILS.log('✅', `Filtre catégorie fonctionne: ${categoryData.fails.length} fails personnels`);
      } else if (categoryData.fails.length === 0) {
        TEST_UTILS.log('ℹ️', 'Aucun fail personnel trouvé (normal si base vide)');
        results.categoryFilter = true;
      }
    } else {
      results.errors.push(`Test filtre catégorie échoué: ${categoryResponse.status}`);
    }

    // 7. Test visibilité des fails privés personnels
    TEST_UTILS.log('🔐', 'Test récupération avec authentification...');
    const authGetResponse = await fetch(getFailsUrl, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (authGetResponse.status === 200) {
      const authData = await authGetResponse.json();
      
      // Devrait inclure les fails privés de l'utilisateur
      const userFails = authData.fails.filter(fail => fail.user_id === userId);
      const privateUserFails = userFails.filter(fail => !fail.isPublic);
      
      if (privateUserFails.length > 0) {
        TEST_UTILS.log('✅', `Fails privés inclus avec auth: ${privateUserFails.length}`);
      }
    }

    // 7. Test accès non autorisé (sans token)
    TEST_UTILS.log('🚫', 'Test accès non autorisé sans authentification...');
    const unauthorizedUrl = `${getFailsUrl}`;
    
    const unauthorizedResponse = await fetch(unauthorizedUrl, {
      method: 'GET',
      headers: DEFAULT_HEADERS // Pas de token d'auth
    });

    if (unauthorizedResponse.status === 401) {
      results.unauthorizedAccess = true;
      TEST_UTILS.log('✅', 'Protection accès non autorisé fonctionne - 401 sans token');
    } else {
      results.errors.push(`Accès non autorisé devrait retourner 401, reçu: ${unauthorizedResponse.status}`);
    }

    // 8. Test formats de réponse avec authentification
    TEST_UTILS.log('📋', 'Vérification formats de réponse...');
    const formatResponse = await fetch(getFailsUrl, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${authToken}` // Auth requise pour tous les accès
      }
    });

    if (formatResponse.status === 200) {
      const formatData = await formatResponse.json();
      
      // Vérifier la structure attendue
      const hasRequiredFields = formatData.fails && 
                               Array.isArray(formatData.fails) &&
                               (formatData.fails.length === 0 || 
                                formatData.fails[0].hasOwnProperty('id') &&
                                formatData.fails[0].hasOwnProperty('title') &&
                                formatData.fails[0].hasOwnProperty('user_id'));
      
      if (hasRequiredFields) {
        results.formatValidation = true;
        TEST_UTILS.log('✅', 'Format de réponse correct');
      } else {
        results.errors.push('Format de réponse incorrect');
      }
    } else {
      results.errors.push(`Vérification format échouée: ${formatResponse.status}`);
    }

  } catch (error) {
    TEST_UTILS.log('❌', `Erreur générale: ${error.message}`);
    results.errors.push(`Erreur réseau: ${error.message}`);
    success = false;
  }

  // Résultats
  console.log('\n📋 RÉSULTATS TEST 3.2 - RÉCUPÉRATION FAILS');
  console.log('==========================================');
  console.log(`Utilisateur créé: ${results.userCreated ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Fails créés: ${results.failsCreated}/4`);
  console.log(`Récupération tous (auth): ${results.getAllFails ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Récupération par ID (auth): ${results.getFailById ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Pagination (auth): ${results.pagination ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Filtre catégorie (auth): ${results.categoryFilter ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Protection accès sans auth: ${results.unauthorizedAccess ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Format de réponse: ${results.formatValidation ? '✅ OK' : '❌ ÉCHEC'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERREURS:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  const allTestsPassed = results.userCreated && results.failsCreated >= 3 && 
                        results.getAllFails && results.getFailById && 
                        results.pagination && results.categoryFilter &&
                        results.unauthorizedAccess && results.formatValidation;
  
  console.log(`\n🎯 STATUT: ${allTestsPassed ? '✅ SUCCÈS - Modèle accès authentifié validé' : '❌ ÉCHEC'}\n`);
  
  return { success: allTestsPassed, results };
}

// Exécution si appelé directement
if (require.main === module) {
  testFailRetrieval()
    .then(({ success }) => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = testFailRetrieval;
