/**
 * 🖼️ TEST 2.7 - UPLOAD AVATAR: POST /upload/avatar
 * ================================================
 */

const { API_CONFIG, TEST_UTILS, DEFAULT_HEADERS } = require('../0_test-config');

async function testUploadAvatar() {
  TEST_UTILS.log('🔍', 'Début test upload avatar...');

  const results = {
    userCreated: false,
    tokenObtained: false,
    uploadOk: false,
    profileUpdated: false,
    errors: []
  };

  const registerUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.registration.register;
  const uploadUrl = API_CONFIG.baseUrl + '/api/upload/avatar';
  const getProfileUrl = API_CONFIG.baseUrl + '/api/auth/profile';

  let token = null;

  try {
    // 1) Register user (adult)
    const email = TEST_UTILS.generateTestEmail();
    const body = {
      email,
      password: 'password123',
      displayName: 'Avatar Test ' + Date.now(),
      birthDate: TEST_UTILS.generateBirthDate(30),
      agreeToTerms: true
    };
    const reg = await fetch(registerUrl, { method: 'POST', headers: DEFAULT_HEADERS, body: JSON.stringify(body) });
    if (reg.status !== 201) {
      results.errors.push('Inscription échouée: ' + await reg.text());
      return { success: false, results };
    }
    const regJson = await reg.json();
    token = regJson.token;
    results.userCreated = true;
    results.tokenObtained = !!token;

    // 2) Prepare a tiny PNG file (1x1)
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B4s6w2+QAAAAASUVORK5CYII=';
    const bytes = Buffer.from(pngBase64, 'base64');
    const blob = new Blob([bytes], { type: 'image/png' });
    const form = new FormData();
    form.append('avatar', blob, 'avatar.png');

    // 3) POST /api/upload/avatar
    const up = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: form
    });
    if (up.status === 200) {
      const upJson = await up.json();
      if (upJson.success && upJson.data && upJson.data.avatarUrl) {
        results.uploadOk = true;
        // 4) Verify profile shows updated avatar
        const pr = await fetch(getProfileUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        if (pr.status === 200) {
          const prJson = await pr.json();
          if (prJson.success && prJson.data && prJson.data.avatarUrl) {
            results.profileUpdated = true;
          }
        }
      } else {
        results.errors.push('Réponse upload avatar invalide');
      }
    } else {
      results.errors.push('Upload avatar a échoué: ' + up.status);
    }

  } catch (e) {
    results.errors.push(e.message);
  }

  console.log('\n📋 RÉSULTATS TEST 2.7 - UPLOAD AVATAR');
  console.log('====================================');
  console.log(`Utilisateur créé: ${results.userCreated ? '✅' : '❌'}`);
  console.log(`Token obtenu: ${results.tokenObtained ? '✅' : '❌'}`);
  console.log(`Upload avatar: ${results.uploadOk ? '✅' : '❌'}`);
  console.log(`Profil mis à jour: ${results.profileUpdated ? '✅' : '❌'}`);
  if (results.errors.length) results.errors.forEach(e => console.log(' - ' + e));

  const ok = results.userCreated && results.tokenObtained && results.uploadOk;
  return { success: ok, results };
}

if (require.main === module) {
  testUploadAvatar()
    .then(({ success }) => process.exit(success ? 0 : 1))
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = testUploadAvatar;

