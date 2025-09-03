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

async function testFrontendBackendIntegration() {
  try {
    console.log('🔧 Test d\'intégration Frontend-Backend pour le panneau admin...\n');
    
    let globalToken = null;
    let testResults = {
      auth: false,
      dashboardStats: false,
      singleTableTruncate: false,
      bulkTruncate: false,
      authTableTruncate: false,
      security: false
    };

    // =================================================================
    // 1. AUTHENTIFICATION COMME LE FERAIT LE FRONTEND
    // =================================================================
    console.log('🔐 Test 1: Authentification via frontend...');
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'bruno@taaazzz.be',
      password: '@51008473@'
    });

    if (loginResponse.status === 200 && loginResponse.data.token) {
      globalToken = loginResponse.data.token;
      testResults.auth = true;
      console.log('✅ Authentification réussie - Token reçu');
    } else {
      console.log('❌ Authentification échouée:', loginResponse.status, loginResponse.data);
      return testResults;
    }

    // =================================================================
    // 2. TEST DES STATISTIQUES DASHBOARD (COMME LE FRONTEND)
    // =================================================================
    console.log('\n📊 Test 2: Récupération des statistiques dashboard...');
    const statsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/dashboard/stats',
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${globalToken}`
      }
    });

    if (statsResponse.status === 200) {
      testResults.dashboardStats = true;
      console.log('✅ Statistiques récupérées avec succès');
      console.log('   - Données:', statsResponse.data.stats ? 'Présentes' : 'Vides');
    } else {
      console.log('❌ Erreur récupération stats:', statsResponse.status, statsResponse.data);
    }

    // =================================================================
    // 3. TEST TRUNCATE INDIVIDUEL (SIMULATION FRONTEND)
    // =================================================================
    console.log('\n🗑️  Test 3: Truncate table individuelle (simulation clic frontend)...');
    const truncateResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/tables/reaction_logs/truncate',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${globalToken}`
      }
    }, {
      isAuthTable: false
    });

    if (truncateResponse.status === 200 && truncateResponse.data.success) {
      testResults.singleTableTruncate = true;
      console.log('✅ Truncate individuel réussi:', truncateResponse.data.message);
    } else {
      console.log('❌ Truncate individuel échoué:', truncateResponse.status, truncateResponse.data);
    }

    // =================================================================
    // 4. TEST BULK TRUNCATE (SIMULATION ACTION GROUPÉE FRONTEND)
    // =================================================================
    console.log('\n📦 Test 4: Bulk truncate (simulation action groupée frontend)...');
    const bulkResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/tables/bulk-truncate',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${globalToken}`
      }
    }, {
      tables: ['activity_logs', 'system_logs'],
      isAuthTables: false
    });

    if (bulkResponse.status === 200) {
      testResults.bulkTruncate = true;
      console.log('✅ Bulk truncate réussi:', bulkResponse.data.message);
      if (bulkResponse.data.results) {
        bulkResponse.data.results.forEach(result => {
          console.log(`   - ${result.table}: ${result.success ? '✅' : '❌'}`);
        });
      }
    } else {
      console.log('❌ Bulk truncate échoué:', bulkResponse.status, bulkResponse.data);
    }

    // =================================================================
    // 5. TEST TABLE AUTH (SIMULATION CONFIRMATION FRONTEND)
    // =================================================================
    console.log('\n🔐 Test 5: Truncate table auth (simulation confirmation frontend)...');
    const authResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/tables/parental_consents/truncate',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${globalToken}`
      }
    }, {
      isAuthTable: true
    });

    if (authResponse.status === 200 && authResponse.data.success) {
      testResults.authTableTruncate = true;
      console.log('✅ Truncate table auth réussi:', authResponse.data.message);
    } else {
      console.log('❌ Truncate table auth échoué:', authResponse.status, authResponse.data);
    }

    // =================================================================
    // 6. TEST SÉCURITÉ (SIMULATION ATTAQUE FRONTEND)
    // =================================================================
    console.log('\n🛡️  Test 6: Sécurité (simulation tentative non autorisée)...');
    const securityResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/tables/malicious_table/truncate',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${globalToken}`
      }
    }, {
      isAuthTable: false
    });

    if (securityResponse.status === 400 && !securityResponse.data.success) {
      testResults.security = true;
      console.log('✅ Sécurité OK - table non autorisée rejetée');
    } else {
      console.log('❌ Problème de sécurité - table non autorisée acceptée:', securityResponse.status);
    }

    // =================================================================
    // RÉSUMÉ DES TESTS D'INTÉGRATION
    // =================================================================
    console.log('\n🎯 RÉSUMÉ DES TESTS D\'INTÉGRATION:');
    console.log('=====================================');
    
    const tests = [
      { name: 'Authentification frontend', status: testResults.auth },
      { name: 'Dashboard stats', status: testResults.dashboardStats },
      { name: 'Truncate individuel', status: testResults.singleTableTruncate },
      { name: 'Bulk truncate', status: testResults.bulkTruncate },
      { name: 'Auth table truncate', status: testResults.authTableTruncate },
      { name: 'Sécurité', status: testResults.security }
    ];

    let passedTests = 0;
    tests.forEach(test => {
      console.log(`${test.status ? '✅' : '❌'} ${test.name}`);
      if (test.status) passedTests++;
    });

    console.log(`\n📊 Score d'intégration: ${passedTests}/${tests.length} tests réussis`);
    
    if (passedTests === tests.length) {
      console.log('🎉 INTÉGRATION FRONTEND-BACKEND PARFAITE !');
      console.log('🚀 Le panneau admin est prêt pour la production !');
    } else {
      console.log('⚠️  Certains tests d\'intégration ont échoué');
    }

    return testResults;

  } catch (error) {
    console.error('❌ Erreur lors des tests d\'intégration:', error.message);
    return testResults;
  }
}

// Exécution du test d'intégration
testFrontendBackendIntegration();
