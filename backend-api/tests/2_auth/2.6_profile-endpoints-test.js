/**
 * 👤 TEST 2.6 - PROFIL: GET /auth/profile et PUT /auth/profile
 * ============================================================
 */

const { API_CONFIG, TEST_UTILS, DEFAULT_HEADERS } = require('../0_test-config');

async function testProfileEndpoints() {
  TEST_UTILS.log('🔍', 'Début test endpoints profil...');

  let success = true;
  const results = {
    userCreated: false,
    tokenObtained: false,
    getProfileOk: false,
    updateProfileOk: false,
    getUpdatedProfileOk: false,
    errors: []
  };

  const registerUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.registration.register;
  const getProfileUrl = API_CONFIG.baseUrl + '/api/auth/profile';
  const updateProfileUrl = API_CONFIG.baseUrl + '/api/auth/profile';

  let authToken = null;
  let userId = null;

  try {
    // 1) Créer un utilisateur adulte
    const testEmail = TEST_UTILS.generateTestEmail();
    const userData = {
      email: testEmail,
      password: 'password123',
      displayName: 'Profile Test ' + Date.now(),
      birthDate: TEST_UTILS.generateBirthDate(25),
      agreeToTerms: true
    };
    const regRes = await fetch(registerUrl, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(userData)
    });
    if (regRes.status !== 201) {
      const err = await regRes.text();
      results.errors.push('Inscription échouée: ' + err);
      return { success: false, results };
    }
    const regBody = await regRes.json();
    results.userCreated = true;
    authToken = regBody.token;
    userId = regBody.user.id;
    results.tokenObtained = !!authToken;

    // 2) GET /auth/profile
    const getRes = await fetch(getProfileUrl, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (getRes.status === 200) {
      const body = await getRes.json();
      if (body.success && body.data && body.data.id === userId) {
        results.getProfileOk = true;
      } else {
        results.errors.push('Format GET /auth/profile invalide');
      }
    } else {
      results.errors.push('GET /auth/profile a échoué: ' + getRes.status);
    }

    // 3) PUT /auth/profile
    const newName = 'Profile Updated ' + Date.now();
    const payload = { displayName: newName, bio: 'Bio de test mise à jour' };
    const putRes = await fetch(updateProfileUrl, {
      method: 'PUT',
      headers: { ...DEFAULT_HEADERS, 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify(payload)
    });
    if (putRes.status === 200) {
      const body = await putRes.json();
      if (body.success && body.data && body.data.displayName === newName) {
        results.updateProfileOk = true;
      } else {
        results.errors.push('Format PUT /auth/profile invalide');
      }
    } else {
      const err = await putRes.text();
      results.errors.push('PUT /auth/profile a échoué: ' + putRes.status + ' ' + err);
    }

    // 4) GET /auth/profile (vérifier update)
    const getRes2 = await fetch(getProfileUrl, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (getRes2.status === 200) {
      const body = await getRes2.json();
      if (body.success && body.data && body.data.displayName && body.data.bio) {
        results.getUpdatedProfileOk = true;
      }
    }

  } catch (e) {
    results.errors.push('Erreur: ' + e.message);
    success = false;
  }

  console.log('\n📋 RÉSULTATS TEST 2.6 - PROFIL');
  console.log('===============================');
  console.log(`Utilisateur créé: ${results.userCreated ? '✅' : '❌'}`);
  console.log(`Token obtenu: ${results.tokenObtained ? '✅' : '❌'}`);
  console.log(`GET profil: ${results.getProfileOk ? '✅' : '❌'}`);
  console.log(`PUT profil: ${results.updateProfileOk ? '✅' : '❌'}`);
  console.log(`GET profil (après): ${results.getUpdatedProfileOk ? '✅' : '❌'}`);
  if (results.errors.length) {
    console.log('Erreurs:');
    results.errors.forEach(e => console.log(' - ' + e));
  }

  const allOk = results.userCreated && results.tokenObtained && results.getProfileOk && results.updateProfileOk;
  return { success: allOk, results };
}

if (require.main === module) {
  testProfileEndpoints()
    .then(({ success }) => process.exit(success ? 0 : 1))
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = testProfileEndpoints;

