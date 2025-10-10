/**
 * SCRIPT PRINCIPAL DE VALIDATION BADGES
 * ====================================
 * 
 * Usage:
 * node validate-badges.js                           // Test complet avec nouvel utilisateur
 * node validate-badges.js bruno@taaazzz.be          // Test avec utilisateur existant
 * node validate-badges.js --quick bruno@taaazzz.be  // Test rapide "Prochains défis" seulement
 */

const BadgeTestingSystem = require('./badge-system-complete-test');
const NextChallengesValidator = require('./next-challenges-validator');

async function main() {
  const args = process.argv.slice(2);
  
  try {
    // Test rapide "Prochains défis" seulement
    if (args[0] === '--quick' && args[1]) {
      console.log('⚡ MODE RAPIDE: Validation "Prochains défis" uniquement');
      
      const validator = new NextChallengesValidator();
      await validator.quickTest(args[1]);
      return;
    }
    
    // Test complet
    console.log('🏆 MODE COMPLET: Tests complets du système de badges');
    
    let userId = null;
    
    // Si un email est fourni
    if (args[0] && args[0].includes('@')) {
      const { executeQuery } = require('../src/config/database');
      
      console.log(`🔍 Recherche utilisateur: ${args[0]}`);
      const user = await executeQuery(`SELECT id FROM users WHERE email = ?`, [args[0]]);
      
      if (user.length === 0) {
        console.error(`❌ Utilisateur non trouvé: ${args[0]}`);
        process.exit(1);
      }
      
      userId = user[0].id;
      console.log(`✅ Utilisateur trouvé: ${userId}`);
    }
    
    // Lancer les tests complets
    const tester = new BadgeTestingSystem();
    const results = await tester.runCompleteTest(userId);
    
    // Test spécifique "Prochains défis"
    console.log('\n' + '='.repeat(60));
    console.log('🎯 TEST SPÉCIFIQUE: "PROCHAINS DÉFIS"');
    console.log('='.repeat(60));
    
    const validator = new NextChallengesValidator();
    const testUserId = userId || results.testUserId;
    
    if (!testUserId) {
      console.error('❌ Aucun ID utilisateur disponible pour la validation');
      return;
    }
    
    const validation = await validator.validateNextChallenges(testUserId);
    
    // Résumé final
    console.log('\n' + '='.repeat(60));
    console.log('📋 RÉSUMÉ FINAL');
    console.log('='.repeat(60));
    
    const overallSuccess = results.errors.length === 0 && validation.isValid;
    
    if (overallSuccess) {
      console.log('🎉 TOUS LES TESTS RÉUSSIS!');
      console.log('✅ Système de badges entièrement fonctionnel');
      console.log('✅ "Prochains défis" fonctionne correctement');
    } else {
      console.log('⚠️ PROBLÈMES DÉTECTÉS:');
      
      if (results.errors.length > 0) {
        console.log(`❌ ${results.errors.length} erreurs dans le système de badges`);
      }
      
      if (!validation.isValid) {
        console.log('❌ Problème avec "Prochains défis"');
      }
    }
    
    // Proposer nettoyage si utilisateur de test créé
    if (!args[0] && testUserId) {
      console.log('\n🧹 Nettoyage des données de test...');
      await tester.cleanup(testUserId);
    }
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };