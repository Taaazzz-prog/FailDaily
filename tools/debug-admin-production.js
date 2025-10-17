// Script de debug pour panel admin production
// Injection via console navigateur sur https://faildaily.com/tabs/admin

console.log('🔧 Debug Admin Panel - Démarré');

// 1. Vérifier l'état de l'utilisateur
if (window.angular) {
    console.log('✅ Angular détecté');
} else {
    console.log('❌ Angular non détecté');
}

// 2. Vérifier les éléments cliquables
const segments = document.querySelectorAll('ion-segment-button');
console.log(`📊 Segments trouvés: ${segments.length}`);
segments.forEach((segment, index) => {
    console.log(`Segment ${index}:`, {
        value: segment.getAttribute('value'),
        disabled: segment.hasAttribute('disabled'),
        style: window.getComputedStyle(segment),
        pointerEvents: window.getComputedStyle(segment).pointerEvents,
        zIndex: window.getComputedStyle(segment).zIndex
    });
});

// 3. Vérifier les event listeners
const buttons = document.querySelectorAll('ion-button, ion-segment-button');
console.log(`🔘 Boutons trouvés: ${buttons.length}`);

buttons.forEach((button, index) => {
    const events = [];
    for (let event of ['click', 'ionChange', 'tap']) {
        if (button.onclick || button.addEventListener) {
            events.push(event);
        }
    }
    console.log(`Bouton ${index}:`, {
        tag: button.tagName,
        events,
        disabled: button.disabled || button.hasAttribute('disabled'),
        pointerEvents: window.getComputedStyle(button).pointerEvents
    });
});

// 4. Vérifier les données chargées
setTimeout(() => {
    const statCards = document.querySelectorAll('.stat-card, .stats-card');
    console.log(`📈 Cartes de stats: ${statCards.length}`);
    
    const loadingElements = document.querySelectorAll('[class*="loading"]');
    console.log(`⏳ Éléments en loading: ${loadingElements.length}`);
    
    const errorElements = document.querySelectorAll('[class*="error"]');
    console.log(`❌ Éléments d'erreur: ${errorElements.length}`);
}, 2000);

// 5. Test de click manuel
function testClicks() {
    console.log('🖱️ Test des clics manuels...');
    const firstSegment = document.querySelector('ion-segment-button');
    if (firstSegment) {
        console.log('Tentative de clic sur premier segment...');
        firstSegment.click();
        firstSegment.dispatchEvent(new Event('ionChange', { bubbles: true }));
    }
}

// Exécuter le test dans 3 secondes
setTimeout(testClicks, 3000);

console.log('🔧 Debug Admin Panel - Script injecté, résultats dans 3-5 secondes');