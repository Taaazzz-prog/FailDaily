// Test simple pour vérifier la création de fails sans tags
const testFailCreation = async () => {
  console.log('🧪 Test de l\'API de création de fails...');
  
  const apiUrl = 'http://localhost:3000/api';
  
  // Test données
  const testFail = {
    title: 'Test Fail Sans Tags',
    description: 'Ceci est un test de création de fail après suppression des tags',
    category: 'Général',
    is_anonyme: false
  };

  try {
    console.log('📤 Envoi de la requête POST /api/fails...');
    console.log('📋 Données:', JSON.stringify(testFail, null, 2));
    
    const response = await fetch(`${apiUrl}/fails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: En réalité il faudrait un token d'authentification
        // 'Authorization': 'Bearer YOUR_TOKEN'
      },
      body: JSON.stringify(testFail)
    });

    console.log('📊 Status de la réponse:', response.status);
    console.log('📊 Status text:', response.statusText);
    
    const result = await response.text();
    console.log('📖 Réponse brute:', result);
    
    try {
      const jsonResult = JSON.parse(result);
      console.log('📖 Réponse JSON:', JSON.stringify(jsonResult, null, 2));
    } catch (e) {
      console.log('ℹ️ La réponse n\'est pas du JSON valide');
    }

    if (response.ok) {
      console.log('✅ Test réussi ! La création de fails fonctionne sans tags.');
    } else {
      console.log('⚠️ Test partiellement réussi - vérifiez les logs du backend');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.log('ℹ️ Vérifiez que le backend est bien lancé sur le port 3000');
  }
};

// Test de l'endpoint des catégories
const testCategories = async () => {
  console.log('\n🧪 Test de l\'endpoint des catégories...');
  
  try {
    const response = await fetch('http://localhost:3000/api/fails/categories');
    const result = await response.json();
    
    console.log('📊 Status:', response.status);
    console.log('📖 Catégories disponibles:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Endpoint des catégories fonctionne !');
    }
  } catch (error) {
    console.error('❌ Erreur test catégories:', error.message);
  }
};

// Exécuter les tests
console.log('🚀 Démarrage des tests API...\n');
testFailCreation().then(() => {
  return testCategories();
}).then(() => {
  console.log('\n🎉 Tests terminés !');
}).catch(console.error);
