/**
 * Debug de la méthode getNextChallengesStats()
 */

const API_BASE = 'http://localhost:8000/api';

async function debugGetNextChallenges() {
    console.log('🔍 Debug de getNextChallengesStats()...\n');

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

        if (!loginResponse.ok) {
            console.error('❌ Erreur de connexion');
            return;
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;

        // 1. Récupérer les badges disponibles
        console.log('1. Récupération des badges disponibles...');
        const badgesResponse = await fetch(`${API_BASE}/badges/available`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const badgesData = await badgesResponse.json();
        const allBadges = badgesData.badges || [];
        
        console.log(`📊 ${allBadges.length} badges disponibles`);
        console.log('\n🔍 Structure d\'un badge example:');
        if (allBadges.length > 0) {
            const exampleBadge = allBadges.find(b => b.category === 'COURAGE') || allBadges[0];
            console.log(JSON.stringify(exampleBadge, null, 2));
        }

        // 2. Récupérer les badges utilisateur
        console.log('\n2. Récupération des badges utilisateur...');
        const userBadgesResponse = await fetch(`${API_BASE}/users/me/badges`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const userBadgesData = await userBadgesResponse.json();
        const userBadges = userBadgesData.badges || [];
        
        console.log(`🏆 ${userBadges.length} badges débloqués`);

        // 3. Récupérer les statistiques utilisateur
        console.log('\n3. Récupération des statistiques utilisateur...');
        const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const profileData = await profileResponse.json();
        const stats = profileData.user?.stats || {};
        
        console.log('📊 Statistiques utilisateur:');
        console.log(JSON.stringify(stats, null, 2));

        // 4. Identifier les badges non débloqués
        const userBadgeNames = userBadges.map(b => b.name);
        const lockedBadges = allBadges.filter(badge => !userBadgeNames.includes(badge.name));
        
        console.log(`\n🔒 ${lockedBadges.length} badges non débloqués`);
        
        // 5. Analyser quelques badges pour voir leurs propriétés
        console.log('\n5. Analyse des propriétés des badges non débloqués:');
        const sampleBadges = lockedBadges.slice(0, 3);
        sampleBadges.forEach((badge, index) => {
            console.log(`\nBadge ${index + 1}: ${badge.name}`);
            console.log(`  - requirements: ${JSON.stringify(badge.requirements)}`);
            console.log(`  - requirementType: ${badge.requirementType || 'undefined'}`);
            console.log(`  - requirementValue: ${badge.requirementValue || 'undefined'}`);
        });

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

debugGetNextChallenges();