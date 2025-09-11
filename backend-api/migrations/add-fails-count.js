const { executeQuery } = require('../src/config/database');

async function addFailsCountColumn() {
  try {
    console.log('🔧 Ajout de la colonne fails_count à la table users...');
    
    // Vérifier si la colonne existe déjà
    const columns = await executeQuery(`
      SHOW COLUMNS FROM users LIKE 'fails_count'
    `);
    
    if (columns.length > 0) {
      console.log('✅ La colonne fails_count existe déjà');
      return;
    }
    
    // Ajouter la colonne
    await executeQuery(`
      ALTER TABLE users 
      ADD COLUMN fails_count INT DEFAULT 0 
      AFTER login_count
    `);
    
    console.log('✅ Colonne fails_count ajoutée');
    
    // Calculer et mettre à jour les valeurs existantes
    console.log('🔄 Mise à jour des valeurs existantes...');
    await executeQuery(`
      UPDATE users u 
      SET fails_count = (
        SELECT COUNT(*) 
        FROM fails f 
        WHERE f.user_id = u.id
      )
    `);
    
    console.log('✅ Valeurs mises à jour');
    
    // Vérifier le résultat
    const result = await executeQuery(`
      SELECT id, email, fails_count 
      FROM users 
      WHERE fails_count > 0 
      LIMIT 5
    `);
    
    console.log('📊 Utilisateurs avec des fails:');
    result.forEach(user => {
      console.log(`  - ${user.email}: ${user.fails_count} fails`);
    });
    
    console.log('🎉 Migration réussie !');
    
  } catch (error) {
    console.error('❌ Erreur migration:', error.message);
  } finally {
    process.exit();
  }
}

addFailsCountColumn();
