const { executeQuery } = require('./src/config/database');

async function extractCompleteDatabase() {
  try {
    console.log('🔍 Extraction complète de la base de données FailDaily...\n');
    
    // 1. Lister toutes les tables
    console.log('📋 TABLES DISPONIBLES:');
    const tables = await executeQuery('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log(tableNames.join(', '));
    console.log(`Total: ${tableNames.length} tables\n`);
    
    let structureOutput = '# Structure de la Base de Données FailDaily\n\n';
    structureOutput += `## Informations générales\n`;
    structureOutput += `- Date d'extraction: ${new Date().toLocaleString('fr-FR')}\n`;
    structureOutput += `- Nombre de tables: ${tableNames.length}\n`;
    structureOutput += `- Tables: ${tableNames.join(', ')}\n\n`;
    
    // 2. Pour chaque table, extraire structure, index, contraintes
    for (const tableName of tableNames) {
      console.log(`🔍 Analyse de la table: ${tableName}`);
      
      structureOutput += `## Table: \`${tableName}\`\n\n`;
      
      // Structure de la table
      const structure = await executeQuery(`DESCRIBE ${tableName}`);
      structureOutput += '### Structure\n```sql\n';
      
      // Reconstituer le CREATE TABLE
      const createTableResult = await executeQuery(`SHOW CREATE TABLE ${tableName}`);
      const createStatement = createTableResult[0]['Create Table'];
      structureOutput += createStatement + ';\n```\n\n';
      
      // Compter les enregistrements
      const count = await executeQuery(`SELECT COUNT(*) as total FROM ${tableName}`);
      structureOutput += `### Données\n- Nombre d'enregistrements: ${count[0].total}\n\n`;
      
      // Index
      const indexes = await executeQuery(`SHOW INDEX FROM ${tableName}`);
      if (indexes.length > 0) {
        structureOutput += '### Index\n';
        const indexGroups = {};
        indexes.forEach(idx => {
          if (!indexGroups[idx.Key_name]) {
            indexGroups[idx.Key_name] = [];
          }
          indexGroups[idx.Key_name].push(idx);
        });
        
        Object.keys(indexGroups).forEach(keyName => {
          const idx = indexGroups[keyName][0];
          const columns = indexGroups[keyName].map(i => i.Column_name).join(', ');
          const unique = idx.Non_unique === 0 ? 'UNIQUE ' : '';
          const type = idx.Key_name === 'PRIMARY' ? 'PRIMARY KEY' : `${unique}INDEX`;
          structureOutput += `- \`${keyName}\`: ${type} (${columns})\n`;
        });
        structureOutput += '\n';
      }
      
      // Contraintes de clés étrangères
      const foreignKeys = await executeQuery(`
        SELECT 
          kcu.CONSTRAINT_NAME,
          kcu.COLUMN_NAME,
          kcu.REFERENCED_TABLE_NAME,
          kcu.REFERENCED_COLUMN_NAME,
          rc.DELETE_RULE,
          rc.UPDATE_RULE
        FROM information_schema.KEY_COLUMN_USAGE kcu
        LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS rc 
          ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME 
          AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
        WHERE kcu.TABLE_SCHEMA = DATABASE() 
        AND kcu.TABLE_NAME = '${tableName}' 
        AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
      `);
      
      if (foreignKeys.length > 0) {
        structureOutput += '### Clés étrangères\n';
        foreignKeys.forEach(fk => {
          structureOutput += `- \`${fk.COLUMN_NAME}\` → \`${fk.REFERENCED_TABLE_NAME}.\`${fk.REFERENCED_COLUMN_NAME}\` (ON DELETE ${fk.DELETE_RULE}, ON UPDATE ${fk.UPDATE_RULE})\n`;
        });
        structureOutput += '\n';
      }
      
      console.log(`  ✅ ${structure.length} colonnes, ${count[0].total} enregistrements`);
    }
    
    // 3. Triggers
    console.log('\n🔍 Extraction des triggers...');
    const triggers = await executeQuery('SHOW TRIGGERS');
    if (triggers.length > 0) {
      structureOutput += '## Triggers\n\n';
      for (const trigger of triggers) {
        structureOutput += `### \`${trigger.Trigger}\`\n`;
        structureOutput += `- Table: \`${trigger.Table}\`\n`;
        structureOutput += `- Événement: ${trigger.Event} ${trigger.Timing}\n`;
        structureOutput += `- Définition:\n\`\`\`sql\n${trigger.Statement}\n\`\`\`\n\n`;
      }
      console.log(`  ✅ ${triggers.length} triggers trouvés`);
    } else {
      console.log('  ℹ️ Aucun trigger trouvé');
    }
    
    // 4. Vues
    console.log('\n🔍 Extraction des vues...');
    const views = await executeQuery(`
      SELECT TABLE_NAME, VIEW_DEFINITION 
      FROM information_schema.VIEWS 
      WHERE TABLE_SCHEMA = DATABASE()
    `);
    if (views.length > 0) {
      structureOutput += '## Vues\n\n';
      for (const view of views) {
        structureOutput += `### \`${view.TABLE_NAME}\`\n`;
        structureOutput += `\`\`\`sql\n${view.VIEW_DEFINITION}\n\`\`\`\n\n`;
      }
      console.log(`  ✅ ${views.length} vues trouvées`);
    } else {
      console.log('  ℹ️ Aucune vue trouvée');
    }
    
    // 5. Procédures stockées
    console.log('\n🔍 Extraction des procédures stockées...');
    const procedures = await executeQuery(`
      SELECT ROUTINE_NAME, ROUTINE_DEFINITION 
      FROM information_schema.ROUTINES 
      WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'PROCEDURE'
    `);
    if (procedures.length > 0) {
      structureOutput += '## Procédures stockées\n\n';
      for (const proc of procedures) {
        structureOutput += `### \`${proc.ROUTINE_NAME}\`\n`;
        structureOutput += `\`\`\`sql\n${proc.ROUTINE_DEFINITION}\n\`\`\`\n\n`;
      }
      console.log(`  ✅ ${procedures.length} procédures trouvées`);
    } else {
      console.log('  ℹ️ Aucune procédure stockée trouvée');
    }
    
    // 6. Fonctions
    console.log('\n🔍 Extraction des fonctions...');
    const functions = await executeQuery(`
      SELECT ROUTINE_NAME, ROUTINE_DEFINITION 
      FROM information_schema.ROUTINES 
      WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'FUNCTION'
    `);
    if (functions.length > 0) {
      structureOutput += '## Fonctions\n\n';
      for (const func of functions) {
        structureOutput += `### \`${func.ROUTINE_NAME}\`\n`;
        structureOutput += `\`\`\`sql\n${func.ROUTINE_DEFINITION}\n\`\`\`\n\n`;
      }
      console.log(`  ✅ ${functions.length} fonctions trouvées`);
    } else {
      console.log('  ℹ️ Aucune fonction trouvée');
    }
    
    // 7. Informations sur la base de données
    console.log('\n🔍 Informations de la base de données...');
    const dbInfo = await executeQuery(`
      SELECT 
        SCHEMA_NAME as database_name,
        DEFAULT_CHARACTER_SET_NAME as charset,
        DEFAULT_COLLATION_NAME as collation
      FROM information_schema.SCHEMATA 
      WHERE SCHEMA_NAME = DATABASE()
    `);
    
    if (dbInfo.length > 0) {
      const info = dbInfo[0];
      structureOutput += '## Informations de la base de données\n\n';
      structureOutput += `- Nom: \`${info.database_name}\`\n`;
      structureOutput += `- Charset: \`${info.charset}\`\n`;
      structureOutput += `- Collation: \`${info.collation}\`\n\n`;
    }
    
    // Sauvegarder dans le fichier
    const fs = require('fs');
    const outputPath = '../Structures/DATABASE_STRUCTURE.md';
    fs.writeFileSync(outputPath, structureOutput, 'utf8');
    
    console.log(`\n✅ Structure complète extraite et sauvée dans: ${outputPath}`);
    console.log(`📄 Taille du fichier: ${(structureOutput.length / 1024).toFixed(1)} KB`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction:', error);
  } finally {
    process.exit();
  }
}

extractCompleteDatabase();
