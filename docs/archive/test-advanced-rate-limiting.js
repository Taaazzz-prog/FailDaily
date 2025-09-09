// test-advanced-rate-limiting.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = 'your-admin-token-here'; // À remplacer par un vrai token admin

class RateLimitTester {
  constructor() {
    this.results = {
      ddosProtection: { passed: false, details: {} },
      authProtection: { passed: false, details: {} },
      uploadProtection: { passed: false, details: {} },
      globalLimiter: { passed: false, details: {} },
      monitoring: { passed: false, details: {} }
    };
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const response = await axios({
        method: 'GET',
        url: `${BASE_URL}${endpoint}`,
        timeout: 5000,
        ...options
      });
      return { status: response.status, data: response.data };
    } catch (error) {
      return { 
        status: error.response?.status || 0, 
        data: error.response?.data || { error: error.message } 
      };
    }
  }

  async testDDoSProtection() {
    console.log('\n🛡️ Test Protection DDoS (200 req/min)...');
    
    const startTime = Date.now();
    let successCount = 0;
    let blockedCount = 0;
    
    // Envoyer 220 requêtes rapidement pour dépasser la limite
    const promises = [];
    for (let i = 0; i < 220; i++) {
      promises.push(this.makeRequest('/api/health'));
    }
    
    const results = await Promise.all(promises);
    
    results.forEach(result => {
      if (result.status === 200) successCount++;
      else if (result.status === 429) blockedCount++;
    });
    
    const duration = Date.now() - startTime;
    
    this.results.ddosProtection = {
      passed: blockedCount > 0 && successCount <= 210,
      details: {
        totalRequests: 220,
        successCount,
        blockedCount,
        duration: `${duration}ms`,
        rateLimitWorking: blockedCount > 0
      }
    };
    
    console.log(`✅ Requêtes réussies: ${successCount}`);
    console.log(`🚫 Requêtes bloquées: ${blockedCount}`);
    console.log(`⏱️ Durée: ${duration}ms`);
    console.log(`📊 Protection DDoS: ${blockedCount > 0 ? 'ACTIVE' : 'INACTIVE'}`);
  }

  async testAuthProtection() {
    console.log('\n🔐 Test Protection Auth (10 tentatives/15min)...');
    
    let successCount = 0;
    let blockedCount = 0;
    
    // Simuler 15 tentatives de login échouées
    for (let i = 0; i < 15; i++) {
      const result = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        data: { email: 'test@example.com', password: 'wrongpassword' }
      });
      
      if (result.status === 401 || result.status === 400) successCount++;
      else if (result.status === 429) blockedCount++;
      
      await this.wait(100); // Petite pause entre les requêtes
    }
    
    this.results.authProtection = {
      passed: blockedCount >= 5, // Au moins 5 requêtes bloquées sur 15
      details: {
        totalAttempts: 15,
        processedAttempts: successCount,
        blockedAttempts: blockedCount,
        rateLimitWorking: blockedCount > 0
      }
    };
    
    console.log(`✅ Tentatives traitées: ${successCount}`);
    console.log(`🚫 Tentatives bloquées: ${blockedCount}`);
    console.log(`📊 Protection Auth: ${blockedCount > 0 ? 'ACTIVE' : 'INACTIVE'}`);
  }

  async testGlobalLimiter() {
    console.log('\n🌐 Test Limiteur Global (5000 req/15min)...');
    
    // Test avec un volume normal (100 requêtes)
    let successCount = 0;
    let blockedCount = 0;
    
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(this.makeRequest('/api/health'));
    }
    
    const results = await Promise.all(promises);
    
    results.forEach(result => {
      if (result.status === 200) successCount++;
      else if (result.status === 429) blockedCount++;
    });
    
    this.results.globalLimiter = {
      passed: successCount >= 90, // La plupart devraient passer
      details: {
        totalRequests: 100,
        successCount,
        blockedCount,
        shouldAllowNormalUsage: successCount >= 90
      }
    };
    
    console.log(`✅ Requêtes réussies: ${successCount}`);
    console.log(`🚫 Requêtes bloquées: ${blockedCount}`);
    console.log(`📊 Usage normal: ${successCount >= 90 ? 'AUTORISÉ' : 'PROBLÈME'}`);
  }

  async testMonitoringEndpoints() {
    console.log('\n📊 Test Endpoints de Monitoring...');
    
    if (!ADMIN_TOKEN || ADMIN_TOKEN === 'your-admin-token-here') {
      console.log('⚠️ Token admin non configuré, test ignoré');
      this.results.monitoring = { passed: false, details: { error: 'No admin token' } };
      return;
    }
    
    // Test stats endpoint
    const statsResult = await this.makeRequest('/api/monitoring/rate-limit-stats', {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    
    // Test suspicious IPs endpoint
    const ipsResult = await this.makeRequest('/api/monitoring/suspicious-ips', {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    
    this.results.monitoring = {
      passed: statsResult.status === 200 && ipsResult.status === 200,
      details: {
        statsEndpoint: statsResult.status,
        ipsEndpoint: ipsResult.status,
        statsData: statsResult.data?.success ? 'OK' : 'Error',
        ipsData: ipsResult.data?.success ? 'OK' : 'Error'
      }
    };
    
    console.log(`📈 Stats endpoint: ${statsResult.status === 200 ? 'OK' : 'ERREUR'}`);
    console.log(`🚨 IPs endpoint: ${ipsResult.status === 200 ? 'OK' : 'ERREUR'}`);
  }

  async runAllTests() {
    console.log('🚀 Démarrage des tests du système de rate limiting avancé...');
    console.log(`🎯 URL de test: ${BASE_URL}`);
    
    try {
      // Vérifier que le serveur répond
      const healthCheck = await this.makeRequest('/api/health');
      if (healthCheck.status !== 200) {
        throw new Error(`Serveur non disponible: ${healthCheck.status}`);
      }
      
      await this.testDDoSProtection();
      await this.wait(2000); // Pause entre les tests
      
      await this.testAuthProtection();
      await this.wait(2000);
      
      await this.testGlobalLimiter();
      await this.wait(1000);
      
      await this.testMonitoringEndpoints();
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Erreur lors des tests:', error.message);
    }
  }

  printResults() {
    console.log('\n🏁 RÉSULTATS DES TESTS');
    console.log('========================');
    
    const tests = [
      { name: 'Protection DDoS', key: 'ddosProtection', icon: '🛡️' },
      { name: 'Protection Auth', key: 'authProtection', icon: '🔐' },
      { name: 'Limiteur Global', key: 'globalLimiter', icon: '🌐' },
      { name: 'Monitoring', key: 'monitoring', icon: '📊' }
    ];
    
    let passedCount = 0;
    
    tests.forEach(test => {
      const result = this.results[test.key];
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${test.icon} ${test.name}: ${status}`);
      
      if (result.passed) passedCount++;
      
      // Afficher les détails en cas d'échec
      if (!result.passed) {
        console.log(`   Détails:`, JSON.stringify(result.details, null, 2));
      }
    });
    
    console.log('\n📈 SCORE GLOBAL');
    console.log(`${passedCount}/${tests.length} tests réussis`);
    
    if (passedCount === tests.length) {
      console.log('🎉 TOUS LES TESTS SONT PASSÉS!');
      console.log('✅ Le système de rate limiting avancé fonctionne correctement');
    } else {
      console.log('⚠️ Certains tests ont échoué, vérifiez la configuration');
    }
    
    console.log('\n💡 RECOMMANDATIONS:');
    console.log('- Vérifiez que le serveur backend est démarré');
    console.log('- Configurez un token admin valide pour tester le monitoring');
    console.log('- Les tests peuvent prendre quelques minutes à s\'exécuter');
  }
}

// Exécution des tests si le script est appelé directement
if (require.main === module) {
  const tester = new RateLimitTester();
  tester.runAllTests();
}

module.exports = RateLimitTester;
