// Créer un nouveau token JWT valide

async function createNewUser() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    const timestamp = Date.now();
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: `test-${timestamp}@example.com`,
        password: 'TestPassword123!',
        displayName: `TestUser${timestamp}`,
        birthDate: '1990-01-01',
        legalConsent: {
          privacy: true,
          terms: true,
          dataProcessing: true
        }
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Utilisateur créé avec succès !');
      console.log('📧 Email:', `test-${timestamp}@example.com`);
      console.log('🎫 Token JWT:', data.token);
      console.log('👤 User ID:', data.user?.id);
      
      // Test immédiat du token
      if (data.token) {
        console.log('\n🧪 Test du token...');
        const testResponse = await fetch('http://localhost:3000/api/fails', {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });
        
        if (testResponse.ok) {
          console.log('✅ Token fonctionne !');
        } else {
          console.log('❌ Token ne fonctionne pas:', testResponse.status);
        }
      }
      
    } else {
      console.log('❌ Erreur lors de la création:', response.status);
      console.log('📝 Réponse:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

createNewUser();
