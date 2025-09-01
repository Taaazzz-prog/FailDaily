const { API_CONFIG, DEFAULT_HEADERS, TEST_UTILS, fetch } = require('../0_test-config');

async function testRegistration() {
  console.log('\n🔐 === TEST 2.1 - Inscription Utilisateur (Simplifié) ===');
  
  const results = {
    validRegistrationAdult: false,
    emailUniqueness: false,
    displayNameUniqueness: false,
    requiredFields: false,
    ageVerification: false,
    termsValidation: false,
    responseFormat: false
  };

  const errors = [];
  const baseUrl = API_CONFIG.baseUrl;
  const registerUrl = `${baseUrl}/api/registration/register`;

  try {
    // Test 1 : Inscription valide d'un adulte
    console.log('  ✓ Test inscription valide...');
    const validUserData = {
      email: TEST_UTILS.generateTestEmail(),
      password: 'TestPassword123!',
      displayName: 'TestUser' + Date.now(),
      birthDate: '1990-01-01', // Adulte
      agreeToTerms: true,
      agreeToNewsletter: false
    };

    const validResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(validUserData)
    });

    if (validResponse.status === 201) {
      const userData = await validResponse.json();
      if (userData.token && userData.user) {
        results.validRegistrationAdult = true;
        results.responseFormat = true;
        console.log('    ✅ Inscription adulte réussie');
      }
    } else {
      errors.push(`Inscription adulte échouée: ${validResponse.status} - ${await validResponse.text()}`);
    }

    // Test 2 : Email déjà utilisé
    console.log('  ✓ Test unicité email...');
    const duplicateEmailResponse = await fetch(registerUrl, {
      method: 'POST', 
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        ...validUserData,
        displayName: 'DifferentName' + Date.now()
      })
    });

    if (duplicateEmailResponse.status === 409) {
      results.emailUniqueness = true;
      console.log('    ✅ Détection email dupliqué fonctionne');
    } else {
      errors.push(`Email dupliqué devrait être rejeté: ${duplicateEmailResponse.status}`);
    }

    // Test 3 : Display name déjà utilisé
    console.log('  ✓ Test unicité display name...');
    const duplicateNameResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        email: TEST_UTILS.generateTestEmail(),
        password: 'TestPassword123!',
        displayName: validUserData.displayName, // Même nom
        birthDate: '1990-01-01',
        agreeToTerms: true,
        agreeToNewsletter: false
      })
    });

    if (duplicateNameResponse.status === 409) {
      results.displayNameUniqueness = true;
      console.log('    ✅ Détection nom dupliqué fonctionne');
    } else {
      errors.push(`Display name dupliqué devrait être rejeté: ${duplicateNameResponse.status}`);
    }

    // Test 4 : Champs obligatoires
    console.log('  ✓ Test champs obligatoires...');
    const missingFieldsResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        email: 'incomplete@test.com'
        // Champs manquants
      })
    });

    if (missingFieldsResponse.status === 400) {
      results.requiredFields = true;
      console.log('    ✅ Validation champs obligatoires fonctionne');
    } else {
      errors.push(`Champs manquants devraient être rejetés: ${missingFieldsResponse.status}`);
    }

    // Test 5 : Âge mineur (< 13 ans)
    console.log('  ✓ Test âge minimum...');
    const underageResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        email: TEST_UTILS.generateTestEmail(),
        password: 'TestPassword123!',
        displayName: 'UnderageUser' + Date.now(),
        birthDate: '2015-01-01', // 9 ans
        agreeToTerms: true,
        agreeToNewsletter: false
      })
    });

    if (underageResponse.status === 400 || underageResponse.status === 403) {
      results.ageVerification = true;
      console.log('    ✅ Restriction âge minimum fonctionne');
    } else {
      errors.push(`Âge < 13 ans devrait être rejeté: ${underageResponse.status}`);
    }

    // Test 6 : CGU obligatoires
    console.log('  ✓ Test acceptation CGU...');
    const noTermsResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        email: TEST_UTILS.generateTestEmail(),
        password: 'TestPassword123!',
        displayName: 'NoTermsUser' + Date.now(),
        birthDate: '1990-01-01',
        agreeToTerms: false, // Pas d'acceptation
        agreeToNewsletter: false
      })
    });

    if (noTermsResponse.status === 400) {
      results.termsValidation = true;
      console.log('    ✅ Validation CGU fonctionne');
    } else {
      errors.push(`CGU devrait être obligatoire: ${noTermsResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Erreur durant tests inscription:', error.message);
    errors.push(`Erreur test: ${error.message}`);
  }

  // Calcul du succès en ne considérant que les flags booléens
  const boolKeys = [
    'validRegistrationAdult',
    'emailUniqueness',
    'displayNameUniqueness',
    'requiredFields',
    'ageVerification',
    'termsValidation',
    'responseFormat'
  ];
  const success = boolKeys.every(k => results[k] === true);
  
  console.log(`\n📊 Résultat inscription: ${success ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
  
  return {
    success,
    results: { ...results, errors }
  };
}

module.exports = { testRegistration };
