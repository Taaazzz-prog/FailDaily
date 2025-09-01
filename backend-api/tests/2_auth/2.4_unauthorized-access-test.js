/**
 * 🚫 TEST 2.4 - PROTECTION ACCÈS NON AUTHENTIFIÉ
 * ==============================================
 * 
 * Teste que TOUS les endpoints protégés renvoient bien 401
 * quand un utilisateur n'est pas connecté
 */

const { API_CONFIG, TEST_UTILS, DEFAULT_HEADERS, fetch } = require('../0_test-config');

async function testUnauthorizedAccess() {
  TEST_UTILS.log('🚫', 'Début tests protection accès non authentifié...');
  
  let success = true;
  const results = {
    protectedEndpoints: 0,
    blockedEndpoints: 0,
    endpointResults: [],
    errors: []
  };

  // Liste de TOUS les endpoints qui doivent être protégés
  const protectedEndpoints = [
    // Endpoints de fails
    {
      name: 'GET /api/fails',
      method: 'GET',
      url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.fails.getAll}`,
      expectedStatus: 401
    },
    {
      name: 'POST /api/fails',
      method: 'POST',
      url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.fails.create}`,
      body: {
        title: 'Test fail',
        description: 'Test description',
        category: 'personnel'
      },
      expectedStatus: 401
    },
    {
      name: 'GET /api/fails/:id',
      method: 'GET',
      url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.fails.getById}/123`,
      expectedStatus: 401
    },
    {
      name: 'PUT /api/fails/:id',
      method: 'PUT',
      url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.fails.update}/123`,
      body: {
        title: 'Updated fail'
      },
      expectedStatus: 401
    },
    {
      name: 'DELETE /api/fails/:id',
      method: 'DELETE',
      url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.fails.delete}/123`,
      expectedStatus: 401
    },
    
    // Endpoints de profil utilisateur (probablement pas encore implémentés)
    {
      name: 'GET /api/auth/profile',
      method: 'GET',
      url: `${API_CONFIG.baseUrl}/api/auth/profile`,
      expectedStatus: 401,
      skipTest: true // Skip car pas encore implémenté
    },
    {
      name: 'PUT /api/auth/profile',
      method: 'PUT',
      url: `${API_CONFIG.baseUrl}/api/auth/profile`,
      body: {
        displayName: 'New Name'
      },
      expectedStatus: 401,
      skipTest: true // Skip car pas encore implémenté
    },
    {
      name: 'GET /api/auth/verify',
      method: 'GET',
      url: `${API_CONFIG.baseUrl}/api/auth/verify`,
      expectedStatus: 401
    },
    
    // Endpoints de statistiques (probablement pas encore implémentés)
    {
      name: 'GET /api/user/stats',
      method: 'GET',
      url: `${API_CONFIG.baseUrl}/api/user/stats`,
      expectedStatus: 401,
      skipTest: true // Skip car pas encore implémenté
    },
    
    // Endpoints de commentaires (probablement pas encore implémentés)
    {
      name: 'GET /api/fails/:id/comments',
      method: 'GET',
      url: `${API_CONFIG.baseUrl}/api/fails/123/comments`,
      expectedStatus: 401,
      skipTest: true // Skip car pas encore implémenté
    },
    {
      name: 'POST /api/fails/:id/comments',
      method: 'POST',
      url: `${API_CONFIG.baseUrl}/api/fails/123/comments`,
      body: {
        content: 'Test comment'
      },
      expectedStatus: 401,
      skipTest: true // Skip car pas encore implémenté
    }
  ];

  console.log(`🔍 Test de ${protectedEndpoints.length} endpoints protégés...\n`);

  try {
    for (const endpoint of protectedEndpoints) {
      results.protectedEndpoints++;
      
      TEST_UTILS.log('🔒', `Test ${endpoint.name}...`);
      
      const requestOptions = {
        method: endpoint.method,
        headers: DEFAULT_HEADERS // VOLONTAIREMENT AUCUN TOKEN
      };

      // Ajouter le body si nécessaire
      if (endpoint.body) {
        requestOptions.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(endpoint.url, requestOptions);
      
      const endpointResult = {
        name: endpoint.name,
        method: endpoint.method,
        url: endpoint.url,
        expectedStatus: endpoint.expectedStatus,
        actualStatus: response.status,
        blocked: response.status === endpoint.expectedStatus
      };

      results.endpointResults.push(endpointResult);

      if (response.status === endpoint.expectedStatus) {
        results.blockedEndpoints++;
        TEST_UTILS.log('✅', `${endpoint.name} - Correctement bloqué (${response.status})`);
      } else {
        const error = `${endpoint.name} - ÉCHEC: attendu ${endpoint.expectedStatus}, reçu ${response.status}`;
        results.errors.push(error);
        TEST_UTILS.log('❌', error);
        success = false;
      }

      // Petite pause pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Tests spéciaux pour vérifier la robustesse
    TEST_UTILS.log('\n🔧', 'Tests de robustesse...');
    
    // Test avec token invalide
    const invalidTokenResponse = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.fails.getAll}`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': 'Bearer token-invalide-123'
      }
    });

    if (invalidTokenResponse.status === 401 || invalidTokenResponse.status === 403) {
      TEST_UTILS.log('✅', 'Token invalide correctement rejeté');
    } else {
      results.errors.push(`Token invalide devrait être rejeté, reçu: ${invalidTokenResponse.status}`);
      success = false;
    }

    // Test avec token expiré simulé
    const expiredTokenResponse = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.fails.getAll}`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      }
    });

    if (expiredTokenResponse.status === 401 || expiredTokenResponse.status === 403) {
      TEST_UTILS.log('✅', 'Token expiré/invalide correctement rejeté');
    } else {
      results.errors.push(`Token expiré devrait être rejeté, reçu: ${expiredTokenResponse.status}`);
      success = false;
    }

    // Test avec Authorization header malformé
    const malformedAuthResponse = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.fails.getAll}`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': 'InvalidFormat token123'
      }
    });

    if (malformedAuthResponse.status === 401 || malformedAuthResponse.status === 403) {
      TEST_UTILS.log('✅', 'Header Authorization malformé correctement rejeté');
    } else {
      results.errors.push(`Header malformé devrait être rejeté, reçu: ${malformedAuthResponse.status}`);
      success = false;
    }

  } catch (error) {
    TEST_UTILS.log('❌', `Erreur générale: ${error.message}`);
    results.errors.push(`Erreur réseau: ${error.message}`);
    success = false;
  }

  // Résultats détaillés
  console.log('\n📋 RÉSULTATS TEST 2.4 - PROTECTION ACCÈS NON AUTHENTIFIÉ');
  console.log('=========================================================');
  console.log(`Total endpoints testés: ${results.protectedEndpoints}`);
  console.log(`Endpoints correctement protégés: ${results.blockedEndpoints}`);
  console.log(`Taux de protection: ${(results.blockedEndpoints/results.protectedEndpoints*100).toFixed(1)}%`);

  if (results.endpointResults.length > 0) {
    console.log('\n📊 Détail par endpoint:');
    results.endpointResults.forEach(result => {
      const status = result.blocked ? '✅' : '❌';
      console.log(`   ${status} ${result.name} (${result.actualStatus})`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\n❌ ERREURS:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }

  const allProtected = results.blockedEndpoints === results.protectedEndpoints && results.errors.length === 0;
  
  if (allProtected) {
    console.log('\n🎉 SUCCÈS COMPLET !');
    console.log('✅ Tous les endpoints sont correctement protégés');
    console.log('🔒 Aucun accès non autorisé possible');
    console.log('🛡️ Sécurité robuste contre différents types d\'attaques');
  } else {
    console.log('\n⚠️ PROBLÈMES DE SÉCURITÉ DÉTECTÉS !');
    console.log('❌ Certains endpoints ne sont pas correctement protégés');
    console.log('🚨 RISQUE DE SÉCURITÉ - À corriger immédiatement');
  }
  
  console.log(`\n🎯 STATUT: ${allProtected ? '✅ SÉCURISÉ' : '❌ VULNÉRABLE'}\n`);
  
  return { success: allProtected, results };
}

// Exécution si appelé directement
if (require.main === module) {
  testUnauthorizedAccess()
    .then(({ success }) => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = testUnauthorizedAccess;

