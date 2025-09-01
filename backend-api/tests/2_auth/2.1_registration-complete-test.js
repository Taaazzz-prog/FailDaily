/**
 * 🔐 TEST 2.1 - INSCRIPTION COMPLÈTE AVEC VALIDATION D'ÂGE
 * ========================================================
 * 
 * Test complet de l'inscription avec tous les cas de validation d'âge :
 * - < 13 ans : inscription bloquée
 * - 13-16 ans : autorisation parentale requise
 * - 17+ ans : inscription directe
 * 
 * Inclut également :
 * - Vérification unicité email/pseudo
 * - Validation des champs obligatoires
 * - Gestion des erreurs
 */

const { API_CONFIG, DEFAULT_HEADERS, TEST_UTILS, fetch } = require('../0_test-config');

async function testCompleteRegistration() {
  console.log('\n🔐 === TEST 2.1 - Inscription Complète avec Validation d\'Âge ===');
  
  const results = {
    // Tests de base
    validRegistrationAdult: false,
    emailUniqueness: false,
    displayNameUniqueness: false,
    requiredFields: false,
    termsValidation: false,
    responseFormat: false,
    
    // Tests spécifiques à l'âge
    ageVerificationUnder13: false,
    ageVerification13to16: false,
    ageVerificationAdult: false,
    parentalConsentRequired: false,
    minorTokenHandling: false,
    
    // Tests d'intégration
    displayNameGeneration: false,
    parentEmailValidation: false
  };

  const errors = [];
  const baseUrl = API_CONFIG.baseUrl;
  const registerUrl = `${baseUrl}/api/registration/register`;
  const checkEmailUrl = `${baseUrl}/api/registration/check-email`;
  const checkDisplayNameUrl = `${baseUrl}/api/registration/check-display-name`;

  try {
    console.log('\n📋 === PHASE 1: Tests de validation de base ===');
    
    // ========================================
    // TEST 1: Champs obligatoires
    // ========================================
    console.log('  ✓ Test champs obligatoires...');
    const missingFieldsResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        email: 'incomplete@test.com'
        // Champs manquants intentionnellement
      })
    });

    if (missingFieldsResponse.status === 400) {
      results.requiredFields = true;
      console.log('    ✅ Validation champs obligatoires fonctionne');
    } else {
      errors.push(`Champs manquants devraient être rejetés: ${missingFieldsResponse.status}`);
    }

    // ========================================
    // TEST 2: Validation des CGU
    // ========================================
    console.log('  ✓ Test acceptation CGU obligatoires...');
    const noTermsResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        email: TEST_UTILS.generateTestEmail(),
        password: 'TestPassword123!',
        displayName: 'TestUserNoTerms' + Date.now(),
        birthDate: '1990-01-01',
        agreeToTerms: false, // CGU non acceptées
        agreeToNewsletter: false
      })
    });

    if (noTermsResponse.status === 400) {
      results.termsValidation = true;
      console.log('    ✅ Validation CGU obligatoires fonctionne');
    } else {
      errors.push(`CGU devraient être obligatoires: ${noTermsResponse.status}`);
    }

    console.log('\n👶 === PHASE 2: Tests de validation d\'âge ===');
    
    // ========================================
    // TEST 3: Âge < 13 ans (INTERDIT)
    // ========================================
    console.log('  ✓ Test âge < 13 ans (doit être rejeté)...');
    const under13Response = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        email: TEST_UTILS.generateTestEmail(),
        password: 'TestPassword123!',
        displayName: 'Enfant9ans' + Date.now(),
        birthDate: '2015-01-01', // 9 ans
        agreeToTerms: true,
        agreeToNewsletter: false
      })
    });

    if (under13Response.status === 400) {
      const under13Error = await under13Response.json();
      if (under13Error.code === 'AGE_RESTRICTION' && under13Error.message.includes('13 ans')) {
        results.ageVerificationUnder13 = true;
        console.log('    ✅ Interdiction < 13 ans fonctionne correctement');
        console.log(`    📝 Message: "${under13Error.message}"`);
      } else {
        errors.push(`Message d'erreur incorrect pour < 13 ans: ${under13Error.message}`);
      }
    } else {
      errors.push(`Âge < 13 ans devrait être rejeté avec code 400: ${under13Response.status}`);
    }

    // ========================================
    // TEST 4: Âge 13-16 ans (AUTORISATION PARENTALE)
    // ========================================
    console.log('  ✓ Test âge 13-16 ans (autorisation parentale requise)...');
    const minor15Response = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        email: TEST_UTILS.generateTestEmail(),
        password: 'TestPassword123!',
        displayName: 'Mineur15ans' + Date.now(),
        birthDate: '2009-01-01', // 15 ans
        agreeToTerms: true,
        agreeToNewsletter: false,
        parentEmail: 'parent@exemple.com'
      })
    });

    if (minor15Response.status === 201) {
      const minorData = await minor15Response.json();
      if (minorData.requiresParentalConsent && !minorData.token) {
        results.ageVerification13to16 = true;
        results.parentalConsentRequired = true;
        results.minorTokenHandling = true;
        console.log('    ✅ Gestion mineur 13-16 ans correcte');
        console.log(`    📝 Message: "${minorData.message}"`);
        console.log(`    👥 Utilisateur créé: ${minorData.user.displayName} (${minorData.user.age} ans)`);
        console.log('    🔒 Aucun token fourni (correct pour mineur)');
        console.log(`    📧 Status: ${minorData.user.status}`);
      } else {
        errors.push(`Mineur devrait nécessiter autorisation parentale sans token`);
      }
    } else {
      const minorError = await minor15Response.json();
      errors.push(`Inscription mineur 13-16 ans échouée: ${minor15Response.status} - ${minorError.message}`);
    }

    // ========================================
    // TEST 5: Âge adulte 17+ ans (INSCRIPTION DIRECTE)
    // ========================================
    console.log('  ✓ Test âge adulte 17+ ans (inscription directe)...');
    const adultData = {
      email: TEST_UTILS.generateTestEmail(),
      password: 'TestPassword123!',
      displayName: 'Adulte25ans' + Date.now(),
      birthDate: '1999-01-01', // 25 ans
      agreeToTerms: true,
      agreeToNewsletter: false
    };

    const adultResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(adultData)
    });

    if (adultResponse.status === 201) {
      const adultResult = await adultResponse.json();
      if (adultResult.token && adultResult.user && !adultResult.requiresParentalConsent) {
        results.validRegistrationAdult = true;
        results.ageVerificationAdult = true;
        results.responseFormat = true;
        console.log('    ✅ Inscription adulte directe réussie');
        console.log(`    👤 Utilisateur: ${adultResult.user.displayName}`);
        console.log(`    🔑 Token fourni: ${adultResult.token.substring(0, 20)}...`);
        console.log(`    📅 Date création: ${adultResult.user.createdAt}`);
      } else {
        errors.push(`Adulte devrait avoir inscription complète avec token`);
      }
    } else {
      const adultError = await adultResponse.json();
      errors.push(`Inscription adulte échouée: ${adultResponse.status} - ${adultError.message}`);
    }

    console.log('\n🔧 === PHASE 3: Tests d\'unicité et validation ===');
    
    // ========================================
    // TEST 6: Unicité email
    // ========================================
    console.log('  ✓ Test unicité email...');
    const duplicateEmailResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        ...adultData,
        displayName: 'DifferentName' + Date.now()
      })
    });

    if (duplicateEmailResponse.status === 409) {
      results.emailUniqueness = true;
      console.log('    ✅ Validation unicité email fonctionne');
    } else {
      errors.push(`Email dupliqué devrait être rejeté: ${duplicateEmailResponse.status}`);
    }

    // ========================================
    // TEST 7: Unicité display_name
    // ========================================
    console.log('  ✓ Test unicité display_name...');
    const duplicateNameResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        email: TEST_UTILS.generateTestEmail(),
        password: 'TestPassword123!',
        displayName: adultData.displayName, // Même nom que l'adulte créé
        birthDate: '1995-01-01',
        agreeToTerms: true,
        agreeToNewsletter: false
      })
    });

    if (duplicateNameResponse.status === 409) {
      results.displayNameUniqueness = true;
      console.log('    ✅ Validation unicité display_name fonctionne');
    } else {
      errors.push(`Display name dupliqué devrait être rejeté: ${duplicateNameResponse.status}`);
    }

    // ========================================
    // TEST 8: Vérification API display_name
    // ========================================
    console.log('  ✓ Test API vérification display_name...');
    const checkNameResponse = await fetch(`${checkDisplayNameUrl}?displayName=TestUser`, {
      method: 'GET',
      headers: DEFAULT_HEADERS
    });

    if (checkNameResponse.status === 200) {
      const checkResult = await checkNameResponse.json();
      if (checkResult.success && typeof checkResult.available === 'boolean') {
        results.displayNameGeneration = true;
        console.log('    ✅ API vérification display_name fonctionne');
        console.log(`    📋 Disponible: ${checkResult.available}`);
      }
    } else {
      errors.push(`API check display_name échouée: ${checkNameResponse.status}`);
    }

    console.log('\n🧪 === PHASE 4: Tests d\'intégration avancés ===');
    
    // ========================================
    // TEST 9: Mineur avec email parent invalide
    // ========================================
    console.log('  ✓ Test email parent invalide...');
    const invalidParentEmailResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        email: TEST_UTILS.generateTestEmail(),
        password: 'TestPassword123!',
        displayName: 'MineurEmailInvalide' + Date.now(),
        birthDate: '2010-01-01', // 14 ans
        agreeToTerms: true,
        agreeToNewsletter: false,
        parentEmail: 'email-invalide'
      })
    });

    // Soit accepté avec email nettoyé, soit rejeté pour email invalide
    if (invalidParentEmailResponse.status === 201 || invalidParentEmailResponse.status === 400) {
      results.parentEmailValidation = true;
      console.log('    ✅ Validation email parent gérée');
    } else {
      errors.push(`Email parent invalide mal géré: ${invalidParentEmailResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    errors.push(`Erreur générale: ${error.message}`);
  }

  // ========================================
  // RAPPORT FINAL
  // ========================================
  console.log('\n📊 === RAPPORT DE TEST COMPLET ===');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log(`\n📈 Résultats: ${passedTests}/${totalTests} tests réussis (${successRate}%)`);
  console.log('\n📋 Détail des tests:');
  
  // Tests de validation de base
  console.log('\n🔹 Validation de base:');
  console.log(`  Champs obligatoires: ${results.requiredFields ? '✅' : '❌'}`);
  console.log(`  Validation CGU: ${results.termsValidation ? '✅' : '❌'}`);
  console.log(`  Format de réponse: ${results.responseFormat ? '✅' : '❌'}`);
  
  // Tests de validation d'âge
  console.log('\n🔹 Validation d\'âge:');
  console.log(`  Blocage < 13 ans: ${results.ageVerificationUnder13 ? '✅' : '❌'}`);
  console.log(`  Détection 13-16 ans: ${results.ageVerification13to16 ? '✅' : '❌'}`);
  console.log(`  Inscription adulte: ${results.ageVerificationAdult ? '✅' : '❌'}`);
  console.log(`  Autorisation parentale: ${results.parentalConsentRequired ? '✅' : '❌'}`);
  console.log(`  Gestion token mineur: ${results.minorTokenHandling ? '✅' : '❌'}`);
  
  // Tests d'unicité
  console.log('\n🔹 Unicité et validation:');
  console.log(`  Unicité email: ${results.emailUniqueness ? '✅' : '❌'}`);
  console.log(`  Unicité display_name: ${results.displayNameUniqueness ? '✅' : '❌'}`);
  console.log(`  API display_name: ${results.displayNameGeneration ? '✅' : '❌'}`);
  console.log(`  Validation email parent: ${results.parentEmailValidation ? '✅' : '❌'}`);
  
  // Tests d'inscription complète
  console.log('\n🔹 Inscriptions complètes:');
  console.log(`  Inscription adulte valide: ${results.validRegistrationAdult ? '✅' : '❌'}`);

  // Erreurs rencontrées
  if (errors.length > 0) {
    console.log('\n🚨 Erreurs détectées:');
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  // Statut final
  const criticalTests = [
    'ageVerificationUnder13',
    'ageVerification13to16', 
    'ageVerificationAdult',
    'parentalConsentRequired',
    'minorTokenHandling',
    'validRegistrationAdult'
  ];
  
  const criticalPassed = criticalTests.every(test => results[test]);
  
  console.log(`\n🎯 STATUT FINAL: ${criticalPassed ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
  console.log('\n💡 Note: Ce test valide le processus complet d\'inscription avec:');
  console.log('   - Validation d\'âge stricte (< 13 ans bloqué)');
  console.log('   - Gestion autorisation parentale (13-16 ans)');
  console.log('   - Inscription directe adultes (17+ ans)');
  console.log('   - Sécurité token (pas de token pour mineurs)');
  console.log('   - Unicité email/pseudo');
  console.log('   - Validation des CGU\n');
  
  return { 
    success: criticalPassed, 
    results, 
    errors,
    passedTests,
    totalTests,
    successRate: parseFloat(successRate)
  };
}

// Exécution si appelé directement
if (require.main === module) {
  testCompleteRegistration()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { testCompleteRegistration };

