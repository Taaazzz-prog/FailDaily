// Script de test pour vérifier le nettoyage automatique du localStorage
// Exécuter dans la console du navigateur

console.log('🧪 Test de nettoyage automatique du localStorage');

// 1. Afficher l'état actuel du localStorage
console.log('\n📋 État actuel du localStorage:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('faildaily') || key.includes('auth') || key.includes('user'))) {
    console.log(`  ${key}: ${localStorage.getItem(key)?.substring(0, 100)}...`);
  }
}

// 2. Fonction pour nettoyer manuellement
function forceCleanup() {
  console.log('\n🧹 Nettoyage forcé du localStorage...');
  
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('faildaily') || 
      key.includes('auth') || 
      key.includes('user') ||
      key.includes('token') ||
      key.includes('session')
    )) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`  ✅ Supprimé: ${key}`);
  });
  
  console.log(`\n🎯 ${keysToRemove.length} clés supprimées`);
}

// 3. Fonction pour vérifier l'état après nettoyage
function checkCleanState() {
  console.log('\n🔍 Vérification de l\'état après nettoyage:');
  
  let foundAuthData = false;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('faildaily') || 
      key.includes('auth') || 
      key.includes('user') ||
      key.includes('token')
    )) {
      console.log(`  ⚠️ Trouvé: ${key}`);
      foundAuthData = true;
    }
  }
  
  if (!foundAuthData) {
    console.log('  ✅ Aucune donnée d\'authentification trouvée');
  }
}

// 4. Instructions
console.log('\n📖 Instructions:');
console.log('1. Pour nettoyer manuellement: forceCleanup()');
console.log('2. Pour vérifier l\'état: checkCleanState()');
console.log('3. Pour tester la déconnexion automatique, utilisez l\'interface');

// Exporter les fonctions globalement
window.forceCleanup = forceCleanup;
window.checkCleanState = checkCleanState;
