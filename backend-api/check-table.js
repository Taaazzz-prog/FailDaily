const { executeQuery } = require('./src/config/database');

async function checkUserActivitiesTable() {
  try {
    const result = await executeQuery('SHOW TABLES LIKE "user_activities"');
    console.log('Table user_activities:', result);
    if (result.length === 0) {
      console.log('❌ Table user_activities n\'existe pas');
      
      // Vérifions toutes les tables disponibles
      const allTables = await executeQuery('SHOW TABLES');
      console.log('Tables disponibles:', allTables.map(t => Object.values(t)[0]));
    } else {
      console.log('✅ Table user_activities existe');
    }
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    process.exit();
  }
}

checkUserActivitiesTable();
