/**
 * Test simple pour diagnostiquer les problèmes d'inscription
 */

const { API_CONFIG, DEFAULT_HEADERS, fetch } = require('./0_test-config');

async function testSimpleRegistration() {
  console.log('🔍 Test Diagnostic Simple');
  console.log('=========================');
  
  const baseUrl = API_CONFIG.baseUrl;
  console.log(`Base URL: ${baseUrl}`);
  
  // Test Health Check
  try {
    console.log('\n1. Test Health Check...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthResult = await healthResponse.json();
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response:`, healthResult);
  } catch (error) {
    console.log(`   Erreur Health: ${error.message}`);
  }

  // Test Registration Route
  try {
    console.log('\n2. Test Registration...');
    const registerData = {
      email: `test.${Date.now()}@diagnostic.com`,
      password: 'DiagnosticPass123!',
      displayName: 'Diagnostic User',
      birthDate: '1990-01-01',
      agreeToTerms: true,
      agreeToNewsletter: false
    };
    
    console.log('   Données envoyées:', registerData);
    
    const registerResponse = await fetch(`${baseUrl}/api/registration/register`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(registerData)
    });
    
    console.log(`   Status Response: ${registerResponse.status}`);
    
    const responseText = await registerResponse.text();
    console.log(`   Response Text (first 200 chars):`, responseText.substring(0, 200));
    
    try {
      const registerResult = JSON.parse(responseText);
      console.log('   Parsed JSON:', registerResult);
    } catch (parseError) {
      console.log('   Erreur parsing JSON:', parseError.message);
    }
    
  } catch (error) {
    console.log(`   Erreur Registration: ${error.message}`);
  }

  // Test Auth Route
  try {
    console.log('\n3. Test Auth Register...');
    const authRegisterData = {
      email: `auth.${Date.now()}@diagnostic.com`,
      password: 'AuthDiagnostic123!',
      displayName: 'Auth Diagnostic User',
      birthDate: '1990-01-01'
    };
    
    const authResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(authRegisterData)
    });
    
    console.log(`   Status Response: ${authResponse.status}`);
    
    const authText = await authResponse.text();
    console.log(`   Response Text (first 200 chars):`, authText.substring(0, 200));
    
  } catch (error) {
    console.log(`   Erreur Auth Register: ${error.message}`);
  }

  console.log('\n✅ Diagnostic terminé');
}

if (require.main === module) {
  testSimpleRegistration().catch(console.error);
}

module.exports = testSimpleRegistration;