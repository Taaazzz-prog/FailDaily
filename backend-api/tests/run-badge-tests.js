/**
 * SCRIPT DE LANCEMENT DES TESTS BADGES
 * ====================================
 * 
 * Usage:
 * node run-badge-tests.js                    // Nouveau utilisateur test
 * node run-badge-tests.js <userId>           // Utilisateur spécifique
 * node run-badge-tests.js bruno@taaazzz.be   // Test avec email
 */

const BadgeTestingSystem = require('./badge-system-complete-test');
const { executeQuery } = require('../src/config/database');

async function main() {
  const args = process.argv.slice(2);
  let userId = null;
  
  // Si un argument est fourni
  if (args.length > 0) {
    const input = args[0];
    
    // Si c'est un email, récupérer l'ID utilisateur
    if (input.includes('@')) {
      console.log(`🔍 Recherche utilisateur avec email: ${input}`);
      
      const user = await executeQuery(`
        SELECT id FROM users WHERE email = ?
      `, [input]);
      
      if (user.length === 0) {
        console.error(`❌ Utilisateur non trouvé: ${input}`);
        process.exit(1);
      }
      
      userId = user[0].id;
      console.log(`✅ Utilisateur trouvé: ${userId}`);
    } else {
      // Sinon, utiliser directement comme ID
      userId = input;
    }
  }
  
  const tester = new BadgeTestingSystem();
  
  try {
    await tester.runCompleteTest(userId);
    
    // Demander si on veut nettoyer les données de test
    if (!userId || args[0] === 'clean') {
      console.log('\n🧹 Nettoyage des données de test...');
      await tester.cleanup(userId);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };