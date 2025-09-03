// Test de validation de l'UUID
const { v4: uuidv4 } = require('uuid');

console.log('🧪 Test de génération UUID pour fails...');

// Générer quelques UUIDs de test
for (let i = 1; i <= 3; i++) {
  const testUUID = uuidv4();
  console.log(`✅ UUID ${i}: ${testUUID}`);
  console.log(`   Longueur: ${testUUID.length} caractères`);
  console.log(`   Format valide: ${/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(testUUID)}`);
}

console.log('\n🔧 Simulation de la création de fail...');

const failData = {
  id: uuidv4(),
  user_id: '9f92d99e-5f70-427e-aebd-68ca8b727bd4',
  title: 'Test Fail avec UUID',
  description: 'Test de création avec ID UUID',
  category: 'Général',
  is_anonyme: false,
  image_url: null
};

console.log('📋 Données du fail simulé:');
console.log(JSON.stringify(failData, null, 2));

console.log('\n✅ Le problème d\'ID manquant devrait être résolu !');
console.log('🔄 Redémarrez le backend pour appliquer les changements.');
