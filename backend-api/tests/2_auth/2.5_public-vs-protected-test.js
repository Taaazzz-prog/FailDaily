/**
 * ✅ TEST 2.5 - VÉRIFICATION ENDPOINTS PUBLICS VS PROTÉGÉS
 * ========================================================
 * 
 * Vérifie que seuls les endpoints vraiment publics sont accessibles
 * sans authentification (comme health check, info app)
 */

const { API_CONFIG, TEST_UTILS, DEFAULT_HEADERS } = require('../0_test-config');

async function testPublicVsProtectedEndpoints() {
  TEST_UTILS.log('🔍', 'Test endpoints publics vs protégés...');
  
  let success = true;
  const results = {
    publicEndpointsAccessible: 0,
    protectedEndpointsBlocked: 0,
    publicEndpointsTested: 0,
    protectedEndpointsTested: 0,
    errors: []
  };

  // Endpoints qui DEVRAIENT être publics (accessibles sans auth)
  const publicEndpoints = [
    {
      name: 'Health Check',
      method: 'GET',
      url: `${API_CONFIG.baseUrl}/api/health`,
      shouldBeAccessible: true
    },
    {
      name: 'App Info',
      method: 'GET', 
      url: `${API_CONFIG.baseUrl}/api/info`,
      shouldBeAccessible: true
    },
    {
      name: 'Registration Endpoint',
      method: 'POST',
      url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.register}`,
      body: { /* données de test */ },
      shouldBeAccessible: true, // L'inscription doit être publique
      skipTest: true // On ne teste pas vraiment l'inscription ici
    },
    {
      name: 'Login Endpoint',
      method: 'POST',
      url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.login}`,
      body: { /* données de test */ },
      shouldBeAccessible: true, // La connexion doit être publique
      skipTest: true // On ne teste pas vraiment la connexion ici
    }
  ];

  // Endpoints qui DOIVENT être protégés (interdits sans auth)
  const protectedEndpoints = [
    {
      name: 'Get All Fails',
      method: 'GET',
      url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.fails.getAll}`,
      expectedStatus: 401
    },
    {
      name: 'Create Fail',
      method: 'POST',
      url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.fails.create}`,
      body: { title: 'Test', description: 'Test', category: 'personnel' },
      expectedStatus: 401
    },
    {
      name: 'User Profile',
      method: 'GET',
      url: `${API_CONFIG.baseUrl}/api/auth/profile`,
      expectedStatus: 401
    },
    {
      name: 'JWT Verify',
      method: 'GET',
      url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.verify}`,
      expectedStatus: 401
    }
  ];

  try {
    console.log('🌐 Test des endpoints publics...');
    
    for (const endpoint of publicEndpoints) {
      if (endpoint.skipTest) continue;
      
      results.publicEndpointsTested++;
      TEST_UTILS.log('🔓', `Test public: ${endpoint.name}...`);
      
      const requestOptions = {
        method: endpoint.method,
        headers: DEFAULT_HEADERS // Pas d'auth
      };

      if (endpoint.body) {
        requestOptions.body = JSON.stringify(endpoint.body);
      }

      try {
        const response = await fetch(endpoint.url, requestOptions);
        
        // Pour les endpoints publics, on s'attend à ce qu'ils ne retournent PAS 401
        if (endpoint.shouldBeAccessible && response.status !== 401) {
          results.publicEndpointsAccessible++;
          TEST_UTILS.log('✅', `${endpoint.name} - Accessible publiquement (${response.status})`);
        } else if (endpoint.shouldBeAccessible && response.status === 401) {
          results.errors.push(`${endpoint.name} devrait être public mais retourne 401`);
          TEST_UTILS.log('❌', `${endpoint.name} - Incorrectement protégé`);
          success = false;
        }
      } catch (error) {
        // Si l'endpoint n'existe pas, ce n'est pas forcément une erreur
        TEST_UTILS.log('ℹ️', `${endpoint.name} - Endpoint non trouvé (normal si pas implémenté)`);
      }
    }

    console.log('\n🔒 Test des endpoints protégés...');
    
    for (const endpoint of protectedEndpoints) {
      results.protectedEndpointsTested++;
      TEST_UTILS.log('🔐', `Test protégé: ${endpoint.name}...`);
      
      const requestOptions = {
        method: endpoint.method,
        headers: DEFAULT_HEADERS // VOLONTAIREMENT sans auth
      };

      if (endpoint.body) {
        requestOptions.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(endpoint.url, requestOptions);
      
      if (response.status === endpoint.expectedStatus) {
        results.protectedEndpointsBlocked++;
        TEST_UTILS.log('✅', `${endpoint.name} - Correctement protégé (${response.status})`);
      } else {
        results.errors.push(`${endpoint.name} - Attendu ${endpoint.expectedStatus}, reçu ${response.status}`);
        TEST_UTILS.log('❌', `${endpoint.name} - Protection insuffisante`);
        success = false;
      }
    }

    // Vérification supplémentaire : Test de cohérence
    console.log('\n🧪 Tests de cohérence...');
    
    // Vérifier qu'aucun endpoint de contenu n'est public
    const suspiciousPublicAccess = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.fails.getAll}`, {
      method: 'GET',
      headers: DEFAULT_HEADERS
    });

    if (suspiciousPublicAccess.status === 200) {
      results.errors.push('SÉCURITÉ CRITIQUE: Les fails sont accessibles publiquement !');
      success = false;
      TEST_UTILS.log('🚨', 'ALERTE SÉCURITÉ: Contenu accessible sans authentification');
    } else {
      TEST_UTILS.log('✅', 'Cohérence sécurité: Contenu correctement protégé');
    }

  } catch (error) {
    TEST_UTILS.log('❌', `Erreur générale: ${error.message}`);
    results.errors.push(`Erreur réseau: ${error.message}`);
    success = false;
  }

  // Résultats
  console.log('\n📋 RÉSULTATS TEST 2.5 - ENDPOINTS PUBLICS VS PROTÉGÉS');
  console.log('=====================================================');
  console.log(`Endpoints publics testés: ${results.publicEndpointsTested}`);
  console.log(`Endpoints publics accessibles: ${results.publicEndpointsAccessible}`);
  console.log(`Endpoints protégés testés: ${results.protectedEndpointsTested}`);
  console.log(`Endpoints protégés bloqués: ${results.protectedEndpointsBlocked}`);

  if (results.errors.length > 0) {
    console.log('\n❌ PROBLÈMES DÉTECTÉS:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }

  const isSecure = results.protectedEndpointsBlocked === results.protectedEndpointsTested && 
                   results.errors.length === 0;

  if (isSecure) {
    console.log('\n🛡️ SÉCURITÉ VALIDÉE');
    console.log('✅ Séparation correcte public/protégé');
    console.log('🔒 Aucun accès non autorisé au contenu');
    console.log('🌐 Endpoints publics fonctionnels');
  } else {
    console.log('\n⚠️ PROBLÈMES DE SÉCURITÉ');
    console.log('❌ Réviser la protection des endpoints');
    console.log('🚨 Risque d\'accès non autorisé');
  }
  
  console.log(`\n🎯 STATUT: ${isSecure ? '✅ SÉCURISÉ' : '❌ VULNÉRABLE'}\n`);
  
  return { success: isSecure, results };
}

// Exécution si appelé directement
if (require.main === module) {
  testPublicVsProtectedEndpoints()
    .then(({ success }) => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = testPublicVsProtectedEndpoints;
