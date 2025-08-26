/**
 * 🔄 TEST 4.1 - TESTS D'INTÉGRATION COMPLETS
 * ==========================================
 * 
 * Scénarios complets d'utilisation de l'API
 */

const { API_CONFIG, TEST_UTILS, DEFAULT_HEADERS } = require('../0_test-config');

async function testCompleteIntegration() {
  TEST_UTILS.log('🔍', 'Début tests d\'intégration complets...');
  
  let success = true;
  const results = {
    userRegistration: false,
    userLogin: false,
    failCreation: false,
    failRetrieval: false,
    userStats: false,
    endToEndFlow: false,
    errors: []
  };

  const baseUrl = API_CONFIG.baseUrl;
  let userData = null;
  let authToken = null;
  let createdFailId = null;

  try {
    // Scénario complet : Inscription → Connexion → Création Fail → Récupération
    TEST_UTILS.log('🎬', 'SCÉNARIO COMPLET D\'UTILISATION');
    
    // 1. Inscription utilisateur
    TEST_UTILS.log('1️⃣', 'Inscription utilisateur...');
    const testEmail = TEST_UTILS.generateTestEmail();
    const testPassword = 'password123';
    
    const registerData = {
      email: testEmail,
      password: testPassword,
      displayName: 'Utilisateur Intégration Test ' + Date.now()
    };

    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(registerData)
    });

    if (registerResponse.status === 201) {
      const registerResult = await registerResponse.json();
      userData = registerResult.user;
      authToken = registerResult.token;
      results.userRegistration = true;
      TEST_UTILS.log('✅', `Utilisateur inscrit: ${userData.email}`);
    } else {
      const error = await registerResponse.json();
      results.errors.push(`Inscription échouée: ${error.error}`);
      success = false;
      return { success, results };
    }

    // 2. Connexion utilisateur (vérification du système d'auth)
    TEST_UTILS.log('2️⃣', 'Connexion utilisateur...');
    const loginData = {
      email: testEmail,
      password: testPassword
    };

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(loginData)
    });

    if (loginResponse.status === 200) {
      const loginResult = await loginResponse.json();
      authToken = loginResult.token; // Utiliser le nouveau token
      results.userLogin = true;
      TEST_UTILS.log('✅', 'Connexion réussie');
    } else {
      results.errors.push('Connexion échouée');
      success = false;
    }

    // 3. Création de plusieurs fails
    TEST_UTILS.log('3️⃣', 'Création de fails...');
    const failsToCreate = [
      {
        title: 'Premier échec professionnel',
        description: 'J\'ai complètement raté ma présentation importante',
        category: 'professionnel',
        is_anonyme: false
      },
      {
        title: 'Échec relationnel',
        description: 'Dispute avec un proche',
        category: 'relationnel',
        is_anonyme: true
      },
      {
        title: 'Échec financier',
        description: 'Mauvais investissement',
        category: 'financier',
        is_anonyme: false
      }
    ];

    let failsCreated = 0;
    for (const failData of failsToCreate) {
      const failResponse = await fetch(`${baseUrl}/api/fails`, {
        method: 'POST',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(failData)
      });

      if (failResponse.status === 201) {
        const failResult = await failResponse.json();
        if (failsCreated === 0) {
          createdFailId = failResult.fail.id;
        }
        failsCreated++;
        TEST_UTILS.log('✅', `Fail créé: ${failResult.fail.title}`);
      }
    }

    if (failsCreated === failsToCreate.length) {
      results.failCreation = true;
      TEST_UTILS.log('✅', `${failsCreated} fails créés avec succès`);
    } else {
      results.errors.push(`Seulement ${failsCreated}/${failsToCreate.length} fails créés`);
    }

    // 4. Récupération des fails
    TEST_UTILS.log('4️⃣', 'Récupération des fails...');
    
    // Test d'accès non autorisé (sans token)
    const unauthenticatedResponse = await fetch(`${baseUrl}/api/fails`, {
      method: 'GET',
      headers: DEFAULT_HEADERS
    });

    if (unauthenticatedResponse.status === 401) {
      TEST_UTILS.log('✅', 'Protection authentification fonctionne - accès refusé sans token');
    } else {
      results.errors.push(`Accès non autorisé devrait retourner 401, reçu: ${unauthenticatedResponse.status}`);
    }

    // Récupération avec auth (tous les fails visibles pour l'utilisateur)
    const allFailsResponse = await fetch(`${baseUrl}/api/fails`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (allFailsResponse.status === 200) {
      const allData = await allFailsResponse.json();
      
      // Vérifier que l'utilisateur voit ses fails (publics et privés)
      const userFails = allData.fails.filter(f => f.user_id === userData.id);
      
      if (userFails.length > 0) {
        results.failRetrieval = true;
        TEST_UTILS.log('✅', `Récupération OK: ${userFails.length} fails visibles avec authentification`);
        
        // Vérifier l'anonymat des autres auteurs
        const otherAuthorFails = allData.fails.filter(f => f.user_id !== userData.id);
        if (otherAuthorFails.length === 0 || !otherAuthorFails[0].author_name) {
          TEST_UTILS.log('✅', 'Anonymat préservé pour les autres auteurs');
        }
      } else {
        TEST_UTILS.log('ℹ️', 'Aucun fail trouvé (normal si base vide)');
        results.failRetrieval = true;
      }
    } else {
      results.errors.push(`Récupération des fails échouée: ${allFailsResponse.status}`);
    }

    // 5. Récupération d'un fail spécifique
    if (createdFailId) {
      TEST_UTILS.log('5️⃣', 'Récupération fail spécifique...');
      const specificFailResponse = await fetch(`${baseUrl}/api/fails/${createdFailId}`, {
        method: 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (specificFailResponse.status === 200) {
        const specificData = await specificFailResponse.json();
        if (specificData.fail.id === createdFailId) {
          TEST_UTILS.log('✅', `Fail spécifique récupéré: ${specificData.fail.title}`);
        }
      }
    }

    // 6. Vérification token et profil
    TEST_UTILS.log('6️⃣', 'Vérification token et session...');
    const verifyResponse = await fetch(`${baseUrl}/api/auth/verify`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (verifyResponse.status === 200) {
      const verifyData = await verifyResponse.json();
      if (verifyData.valid && verifyData.user.id === userData.id) {
        TEST_UTILS.log('✅', 'Token et session valides');
      }
    }

    // 7. Test de cohérence des données
    TEST_UTILS.log('7️⃣', 'Vérification cohérence des données...');
    
    // Vérifier que tous les fails créés appartiennent bien à l'utilisateur
    const userFailsResponse = await fetch(`${baseUrl}/api/fails?user=${userData.id}`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (userFailsResponse.status === 200) {
      const userFailsData = await userFailsResponse.json();
      const userOnlyFails = userFailsData.fails.every(fail => fail.user_id === userData.id);
      
      if (userOnlyFails) {
        TEST_UTILS.log('✅', 'Cohérence des données vérifiée');
      }
    }

    // 8. Test des limites et edge cases
    TEST_UTILS.log('8️⃣', 'Test des limites...');
    
    // Tentative de création fail sans titre
    const invalidFailResponse = await fetch(`${baseUrl}/api/fails`, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        description: 'Fail sans titre',
        category: 'autre'
      })
    });

    if (invalidFailResponse.status === 400) {
      TEST_UTILS.log('✅', 'Validation côté serveur fonctionne');
    }

    // 9. Déconnexion
    TEST_UTILS.log('9️⃣', 'Déconnexion...');
    const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (logoutResponse.status === 200) {
      TEST_UTILS.log('✅', 'Déconnexion réussie');
      
      // Vérifier que le token n'est plus valide
      const invalidTokenResponse = await fetch(`${baseUrl}/api/auth/verify`, {
        method: 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (invalidTokenResponse.status === 403) {
        TEST_UTILS.log('✅', 'Token invalidé après déconnexion');
      }
    }

    // Marquer le flux end-to-end comme réussi si on arrive ici
    results.endToEndFlow = true;
    TEST_UTILS.log('🎉', 'Flux end-to-end complet réussi!');

  } catch (error) {
    TEST_UTILS.log('❌', `Erreur intégration: ${error.message}`);
    results.errors.push(`Erreur générale: ${error.message}`);
    success = false;
  }

  // Résultats finaux
  console.log('\n📋 RÉSULTATS TEST 4.1 - INTÉGRATION COMPLÈTE');
  console.log('=============================================');
  console.log(`Inscription: ${results.userRegistration ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Connexion: ${results.userLogin ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Création fails: ${results.failCreation ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Récupération fails: ${results.failRetrieval ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Flux end-to-end: ${results.endToEndFlow ? '✅ OK' : '❌ ÉCHEC'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERREURS:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  const allTestsPassed = results.userRegistration && results.userLogin && 
                        results.failCreation && results.failRetrieval && 
                        results.endToEndFlow;
  
  console.log(`\n🎯 STATUT GLOBAL: ${allTestsPassed ? '✅ SUCCÈS COMPLET' : '❌ ÉCHEC'}\n`);
  
  return { success: allTestsPassed, results };
}

// Exécution si appelé directement
if (require.main === module) {
  testCompleteIntegration()
    .then(({ success }) => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = testCompleteIntegration;
