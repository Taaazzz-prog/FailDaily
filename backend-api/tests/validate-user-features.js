/**
 * Script Simple de Test des Nouvelles Fonctionnalités
 * Test direct sans Jest pour valider rapidement
 */

const { API_CONFIG, TEST_UTILS, DEFAULT_HEADERS, fetch } = require('./0_test-config');

async function testProfile() {
  console.log('🔄 Test Gestion de Profil...');
  
  try {
    const baseUrl = API_CONFIG.baseUrl;
    
    // Test inscription
    const registerData = {
      email: `test-profile-${Date.now()}@validate.test`,
      password: 'TestPassword123!',
      displayName: `TestProfile${Date.now()}`,
      birthDate: '1990-05-15',
      agreeToTerms: true,
      agreeToNewsletter: false
    };

    const registerResponse = await fetch(`${baseUrl}/api/registration/register`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(registerData)
    });

    const registerResult = await registerResponse.json();

    if (registerResponse.status !== 201) {
      throw new Error(`Inscription échouée: ${registerResult.message || 'Erreur inconnue'}`);
    }

    const token = registerResult.token;
    const userId = registerResult.user.id;
    
    console.log('✅ Inscription réussie');

    // Test modification profil
    const updateData = {
      displayName: 'Nom Mis À Jour', // Essayer displayName au lieu de display_name
      bio: 'Nouvelle bio de test',
      preferences: {
        theme: 'dark',
        notifications: { email: true, push: false }
      }
    };

    const updateResponse = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    const updateResult = await updateResponse.json();

    if (updateResponse.status !== 200) {
      throw new Error(`Modification profil échouée: ${updateResult.message}`);
    }

    console.log('✅ Modification profil réussie');

    // Test récupération profil
    const getResponse = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      }
    });

    const getResult = await getResponse.json();

    if (getResponse.status !== 200) {
      throw new Error(`Récupération profil échouée`);
    }

    // L'API retourne 'user' pas 'profile'
    if (!getResult.user || !getResult.user.displayName) {
      throw new Error(`Profil invalide. Structure reçue: ${JSON.stringify(getResult, null, 2)}`);
    }
    
    if (getResult.user.displayName !== 'Nom Mis À Jour') {
      throw new Error(`Nom d'affichage incorrect. Attendu: 'Nom Mis À Jour', Reçu: '${getResult.user.displayName}'`);
    }

    console.log('✅ Récupération profil réussie');

    // Nettoyage
    const { executeQuery } = require('../src/config/database');
    await executeQuery('DELETE FROM profiles WHERE user_id = ?', [userId]);
    await executeQuery('DELETE FROM users WHERE id = ?', [userId]);

    return { success: true };

  } catch (error) {
    console.error('❌ Erreur test profil:', error.message);
    return { success: false, error: error.message };
  }
}

async function testWorkflow() {
  console.log('🔄 Test Workflow Complet...');
  
  try {
    const baseUrl = API_CONFIG.baseUrl;
    
    // Test inscription + connexion
    const registerData = {
      email: `test-workflow-${Date.now()}@validate.test`,
      password: 'WorkflowPass123!',
      displayName: `WorkflowUser${Date.now()}`,
      birthDate: '1985-03-10',
      agreeToTerms: true,
      agreeToNewsletter: false
    };

    const registerResponse = await fetch(`${baseUrl}/api/registration/register`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(registerData)
    });

    const registerResult = await registerResponse.json();

    if (registerResponse.status !== 201) {
      throw new Error(`Inscription échouée: ${registerResult.message || 'Erreur inconnue'}`);
    }

    const token = registerResult.token;
    const userId = registerResult.user.id;
    
    console.log('✅ Inscription/Connexion réussie');

    // Test création fail
    const failData = {
      title: 'Test Workflow Fail',
      description: 'Description du fail pour test workflow',
      category: 'professional',
      is_anonyme: false
    };

    const failResponse = await fetch(`${baseUrl}/api/fails`, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(failData)
    });

    const failResult = await failResponse.json();

    console.log('   Debug - Status création fail:', failResponse.status);
    console.log('   Debug - Réponse fail:', failResult);
    
    if (failResponse.status !== 200 && failResponse.status !== 201) {
      throw new Error(`Création fail échouée: ${failResult.message || 'Status: ' + failResponse.status}`);
    }

    const failId = failResult.fail.id;
    console.log('✅ Création fail réussie');

    // Test consultation fails
    const getFailsResponse = await fetch(`${baseUrl}/api/fails/anonymes`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      }
    });

    const getFailsResult = await getFailsResponse.json();

    if (getFailsResponse.status !== 200) {
      throw new Error('Consultation fails échouée');
    }

    console.log('✅ Consultation fails réussie');

    // Test points (vérifier profil)
    const profileResponse = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      }
    });

    const profileResult = await profileResponse.json();

    // L'API retourne 'user' pas 'profile'
    if (profileResponse.status !== 200 || !profileResult.user || profileResult.user.couragePoints < 10) {
      console.log('   Debug - Points reçus:', profileResult.user ? profileResult.user.couragePoints : 'Pas de points');
      throw new Error('Points de courage non attribués correctement');
    }

    console.log('✅ Système de points fonctionnel');

    // Nettoyage
    const { executeQuery } = require('../src/config/database');
    await executeQuery('DELETE FROM fails WHERE id = ?', [failId]);
    await executeQuery('DELETE FROM profiles WHERE user_id = ?', [userId]);
    await executeQuery('DELETE FROM users WHERE id = ?', [userId]);

    return { success: true };

  } catch (error) {
    console.error('❌ Erreur test workflow:', error.message);
    return { success: false, error: error.message };
  }
}

async function runValidationTests() {
  console.log('🎯 VALIDATION DES FONCTIONNALITÉS UTILISATEUR');
  console.log('==============================================');
  console.log(`📅 Date: ${new Date().toLocaleString('fr-FR')}`);
  console.log();

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Gestion de Profil
  results.total++;
  const profileResult = await testProfile();
  if (profileResult.success) {
    results.passed++;
    console.log('✅ Test Profil: RÉUSSI');
  } else {
    results.failed++;
    console.log('❌ Test Profil: ÉCHOUÉ');
  }
  results.tests.push({ name: 'Gestion Profil', ...profileResult });
  
  console.log();

  // Test 2: Workflow Complet
  results.total++;
  const workflowResult = await testWorkflow();
  if (workflowResult.success) {
    results.passed++;
    console.log('✅ Test Workflow: RÉUSSI');
  } else {
    results.failed++;
    console.log('❌ Test Workflow: ÉCHOUÉ');
  }
  results.tests.push({ name: 'Workflow Complet', ...workflowResult });

  console.log();

  // Rapport final
  console.log('🏆 RÉSULTATS DE VALIDATION');
  console.log('==========================');
  console.log(`📊 Total: ${results.total} tests`);
  console.log(`✅ Réussis: ${results.passed}`);
  console.log(`❌ Échoués: ${results.failed}`);
  console.log(`📈 Taux de réussite: ${Math.round((results.passed / results.total) * 100)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 TOUTES LES FONCTIONNALITÉS UTILISATEUR SONT OPÉRATIONNELLES !');
    console.log('✅ Application prête pour tests manuels');
  } else {
    console.log('\n⚠️ Certaines fonctionnalités nécessitent des corrections');
    results.tests.filter(t => !t.success).forEach(test => {
      console.log(`❌ ${test.name}: ${test.error}`);
    });
  }
  
  console.log();
  return results;
}

// Exécution
if (require.main === module) {
  runValidationTests()
    .then((results) => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = runValidationTests;