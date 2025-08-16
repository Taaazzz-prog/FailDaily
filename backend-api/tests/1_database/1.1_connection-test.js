/**
 * 🗄️ TEST 1.1 - CONNEXION BASE DE DONNÉES
 * =======================================
 * 
 * Teste la connexion MySQL et la configuration de base
 */

const mysql = require('mysql2/promise');
const { TEST_DB_CONFIG, TEST_UTILS } = require('../0_test-config');

async function testDatabaseConnection() {
  TEST_UTILS.log('🔍', 'Début test connexion base de données...');
  
  let connection;
  let success = true;
  const results = {
    connection: false,
    tablesCount: 0,
    usersCount: 0,
    errors: []
  };

  try {
    // Test de connexion
    TEST_UTILS.log('⚡', 'Tentative de connexion MySQL...');
    connection = await mysql.createConnection(TEST_DB_CONFIG);
    results.connection = true;
    TEST_UTILS.log('✅', 'Connexion MySQL établie');

    // Vérifier les tables
    TEST_UTILS.log('🔍', 'Vérification des tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    results.tablesCount = tables.length;
    TEST_UTILS.log('📊', `${tables.length} tables trouvées`);

    // Tables essentielles requises
    const requiredTables = ['users', 'profiles', 'fails', 'user_badges', 'badge_definitions'];
    const tableNames = tables.map(t => t[`Tables_in_${TEST_DB_CONFIG.database}`]);
    
    for (const table of requiredTables) {
      if (tableNames.includes(table)) {
        TEST_UTILS.log('✅', `Table ${table} présente`);
      } else {
        TEST_UTILS.log('❌', `Table ${table} MANQUANTE`);
        results.errors.push(`Table manquante: ${table}`);
        success = false;
      }
    }

    // Compter les utilisateurs
    try {
      const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
      results.usersCount = users[0].count;
      TEST_UTILS.log('👥', `${results.usersCount} utilisateurs en base`);
    } catch (error) {
      results.errors.push(`Erreur comptage users: ${error.message}`);
      success = false;
    }

  } catch (error) {
    TEST_UTILS.log('❌', `Erreur connexion: ${error.message}`);
    results.errors.push(error.message);
    success = false;
  } finally {
    if (connection) {
      await connection.end();
      TEST_UTILS.log('🔌', 'Connexion fermée');
    }
  }

  // Résultats
  console.log('\n📋 RÉSULTATS TEST 1.1 - CONNEXION BDD');
  console.log('=====================================');
  console.log(`Connexion: ${results.connection ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Tables: ${results.tablesCount} trouvées`);
  console.log(`Utilisateurs: ${results.usersCount}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERREURS:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log(`\n🎯 STATUT: ${success ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);
  
  return { success, results };
}

// Exécution si appelé directement
if (require.main === module) {
  testDatabaseConnection()
    .then(({ success }) => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = testDatabaseConnection;
