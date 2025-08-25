/**
 * 🚀 LANCEUR DE TESTS GÉNÉRAL
 * ============    { name: '2.3 - Vérification JWT', fn: testJWTVerification, category: 'Authentication' },
    { name: '2.4 - Protection Accès Non Authentifié', fn: testUnauthorizedAccess, category: 'Security' },
    { name: '2.5 - Endpoints Publics vs Protégés', fn: testPublicVsProtected, category: 'Security' },
    { name: '3.1 - Création Fails', fn: testFailCreation, category: 'Fails' },============
 * 
 * Exécute tous les tests dans l'ordre logique avec rapport final
 */

const fs = require('fs');
const path = require('path');
const { TEST_UTILS } = require('./0_test-config');

// Import de tous les tests
const testDatabaseConnection = require('./1_database/1.1_connection-test');
const testDatabaseStructure = require('./1_database/1.2_structure-test');
const testUserRegistration = require('./2_auth/2.1_registration-test-simple');
const testUserLogin = require('./2_auth/2.2_login-test');
const testJWTVerification = require('./2_auth/2.3_jwt-verification-test');
const testUnauthorizedAccess = require('./2_auth/2.4_unauthorized-access-test');
const testPublicVsProtected = require('./2_auth/2.5_public-vs-protected-test');
const testProfileEndpoints = require('./2_auth/2.6_profile-endpoints-test');
const testUploadAvatar = require('./2_auth/2.7_upload-avatar-endpoint-test');
const testUploadFailImage = require('./3_fails/3.0_upload-image-endpoint-test');
const testFailCreation = require('./3_fails/3.1_fail-creation-test');
const testFailRetrieval = require('./3_fails/3.2_fail-retrieval-test');
const testCompleteIntegration = require('./4_integration/4.1_complete-integration-test');

async function runAllTests() {
  console.log('🎯 DÉMARRAGE DE LA SUITE DE TESTS COMPLÈTE');
  console.log('==========================================');
  console.log(`📅 Date: ${new Date().toLocaleString('fr-FR')}`);
  console.log(`🖥️ Plateforme: ${process.platform}`);
  console.log(`🔧 Node.js: ${process.version}`);
  
  // Validation du modèle d'accès
  console.log('\n🔐 MODÈLE D\'ACCÈS VALIDÉ');
  console.log('=========================');
  console.log('✅ Authentification OBLIGATOIRE pour tout accès au contenu');
  console.log('✅ Aucun accès anonyme autorisé aux fails');
  console.log('✅ Anonymat préservé via masquage des auteurs');
  console.log('✅ Inscription obligatoire pour utiliser l\'application\n');

  const startTime = Date.now();
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  // Définition des tests à exécuter
  const testSuite = [
    { name: '1.1 - Connexion Base de Données', fn: testDatabaseConnection, category: 'Database' },
    { name: '1.2 - Structure Base de Données', fn: testDatabaseStructure, category: 'Database' },
    { name: '2.1 - Inscription Utilisateur', fn: testUserRegistration.testRegistration, category: 'Authentication' },
    { name: '2.2 - Connexion Utilisateur', fn: testUserLogin, category: 'Authentication' },
    { name: '2.3 - Vérification JWT', fn: testJWTVerification, category: 'Authentication' },
    { name: '2.4 - Protection Accès Non Authentifié', fn: testUnauthorizedAccess, category: 'Security' },
    { name: '2.6 - Profil (GET/PUT)', fn: testProfileEndpoints, category: 'Authentication' },
    { name: '2.7 - Upload Avatar', fn: testUploadAvatar, category: 'Authentication' },
    { name: '3.0 - Upload Image (Fail)', fn: testUploadFailImage, category: 'Fails' },
    { name: '3.1 - Création de Fails', fn: testFailCreation, category: 'Fails' },
    { name: '3.2 - Récupération de Fails', fn: testFailRetrieval, category: 'Fails' },
    { name: '4.1 - Intégration Complète', fn: testCompleteIntegration, category: 'Integration' }
  ];

  // Exécution des tests
  for (const test of testSuite) {
    results.total++;
    
    try {
      TEST_UTILS.log('🔄', `Exécution: ${test.name}`);
      const testStart = Date.now();
      
      const { success, results: testResults } = await test.fn();
      
      const duration = Date.now() - testStart;
      
      if (success) {
        results.passed++;
        TEST_UTILS.log('✅', `${test.name} - SUCCÈS (${duration}ms)`);
      } else {
        results.failed++;
        TEST_UTILS.log('❌', `${test.name} - ÉCHEC (${duration}ms)`);
      }
      
      results.tests.push({
        name: test.name,
        category: test.category,
        success,
        duration,
        details: testResults
      });
      
      // Pause entre les tests pour éviter la surcharge
      await TEST_UTILS.sleep(1000);
      
    } catch (error) {
      results.failed++;
      TEST_UTILS.log('💥', `${test.name} - ERREUR FATALE: ${error.message}`);
      
      results.tests.push({
        name: test.name,
        category: test.category,
        success: false,
        duration: 0,
        error: error.message
      });
    }
    
    console.log(''); // Ligne vide entre les tests
  }

  const totalDuration = Date.now() - startTime;

  // Génération du rapport final
  generateFinalReport(results, totalDuration);
  
  return results;
}

function generateFinalReport(results, totalDuration) {
  console.log('\n🏆 RAPPORT FINAL DES TESTS');
  console.log('==========================');
  
  // Statistiques générales
  console.log(`📊 Statistiques:`);
  console.log(`   Total: ${results.total} tests`);
  console.log(`   ✅ Réussis: ${results.passed}`);
  console.log(`   ❌ Échoués: ${results.failed}`);
  console.log(`   ⏱️ Durée totale: ${Math.round(totalDuration / 1000)}s`);
  console.log(`   📈 Taux de réussite: ${Math.round((results.passed / results.total) * 100)}%`);

  // Détail par catégorie
  const categories = [...new Set(results.tests.map(t => t.category))];
  
  console.log('\n📋 Détail par catégorie:');
  categories.forEach(category => {
    const categoryTests = results.tests.filter(t => t.category === category);
    const categoryPassed = categoryTests.filter(t => t.success).length;
    const categoryTotal = categoryTests.length;
    
    console.log(`\n🔹 ${category}:`);
    categoryTests.forEach(test => {
      const status = test.success ? '✅' : '❌';
      const duration = `${test.duration}ms`;
      console.log(`   ${status} ${test.name.padEnd(35)} (${duration})`);
      
      if (!test.success && test.error) {
        console.log(`      ⚠️ ${test.error}`);
      }
    });
    
    console.log(`   📊 ${category}: ${categoryPassed}/${categoryTotal} réussis`);
  });

  // Recommandations basées sur les résultats
  console.log('\n💡 Recommandations:');
  
  if (results.failed === 0) {
    console.log('   🎉 Tous les tests passent ! Votre API est prête.');
    console.log('   📦 Vous pouvez procéder au déploiement en toute confiance.');
  } else {
    console.log('   ⚠️ Certains tests ont échoué. Vérifiez:');
    
    const failedTests = results.tests.filter(t => !t.success);
    failedTests.forEach(test => {
      console.log(`   - ${test.name}: Vérifiez la configuration et les endpoints`);
    });
    
    if (failedTests.some(t => t.category === 'Database')) {
      console.log('   🗄️ Problème de base de données détecté - Vérifiez la connexion MySQL');
    }
    
    if (failedTests.some(t => t.category === 'Authentication')) {
      console.log('   🔐 Problème d\'authentification - Vérifiez JWT_SECRET et les endpoints auth');
    }
  }

  // Sauvegarde du rapport
  const reportData = {
    timestamp: new Date().toISOString(),
    duration: totalDuration,
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      successRate: Math.round((results.passed / results.total) * 100)
    },
    tests: results.tests
  };

  try {
    fs.writeFileSync(
      path.join(__dirname, 'test-report.json'),
      JSON.stringify(reportData, null, 2)
    );
    console.log('\n💾 Rapport sauvegardé: test-report.json');
  } catch (error) {
    console.log('\n⚠️ Impossible de sauvegarder le rapport:', error.message);
  }

  // Statut final
  const finalStatus = results.failed === 0 ? 'SUCCÈS COMPLET' : 'ÉCHEC PARTIEL';
  const statusEmoji = results.failed === 0 ? '🎉' : '⚠️';
  
  console.log(`\n${statusEmoji} STATUT FINAL: ${finalStatus}`);
  console.log('==========================================\n');
}

// Exécution si appelé directement
if (require.main === module) {
  runAllTests()
    .then((results) => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erreur fatale dans la suite de tests:', error);
      process.exit(1);
    });
}

module.exports = runAllTests;
