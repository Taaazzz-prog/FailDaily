const mysql = require('mysql2/promise');

async function checkModeration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '@51008473@Alexia@',
    database: 'faildaily'
  });
  
  // Vérifier les fails avec leur statut de modération
  const [failsWithMod] = await connection.execute(`
    SELECT f.id, f.title, f.category, fm.status as moderation_status
    FROM fails f
    LEFT JOIN fail_moderation fm ON f.id = fm.fail_id
    ORDER BY f.created_at DESC
  `);
  
  console.log('📊 Fails avec statut de modération:');
  failsWithMod.forEach(f => {
    console.log('-', f.title, '| Statut:', f.moderation_status || 'NULL (visible)');
  });
  
  // Compter les fails visibles selon la logique backend
  const [visibleFails] = await connection.execute(`
    SELECT COUNT(*) as count 
    FROM fails f
    LEFT JOIN fail_moderation fm ON f.id = fm.fail_id
    WHERE fm.status IS NULL OR fm.status NOT IN ('hidden', 'rejected')
  `);
  
  console.log('');
  console.log('👁️ Fails visibles selon la logique backend:', visibleFails[0].count);
  
  // Si aucun fail visible, approuver tous les fails
  if (visibleFails[0].count === 0) {
    console.log('🔧 Aucun fail visible, suppression des restrictions de modération...');
    await connection.execute('DELETE FROM fail_moderation');
    console.log('✅ Restrictions supprimées, tous les fails sont maintenant visibles');
  }
  
  await connection.end();
}

checkModeration().catch(console.error);