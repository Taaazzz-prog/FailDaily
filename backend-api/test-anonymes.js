const mysql = require('mysql2/promise');

async function testAnonymesEndpoint() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '@51008473@Alexia@',
    database: 'faildaily'
  });
  
  console.log('🔧 Test direct de la requête utilisée par /fails/anonymes:');
  
  const [fails] = await connection.execute(`
    SELECT f.id, f.title, f.description, f.category, f.image_url, f.is_anonyme,
           f.created_at, f.updated_at, f.comments_count,
           CASE 
             WHEN f.is_anonyme = 1 THEN 'Utilisateur anonyme'
             ELSE p.display_name
           END as authorName,
           CASE 
             WHEN f.is_anonyme = 1 THEN NULL
             ELSE p.avatar_url
           END as authorAvatar,
           p.user_id as authorId
    FROM fails f
    JOIN profiles p ON f.user_id = p.user_id
    LEFT JOIN fail_moderation fm ON f.id = fm.fail_id
    WHERE fm.status IS NULL OR fm.status NOT IN ('hidden', 'rejected')
    ORDER BY f.created_at DESC
    LIMIT 20
  `);
  
  console.log('✅ Fails trouvés:', fails.length);
  console.log('');
  
  if (fails.length > 0) {
    console.log('📋 Liste des fails:');
    fails.forEach((f, i) => {
      console.log(`${i+1}. "${f.title}" | Auteur: ${f.authorName} | Catégorie: ${f.category}`);
    });
  } else {
    console.log('❌ Aucun fail trouvé - problème potentiel:');
    
    // Vérifier si les profils existent
    const [profiles] = await connection.execute('SELECT COUNT(*) as count FROM profiles');
    console.log('📊 Nombre de profils:', profiles[0].count);
    
    // Vérifier les fails sans JOIN
    const [directFails] = await connection.execute('SELECT id, title, user_id FROM fails');
    console.log('📊 Fails directs:', directFails.length);
    
    if (directFails.length > 0 && profiles[0].count === 0) {
      console.log('🔧 Problème détecté: les fails existent mais pas les profils correspondants');
    }
  }
  
  await connection.end();
}

testAnonymesEndpoint().catch(console.error);