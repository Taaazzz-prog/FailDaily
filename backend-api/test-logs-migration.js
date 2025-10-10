// Test des logs après corrections
const { testLogsConnection } = require('./src/config/database-logs');
const LogsService = require('./src/services/logsService');
const { logToSeparateDatabase } = require('./src/utils/logsHelper');

async function testLogsSystem() {
  console.log('🧪 Test du système de logs corrigé...\n');
  
  // 1. Test connexion base logs
  console.log('1️⃣ Test connexion base logs séparée:');
  const connected = await testLogsConnection();
  if (!connected) {
    console.log('❌ Impossible de continuer sans connexion logs');
    return;
  }
  
  // 2. Test LogsService direct
  console.log('\n2️⃣ Test LogsService.saveLog():');
  try {
    await LogsService.saveLog({
      level: 'info',
      message: 'Test LogsService direct',
      details: { test: 'migration_logs', timestamp: new Date() },
      user_id: 'test-user',
      action: 'test_direct',
      ip_address: '127.0.0.1',
      user_agent: 'test-script'
    });
    console.log('✅ LogsService.saveLog() fonctionne');
  } catch (error) {
    console.log('❌ LogsService.saveLog() échoue:', error.message);
  }
  
  // 3. Test helper logToSeparateDatabase
  console.log('\n3️⃣ Test helper logToSeparateDatabase():');
  try {
    await logToSeparateDatabase(
      'warning',
      'Test helper logToSeparateDatabase',
      { test: 'helper_migration', success: true },
      'test-user-helper',
      'test_helper',
      { ip: '127.0.0.1', get: () => 'test-agent' }
    );
    console.log('✅ logToSeparateDatabase() fonctionne');
  } catch (error) {
    console.log('❌ logToSeparateDatabase() échoue:', error.message);
  }
  
  // 4. Vérification des logs dans la base
  console.log('\n4️⃣ Vérification logs dans base séparée:');
  try {
    const { logsPool } = require('./src/config/database-logs');
    const connection = await logsPool.getConnection();
    const [logs] = await connection.execute(
      'SELECT id, level, message, action, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 5'
    );
    connection.release();
    
    console.log(`✅ ${logs.length} logs trouvés dans base séparée:`);
    logs.forEach(log => {
      console.log(`   - [${log.level}] ${log.message} (${log.action})`);
    });
  } catch (error) {
    console.log('❌ Erreur lecture logs:', error.message);
  }
  
  console.log('\n🎉 Test terminé !');
}

testLogsSystem().catch(console.error);