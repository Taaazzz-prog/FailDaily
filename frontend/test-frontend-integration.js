/**
 * TESTS D'INTÉGRATION FRONTEND-BACKEND
 * =====================================
 * Tests complets de l'application FailDaily côté frontend
 * 
 * ⚠️  PRÉREQUIS: Backend en cours d'exécution sur localhost:3000
 */

import { spawn } from 'child_process';
import fetch from 'node-fetch';

// Configuration des tests
const BACKEND_URL = 'http://localhost:3000/api';
const FRONTEND_URL = 'http://localhost:4200';
const TESTS_CONFIG = {
  timeout: 30000,
  retryAttempts: 3,
  waitTime: 2000
};

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class FrontendTestSuite {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==========================================
  // 🔍 VÉRIFICATIONS PRÉLIMINAIRES
  // ==========================================

  async checkBackendStatus() {
    this.log('\n🔍 Vérification du backend...', colors.cyan);
    try {
      const response = await fetch(`${BACKEND_URL}/health`, {
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        this.log(`✅ Backend opérationnel: ${data.message}`, colors.green);
        return true;
      } else {
        this.log(`❌ Backend erreur: ${response.status}`, colors.red);
        return false;
      }
    } catch (error) {
      this.log(`❌ Backend inaccessible: ${error.message}`, colors.red);
      return false;
    }
  }

  async checkFrontendStatus() {
    this.log('\n🔍 Vérification du frontend...', colors.cyan);
    try {
      const response = await fetch(FRONTEND_URL, {
        timeout: 5000
      });
      
      if (response.ok) {
        this.log(`✅ Frontend accessible sur ${FRONTEND_URL}`, colors.green);
        return true;
      } else {
        this.log(`❌ Frontend erreur: ${response.status}`, colors.red);
        return false;
      }
    } catch (error) {
      this.log(`❌ Frontend inaccessible: ${error.message}`, colors.red);
      this.log(`💡 Suggestion: Lancez 'cd frontend && npm start'`, colors.yellow);
      return false;
    }
  }

  // ==========================================
  // 🧪 TESTS DE SERVICES ANGULAR
  // ==========================================

  async testAngularEnvironment() {
    this.log('\n🧪 Test: Configuration environnement Angular', colors.blue);
    this.results.total++;

    try {
      // Vérifier que les fichiers de config existent
      const fs = await import('fs');
      const path = await import('path');
      
      const envPath = path.join(process.cwd(), 'frontend', 'src', 'environments', 'environment.ts');
      const packagePath = path.join(process.cwd(), 'frontend', 'package.json');
      const angularPath = path.join(process.cwd(), 'frontend', 'angular.json');

      if (!fs.existsSync(envPath)) {
        throw new Error('Fichier environment.ts manquant');
      }
      if (!fs.existsSync(packagePath)) {
        throw new Error('Fichier package.json manquant');
      }
      if (!fs.existsSync(angularPath)) {
        throw new Error('Fichier angular.json manquant');
      }

      // Vérifier la configuration API
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (!envContent.includes('http://localhost:3000/api')) {
        throw new Error('Configuration API incorrecte dans environment.ts');
      }

      this.log(`✅ Configuration Angular valide`, colors.green);
      this.results.passed++;
      return true;

    } catch (error) {
      this.log(`❌ Erreur configuration: ${error.message}`, colors.red);
      this.results.failed++;
      this.results.errors.push(`Configuration Angular: ${error.message}`);
      return false;
    }
  }

  async testAPIServices() {
    this.log('\n🧪 Test: Services API Frontend', colors.blue);
    this.results.total++;

    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const servicesPath = path.join(process.cwd(), 'frontend', 'src', 'app', 'services');
      
      // Vérifier les services critiques
      const criticalServices = [
        'auth.service.ts',
        'mysql.service.ts',
        'fail.service.ts',
        'badge.service.ts'
      ];

      for (const service of criticalServices) {
        const servicePath = path.join(servicesPath, service);
        if (!fs.existsSync(servicePath)) {
          throw new Error(`Service manquant: ${service}`);
        }

        // Vérifier que le service utilise la bonne URL
        const content = fs.readFileSync(servicePath, 'utf8');
        if (service === 'mysql.service.ts' && !content.includes('environment.api.baseUrl')) {
          throw new Error(`Service ${service} ne référence pas l'environment`);
        }
      }

      this.log(`✅ Services API présents et configurés`, colors.green);
      this.results.passed++;
      return true;

    } catch (error) {
      this.log(`❌ Erreur services: ${error.message}`, colors.red);
      this.results.failed++;
      this.results.errors.push(`Services API: ${error.message}`);
      return false;
    }
  }

  // ==========================================
  // 🌐 TESTS D'INTÉGRATION HTTP
  // ==========================================

  async testCORSConfiguration() {
    this.log('\n🧪 Test: Configuration CORS', colors.blue);
    this.results.total++;

    try {
      // Simuler une requête CORS depuis le frontend
      const response = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        headers: {
          'Origin': FRONTEND_URL,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type,Authorization'
        }
      });

      const corsHeaders = response.headers.get('access-control-allow-origin');
      
      if (response.ok && (corsHeaders === '*' || corsHeaders === FRONTEND_URL)) {
        this.log(`✅ CORS configuré correctement`, colors.green);
        this.results.passed++;
        return true;
      } else {
        throw new Error(`CORS mal configuré. Headers: ${corsHeaders}`);
      }

    } catch (error) {
      this.log(`❌ Erreur CORS: ${error.message}`, colors.red);
      this.results.failed++;
      this.results.errors.push(`CORS: ${error.message}`);
      return false;
    }
  }

  async testAPIConnectivity() {
    this.log('\n🧪 Test: Connectivité API depuis Frontend', colors.blue);
    this.results.total++;

    try {
      // Tester les endpoints principaux
      const endpoints = [
        { url: '/health', method: 'GET', expected: 200 },
        { url: '/auth/register', method: 'POST', expected: 400 }, // Sans données
        { url: '/fails/public', method: 'GET', expected: 401 }, // Nécessite auth
        { url: '/badges/available', method: 'GET', expected: 401 } // Nécessite auth
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${BACKEND_URL}${endpoint.url}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'Origin': FRONTEND_URL
          }
        });

        if (response.status !== endpoint.expected) {
          throw new Error(`Endpoint ${endpoint.url}: attendu ${endpoint.expected}, reçu ${response.status}`);
        }
      }

      this.log(`✅ Connectivité API fonctionnelle`, colors.green);
      this.results.passed++;
      return true;

    } catch (error) {
      this.log(`❌ Erreur connectivité: ${error.message}`, colors.red);
      this.results.failed++;
      this.results.errors.push(`Connectivité API: ${error.message}`);
      return false;
    }
  }

  // ==========================================
  // 🔐 TESTS D'AUTHENTIFICATION
  // ==========================================

  async testAuthenticationFlow() {
    this.log('\n🧪 Test: Flux d\'authentification Frontend', colors.blue);
    this.results.total++;

    try {
      // 1. Test inscription
      const registerData = {
        email: `test_frontend_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        displayName: `TestUser${Date.now()}`,
        legalConsent: {
          documentsAccepted: ['terms', 'privacy'],
          consentDate: new Date().toISOString(),
          consentVersion: '1.0',
          marketingOptIn: false
        },
        ageVerification: {
          birthDate: '1990-01-01',
          isMinor: false,
          needsParentalConsent: false
        }
      };

      const registerResponse = await fetch(`${BACKEND_URL}/registration/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': FRONTEND_URL
        },
        body: JSON.stringify(registerData)
      });

      if (!registerResponse.ok) {
        const error = await registerResponse.text();
        throw new Error(`Inscription échouée: ${error}`);
      }

      // 2. Test connexion
      const loginResponse = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': FRONTEND_URL
        },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password
        })
      });

      if (!loginResponse.ok) {
        throw new Error('Connexion échouée');
      }

      const loginData = await loginResponse.json();
      if (!loginData.token) {
        throw new Error('Token JWT manquant');
      }

      // 3. Test accès protégé
      const profileResponse = await fetch(`${BACKEND_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Origin': FRONTEND_URL
        }
      });

      if (!profileResponse.ok) {
        throw new Error('Accès au profil échoué');
      }

      this.log(`✅ Flux d'authentification complet fonctionnel`, colors.green);
      this.results.passed++;
      return { success: true, token: loginData.token };

    } catch (error) {
      this.log(`❌ Erreur authentification: ${error.message}`, colors.red);
      this.results.failed++;
      this.results.errors.push(`Authentification: ${error.message}`);
      return { success: false };
    }
  }

  // ==========================================
  // 📱 TESTS DE FONCTIONNALITÉS
  // ==========================================

  async testDataRetrieval(token) {
    this.log('\n🧪 Test: Récupération des données', colors.blue);
    this.results.total++;

    if (!token) {
      this.log(`⚠️  Skippé: Token manquant`, colors.yellow);
      return false;
    }

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': FRONTEND_URL
      };

      // Test récupération des fails
      const failsResponse = await fetch(`${BACKEND_URL}/fails/public?page=1&limit=10`, {
        headers
      });

      if (!failsResponse.ok) {
        throw new Error(`Récupération fails échouée: ${failsResponse.status}`);
      }

      // Test récupération des badges
      const badgesResponse = await fetch(`${BACKEND_URL}/badges/available`, {
        headers
      });

      if (!badgesResponse.ok) {
        throw new Error(`Récupération badges échouée: ${badgesResponse.status}`);
      }

      // Vérifier la structure des données
      const failsData = await failsResponse.json();
      const badgesData = await badgesResponse.json();

      if (!Array.isArray(failsData.fails)) {
        throw new Error('Structure de données fails incorrecte');
      }

      if (!Array.isArray(badgesData)) {
        throw new Error('Structure de données badges incorrecte');
      }

      this.log(`✅ Récupération des données fonctionnelle`, colors.green);
      this.results.passed++;
      return true;

    } catch (error) {
      this.log(`❌ Erreur récupération: ${error.message}`, colors.red);
      this.results.failed++;
      this.results.errors.push(`Récupération données: ${error.message}`);
      return false;
    }
  }

  // ==========================================
  // 📊 RAPPORT FINAL
  // ==========================================

  generateReport() {
    this.log('\n' + '='.repeat(50), colors.bright);
    this.log('📊 RAPPORT DE TESTS FRONTEND', colors.bright);
    this.log('='.repeat(50), colors.bright);
    
    this.log(`\n📈 RÉSULTATS:`, colors.bright);
    this.log(`   Total des tests: ${this.results.total}`, colors.cyan);
    this.log(`   Tests réussis:   ${this.results.passed} ✅`, colors.green);
    this.log(`   Tests échoués:   ${this.results.failed} ❌`, colors.red);
    
    const successRate = this.results.total > 0 ? 
      ((this.results.passed / this.results.total) * 100).toFixed(1) : 0;
    
    this.log(`   Taux de réussite: ${successRate}%`, 
      successRate >= 80 ? colors.green : successRate >= 60 ? colors.yellow : colors.red);

    if (this.results.errors.length > 0) {
      this.log(`\n🔍 ERREURS DÉTECTÉES:`, colors.red);
      this.results.errors.forEach((error, index) => {
        this.log(`   ${index + 1}. ${error}`, colors.red);
      });
    }

    this.log(`\n💡 RECOMMANDATIONS:`, colors.yellow);
    
    if (this.results.failed === 0) {
      this.log(`   🎉 Félicitations ! Tous les tests frontend passent.`, colors.green);
      this.log(`   🔗 L'intégration Frontend-Backend est fonctionnelle.`, colors.green);
    } else {
      if (this.results.errors.some(e => e.includes('inaccessible'))) {
        this.log(`   1. Démarrer le serveur frontend: cd frontend && npm start`, colors.yellow);
      }
      if (this.results.errors.some(e => e.includes('CORS'))) {
        this.log(`   2. Vérifier la configuration CORS du backend`, colors.yellow);
      }
      if (this.results.errors.some(e => e.includes('Configuration'))) {
        this.log(`   3. Vérifier les fichiers de configuration Angular`, colors.yellow);
      }
    }

    return {
      success: this.results.failed === 0,
      totalTests: this.results.total,
      passedTests: this.results.passed,
      failedTests: this.results.failed,
      successRate: parseFloat(successRate),
      errors: this.results.errors
    };
  }

  // ==========================================
  // 🚀 EXÉCUTION PRINCIPALE
  // ==========================================

  async runAllTests() {
    this.log('🚀 DÉMARRAGE DES TESTS FRONTEND', colors.bright);
    this.log('=====================================', colors.bright);
    this.log(`Backend: ${BACKEND_URL}`, colors.cyan);
    this.log(`Frontend: ${FRONTEND_URL}`, colors.cyan);

    // Vérifications préliminaires
    const backendOk = await this.checkBackendStatus();
    if (!backendOk) {
      this.log('\n❌ Backend non disponible. Tests interrompus.', colors.red);
      return this.generateReport();
    }

    const frontendOk = await this.checkFrontendStatus();
    // Note: On continue même si le frontend n'est pas démarré (tests de config)

    // Tests de configuration
    await this.testAngularEnvironment();
    await this.testAPIServices();

    // Tests d'intégration (si backend disponible)
    if (backendOk) {
      await this.testCORSConfiguration();
      await this.testAPIConnectivity();
      
      const authResult = await this.testAuthenticationFlow();
      if (authResult.success) {
        await this.testDataRetrieval(authResult.token);
      }
    }

    return this.generateReport();
  }
}

// ==========================================
// 🏃‍♂️ EXÉCUTION
// ==========================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new FrontendTestSuite();
  
  testSuite.runAllTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export default FrontendTestSuite;
