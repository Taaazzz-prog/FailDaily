// Utilisation d'import dynamique pour node-fetch v3
let fetch;

async function initFetch(    // Tests utilisateur (avec ID spécifique)
    { name: '📊 User Stats (avec ID)', endpoint: '/api/users/e10fbd52-b906-4504-8e13-7c7b7c451afa/stats', method: 'GET', 
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }, 
      expectStatus: 200 
    },  const module = await import('node-fetch');
  fetch = module.default;
}

const API_BASE = 'http://localhost:3000';

// Token JWT valide (nouveau)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMTBmYmQ1Mi1iOTA2LTQ1MDQtOGUxMy03YzdiN2M0NTFhZmEiLCJlbWFpbCI6InRlc3QtMTc1NjcyNzM3MzE1NkBleGFtcGxlLmNvbSIsImlhdCI6MTc1NjcyNzM3MywiZXhwIjoxNzU2ODEzNzczfQ.OEMH2_b3H4wxNF4ZO1qaoKUgyQDTrHWZEd8n9mBQ2HY';

async function testAPI(endpoint, method = 'GET', body = null, headers = {}) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      success: response.ok,
      data: data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    };
  }
}

async function runCompleteAPITests() {
  // Initialiser fetch
  await initFetch();
  
  console.log('🧪 RAPPORT COMPLET DES TESTS API - FailDaily');
  console.log('='.repeat(60));
  console.log(`📅 Date: ${new Date().toLocaleString('fr-FR')}`);
  console.log(`🌐 API Base: ${API_BASE}`);
  console.log('='.repeat(60));

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  const tests = [
    // Tests de base
    { name: '🏥 Health Check', endpoint: '/health', method: 'GET', expectStatus: 200 },
    { name: '📊 API Info', endpoint: '/api/info', method: 'GET', expectStatus: 200 },
    
    // Tests d'authentification
    { name: '🔐 Register New User', endpoint: '/api/auth/register', method: 'POST', 
      body: { 
        email: `test-${Date.now()}@example.com`, 
        password: 'TestPassword123!',
        displayName: `TestUser${Date.now()}`,
        birthDate: '1990-01-01',
        legalConsent: { privacy: true, terms: true, dataProcessing: true }
      }, 
      expectStatus: 201 
    },
    
    // Tests fails publics
    { name: '📰 Public Fails', endpoint: '/api/fails/public', method: 'GET', expectStatus: 200 },
    { name: '📰 Public Fails avec pagination', endpoint: '/api/fails/public?page=1&limit=5', method: 'GET', expectStatus: 200 },
    
    // Tests fails protégés
    { name: '🔒 Protected Fails', endpoint: '/api/fails', method: 'GET', 
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }, 
      expectStatus: 200 
    },
    { name: '🔒 Protected Fails avec filtres', endpoint: '/api/fails?category=sport&limit=10', method: 'GET', 
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }, 
      expectStatus: 200 
    },
    
    // Tests utilisateur (avec ID spécifique)
    { name: '� User Stats (avec ID)', endpoint: '/api/users/57a2560d-b065-44f3-96c8-3b0d2e5b569b/stats', method: 'GET', 
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }, 
      expectStatus: 200 
    },
    
    // Tests badges (routes réelles)
    { name: '🏆 Available Badges', endpoint: '/api/badges/available', method: 'GET', 
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }, 
      expectStatus: 200 
    },
    { name: '🏆 Badge Definitions', endpoint: '/api/badges/definitions', method: 'GET', 
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }, 
      expectStatus: 200 
    },
    
    // Tests réactions et commentaires (sur un fail spécifique)
    { name: '� Reactions for specific fail', endpoint: '/api/fails/85efade8-0857-40a9-a790-8253c270157f/reactions', method: 'GET', 
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }, 
      expectStatus: 200 
    },
    { name: '💬 Comments for specific fail', endpoint: '/api/fails/85efade8-0857-40a9-a790-8253c270157f/comments', method: 'GET', 
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }, 
      expectStatus: 200 
    },
    
    // Tests uploads
    { name: '📤 Upload Info', endpoint: '/api/upload', method: 'GET', 
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }, 
      expectStatus: 405 // Method not allowed, mais endpoint existe
    },
    
    // Tests sans authentification (doivent échouer)
    { name: '❌ Protected Fails sans auth', endpoint: '/api/fails', method: 'GET', expectStatus: 401 },
    { name: '❌ Badges sans auth', endpoint: '/api/badges/available', method: 'GET', expectStatus: 401 },
    
    // Tests d'endpoints inexistants
    { name: '❌ Endpoint inexistant', endpoint: '/api/nonexistent', method: 'GET', expectStatus: 404 },
  ];

  console.log(`\n🧪 Exécution de ${tests.length} tests...\n`);

  for (const test of tests) {
    results.total++;
    console.log(`⏳ ${test.name}...`);
    
    const result = await testAPI(test.endpoint, test.method, test.body, test.headers || {});
    
    const passed = result.status === test.expectStatus;
    if (passed) {
      results.passed++;
      console.log(`  ✅ PASS (${result.status})`);
    } else {
      results.failed++;
      console.log(`  ❌ FAIL (attendu: ${test.expectStatus}, reçu: ${result.status})`);
      if (result.error) {
        console.log(`     Erreur: ${result.error}`);
      }
      if (result.data && result.data.message) {
        console.log(`     Message: ${result.data.message}`);
      }
    }

    // Stockage des détails pour le rapport
    results.details.push({
      name: test.name,
      endpoint: test.endpoint,
      method: test.method,
      expectedStatus: test.expectStatus,
      actualStatus: result.status,
      passed: passed,
      data: result.success ? (result.data ? 'Données reçues' : 'Aucune donnée') : 'Erreur',
      error: result.error || null
    });

    // Petite pause pour éviter de surcharger l'API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Rapport final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(60));
  console.log(`✅ Tests réussis: ${results.passed}/${results.total} (${Math.round(results.passed/results.total*100)}%)`);
  console.log(`❌ Tests échoués: ${results.failed}/${results.total} (${Math.round(results.failed/results.total*100)}%)`);

  if (results.failed > 0) {
    console.log('\n❌ TESTS ÉCHOUÉS:');
    results.details.filter(t => !t.passed).forEach(test => {
      console.log(`  - ${test.name}: ${test.actualStatus} (attendu: ${test.expectedStatus})`);
      if (test.error) console.log(`    Erreur: ${test.error}`);
    });
  }

  console.log('\n✅ TESTS RÉUSSIS:');
  results.details.filter(t => t.passed).forEach(test => {
    console.log(`  - ${test.name}: OK`);
  });

  console.log('\n🎯 ÉTAT GÉNÉRAL:');
  if (results.passed === results.total) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS ! L\'API fonctionne correctement.');
  } else if (results.passed > results.total * 0.8) {
    console.log('✅ La plupart des tests passent. Quelques problèmes mineurs à corriger.');
  } else if (results.passed > results.total * 0.5) {
    console.log('⚠️ Tests mitigés. Des problèmes significatifs existent.');
  } else {
    console.log('❌ Échec critique. L\'API a des problèmes majeurs.');
  }

  console.log('\n' + '='.repeat(60));
  return results;
}

// Exécution des tests
runCompleteAPITests()
  .then(results => {
    console.log('\n🏁 Tests terminés.');
    process.exit(results.failed === 0 ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  });
