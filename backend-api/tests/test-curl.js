// Test avec curl pour éviter les problèmes de fetch
const { spawn } = require('child_process');

async function testWithCurl() {
  console.log('🧪 Test avec curl...');
  
  return new Promise((resolve) => {
    const curl = spawn('curl', ['-s', 'http://localhost:3000/health']);
    
    let data = '';
    curl.stdout.on('data', (chunk) => {
      data += chunk;
    });
    
    curl.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Health OK:', data);
        testRegistration();
      } else {
        console.log('❌ Serveur non accessible');
      }
      resolve();
    });
  });
}

function testRegistration() {
  console.log('🧪 Test inscription avec curl...');
  
  const userData = JSON.stringify({
    email: `test.${Date.now()}@faildaily.com`,
    password: 'TestPassword123!',
    displayName: 'TestUser' + Date.now(),
    birthDate: '1990-01-01',
    agreeToTerms: true,
    agreeToNewsletter: false
  });
  
  const curl = spawn('curl', [
    '-s',
    '-X', 'POST',
    '-H', 'Content-Type: application/json',
    '-d', userData,
    'http://localhost:3000/api/registration/register'
  ]);
  
  let data = '';
  curl.stdout.on('data', (chunk) => {
    data += chunk;
  });
  
  curl.on('close', (code) => {
    console.log('Status code:', code);
    console.log('Response:', data);
  });
}

testWithCurl();
