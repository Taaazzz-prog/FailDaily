const mysql = require('mysql2/promise');

async function testFailCreation() {
  console.log('🧪 Test de création de fail...');
  
  // Configuration de test
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'faildaily'
  });

  try {
    // Test d'insertion simple
    const testFail = {
      user_id: 1, // Assumons qu'il y a un utilisateur avec ID 1
      title: 'Test Fail',
      description: 'Ceci est un test de création de fail sans tags',
      category: 'Général',
      is_anonyme: false
    };

    const query = `
      INSERT INTO fails (user_id, title, description, category, is_anonyme, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const values = [
      testFail.user_id,
      testFail.title,
      testFail.description,
      testFail.category,
      testFail.is_anonyme
    ];

    console.log('📤 Exécution de la requête...', query);
    console.log('📋 Avec les valeurs:', values);

    const [result] = await connection.execute(query, values);
    
    console.log('✅ Fail créé avec succès !');
    console.log('📊 Résultat:', result);
    console.log('🆔 ID du fail créé:', result.insertId);

    // Vérification de la récupération
    const [rows] = await connection.execute(
      'SELECT * FROM fails WHERE id = ?', 
      [result.insertId]
    );

    console.log('📖 Fail récupéré:', rows[0]);

    // Nettoyage
    await connection.execute('DELETE FROM fails WHERE id = ?', [result.insertId]);
    console.log('🧹 Test nettoyé');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await connection.end();
  }
}

testFailCreation();
