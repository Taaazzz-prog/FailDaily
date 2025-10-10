/* =================================================================
   TEST COLLISION COULEURS FAILDAILY
   =================================================================
   Script JavaScript pour détecter et corriger les conflits de thème
*/

console.log('🎨 Test collision couleurs FailDaily');

// Fonction pour vérifier les couleurs appliquées
function checkThemeColors() {
  const body = document.body;
  const computedStyle = getComputedStyle(body);
  
  console.log('🎨 Couleurs détectées:');
  console.log('- Background:', computedStyle.backgroundColor);
  console.log('- Color:', computedStyle.color);
  console.log('- Classes:', body.className);
  
  // Vérifier si le thème clair est bien appliqué
  const expectedBg = 'rgb(219, 234, 254)'; // #dbeafe
  const actualBg = computedStyle.backgroundColor;
  
  if (actualBg === expectedBg) {
    console.log('✅ Thème clair correctement appliqué');
    return true;
  } else {
    console.log('❌ Problème de thème détecté');
    console.log(`Attendu: ${expectedBg}, Reçu: ${actualBg}`);
    return false;
  }
}

// Fonction pour forcer le thème clair
function forceThemeClair() {
  console.log('🔧 Force application du thème clair');
  
  const body = document.body;
  const html = document.documentElement;
  
  // Supprimer les classes sombres
  body.classList.remove('dark');
  html.classList.remove('dark');
  
  // Ajouter la classe force-light-theme
  body.classList.add('force-light-theme');
  
  // Forcer les variables CSS
  body.style.setProperty('--ion-background-color', '#dbeafe', 'important');
  body.style.setProperty('--ion-text-color', '#1e293b', 'important');
  body.style.backgroundColor = '#dbeafe';
  body.style.color = '#1e293b';
  
  console.log('✅ Thème clair forcé');
}

// Test au chargement
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (!checkThemeColors()) {
      forceThemeClair();
      setTimeout(checkThemeColors, 500);
    }
  }, 1000);
});

// Exposer les fonctions pour les tests manuels
window.failDailyThemeTest = {
  check: checkThemeColors,
  force: forceThemeClair
};

console.log('🎨 Test couleurs chargé. Utilisez window.failDailyThemeTest.check() ou .force()');