// Test de l'endpoint badges/ids corrigé
const fetch = require('node-fetch');

async function testBadgesEndpoint() {
  console.log('🧪 Test de l\'endpoint /api/users/:userId/badges/ids...');
  
  const userId = '9f92d99e-5f70-427e-aebd-68ca8b727bd4';
  const apiUrl = 'http://localhost:3000/api';
  
  try {
    const response = await fetch(`${apiUrl}/users/${userId}/badges/ids`, {
      headers: {
        'Content-Type': 'application/json',
        // Note: Il faudrait normalement un token d'authentification
      }
    });

    console.log('📊 Status:', response.status);
    
    const result = await response.json();
    console.log('📋 Réponse:', JSON.stringify(result, null, 2));
    
    if (result.success && result.badgeIds) {
      console.log(`✅ ${result.badgeIds.length} badge(s) trouvé(s) !`);
      
      if (result.badgeIds.length > 0) {
        console.log('🏆 IDs des badges:', result.badgeIds);
      } else {
        console.log('⚠️ Aucun badge trouvé - vérifiez la base de données');
      }
    } else {
      console.log('❌ Erreur dans la réponse:', result.message || 'Format invalide');
    }

  } catch (error) {
    console.error('❌ Erreur requête:', error.message);
    console.log('💡 Assurez-vous que le backend est redémarré avec les corrections');
  }
}

testBadgesEndpoint();
