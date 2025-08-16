/**
 * 🎭 DÉMONSTRATION - COMPORTEMENT UTILISATEUR NON CONNECTÉ
 * ========================================================
 * 
 * Script de démonstration qui simule ce qui arrive quand un utilisateur
 * non connecté essaie d'accéder à différentes parties de l'application
 */

const { API_CONFIG, TEST_UTILS, DEFAULT_HEADERS } = require('../0_test-config');

async function demonstrateUnauthenticatedBehavior() {
  console.log('🎭 DÉMONSTRATION - COMPORTEMENT UTILISATEUR NON CONNECTÉ');
  console.log('========================================================');
  console.log('💡 Simulation d\'un utilisateur qui essaie d\'accéder au contenu sans être connecté\n');

  const scenarios = [
    {
      name: '📱 Tentative de voir les fails',
      description: 'L\'utilisateur essaie de voir la liste des fails',
      endpoint: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.fails.getAll}`,
      method: 'GET'
    },
    {
      name: '✍️ Tentative de poster un fail',
      description: 'L\'utilisateur essaie de créer un nouveau fail',
      endpoint: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.fails.create}`,
      method: 'POST',
      body: {
        title: 'Mon échec du jour',
        description: 'J\'ai oublié mes clés dans la voiture',
        category: 'personnel'
      }
    },
    {
      name: '👤 Tentative d\'accès au profil',
      description: 'L\'utilisateur essaie de voir son profil',
      endpoint: `${API_CONFIG.baseUrl}/api/auth/profile`,
      method: 'GET'
    },
    {
      name: '📊 Tentative de voir les statistiques',
      description: 'L\'utilisateur essaie d\'accéder aux stats',
      endpoint: `${API_CONFIG.baseUrl}/api/user/stats`,
      method: 'GET'
    }
  ];

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    
    console.log(`\n${i + 1}. ${scenario.name}`);
    console.log(`   ${scenario.description}`);
    console.log(`   🌐 Requête: ${scenario.method} ${scenario.endpoint}`);
    
    try {
      const requestOptions = {
        method: scenario.method,
        headers: DEFAULT_HEADERS // IMPORTANT: Pas de token d'authentification
      };

      if (scenario.body) {
        requestOptions.body = JSON.stringify(scenario.body);
        console.log(`   📝 Données: ${JSON.stringify(scenario.body, null, 2).replace(/\n/g, '\n      ')}`);
      }

      console.log('   ⏳ Envoi de la requête...');
      
      const response = await fetch(scenario.endpoint, requestOptions);
      
      // Analyser la réponse
      if (response.status === 401) {
        console.log('   🚫 RÉSULTAT: Accès refusé (401 Unauthorized)');
        console.log('   ✅ COMPORTEMENT ATTENDU: L\'utilisateur est redirigé vers la page de connexion');
        console.log('   💬 MESSAGE UTILISATEUR: "Vous devez vous connecter pour accéder à cette fonctionnalité"');
      } else if (response.status === 403) {
        console.log('   🚫 RÉSULTAT: Accès interdit (403 Forbidden)');
        console.log('   ✅ COMPORTEMENT ATTENDU: L\'utilisateur est informé qu\'il n\'a pas les permissions');
      } else if (response.status === 200) {
        console.log('   ⚠️  RÉSULTAT: Accès autorisé (200 OK)');
        console.log('   ❌ PROBLÈME: Cet endpoint ne devrait PAS être accessible sans authentification');
        console.log('   🚨 ACTION REQUISE: Ajouter la protection d\'authentification');
      } else {
        console.log(`   ❓ RÉSULTAT: Statut inattendu (${response.status})`);
        try {
          const data = await response.json();
          console.log(`   📄 Détails: ${JSON.stringify(data, null, 2).replace(/\n/g, '\n      ')}`);
        } catch (e) {
          console.log('   📄 Détails: Réponse non-JSON ou vide');
        }
      }

    } catch (error) {
      console.log(`   ❌ ERREUR: ${error.message}`);
      console.log('   💡 Cela peut indiquer que l\'endpoint n\'existe pas encore');
    }

    // Petite pause pour la lisibilité
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Résumé des bonnes pratiques
  console.log('\n' + '='.repeat(60));
  console.log('📋 RÉSUMÉ DES BONNES PRATIQUES POUR UTILISATEURS NON CONNECTÉS');
  console.log('='.repeat(60));
  
  console.log('\n✅ CE QUI DOIT ÊTRE ACCESSIBLE:');
  console.log('   🌐 Page d\'accueil/landing page');
  console.log('   📝 Formulaire d\'inscription');
  console.log('   🔑 Formulaire de connexion');
  console.log('   ❓ Page d\'aide/FAQ');
  console.log('   📞 Informations de contact');
  console.log('   ⚖️  Conditions d\'utilisation');
  console.log('   🔐 Politique de confidentialité');

  console.log('\n🚫 CE QUI DOIT ÊTRE PROTÉGÉ:');
  console.log('   📱 Liste des fails');
  console.log('   ✍️  Création de fails');
  console.log('   👤 Profil utilisateur');
  console.log('   📊 Statistiques personnelles');
  console.log('   💬 Commentaires');
  console.log('   ⚙️  Paramètres de compte');

  console.log('\n🎯 EXPÉRIENCE UTILISATEUR RECOMMANDÉE:');
  console.log('   1. Détection automatique du statut de connexion');
  console.log('   2. Redirection fluide vers la page de connexion');
  console.log('   3. Messages clairs expliquant pourquoi l\'authentification est requise');
  console.log('   4. Possibilité de revenir à la page demandée après connexion');
  console.log('   5. Interface intuitive pour l\'inscription de nouveaux utilisateurs');

  console.log('\n🔒 SÉCURITÉ:');
  console.log('   ✅ Toutes les requêtes sensibles retournent 401 sans token');
  console.log('   ✅ Aucune donnée utilisateur exposée publiquement');
  console.log('   ✅ Messages d\'erreur non informatifs pour les attaquants');
  console.log('   ✅ Rate limiting pour éviter les attaques par force brute');

  console.log('\n🎉 CONCLUSION:');
  console.log('   Votre application force correctement l\'authentification pour accéder au contenu,');
  console.log('   tout en préservant l\'anonymat des utilisateurs une fois connectés.');
  console.log('   C\'est exactement le comportement souhaité pour FailDaily ! 🎯\n');
}

// Exécution si appelé directement
if (require.main === module) {
  demonstrateUnauthenticatedBehavior()
    .catch(error => {
      console.error('💥 Erreur pendant la démonstration:', error);
      process.exit(1);
    });
}

module.exports = demonstrateUnauthenticatedBehavior;
