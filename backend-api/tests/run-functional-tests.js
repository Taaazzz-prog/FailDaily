/**
 * 🎯 LANCEUR TESTS FONCTIONNELS COMPLETS - FailDaily
 * ===================================================
 * 
 * Exécute les tests fonctionnels approfondis incluant :
 * - Tests de gestion de profil complets
 * - Tests de workflow utilisateur bout-en-bout
 * - Tests de réinitialisation de mot de passe
 * - Validation de toutes les fonctionnalités utilisateur
 * 
 * @author FailDaily Team
 * @date 2025-10-17
 */

const { spawn } = require('child_process');
const path = require('path');
const { TEST_UTILS } = require('./0_test-config');

// Configuration des nouveaux tests
const FUNCTIONAL_TESTS = [
  {
    name: '6.1 - Gestion Profil Utilisateur',
    path: './6_profile_management/6.1_profile-update-test.js',
    category: 'Profile Management',
    description: 'Tests complets de modification de profil, préférences, et validation'
  },
  {
    name: '7.1 - Workflow Complet Application',
    path: './7_functional/7.1_complete-workflow-test.js',
    category: 'Functional Testing',
    description: 'Tests bout-en-bout couvrant tout le cycle de vie utilisateur'
  },
  {
    name: '8.1 - Réinitialisation Mot de Passe',
    path: './8_password_reset/8.1_password-reset-test.js',
    category: 'Security & Auth',
    description: 'Tests complets du processus de reset de mot de passe'
  }
];

/**
 * Lance Jest pour un fichier de test spécifique
 */
function runJestTest(testPath) {
  return new Promise((resolve) => {
    const jestProcess = spawn('npx', ['jest', testPath, '--verbose'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    jestProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    jestProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    jestProcess.on('close', (code) => {
      resolve({
        success: code === 0,
        stdout,
        stderr,
        exitCode: code
      });
    });
  });
}

/**
 * Analyse les résultats Jest pour extraire les statistiques
 */
function parseJestResults(stdout) {
  const lines = stdout.split('\n');
  let stats = {
    tests: 0,
    passed: 0,
    failed: 0,
    suites: 0,
    time: '0s'
  };

  // Rechercher la ligne de résumé Jest
  const summaryLine = lines.find(line => 
    line.includes('Tests:') && (line.includes('passed') || line.includes('failed'))
  );

  if (summaryLine) {
    // Extraire les nombres des résultats
    const passedMatch = summaryLine.match(/(\d+) passed/);
    const failedMatch = summaryLine.match(/(\d+) failed/);
    const totalMatch = summaryLine.match(/(\d+) total/);

    if (passedMatch) stats.passed = parseInt(passedMatch[1]);
    if (failedMatch) stats.failed = parseInt(failedMatch[1]);
    if (totalMatch) stats.tests = parseInt(totalMatch[1]);
  }

  // Rechercher ligne test suites
  const suitesLine = lines.find(line => line.includes('Test Suites:'));
  if (suitesLine) {
    const suitesMatch = suitesLine.match(/(\d+) passed/);
    if (suitesMatch) stats.suites = parseInt(suitesMatch[1]);
  }

  // Rechercher le temps d'exécution
  const timeLine = lines.find(line => line.includes('Time:'));
  if (timeLine) {
    const timeMatch = timeLine.match(/Time:\s+(.+)/);
    if (timeMatch) stats.time = timeMatch[1].trim();
  }

  return stats;
}

/**
 * Fonction principale d'exécution des tests fonctionnels
 */
async function runFunctionalTests() {
  console.log('🎯 LANCEMENT DES TESTS FONCTIONNELS APPROFONDIS');
  console.log('===============================================');
  console.log(`📅 Date: ${new Date().toLocaleString('fr-FR')}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Répertoire: ${__dirname}`);
  console.log();

  const startTime = Date.now();
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    suites: 0,
    tests: []
  };

  // Exécution de chaque test
  for (const test of FUNCTIONAL_TESTS) {
    console.log(`🔄 Exécution: ${test.name}`);
    console.log(`📋 Description: ${test.description}`);
    console.log(`📂 Fichier: ${test.path}`);
    
    const testStart = Date.now();
    
    try {
      const testResult = await runJestTest(test.path);
      const testDuration = Date.now() - testStart;
      const stats = parseJestResults(testResult.stdout);

      // Mise à jour des résultats globaux
      results.total += stats.tests;
      results.passed += stats.passed;
      results.failed += stats.failed;
      results.suites += stats.suites;

      // Affichage des résultats
      if (testResult.success && stats.failed === 0) {
        console.log(`✅ ${test.name} - SUCCÈS`);
        console.log(`   📊 ${stats.passed} tests passés (${testDuration}ms)`);
      } else {
        console.log(`❌ ${test.name} - ÉCHEC`);
        console.log(`   📊 ${stats.passed} passés, ${stats.failed} échoués`);
        
        // Afficher les erreurs spécifiques
        if (testResult.stderr) {
          console.log(`   ⚠️ Erreurs:`);
          const errorLines = testResult.stderr.split('\n')
            .filter(line => line.trim() && !line.includes('deprecation'))
            .slice(0, 3); // Limiter à 3 lignes d'erreur
          
          errorLines.forEach(line => {
            console.log(`      ${line.trim()}`);
          });
        }
      }

      // Enregistrer le test
      results.tests.push({
        name: test.name,
        category: test.category,
        path: test.path,
        success: testResult.success && stats.failed === 0,
        duration: testDuration,
        stats: stats,
        error: testResult.success ? null : testResult.stderr
      });

      console.log(); // Ligne vide entre les tests

      // Pause entre les tests pour stabilité
      await TEST_UTILS.sleep(2000);

    } catch (error) {
      console.log(`💥 ${test.name} - ERREUR FATALE`);
      console.log(`   ⚠️ ${error.message}`);
      
      results.total += 1; // Compter comme un test qui a échoué
      results.failed += 1;

      results.tests.push({
        name: test.name,
        category: test.category,
        path: test.path,
        success: false,
        duration: Date.now() - testStart,
        stats: { tests: 0, passed: 0, failed: 1 },
        error: error.message
      });

      console.log();
    }
  }

  const totalDuration = Date.now() - startTime;

  // Génération du rapport final
  generateFunctionalReport(results, totalDuration);
  
  return results;
}

/**
 * Génère le rapport final détaillé
 */
function generateFunctionalReport(results, totalDuration) {
  console.log('🏆 RAPPORT FINAL - TESTS FONCTIONNELS');
  console.log('=====================================');

  // Statistiques globales
  const successRate = results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0;
  
  console.log(`📊 Résultats Globaux:`);
  console.log(`   🧪 Total des tests: ${results.total}`);
  console.log(`   ✅ Tests réussis: ${results.passed}`);
  console.log(`   ❌ Tests échoués: ${results.failed}`);
  console.log(`   📦 Suites passées: ${results.suites}`);
  console.log(`   ⏱️ Durée totale: ${Math.round(totalDuration / 1000)}s`);
  console.log(`   📈 Taux de réussite: ${successRate}%`);
  console.log();

  // Détail par catégorie
  const categories = [...new Set(results.tests.map(t => t.category))];
  
  console.log('📋 Détail par Fonctionnalité:');
  categories.forEach(category => {
    const categoryTests = results.tests.filter(t => t.category === category);
    
    console.log(`\n🔹 ${category}:`);
    categoryTests.forEach(test => {
      const status = test.success ? '✅' : '❌';
      const duration = `${test.duration}ms`;
      const testInfo = `${test.stats.passed}/${test.stats.tests} tests`;
      
      console.log(`   ${status} ${test.name}`);
      console.log(`      📊 ${testInfo} | ⏱️ ${duration}`);
      
      if (!test.success && test.error) {
        // Afficher les première lignes d'erreur seulement
        const errorPreview = test.error.split('\n')[0];
        console.log(`      ⚠️ ${errorPreview.substring(0, 80)}...`);
      }
    });
  });

  // Évaluation de l'état de l'application
  console.log('\n🔍 ÉVALUATION DE L\'APPLICATION:');
  console.log('===============================');

  if (results.failed === 0) {
    console.log('🎉 EXCELLENT - Toutes les fonctionnalités utilisateur sont opérationnelles!');
    console.log('✅ Inscription et authentification: Fonctionnel');
    console.log('✅ Gestion de profil: Fonctionnel');
    console.log('✅ Création et consultation de fails: Fonctionnel');
    console.log('✅ Système de réactions et points: Fonctionnel');
    console.log('✅ Reset de mot de passe: Fonctionnel');
    console.log('✅ Workflow utilisateur complet: Fonctionnel');
    console.log('🚀 Application prête pour les tests manuels et déploiement!');
  } else {
    console.log('⚠️ ATTENTION - Certaines fonctionnalités nécessitent des corrections:');
    
    const failedByCategory = {};
    results.tests.filter(t => !t.success).forEach(test => {
      failedByCategory[test.category] = (failedByCategory[test.category] || 0) + 1;
    });

    Object.keys(failedByCategory).forEach(category => {
      console.log(`❌ ${category}: ${failedByCategory[category]} problème(s)`);
    });

    console.log('\n💡 Actions recommandées:');
    results.tests.filter(t => !t.success).forEach(test => {
      console.log(`   🔧 ${test.name}: Vérifier implémentation et configuration`);
    });
  }

  // Prochaines étapes
  console.log('\n🎯 PROCHAINES ÉTAPES RECOMMANDÉES:');
  console.log('==================================');
  
  if (results.failed === 0) {
    console.log('1. ✅ Lancer les tests manuels sur l\'interface web');
    console.log('2. ✅ Tester le panneau d\'administration si nécessaire');
    console.log('3. ✅ Effectuer des tests de charge avec plusieurs utilisateurs');
    console.log('4. ✅ Vérifier les performances sur mobile/tablette');
    console.log('5. ✅ Préparer la documentation utilisateur finale');
  } else {
    console.log('1. 🔧 Corriger les tests échoués avant de continuer');
    console.log('2. 🔧 Relancer cette suite de tests pour valider les corrections');
    console.log('3. 🔧 Vérifier la configuration de l\'environnement de développement');
    console.log('4. 🔧 Consulter les logs détaillés pour identifier les problèmes');
  }

  // Statut final avec emoji approprié
  const finalStatus = results.failed === 0 ? 'SUCCÈS COMPLET' : `${results.failed} PROBLÈME(S) À CORRIGER`;
  const statusEmoji = results.failed === 0 ? '🎉' : '⚠️';
  
  console.log(`\n${statusEmoji} STATUT FINAL: ${finalStatus}`);
  console.log('===============================================\n');

  // Sauvegarde du rapport
  try {
    const fs = require('fs');
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      summary: {
        total: results.total,
        passed: results.passed,
        failed: results.failed,
        suites: results.suites,
        successRate: successRate
      },
      tests: results.tests
    };

    fs.writeFileSync(
      path.join(__dirname, 'functional-test-report.json'),
      JSON.stringify(reportData, null, 2)
    );
    console.log('💾 Rapport détaillé sauvegardé: functional-test-report.json\n');
  } catch (error) {
    console.log('⚠️ Impossible de sauvegarder le rapport:', error.message);
  }
}

// Exécution si appelé directement
if (require.main === module) {
  runFunctionalTests()
    .then((results) => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erreur fatale dans les tests fonctionnels:', error);
      process.exit(1);
    });
}

module.exports = { 
  runFunctionalTests,
  FUNCTIONAL_TESTS 
};