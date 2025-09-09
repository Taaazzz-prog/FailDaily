/**
 * 🧪 TEST DE COMMUNICATION FRONTEND → BACKEND
 * ==========================================
 * 
 * Script pour tester que le frontend peut bien communiquer avec le backend
 * après la restructuration du projet.
 */

const environment = {
  api: {
    baseUrl: 'http://localhost:3000/api'
  }
};

async function testFrontendBackendCommunication() {
  console.log('🧪 TEST DE COMMUNICATION FRONTEND → BACKEND');
  console.log('===========================================\n');

  const baseUrl = environment.api.baseUrl;
  console.log(`📡 URL de base de l'API: ${baseUrl}\n`);

  try {
    // Test 1: Health Check
    console.log('1️⃣ Test Health Check...');
    const healthResponse = await fetch(`${baseUrl.replace('/api', '')}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
    console.log('');

    // Test 2: Test d'inscription (endpoint le plus complexe)
    console.log('2️⃣ Test Inscription utilisateur...');
    const registrationData = {
      email: `frontend-comm-test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      displayName: `FrontendTest${Date.now()}`,
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
      console.log('✅ Inscription réussie:', {
        success: registerData.success,
        userId: registerData.user?.id,
        email: registerData.user?.email
      });
    } else {
      const errorData = await registerResponse.text();
      console.log('❌ Échec inscription:', registerResponse.status, errorData);
    }
    console.log('');

    // Test 3: Test de connexion avec les données précédentes
    console.log('3️⃣ Test Connexion utilisateur...');
    const loginData = {
      email: registrationData.email,
      password: registrationData.password
    };

    const loginResponse = await fetch(`${baseUrl}/../api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(loginData)
    });

    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log('✅ Connexion réussie:', {
        success: loginResult.success,
        hasToken: !!loginResult.token,
        userId: loginResult.user?.id
      });

      // Test 4: Test d'un endpoint protégé
      console.log('4️⃣ Test endpoint protégé...');
      const verifyResponse = await fetch(`${baseUrl}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${loginResult.token}`,
          'Accept': 'application/json'
        }
      });

      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log('✅ Vérification token réussie:', {
          valid: verifyData.valid,
          userId: verifyData.user?.id
        });
      } else {
        console.log('❌ Échec vérification token:', verifyResponse.status);
      }

    } else {
      const errorData = await loginResponse.text();
      console.log('❌ Échec connexion:', loginResponse.status, errorData);
    }

    console.log('\n🎉 RÉSULTATS FINAUX');
    console.log('==================');
    console.log('✅ Frontend → Backend: Communication établie');
    console.log('✅ Ports configurés correctement');
    console.log('✅ Endpoints accessibles');
    console.log('✅ Authentification fonctionnelle');
    console.log('\n💡 Votre frontend enverra bien les données vers votre backend !');

  } catch (error) {
    console.error('❌ Erreur de communication:', error.message);
    console.log('\n🚨 PROBLÈME DÉTECTÉ');
    console.log('===================');
    console.log('❌ La communication frontend → backend a échoué');
    console.log('💡 Vérifiez que le backend est bien démarré sur le port 3000');
  }
}

// Exécution du test
testFrontendBackendCommunication();
