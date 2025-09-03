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

async function testAdminDatabaseManagement() {
  try {
    console.log('🔧 Test complet de la gestion de base de données admin...\n');
    
    let globalToken = null;
    let testResults = {
      auth: false,
      stats: false,
      tableListSafe: false,
      tableListAuth: false,
      singleTruncateSafe: false,
      singleTruncateAuth: false,
      bulkTruncateSafe: false,
      bulkTruncateAuth: false,
      securityCheck: false
    };

    // =================================================================
    // 1. TEST D'AUTHENTIFICATION ADMIN
    // =================================================================
    console.log('🔐 Test 1: Authentification admin...');
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

    if (loginResponse.status !== 200) {
      console.log('❌ Connexion admin échouée');
      console.log('   Status:', loginResponse.status);
      console.log('   Response:', loginResponse.data);
      return testResults;
    }

    globalToken = loginResponse.data.token;
    const userRole = loginResponse.data.user?.role;
    
    if (!['admin', 'super_admin'].includes(userRole)) {
      console.log('❌ Utilisateur sans privilèges admin suffisants:', userRole);
      return testResults;
    }
    
    testResults.auth = true;
    console.log('✅ Connexion admin réussie - Rôle:', userRole);

    // =================================================================
    // 2. TEST DES STATISTIQUES DASHBOARD
    // =================================================================
    console.log('\n📊 Test 2: Statistiques du dashboard...');
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
      testResults.stats = true;
      console.log('✅ Statistiques récupérées:');
      console.log('   - Utilisateurs:', statsResponse.data.stats?.users || 'N/A');
      console.log('   - Fails:', statsResponse.data.stats?.fails || 'N/A');
      console.log('   - Réactions:', statsResponse.data.stats?.reactions || 'N/A');
    } else {
      console.log('❌ Erreur récupération stats:', statsResponse.status, statsResponse.data);
    }

    // =================================================================
    // 3. TEST VIDAGE TABLE SAFE (NON-AUTH)
    // =================================================================
    console.log('\n🗑️  Test 3: Vidage de table safe (reaction_logs)...');
    const truncateSafeResponse = await makeRequest({
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

    if (truncateSafeResponse.status === 200 && truncateSafeResponse.data.success) {
      testResults.singleTruncateSafe = true;
      console.log('✅ Vidage de table safe réussi:', truncateSafeResponse.data.message);
    } else {
      console.log('❌ Vidage de table safe échoué:', truncateSafeResponse.status, truncateSafeResponse.data);
    }

    // =================================================================
    // 4. TEST VIDAGE TABLE AUTH AVEC CONFIRMATION
    // =================================================================
    console.log('\n🔐 Test 4: Vidage de table auth avec confirmation (user_preferences)...');
    const truncateAuthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/tables/user_preferences/truncate',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${globalToken}`
      }
    }, {
      isAuthTable: true
    });

    if (truncateAuthResponse.status === 200 && truncateAuthResponse.data.success) {
      testResults.singleTruncateAuth = true;
      console.log('✅ Vidage de table auth réussi:', truncateAuthResponse.data.message);
    } else {
      console.log('❌ Vidage de table auth échoué:', truncateAuthResponse.status, truncateAuthResponse.data);
    }

    // =================================================================
    // 5. TEST VIDAGE EN MASSE - TABLES SAFE
    // =================================================================
    console.log('\n📦 Test 5: Vidage en masse - tables safe...');
    const bulkTruncateSafeResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/tables/bulk-truncate',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${globalToken}`
      }
    }, {
      tables: ['activity_logs', 'system_logs', 'reaction_logs'],
      isAuthTables: false
    });

    if (bulkTruncateSafeResponse.status === 200) {
      testResults.bulkTruncateSafe = true;
      console.log('✅ Vidage en masse safe réussi:', bulkTruncateSafeResponse.data.message);
      if (bulkTruncateSafeResponse.data.results) {
        bulkTruncateSafeResponse.data.results.forEach(result => {
          console.log(`   - ${result.table}: ${result.success ? '✅' : '❌'}`);
        });
      }
    } else {
      console.log('❌ Vidage en masse safe échoué:', bulkTruncateSafeResponse.status, bulkTruncateSafeResponse.data);
    }

    // =================================================================
    // 6. TEST VIDAGE EN MASSE - TABLES AUTH
    // =================================================================
    console.log('\n🔒 Test 6: Vidage en masse - tables auth...');
    const bulkTruncateAuthResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/tables/bulk-truncate',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${globalToken}`
      }
    }, {
      tables: ['user_preferences', 'parental_consents'],
      isAuthTables: true
    });

    if (bulkTruncateAuthResponse.status === 200) {
      testResults.bulkTruncateAuth = true;
      console.log('✅ Vidage en masse auth réussi:', bulkTruncateAuthResponse.data.message);
      if (bulkTruncateAuthResponse.data.results) {
        bulkTruncateAuthResponse.data.results.forEach(result => {
          console.log(`   - ${result.table}: ${result.success ? '✅' : '❌'}`);
        });
      }
    } else {
      console.log('❌ Vidage en masse auth échoué:', bulkTruncateAuthResponse.status, bulkTruncateAuthResponse.data);
    }

    // =================================================================
    // 7. TEST DE SÉCURITÉ - TABLE NON AUTORISÉE
    // =================================================================
    console.log('\n🛡️  Test 7: Sécurité - table non autorisée...');
    const securityTestResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/tables/non_existent_table/truncate',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${globalToken}`
      }
    }, {
      isAuthTable: false
    });

    if (securityTestResponse.status === 400 && !securityTestResponse.data.success) {
      testResults.securityCheck = true;
      console.log('✅ Sécurité OK - table non autorisée rejetée:', securityTestResponse.data.message);
    } else {
      console.log('❌ Problème de sécurité - table non autorisée acceptée:', securityTestResponse.status, securityTestResponse.data);
    }

    // =================================================================
    // 8. TEST DE SÉCURITÉ - TABLE AUTH SANS CONFIRMATION
    // =================================================================
    console.log('\n🚨 Test 8: Sécurité - table auth sans confirmation...');
    const authSecurityTestResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/tables/users/truncate',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${globalToken}`
      }
    }, {
      isAuthTable: false  // VOLONTAIREMENT FAUX pour tester la sécurité
    });

    if (authSecurityTestResponse.status === 400 && !authSecurityTestResponse.data.success) {
      console.log('✅ Sécurité OK - table auth sans confirmation rejetée:', authSecurityTestResponse.data.message);
    } else {
      console.log('❌ Problème de sécurité - table auth sans confirmation acceptée:', authSecurityTestResponse.status, authSecurityTestResponse.data);
    }

    // =================================================================
    // RÉSUMÉ DES TESTS
    // =================================================================
    console.log('\n� RÉSUMÉ DES TESTS:');
    console.log('==================');
    
    const tests = [
      { name: 'Authentification admin', status: testResults.auth },
      { name: 'Statistiques dashboard', status: testResults.stats },
      { name: 'Vidage table safe', status: testResults.singleTruncateSafe },
      { name: 'Vidage table auth', status: testResults.singleTruncateAuth },
      { name: 'Vidage en masse safe', status: testResults.bulkTruncateSafe },
      { name: 'Vidage en masse auth', status: testResults.bulkTruncateAuth },
      { name: 'Contrôle sécurité', status: testResults.securityCheck }
    ];

    let passedTests = 0;
    tests.forEach(test => {
      console.log(`${test.status ? '✅' : '❌'} ${test.name}`);
      if (test.status) passedTests++;
    });

    console.log(`\n📊 Score: ${passedTests}/${tests.length} tests réussis`);
    
    if (passedTests === tests.length) {
      console.log('🎉 TOUS LES TESTS SONT PASSÉS - LE SYSTÈME EST OPÉRATIONNEL !');
    } else {
      console.log('⚠️  Certains tests ont échoué - vérifiez la configuration');
    }

    return testResults;

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    return testResults;
  }
}

// Exécution du test
testAdminDatabaseManagement();
