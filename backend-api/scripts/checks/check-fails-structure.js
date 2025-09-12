const { executeQuery } = require('./src/config/database');

async function checkFailsStructure() {
  try {
    console.log('🔍 Vérification de la structure de la table fails...');
    
    // Vérifier que la table existe
    const tableExists = await executeQuery('SHOW TABLES LIKE "fails"');
    if (tableExists.length === 0) {
      console.log('❌ Table fails n\'existe pas');
      return;
    }
    
    // Obtenir la structure de la table
    const structure = await executeQuery('DESCRIBE fails');
    console.log('📋 Structure de la table fails:');
    structure.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    // Vérifier quelques colonnes critiques
    const hasIsAnonyme = structure.find(col => col.Field === 'is_anonyme');
    const hasIsPublic = structure.find(col => col.Field === 'is_public');
    
    console.log('\n🔍 Colonnes critiques:');
    console.log(`  - is_anonyme: ${hasIsAnonyme ? '✅ Trouvée' : '❌ Manquante'}`);
    console.log(`  - is_public: ${hasIsPublic ? '✅ Trouvée' : '❌ Manquante'}`);
    
    // Compter les fails
    const count = await executeQuery('SELECT COUNT(*) as total FROM fails');
    console.log(`\n📊 Nombre total de fails: ${count[0].total}`);
    
    // Tester une requête simple
    console.log('\n🧪 Test d\'une requête simple...');
    const simpleQuery = 'SELECT id, title, created_at FROM fails LIMIT 3';
    const testResult = await executeQuery(simpleQuery);
    console.log(`✅ Requête simple réussie, ${testResult.length} résultats`);
    
    // Tester la requête problématique
    console.log('\n🧪 Test de la requête problématique...');
    const problemQuery = `
      SELECT f.*, p.display_name, p.avatar_url, fm.status AS moderation_status
      FROM fails f
      JOIN users u ON f.user_id = u.id
      JOIN profiles p ON u.id = p.user_id
      LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
      WHERE (fm.status IS NULL OR fm.status = 'approved')
      ORDER BY f.created_at DESC, f.id DESC
      LIMIT ?, ?`;
    
    try {
      const problemResult = await executeQuery(problemQuery, [0, 2]);
      console.log(`✅ Requête avec JOIN réussie, ${problemResult.length} résultats`);
    } catch (error) {
      console.log(`❌ Erreur avec la requête JOIN: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit();
  }
}

checkFailsStructure();
