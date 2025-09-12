const { executeQuery } = require('./src/config/database');

async function testLimitSyntax() {
  try {
    console.log('🔍 Test des différentes syntaxes LIMIT...\n');
    
    // Test 1: LIMIT avec valeurs directes (pas de paramètres)
    console.log('1️⃣ Test LIMIT avec valeurs directes...');
    try {
      const test1 = await executeQuery('SELECT id, title FROM fails LIMIT 2');
      console.log(`✅ Test 1 réussi: ${test1.length} résultats`);
    } catch (e) {
      console.log(`❌ Test 1 échoué: ${e.message}`);
    }
    
    // Test 2: LIMIT avec un seul paramètre
    console.log('\n2️⃣ Test LIMIT avec un paramètre...');
    try {
      const test2 = await executeQuery('SELECT id, title FROM fails LIMIT ?', [2]);
      console.log(`✅ Test 2 réussi: ${test2.length} résultats`);
    } catch (e) {
      console.log(`❌ Test 2 échoué: ${e.message}`);
    }
    
    // Test 3: LIMIT avec OFFSET séparés
    console.log('\n3️⃣ Test LIMIT ? OFFSET ?...');
    try {
      const test3 = await executeQuery('SELECT id, title FROM fails LIMIT ? OFFSET ?', [2, 0]);
      console.log(`✅ Test 3 réussi: ${test3.length} résultats`);
    } catch (e) {
      console.log(`❌ Test 3 échoué: ${e.message}`);
    }
    
    // Test 4: Version MySQL ancienne LIMIT offset, limit
    console.log('\n4️⃣ Test LIMIT offset, limit (syntaxe MySQL ancienne)...');
    try {
      const test4 = await executeQuery('SELECT id, title FROM fails LIMIT ?, ?', [0, 2]);
      console.log(`✅ Test 4 réussi: ${test4.length} résultats`);
    } catch (e) {
      console.log(`❌ Test 4 échoué: ${e.message}`);
    }
    
    // Test 5: Sans paramètres préparés
    console.log('\n5️⃣ Test construction de requête sans paramètres préparés...');
    try {
      const limit = 2;
      const offset = 0;
      const query = `SELECT id, title FROM fails LIMIT ${offset}, ${limit}`;
      const test5 = await executeQuery(query);
      console.log(`✅ Test 5 réussi: ${test5.length} résultats`);
    } catch (e) {
      console.log(`❌ Test 5 échoué: ${e.message}`);
    }
    
    // Test 6: Vérifier la version MySQL
    console.log('\n6️⃣ Vérification version MySQL...');
    try {
      const version = await executeQuery('SELECT VERSION() as version');
      console.log(`MySQL Version: ${version[0].version}`);
    } catch (e) {
      console.log(`❌ Erreur version: ${e.message}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    process.exit();
  }
}

testLimitSyntax();
