// Test simple pour vérifier l'API
const { API_CONFIG, fetch } = require('./0_test-config');

async function testSimple() {
  console.log('🧪 Test simple API...');
  
  try {
    // Test health endpoint
    console.log('1. Test endpoint health...');
    const healthResponse = await fetch(`${API_CONFIG.baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health OK:', healthData);
    
    // Test inscription
    console.log('2. Test inscription...');
    const userData = {
      email: `test.${Date.now()}@faildaily.com`,
      password: 'TestPassword123!',
      displayName: 'TestUser' + Date.now(),
      birthDate: '1990-01-01',
      agreeToTerms: true,
      agreeToNewsletter: false
    };
    
    const registerResponse = await fetch(`${API_CONFIG.baseUrl}/api/registration/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    console.log('Status:', registerResponse.status);
    const registerData = await registerResponse.text();
    console.log('Response:', registerData);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testSimple();
