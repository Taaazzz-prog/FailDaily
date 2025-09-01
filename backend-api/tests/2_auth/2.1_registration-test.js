/**
 * 🔐 TEST 2.1 - INSCRIPTION UTILISATEUR COMPLÈTE
 * ==============================================
 * 
 * Teste l'endpoint d'inscription avec le processus complet :
 * 1. Vérification unicité email/pseudo
 * 2. Vérification d'âge (13 ans min, validation parentale 13-16 ans)
 * 3. Acceptation CGU (4 cases obligatoires)
 */

const { API_CONFIG, TEST_USERS, TEST_UTILS, DEFAULT_HEADERS, fetch } = require('../0_test-config');

async function testUserRegistration() {
  TEST_UTILS.log('🔍', 'Début test inscription utilisateur complète...');
  
  let success = true;
  const results = {
    emailUniqueness: false,
    displayNameUniqueness: false,
    ageVerificationUnder13: false,
    ageVerification13to16: false,
    ageVerificationAdult: false,
    parentalConsentRequired: false,
    termsValidation: false,
    validRegistrationAdult: false,
    validRegistrationMinor: false,
    responseFormat: false,
    errors: []
  };

  const baseUrl = API_CONFIG.baseUrl;
  const registerUrl = `${baseUrl}/api/auth/register`;
  const checkEmailUrl = `${baseUrl}/api/registration/check-email`;
  const checkDisplayNameUrl = `${baseUrl}/api/registration/check-display-name`;
  const verifyAgeUrl = `${baseUrl}/api/age-verification/verify`;

  try {
    // ÉTAPE 1: Tests de vérification d'unicité
    TEST_UTILS.log('1️⃣', 'Test vérification unicité email/pseudo...');
    
    // 1.1 Test email unique
    TEST_UTILS.log('📧', 'Test unicité email...');
    const testEmail = TEST_UTILS.generateTestEmail();
    
    // D'abord créer un utilisateur
    const existingUserData = {
      email: testEmail,
      password: 'password123',
      displayName: 'Existing User',
      birthDate: '1995-01-01',
      agreeToTerms: true,
      agreeToNewsletter: false
    };

    const createExistingResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(existingUserData)
    });

    if (createExistingResponse.status === 201) {
      // Maintenant tester la vérification d'email
      const checkEmailResponse = await fetch(`${checkEmailUrl}?email=${testEmail}`, {
        method: 'GET',
        headers: DEFAULT_HEADERS
      });

      if (checkEmailResponse.status === 200) {
        const emailData = await checkEmailResponse.json();
        if (emailData.exists === true) {
          results.emailUniqueness = true;
          TEST_UTILS.log('✅', 'Vérification unicité email fonctionne');
        }
      }

      // Test tentative d'inscription avec email existant
      const duplicateEmailResponse = await fetch(registerUrl, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          ...existingUserData,
          displayName: 'Different User'
        })
      });

      if (duplicateEmailResponse.status === 409) {
        TEST_UTILS.log('✅', 'Rejet email dupliqué fonctionne');
      }
    }

    // 1.2 Test pseudo unique
    TEST_UTILS.log('👤', 'Test unicité pseudo...');
    const checkDisplayNameResponse = await fetch(`${checkDisplayNameUrl}?displayName=Existing User`, {
      method: 'GET',
      headers: DEFAULT_HEADERS
    });

    if (checkDisplayNameResponse.status === 200) {
      const displayNameData = await checkDisplayNameResponse.json();
      if (displayNameData.exists === true) {
        results.displayNameUniqueness = true;
        TEST_UTILS.log('✅', 'Vérification unicité pseudo fonctionne');
      }
    }

    // ÉTAPE 2: Tests de vérification d'âge
    TEST_UTILS.log('2️⃣', 'Test vérification d\'âge...');

    // 2.1 Test âge < 13 ans (interdit)
    TEST_UTILS.log('👶', 'Test âge inférieur à 13 ans...');
    const under13BirthDate = new Date();
    under13BirthDate.setFullYear(under13BirthDate.getFullYear() - 10); // 10 ans

    const under13Data = {
      email: TEST_UTILS.generateTestEmail(),
      password: 'password123',
      displayName: 'Kid Under 13',
      birthDate: under13BirthDate.toISOString().split('T')[0],
      agreeToTerms: true
    };

    const under13Response = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(under13Data)
    });

    if (under13Response.status === 400) {
      const under13Error = await under13Response.json();
      if (under13Error.message.includes('13 ans')) {
        results.ageVerificationUnder13 = true;
        TEST_UTILS.log('✅', 'Interdiction < 13 ans fonctionne');
      }
    } else {
      results.errors.push(`Âge < 13 ans devrait être rejeté: ${under13Response.status}`);
    }

    // 2.2 Test âge 13-16 ans (autorisation parentale requise)
    TEST_UTILS.log('🧒', 'Test âge 13-16 ans (autorisation parentale)...');
    const minor15BirthDate = new Date();
    minor15BirthDate.setFullYear(minor15BirthDate.getFullYear() - 15); // 15 ans

    // Test de vérification d'âge via l'endpoint dédié
    const ageVerifyResponse = await fetch(verifyAgeUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        birthDate: minor15BirthDate.toISOString().split('T')[0]
      })
    });

    if (ageVerifyResponse.status === 200) {
      const ageData = await ageVerifyResponse.json();
      if (ageData.verification && ageData.verification.ageCategory === 'teen') {
        results.ageVerification13to16 = true;
        TEST_UTILS.log('✅', 'Détection mineur 13-16 ans fonctionne');
      }
    }

    // 2.3 Test âge adulte (≥ 18 ans)
    TEST_UTILS.log('👨', 'Test âge adulte...');
    const adultBirthDate = new Date();
    adultBirthDate.setFullYear(adultBirthDate.getFullYear() - 25); // 25 ans

    const adultAgeVerifyResponse = await fetch(verifyAgeUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        birthDate: adultBirthDate.toISOString().split('T')[0]
      })
    });

    if (adultAgeVerifyResponse.status === 200) {
      const adultAgeData = await adultAgeVerifyResponse.json();
      if (adultAgeData.verification && adultAgeData.verification.ageCategory === 'adult') {
        results.ageVerificationAdult = true;
        TEST_UTILS.log('✅', 'Détection adulte fonctionne');
      }
    }

    // ÉTAPE 3: Test validation CGU
    TEST_UTILS.log('3️⃣', 'Test validation CGU...');

    // 3.1 Test inscription sans acceptation CGU
    const noTermsData = {
      email: TEST_UTILS.generateTestEmail(),
      password: 'password123',
      displayName: 'No Terms User',
      birthDate: adultBirthDate.toISOString().split('T')[0],
      agreeToTerms: false // CGU non acceptées
    };

    const noTermsResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(noTermsData)
    });

    if (noTermsResponse.status === 400) {
      const noTermsError = await noTermsResponse.json();
      if (noTermsError.message.includes('obligatoires')) {
        results.termsValidation = true;
        TEST_UTILS.log('✅', 'Validation CGU obligatoires fonctionne');
      }
    } else {
      results.errors.push(`CGU devrait être obligatoire: ${noTermsResponse.status}`);
    }

    // ÉTAPE 4: Inscription valide d'un adulte
    TEST_UTILS.log('4️⃣', 'Test inscription valide adulte...');
    const validAdultData = {
      email: TEST_UTILS.generateTestEmail(),
      password: 'password123',
      displayName: 'Valid Adult User',
      birthDate: adultBirthDate.toISOString().split('T')[0],
      agreeToTerms: true,
      agreeToNewsletter: false
    };

    const validAdultResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(validAdultData)
    });

    if (validAdultResponse.status === 201) {
      const adultData = await validAdultResponse.json();
      
      // Vérifier la structure de la réponse
      if (adultData.success && adultData.user && adultData.token) {
        results.validRegistrationAdult = true;
        results.responseFormat = true;
        TEST_UTILS.log('✅', 'Inscription adulte valide réussie');
        TEST_UTILS.log('ℹ️', `User ID: ${adultData.user.id}`);
        TEST_UTILS.log('ℹ️', `Token: ${adultData.token.substring(0, 20)}...`);
        
        // Vérifier que l'utilisateur a les bonnes données
        if (adultData.user.email === validAdultData.email.toLowerCase() &&
            adultData.user.display_name === validAdultData.displayName) {
          TEST_UTILS.log('✅', 'Données utilisateur correctes');
        }
      } else {
        results.errors.push('Format de réponse invalide pour inscription adulte');
        success = false;
      }
    } else {
      const errorData = await validAdultResponse.json();
      results.errors.push(`Inscription adulte valide échouée: ${validAdultResponse.status} - ${errorData.message || 'Erreur inconnue'}`);
      success = false;
    }

    // ÉTAPE 5: Test spécifique pour mineur (nécessiterait validation parentale)
    TEST_UTILS.log('5️⃣', 'Test inscription mineur (simulation)...');
    
    // Pour un mineur de 15 ans, l'inscription devrait être possible mais nécessiter validation parentale
    const validMinorData = {
      email: TEST_UTILS.generateTestEmail(),
      password: 'password123',
      displayName: 'Valid Minor User',
      birthDate: minor15BirthDate.toISOString().split('T')[0],
      agreeToTerms: true,
      agreeToNewsletter: false,
      parentEmail: 'parent@example.com' // Email parent requis pour mineur
    };

    // Note: Le backend peut soit accepter avec statut "pending parental approval"
    // soit rejeter en demandant validation parentale d'abord
    const validMinorResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(validMinorData)
    });

    if (validMinorResponse.status === 201 || validMinorResponse.status === 202) {
      // 201: Inscription réussie, 202: En attente validation parentale
      results.validRegistrationMinor = true;
      TEST_UTILS.log('✅', 'Inscription mineur gérée correctement');
      
      if (validMinorResponse.status === 202) {
        TEST_UTILS.log('ℹ️', 'Statut: En attente validation parentale');
        results.parentalConsentRequired = true;
      }
    } else if (validMinorResponse.status === 400) {
      // Le backend peut rejeter en demandant validation parentale préalable
      const minorError = await validMinorResponse.json();
      if (minorError.message.includes('parental') || minorError.message.includes('parent')) {
        results.parentalConsentRequired = true;
        TEST_UTILS.log('✅', 'Demande validation parentale pour mineur');
      }
    }

    // ÉTAPE 6: Tests de validation des données
    TEST_UTILS.log('6️⃣', 'Tests validation données...');

    // Test mot de passe trop court
    const shortPasswordData = {
      email: TEST_UTILS.generateTestEmail(),
      password: '123', // Trop court
      displayName: 'Short Password User',
      birthDate: adultBirthDate.toISOString().split('T')[0],
      agreeToTerms: true
    };

    const shortPasswordResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(shortPasswordData)
    });

    if (shortPasswordResponse.status === 400) {
      TEST_UTILS.log('✅', 'Validation longueur mot de passe fonctionne');
    }

    // Test email invalide
    const invalidEmailData = {
      email: 'email-invalide',
      password: 'password123',
      displayName: 'Invalid Email User',
      birthDate: adultBirthDate.toISOString().split('T')[0],
      agreeToTerms: true
    };

    const invalidEmailResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(invalidEmailData)
    });

    if (invalidEmailResponse.status === 400) {
      TEST_UTILS.log('✅', 'Validation format email fonctionne');
    }

  } catch (error) {
    TEST_UTILS.log('❌', `Erreur générale: ${error.message}`);
    results.errors.push(`Erreur réseau: ${error.message}`);
    success = false;
  }

  // Résultats
  console.log('\n📋 RÉSULTATS TEST 2.1 - INSCRIPTION COMPLÈTE');
  console.log('============================================');
  console.log(`Unicité email: ${results.emailUniqueness ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Unicité pseudo: ${results.displayNameUniqueness ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Âge < 13 ans (interdit): ${results.ageVerificationUnder13 ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Âge 13-16 ans (détection): ${results.ageVerification13to16 ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Âge adulte (détection): ${results.ageVerificationAdult ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Validation parentale: ${results.parentalConsentRequired ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Validation CGU: ${results.termsValidation ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Inscription adulte: ${results.validRegistrationAdult ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Format réponse: ${results.responseFormat ? '✅ OK' : '❌ ÉCHEC'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERREURS:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  // Considérer le test réussi si les fonctionnalités essentielles passent
  const essentialTestsPassed = results.emailUniqueness && results.displayNameUniqueness && 
                              results.ageVerificationUnder13 && results.termsValidation && 
                              results.validRegistrationAdult && results.responseFormat;
  
  console.log(`\n🎯 STATUT: ${essentialTestsPassed ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
  console.log('\n💡 Note: Ce test couvre le processus complet d\'inscription avec:');
  console.log('   - Vérification unicité email/pseudo');
  console.log('   - Validation d\'âge (13 ans min, détection mineurs)');
  console.log('   - Acceptation CGU obligatoire');
  console.log('   - Gestion validation parentale pour 13-16 ans\n');
  
  return { success: essentialTestsPassed, results };
}

// Exécution si appelé directement
if (require.main === module) {
  testUserRegistration()
    .then(({ success }) => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = testUserRegistration;

