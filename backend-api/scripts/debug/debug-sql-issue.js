const { executeQuery } = require('./src/config/database');

async function debugSQLIssue() {
  try {
    console.log('🔍 Test progressif pour identifier le problème SQL...\n');
    
    // Test 1: Requête la plus simple possible
    console.log('1️⃣ Test requête ultra-simple...');
    try {
      const test1 = await executeQuery('SELECT COUNT(*) as total FROM fails');
      console.log(`✅ Test 1 réussi: ${test1[0].total} fails`);
    } catch (e) {
      console.log(`❌ Test 1 échoué: ${e.message}`);
      return;
    }
    
    // Test 2: Avec LIMIT et paramètres
    console.log('\n2️⃣ Test avec LIMIT et paramètres...');
    try {
      const test2 = await executeQuery('SELECT id, title FROM fails LIMIT ?, ?', [0, 2]);
      console.log(`✅ Test 2 réussi: ${test2.length} résultats`);
    } catch (e) {
      console.log(`❌ Test 2 échoué: ${e.message}`);
      return;
    }
    
    // Test 3: Avec JOIN users/profiles
    console.log('\n3️⃣ Test avec JOIN users/profiles...');
    try {
      const test3 = await executeQuery(`
        SELECT f.id, f.title, u.email, p.display_name
        FROM fails f
        JOIN users u ON f.user_id = u.id
        JOIN profiles p ON u.id = p.user_id
        LIMIT ?, ?`, [0, 2]);
      console.log(`✅ Test 3 réussi: ${test3.length} résultats`);
    } catch (e) {
      console.log(`❌ Test 3 échoué: ${e.message}`);
      return;
    }
    
    // Test 4: Avec LEFT JOIN fail_moderation
    console.log('\n4️⃣ Test avec LEFT JOIN fail_moderation...');
    try {
      const test4 = await executeQuery(`
        SELECT f.id, f.title, fm.status
        FROM fails f
        LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
        LIMIT ?, ?`, [0, 2]);
      console.log(`✅ Test 4 réussi: ${test4.length} résultats`);
      test4.forEach(row => {
        console.log(`  - Fail ${row.id}: status = ${row.status}`);
      });
    } catch (e) {
      console.log(`❌ Test 4 échoué: ${e.message}`);
      return;
    }
    
    // Test 5: Avec WHERE sur fail_moderation
    console.log('\n5️⃣ Test avec WHERE sur fail_moderation...');
    try {
      const test5 = await executeQuery(`
        SELECT f.id, f.title, fm.status
        FROM fails f
        LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
        WHERE (fm.status IS NULL OR fm.status = 'approved')
        LIMIT ?, ?`, [0, 2]);
      console.log(`✅ Test 5 réussi: ${test5.length} résultats`);
    } catch (e) {
      console.log(`❌ Test 5 échoué: ${e.message}`);
      return;
    }
    
    // Test 6: Ajouter les sous-requêtes reactions une par une
    console.log('\n6️⃣ Test avec sous-requête reactions...');
    try {
      const test6 = await executeQuery(`
        SELECT f.id, f.title,
               (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id) as reactions_count
        FROM fails f
        LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
        WHERE (fm.status IS NULL OR fm.status = 'approved')
        LIMIT ?, ?`, [0, 2]);
      console.log(`✅ Test 6 réussi: ${test6.length} résultats`);
    } catch (e) {
      console.log(`❌ Test 6 échoué: ${e.message}`);
      return;
    }
    
    // Test 7: Tester textProtocol option
    console.log('\n7️⃣ Test avec option textProtocol...');
    try {
      const test7 = await executeQuery(`
        SELECT f.id, f.title
        FROM fails f
        LIMIT ?, ?`, [0, 2], { textProtocol: true });
      console.log(`✅ Test 7 réussi: ${test7.length} résultats avec textProtocol`);
    } catch (e) {
      console.log(`❌ Test 7 échoué: ${e.message}`);
    }
    
    // Test 8: La requête complète de getPublicFails
    console.log('\n8️⃣ Test de la requête complète getPublicFails...');
    try {
      const test8 = await executeQuery(`
        SELECT f.*, p.display_name, p.avatar_url, fm.status AS moderation_status,
               (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id) as reactions_count,
               (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'courage') as courage_count,
               (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'empathy') as empathy_count,
               (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'laugh')   as laugh_count,
               (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'support') as support_count
        FROM fails f
        JOIN users u    ON f.user_id = u.id
        JOIN profiles p ON u.id = p.user_id
        LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
        WHERE (fm.status IS NULL OR fm.status = 'approved')
        ORDER BY f.created_at DESC, f.id DESC
        LIMIT ?, ?`, [0, 2], { textProtocol: true });
      console.log(`✅ Test 8 réussi: ${test8.length} résultats`);
    } catch (e) {
      console.log(`❌ Test 8 échoué: ${e.message}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    process.exit();
  }
}

debugSQLIssue();
