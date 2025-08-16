const mysql = require('mysql2/promise');

/**
 * Script de débogage pour analyser la structure des tables MySQL
 */

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '', // Mot de passe WampServer si configuré
  database: 'faildaily'
};

async function debugTables() {
  let connection;

  try {
    console.log('🔍 Connexion à la base de données MySQL...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion établie');

    // Lister toutes les tables
    console.log('\n📊 === LISTE DES TABLES ===');
    const tables = await connection.execute('SHOW TABLES');
    
    console.log(`\n📋 Nombre de tables: ${tables[0].length}`);
    
    for (const table of tables[0]) {
      const tableName = table[`Tables_in_${dbConfig.database}`];
      console.log(`📄 ${tableName}`);
    }

    // Analyser chaque table
    console.log('\n🔍 === ANALYSE DÉTAILLÉE DES TABLES ===');
    
    for (const table of tables[0]) {
      const tableName = table[`Tables_in_${dbConfig.database}`];
      
      console.log(`\n📄 Table: ${tableName}`);
      console.log('=' .repeat(50));

      // Structure de la table
      const structure = await connection.execute(`DESCRIBE ${tableName}`);
      
      console.log('📋 Structure:');
      for (const column of structure[0]) {
        const nullable = column.Null === 'YES' ? 'NULL' : 'NOT NULL';
        const key = column.Key ? ` [${column.Key}]` : '';
        const defaultValue = column.Default !== null ? ` DEFAULT: ${column.Default}` : '';
        const extra = column.Extra ? ` (${column.Extra})` : '';
        
        console.log(`   ${column.Field}: ${column.Type} ${nullable}${key}${defaultValue}${extra}`);
      }

      // Compter les enregistrements
      try {
        const count = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`📊 Nombre d'enregistrements: ${count[0][0].count}`);
      } catch (error) {
        console.log(`❌ Erreur comptage: ${error.message}`);
      }

      // Exemples d'enregistrements (5 premiers)
      try {
        const samples = await connection.execute(`SELECT * FROM ${tableName} LIMIT 5`);
        if (samples[0].length > 0) {
          console.log('📋 Exemples d\'enregistrements:');
          samples[0].forEach((row, index) => {
            console.log(`   ${index + 1}. ${JSON.stringify(row, null, 2).substring(0, 200)}...`);
          });
        } else {
          console.log('📋 Table vide');
        }
      } catch (error) {
        console.log(`❌ Erreur exemples: ${error.message}`);
      }

      // Informations sur les index
      try {
        const indexes = await connection.execute(`SHOW INDEX FROM ${tableName}`);
        if (indexes[0].length > 0) {
          console.log('🔑 Index:');
          const indexGroups = {};
          
          for (const index of indexes[0]) {
            if (!indexGroups[index.Key_name]) {
              indexGroups[index.Key_name] = [];
            }
            indexGroups[index.Key_name].push(index.Column_name);
          }
          
          for (const [indexName, columns] of Object.entries(indexGroups)) {
            const type = indexName === 'PRIMARY' ? 'PRIMARY KEY' : 'INDEX';
            console.log(`   ${type} ${indexName}: (${columns.join(', ')})`);
          }
        }
      } catch (error) {
        console.log(`❌ Erreur index: ${error.message}`);
      }

      // Contraintes de clés étrangères
      try {
        const fks = await connection.execute(`
          SELECT 
            CONSTRAINT_NAME,
            COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = ? 
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `, [dbConfig.database, tableName]);

        if (fks[0].length > 0) {
          console.log('🔗 Clés étrangères:');
          for (const fk of fks[0]) {
            console.log(`   ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
          }
        }
      } catch (error) {
        console.log(`❌ Erreur clés étrangères: ${error.message}`);
      }
    }

    // Statistiques globales
    console.log('\n📊 === STATISTIQUES GLOBALES ===');
    
    try {
      const dbSize = await connection.execute(`
        SELECT 
          ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'DB Size (MB)'
        FROM information_schema.tables 
        WHERE table_schema = ?
      `, [dbConfig.database]);
      
      console.log(`💾 Taille de la base: ${dbSize[0][0]['DB Size (MB)']} MB`);
    } catch (error) {
      console.log(`❌ Erreur taille DB: ${error.message}`);
    }

    try {
      const tableStats = await connection.execute(`
        SELECT 
          TABLE_NAME,
          TABLE_ROWS,
          ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
        FROM information_schema.TABLES 
        WHERE table_schema = ?
        ORDER BY (data_length + index_length) DESC
      `, [dbConfig.database]);

      console.log('\n📋 Statistiques par table:');
      for (const stat of tableStats[0]) {
        console.log(`   ${stat.TABLE_NAME}: ${stat.TABLE_ROWS} lignes, ${stat['Size (MB)']} MB`);
      }
    } catch (error) {
      console.log(`❌ Erreur stats tables: ${error.message}`);
    }

    // Vérifications d'intégrité
    console.log('\n🔍 === VÉRIFICATIONS D\'INTÉGRITÉ ===');
    
    // Vérifier les relations utilisateurs
    try {
      const orphanedProfiles = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM user_profiles up 
        LEFT JOIN users u ON up.user_id = u.id 
        WHERE u.id IS NULL
      `);
      
      const orphanedFails = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM fails f 
        LEFT JOIN users u ON f.user_id = u.id 
        WHERE u.id IS NULL
      `);

      console.log(`👤 Profils orphelins: ${orphanedProfiles[0][0].count}`);
      console.log(`📝 Fails orphelins: ${orphanedFails[0][0].count}`);
      
      if (orphanedProfiles[0][0].count > 0 || orphanedFails[0][0].count > 0) {
        console.log('⚠️ Problèmes d\'intégrité détectés !');
      } else {
        console.log('✅ Intégrité des données OK');
      }
    } catch (error) {
      console.log(`❌ Erreur vérification intégrité: ${error.message}`);
    }

    console.log('\n✅ Analyse terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

/**
 * Fonction pour vérifier une table spécifique
 */
async function debugSpecificTable(tableName) {
  let connection;

  try {
    console.log(`🔍 Analyse de la table: ${tableName}`);
    connection = await mysql.createConnection(dbConfig);

    // Vérifier si la table existe
    const tableExists = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = ?
    `, [dbConfig.database, tableName]);

    if (tableExists[0][0].count === 0) {
      console.log(`❌ La table '${tableName}' n'existe pas`);
      return;
    }

    // Structure détaillée
    const structure = await connection.execute(`DESCRIBE ${tableName}`);
    console.log('\n📋 Structure détaillée:');
    
    for (const column of structure[0]) {
      console.log(`\n🔧 Colonne: ${column.Field}`);
      console.log(`   Type: ${column.Type}`);
      console.log(`   Null: ${column.Null}`);
      console.log(`   Clé: ${column.Key || 'Aucune'}`);
      console.log(`   Défaut: ${column.Default || 'Aucun'}`);
      console.log(`   Extra: ${column.Extra || 'Aucun'}`);
    }

    // Données d'exemple
    const samples = await connection.execute(`SELECT * FROM ${tableName} LIMIT 10`);
    console.log(`\n📊 Échantillon de données (${samples[0].length} lignes):`);
    
    if (samples[0].length > 0) {
      console.log(JSON.stringify(samples[0], null, 2));
    } else {
      console.log('📋 Table vide');
    }

  } catch (error) {
    console.error('❌ Erreur analyse table:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--table') && args[args.indexOf('--table') + 1]) {
    const tableName = args[args.indexOf('--table') + 1];
    await debugSpecificTable(tableName);
  } else {
    await debugTables();
  }
}

// Aide
function showHelp() {
  console.log(`
📖 Utilisation: node debug-tables.js [options]

Options:
  (aucune)       Analyser toutes les tables
  --table NAME   Analyser une table spécifique
  --help         Afficher cette aide

Exemples:
  node debug-tables.js              # Analyse complète
  node debug-tables.js --table users   # Analyser la table users
  `);
}

// Vérifier l'aide
if (process.argv.includes('--help')) {
  showHelp();
  process.exit(0);
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  debugTables,
  debugSpecificTable
};