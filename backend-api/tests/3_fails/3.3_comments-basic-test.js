/**
 * 💬 TEST 3.3 - Commentaires: création et lecture
 * ===============================================
 */

const { API_CONFIG, TEST_UTILS, DEFAULT_HEADERS, fetch } = require('../0_test-config');

async function testCommentsBasic() {
  TEST_UTILS.log('🔍', 'Début test commentaires (création/lecture)...');

  const results = {
    userCreated: false,
    tokenObtained: false,
    failCreated: false,
    commentCreated: false,
    commentListed: false,
    errors: []
  };

  try {
    // 1) Register adult user
    const registerUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.registration.register;
    const email = TEST_UTILS.generateTestEmail();
    const regBody = {
      email, password: 'password123', displayName: 'CommentUser ' + Date.now(),
      birthDate: TEST_UTILS.generateBirthDate(25), agreeToTerms: true
    };
    const regRes = await fetch(registerUrl, { method: 'POST', headers: DEFAULT_HEADERS, body: JSON.stringify(regBody) });
    if (regRes.status !== 201) {
      results.errors.push('Inscription échouée: ' + (await regRes.text()));
      return { success: false, results };
    }
    const regJson = await regRes.json();
    results.userCreated = true;
    const token = regJson.token; const userId = regJson.user.id;
    results.tokenObtained = !!token;

    // 2) Create a fail
    const failsUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.fails.create;
    const failPayload = {
      title: 'Fail pour test commentaires',
      description: 'Contenu test',
      category: 'personnel',
      is_anonyme: false
    };
    const failRes = await fetch(failsUrl, { method: 'POST', headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` }, body: JSON.stringify(failPayload) });
    if (failRes.status !== 201) {
      results.errors.push('Création fail échouée: ' + (await failRes.text()));
      return { success: false, results };
    }
    const failJson = await failRes.json();
    results.failCreated = !!(failJson && failJson.fail && failJson.fail.id);
    const failId = failJson.fail.id;

    // 3) POST comment
    const addUrl = `${API_CONFIG.baseUrl}/api/fails/${failId}/comments`;
    const content = 'test du premier commentaire';
    const addRes = await fetch(addUrl, {
      method: 'POST',
      headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content })
    });
    if (addRes.status === 201) {
      const addJson = await addRes.json();
      if (addJson.success && addJson.data && addJson.data.content === content) {
        results.commentCreated = true;
      } else {
        results.errors.push('Format réponse addComment invalide');
      }
    } else {
      results.errors.push('Ajout commentaire échoué: ' + (await addRes.text()));
    }

    // 4) GET comments
    const listUrl = `${API_CONFIG.baseUrl}/api/fails/${failId}/comments`;
    const listRes = await fetch(listUrl);
    if (listRes.status === 200) {
      const listJson = await listRes.json();
      const comments = (listJson && listJson.data && listJson.data.comments) || [];
      results.commentListed = Array.isArray(comments) && comments.length > 0;
    } else {
      results.errors.push('Lecture commentaires échouée: ' + (await listRes.text()));
    }

  } catch (e) {
    results.errors.push(e.message);
  }

  console.log('\n📋 RÉSULTATS TEST 3.3 - Commentaires (base)');
  console.log('=========================================');
  console.log(`Utilisateur créé: ${results.userCreated ? '✅' : '❌'}`);
  console.log(`Token obtenu: ${results.tokenObtained ? '✅' : '❌'}`);
  console.log(`Fail créé: ${results.failCreated ? '✅' : '❌'}`);
  console.log(`Commentaire créé: ${results.commentCreated ? '✅' : '❌'}`);
  console.log(`Commentaire listé: ${results.commentListed ? '✅' : '❌'}`);
  if (results.errors.length) results.errors.forEach(e => console.log(' - ' + e));

  const ok = results.userCreated && results.tokenObtained && results.failCreated && results.commentCreated;
  return { success: ok, results };
}

if (require.main === module) {
  testCommentsBasic().then(({ success }) => process.exit(success ? 0 : 1)).catch(err => { console.error(err); process.exit(1); });
}

module.exports = testCommentsBasic;

