/**
 * 🖼️ TEST 3.0 - UPLOAD IMAGE FAIL: POST /upload/image
 * ================================================
 */

const { API_CONFIG, TEST_UTILS, DEFAULT_HEADERS, fetch } = require('../0_test-config');

async function testUploadFailImage() {
  TEST_UTILS.log('🔍', 'Début test upload image fail...');

  const results = {
    userCreated: false,
    tokenObtained: false,
    uploadOk: false,
    fileServed: false,
    errors: []
  };

  const registerUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.registration.register;
  const uploadUrl = API_CONFIG.baseUrl + '/api/upload/image';

  let token = null;
  try {
    // Register adult
    const body = {
      email: TEST_UTILS.generateTestEmail(),
      password: 'password123',
      displayName: 'Upload Image Test ' + Date.now(),
      birthDate: TEST_UTILS.generateBirthDate(22),
      agreeToTerms: true
    };
    const reg = await fetch(registerUrl, { method: 'POST', headers: DEFAULT_HEADERS, body: JSON.stringify(body) });
    if (reg.status !== 201) {
      results.errors.push('Inscription échouée: ' + await reg.text());
      return { success: false, results };
    }
    const regJson = await reg.json();
    results.userCreated = true;
    token = regJson.token;
    results.tokenObtained = !!token;

    // Prepare tiny PNG
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B4s6w2+QAAAAASUVORK5CYII=';
    const bytes = Buffer.from(pngBase64, 'base64');
    const blob = new Blob([bytes], { type: 'image/png' });
    const form = new FormData();
    form.append('image', blob, 'fail.png');

    // Upload
    const up = await fetch(uploadUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: form });
    if (up.status === 200) {
      const upJson = await up.json();
      if (upJson.success && upJson.data && upJson.data.imageUrl) {
        results.uploadOk = true;
        // Verify file served statically
        const fileRes = await fetch(API_CONFIG.baseUrl + upJson.data.imageUrl);
        if (fileRes.status === 200) {
          results.fileServed = true;
        }
      } else {
        results.errors.push('Réponse upload image invalide');
      }
    } else {
      results.errors.push('Upload image a échoué: ' + up.status);
    }
  } catch (e) {
    results.errors.push(e.message);
  }

  console.log('\n📋 RÉSULTATS TEST 3.0 - UPLOAD IMAGE');
  console.log('====================================');
  console.log(`Utilisateur créé: ${results.userCreated ? '✅' : '❌'}`);
  console.log(`Token obtenu: ${results.tokenObtained ? '✅' : '❌'}`);
  console.log(`Upload image: ${results.uploadOk ? '✅' : '❌'}`);
  console.log(`Fichier servi: ${results.fileServed ? '✅' : '❌'}`);
  if (results.errors.length) results.errors.forEach(e => console.log(' - ' + e));

  const ok = results.userCreated && results.tokenObtained && results.uploadOk;
  return { success: ok, results };
}

if (require.main === module) {
  testUploadFailImage()
    .then(({ success }) => process.exit(success ? 0 : 1))
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = testUploadFailImage;


