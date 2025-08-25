/**
 * 👍🚩 TEST 3.4 - Like & Report sur commentaires + modération
 * ==========================================================
 */

const { API_CONFIG, TEST_UTILS, DEFAULT_HEADERS } = require('../0_test-config');

async function registerAdult(label = '') {
  const email = TEST_UTILS.generateTestEmail();
  const body = { email, password: 'password123', displayName: `U ${label} ${Date.now()}`, birthDate: TEST_UTILS.generateBirthDate(25), agreeToTerms: true };
  const res = await fetch(API_CONFIG.baseUrl + API_CONFIG.endpoints.registration.register, { method: 'POST', headers: DEFAULT_HEADERS, body: JSON.stringify(body) });
  if (res.status !== 201) throw new Error('Inscription échouée');
  return await res.json();
}

async function testCommentsLikeReport() {
  TEST_UTILS.log('🔍', 'Début test like/report commentaires...');

  const results = {
    authorCreated: false,
    readerCreated: false,
    failCreated: false,
    commentCreated: false,
    liked: false,
    unliked: false,
    moderated: false,
    errors: []
  };

  try {
    // 1) Create author user + fail + comment
    const author = await registerAdult('Author');
    results.authorCreated = true;
    const tokenAuthor = author.token;

    const failsUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.fails.create;
    const failRes = await fetch(failsUrl, { method: 'POST', headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${tokenAuthor}` }, body: JSON.stringify({ title: 'Fail A', description: 'Desc', category: 'personnel', is_public: true }) });
    if (failRes.status !== 201) throw new Error('Création fail auteur échouée');
    const failJson = await failRes.json();
    results.failCreated = true;
    const failId = failJson.fail.id;

    const addUrl = `${API_CONFIG.baseUrl}/api/fails/${failId}/comments`;
    const addRes = await fetch(addUrl, { method: 'POST', headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${tokenAuthor}` }, body: JSON.stringify({ content: 'Comment A' }) });
    if (addRes.status !== 201) throw new Error('Création commentaire échouée');
    const addJson = await addRes.json();
    const commentId = addJson.data.id;
    results.commentCreated = true;

    // 2) Create a second user to like
    const reader = await registerAdult('Reader');
    results.readerCreated = true;
    const tokenReader = reader.token;

    // Like
    const likeUrl = `${API_CONFIG.baseUrl}/api/fails/${failId}/comments/${commentId}/like`;
    const likeRes = await fetch(likeUrl, { method: 'POST', headers: { Authorization: `Bearer ${tokenReader}` } });
    if (likeRes.status === 200) results.liked = true; else results.errors.push('Like échoué');

    // Unlike
    const unLikeRes = await fetch(likeUrl, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenReader}` } });
    if (unLikeRes.status === 200) results.unliked = true; else results.errors.push('Unlike échoué');

    // 3) Reports from many users until threshold is reached
    const reportUrl = `${API_CONFIG.baseUrl}/api/fails/${failId}/comments/${commentId}/report`;
    const reporters = [];
    for (let i = 0; i < 10; i++) {
      const rep = await registerAdult('Reporter' + i);
      reporters.push(rep);
      const r = await fetch(reportUrl, { method: 'POST', headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${rep.token}` }, body: JSON.stringify({ reason: 'spam' }) });
      if (r.status !== 200) results.errors.push('Report échoué pour user ' + i);
      await TEST_UTILS.sleep(100); // léger délai
    }

    // 4) After threshold, comment should be hidden from GET list
    const listRes = await fetch(`${API_CONFIG.baseUrl}/api/fails/${failId}/comments`);
    if (listRes.status === 200) {
      const listJson = await listRes.json();
      const comments = (listJson && listJson.data && listJson.data.comments) || [];
      const found = comments.some(c => c.id === commentId);
      results.moderated = !found; // Comment should be absent
    }

  } catch (e) {
    results.errors.push(e.message);
  }

  console.log('\n📋 RÉSULTATS TEST 3.4 - Like/Report commentaires');
  console.log('==============================================');
  console.log(`Auteur créé: ${results.authorCreated ? '✅' : '❌'}`);
  console.log(`Lecteur créé: ${results.readerCreated ? '✅' : '❌'}`);
  console.log(`Fail créé: ${results.failCreated ? '✅' : '❌'}`);
  console.log(`Commentaire créé: ${results.commentCreated ? '✅' : '❌'}`);
  console.log(`Like: ${results.liked ? '✅' : '❌'}`);
  console.log(`Unlike: ${results.unliked ? '✅' : '❌'}`);
  console.log(`Modération atteinte: ${results.moderated ? '✅' : '❌'}`);
  if (results.errors.length) results.errors.forEach(e => console.log(' - ' + e));

  const ok = results.authorCreated && results.readerCreated && results.failCreated && results.commentCreated && results.liked && results.unliked;
  return { success: ok, results };
}

if (require.main === module) {
  testCommentsLikeReport().then(({ success }) => process.exit(success ? 0 : 1)).catch(err => { console.error(err); process.exit(1); });
}

module.exports = testCommentsLikeReport;

