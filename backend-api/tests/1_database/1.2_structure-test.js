/**
 * 🏗️ TEST 1.2 - STRUCTURE ET INTÉGRITÉ DES TABLES
 * ===============================================
 * 
 * Vérifie la structure complète des tables MySQL
 */

const mysql = require('mysql2/promise');
const { TEST_DB_CONFIG, TEST_UTILS } = require('../0_test-config');

async function testDatabaseStructure() {
  TEST_UTILS.log('🔍', 'Début test structure base de données...');
  
  let connection;
  let success = true;
  const results = {
    tables: {},
    constraints: {},
    indexes: {},
    errors: []
  };

  try {
    connection = await mysql.createConnection(TEST_DB_CONFIG);

    // Structure des tables principales (VRAIE structure de la DB)
    const expectedTables = {
      users: ['id', 'email', 'password_hash', 'role', 'account_status', 'created_at', 'updated_at', 'email_confirmed', 'last_login', 'login_count', 'registration_step'],
      profiles: ['id', 'user_id', 'display_name', 'username', 'bio', 'avatar_url', 'registration_completed', 'legal_consent', 'age_verification', 'preferences', 'stats', 'created_at', 'updated_at'],
      fails: ['id', 'user_id', 'title', 'description', 'category', 'is_public', 'image_url', 'reactions', 'comments_count', 'created_at', 'updated_at'],
      badge_definitions: ['id', 'name', 'description', 'icon', 'category', 'rarity', 'requirement_type', 'requirement_value', 'created_at'],
      user_badges: ['id', 'user_id', 'badge_id', 'unlocked_at', 'created_at'],
      reactions: ['id', 'user_id', 'fail_id', 'reaction_type', 'created_at'],
      system_logs: ['id', 'level', 'action', 'message', 'user_id', 'details', 'timestamp', 'created_at']
    };

    TEST_UTILS.log('🔍', 'Vérification structure des tables...');

    for (const [tableName, expectedColumns] of Object.entries(expectedTables)) {
      try {
        // Vérifier que la table existe
        const [tableExists] = await connection.execute(
          'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
          [TEST_DB_CONFIG.database, tableName]
        );

        if (tableExists[0].count === 0) {
          TEST_UTILS.log('❌', `Table ${tableName} n'existe pas`);
          results.errors.push(`Table manquante: ${tableName}`);
          success = false;
          continue;
        }

        // Vérifier les colonnes
        const [columns] = await connection.execute(`DESCRIBE \`${tableName}\``);
        const actualColumns = columns.map(col => col.Field);
        
        results.tables[tableName] = {
          exists: true,
          columns: actualColumns,
          missingColumns: [],
          extraColumns: []
        };

        // Colonnes manquantes
        for (const expectedCol of expectedColumns) {
          if (!actualColumns.includes(expectedCol)) {
            results.tables[tableName].missingColumns.push(expectedCol);
            TEST_UTILS.log('⚠️', `${tableName}: colonne manquante ${expectedCol}`);
            success = false;
          }
        }

        // Colonnes supplémentaires (pas forcément un problème)
        for (const actualCol of actualColumns) {
          if (!expectedColumns.includes(actualCol)) {
            results.tables[tableName].extraColumns.push(actualCol);
          }
        }

        if (results.tables[tableName].missingColumns.length === 0) {
          TEST_UTILS.log('✅', `${tableName}: structure OK (${actualColumns.length} colonnes)`);
        }

        // Vérifier les index
        const [indexes] = await connection.execute(
          `SHOW INDEX FROM \`${tableName}\``
        );
        
        results.indexes[tableName] = indexes.map(idx => ({
          name: idx.Key_name,
          column: idx.Column_name,
          unique: idx.Non_unique === 0
        }));

      } catch (error) {
        TEST_UTILS.log('❌', `Erreur table ${tableName}: ${error.message}`);
        results.errors.push(`${tableName}: ${error.message}`);
        success = false;
      }
    }

    // Vérifier les contraintes de clés étrangères
    TEST_UTILS.log('🔗', 'Vérification des contraintes...');
    
    const expectedConstraints = [
      { table: 'profiles', column: 'user_id', refTable: 'users', refColumn: 'id' },
      { table: 'fails', column: 'user_id', refTable: 'users', refColumn: 'id' },
      { table: 'user_badges', column: 'user_id', refTable: 'users', refColumn: 'id' },
      { table: 'user_badges', column: 'badge_id', refTable: 'badge_definitions', refColumn: 'id' },
      { table: 'reactions', column: 'user_id', refTable: 'users', refColumn: 'id' },
      { table: 'reactions', column: 'fail_id', refTable: 'fails', refColumn: 'id' }
    ];

    for (const constraint of expectedConstraints) {
      try {
        const [fks] = await connection.execute(`
          SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
          FROM information_schema.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = ? 
            AND COLUMN_NAME = ?
            AND REFERENCED_TABLE_NAME = ?
            AND REFERENCED_COLUMN_NAME = ?
        `, [TEST_DB_CONFIG.database, constraint.table, constraint.column, constraint.refTable, constraint.refColumn]);

        if (fks.length > 0) {
          TEST_UTILS.log('✅', `FK ${constraint.table}.${constraint.column} → ${constraint.refTable}.${constraint.refColumn}`);
        } else {
          TEST_UTILS.log('⚠️', `FK manquante: ${constraint.table}.${constraint.column} → ${constraint.refTable}.${constraint.refColumn}`);
          results.errors.push(`Contrainte manquante: ${constraint.table}.${constraint.column}`);
        }

      } catch (error) {
        results.errors.push(`Erreur contrainte ${constraint.table}: ${error.message}`);
      }
    }

  } catch (error) {
    TEST_UTILS.log('❌', `Erreur générale: ${error.message}`);
    results.errors.push(error.message);
    success = false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }

  // Résultats détaillés
  console.log('\n📋 RÉSULTATS TEST 1.2 - STRUCTURE BDD');
  console.log('====================================');
  
  Object.entries(results.tables).forEach(([table, info]) => {
    console.log(`\n📄 ${table}:`);
    console.log(`   Colonnes: ${info.columns.length}`);
    if (info.missingColumns.length > 0) {
      console.log(`   ❌ Manquantes: ${info.missingColumns.join(', ')}`);
    }
    if (info.extraColumns.length > 0) {
      console.log(`   ℹ️ Supplémentaires: ${info.extraColumns.join(', ')}`);
    }
  });

  if (results.errors.length > 0) {
    console.log('\n❌ PROBLÈMES DÉTECTÉS:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log(`\n🎯 STATUT: ${success ? '✅ SUCCÈS' : '❌ ÉCHEC'}\n`);
  
  return { success, results };
}

// Exécution si appelé directement
if (require.main === module) {
  testDatabaseStructure()
    .then(({ success }) => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = testDatabaseStructure;
