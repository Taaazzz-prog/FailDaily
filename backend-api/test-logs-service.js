// Test simple du LogsService
const LogsService = require('./src/services/logsService');

async function testLogsService() {
  console.log('🧪 Test du LogsService...');
  
  try {
    const logId = await LogsService.saveLog({
      id: require('uuid').v4(),
      level: 'info',
      message: 'Test direct LogsService',
      details: { test: true },
      user_id: null,
      action: 'test_direct',
      ip_address: '127.0.0.1',
      user_agent: 'test-script'
    });
    
    console.log('✅ Log sauvé avec ID:', logId);
    
    // Test récupération
    const logs = await LogsService.getLogs({ limit: 1 });
    console.log('📝 Dernier log récupéré:', logs[0]);
    
  } catch (error) {
    console.error('❌ Erreur test LogsService:', error.message);
  }
}

testLogsService();