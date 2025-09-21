/**
 * Script pour analyser en détail la structure des badges
 */

const API_BASE = 'http://localhost:8000/api';

async function analyzeBadgeStructure() {
    console.log('🔍 Analyse détaillée de la structure des badges...\n');

    try {
        // Connexion
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'bruno@taaazzz.be',
                password: '@51008473@'
            })
        });

        const loginData = await loginResponse.json();
        const token = loginData.token;

        // Récupérer tous les badges
        const allBadgesResponse = await fetch(`${API_BASE}/badges/available`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const allBadgesData = await allBadgesResponse.json();
        const allBadges = allBadgesData.badges || [];

        console.log(`📊 Total badges: ${allBadges.length}\n`);

        // Grouper par catégorie
        const categoriesCount = {};
        allBadges.forEach(badge => {
            const category = badge.category || 'undefined';
            categoriesCount[category] = (categoriesCount[category] || 0) + 1;
        });

        console.log('📋 Répartition par catégorie:');
        Object.entries(categoriesCount).forEach(([category, count]) => {
            console.log(`  ${category}: ${count} badges`);
        });

        console.log('\n🏆 Premiers badges de chaque catégorie:');
        const categoriesSample = {};
        allBadges.forEach(badge => {
            const category = badge.category || 'undefined';
            if (!categoriesSample[category]) {
                categoriesSample[category] = [];
            }
            if (categoriesSample[category].length < 3) {
                categoriesSample[category].push(badge);
            }
        });

        Object.entries(categoriesSample).forEach(([category, badges]) => {
            console.log(`\n  📂 ${category.toUpperCase()}:`);
            badges.forEach(badge => {
                console.log(`    - ${badge.name} (${badge.rarity}) - ${badge.description}`);
                if (badge.requirements) {
                    console.log(`      Requis: ${badge.requirements.type} = ${badge.requirements.value}`);
                }
            });
        });

        // Test de la logique "Prochains défis"
        console.log('\n🎯 Test de la logique "Prochains défis"...');
        
        // Simuler quelques fails pour déclencher des badges
        console.log('\n📝 Pour tester la correction, vous devriez:');
        console.log('1. Créer quelques fails sur http://localhost:8000/tabs/post-fail');
        console.log('2. Aller sur http://localhost:8000/tabs/badges');
        console.log('3. Vérifier la section "Prochains défis !" en bas');
        console.log('4. Seuls les badges avec du progrès (> 0) devraient apparaître');
        console.log('5. Les badges déjà débloqués ne devraient PAS apparaître');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

analyzeBadgeStructure();