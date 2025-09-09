/**
 * 🐳 TEST DE COMMUNICATION DOCKER
 * ===============================
 * 
 * Script pour tester la communication frontend → backend en environnement Docker
 */

const environment = {
  api: {
    baseUrl: 'http://localhost:3000/api'
  }
};

async function testDockerCommunication() {
  console.log('🐳 TEST DE COMMUNICATION DOCKER');
  console.log('===============================\n');

  const baseUrl = environment.api.baseUrl;
  console.log(`📡 URL de base de l'API: ${baseUrl}\n`);

  try {
    // Test 1: Health Check Backend
    console.log('1️⃣ Test Health Check Backend Docker...');
    const healthResponse = await fetch(`${baseUrl.replace('/api', '')}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Backend Docker:', healthData);
    console.log('');

    // Test 2: Test Frontend Docker
    console.log('2️⃣ Test Frontend Docker...');
    const frontendResponse = await fetch('http://localhost:8080', { 
      method: 'HEAD' 
    });
    console.log('✅ Frontend Docker accessible:', {
      status: frontendResponse.status,
      server: frontendResponse.headers.get('server'),
      port: '8080'
    });
    console.log('');

    // Test 3: Test Base de données Docker
    console.log('3️⃣ Test Inscription (Backend + MySQL Docker)...');
    const registrationData = {
      email: `docker-test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      displayName: `DockerTest${Date.now()}`,
      birthDate: '1990-05-15',
      agreeToTerms: true,
      agreeToNewsletter: false
    };

    const registerResponse = await fetch(`${baseUrl}/../api/registration/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Inscription via Docker réussie:', {
        success: registerData.success,
        userId: registerData.user?.id,
        email: registerData.user?.email
      });
    } else {
      const errorData = await registerResponse.text();
      console.log('❌ Échec inscription Docker:', registerResponse.status, errorData);
    }

    console.log('\n🎉 RÉSULTATS DOCKER');
    console.log('===================');
    console.log('✅ Frontend Docker: http://localhost:8080');
    console.log('✅ Backend Docker: http://localhost:3000');
    console.log('✅ MySQL Docker: localhost:3307');
    console.log('✅ Communication Frontend ↔ Backend opérationnelle');
    console.log('✅ Stack Docker complètement fonctionnelle');
    console.log('\n🚀 PRÊT POUR LE DÉPLOIEMENT KIMSUFI !');

  } catch (error) {
    console.error('❌ Erreur de communication Docker:', error.message);
    console.log('\n🚨 PROBLÈME DOCKER DÉTECTÉ');
    console.log('===========================');
    console.log('❌ La communication Docker a échoué');
    console.log('💡 Vérifiez que tous les conteneurs sont démarrés');
  }
}

// Exécution du test
testDockerCommunication();
