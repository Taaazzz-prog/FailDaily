const { default: fetch } = require('node-fetch');

async function testRegistration() {
  const baseUrl = 'http://localhost:3000';
  const registerUrl = `${baseUrl}/api/auth/register`;
  
  const testData = {
    email: 'test' + Date.now() + '@example.com',
    password: 'password123',
    displayName: 'TestUser' + Date.now(),
    birthDate: '1995-01-01',
    agreeToTerms: true
  };

  console.log('🧪 Test inscription avec données:', testData);

  try {
    const response = await fetch(registerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const result = await response.text();
    console.log('📊 Response:', result);

    try {
      const jsonResult = JSON.parse(result);
      console.log('📊 JSON Response:', JSON.stringify(jsonResult, null, 2));
    } catch {
      console.log('📊 Response n\'est pas du JSON valide');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testRegistration();
