/**
 * Script de debug final pour identifier le problème exact
 */

const API_BASE = 'http://localhost:8000/api';

async function debugComplet() {
    console.log('🔍 DEBUG COMPLET - Analyse de tous les éléments...\n');

    try {
        // 1. Connexion
        console.log('1. Connexion...');
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'bruno@taaazzz.be',
                password: '@51008473@'
            })
        });

        if (!loginResponse.ok) {
            console.error('❌ Connexion échouée:', await loginResponse.text());
            return;
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Connexion OK');

        // 2. Récupérer les badges disponibles
        console.log('\n2. Badges disponibles...');
        const badgesResponse = await fetch(`${API_BASE}/badges/available`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const badgesData = await badgesResponse.json();
        const allBadges = badgesData.badges || [];
        console.log(`📊 ${allBadges.length} badges total`);

        // Structure d'un badge
        const sampleBadge = allBadges.find(b => b.requirements && b.requirements.type === 'fail_count') || allBadges[0];
        console.log('\n🔍 Structure badge example:');
        console.log(JSON.stringify(sampleBadge, null, 2));

        // 3. Badges utilisateur
        console.log('\n3. Badges utilisateur...');
        const userBadgesResponse = await fetch(`${API_BASE}/users/me/badges`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const userBadgesData = await userBadgesResponse.json();
        const userBadges = userBadgesData.badges || [];
        console.log(`🏆 ${userBadges.length} badges débloqués`);

        // 4. Stats utilisateur
        console.log('\n4. Stats utilisateur...');
        const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const profileData = await profileResponse.json();
        const stats = profileData.user?.stats || {};
        console.log('📊 Stats structure:');
        console.log(JSON.stringify(stats, null, 2));

        // 5. Simulation de la logique frontend
        console.log('\n5. Simulation logique frontend...');
        
        // Badges non débloqués
        const userBadgeNames = userBadges.map(b => b.name);
        const lockedBadges = allBadges.filter(badge => !userBadgeNames.includes(badge.name));
        console.log(`🔒 ${lockedBadges.length} badges non débloqués`);

        // Filtrer les badges fail_count
        const failCountBadges = lockedBadges.filter(badge => 
            badge.requirements && badge.requirements.type === 'fail_count'
        );
        console.log(`🎯 ${failCountBadges.length} badges fail_count non débloqués`);

        // Calculer le progrès pour chaque badge
        const currentFails = stats.failsCount || stats.totalFails || 0;
        console.log(`📊 Fails actuels: ${currentFails}`);

        const challenges = [];
        for (const badge of failCountBadges.slice(0, 6)) {
            const required = badge.requirements.value;
            const current = Math.min(currentFails, required);
            const progress = required > 0 ? current / required : 0;
            
            // Condition d'affichage
            const shouldDisplay = current > 0 || (current === 0 && required <= currentFails + 15);
            
            console.log(`\n🔍 Badge "${badge.name}":`);
            console.log(`   - Requis: ${required}`);
            console.log(`   - Actuel: ${current}`);
            console.log(`   - Progrès: ${Math.round(progress * 100)}%`);
            console.log(`   - Afficher: ${shouldDisplay}`);
            
            if (shouldDisplay) {
                challenges.push({
                    name: badge.name,
                    description: badge.description,
                    rarity: badge.rarity,
                    current,
                    required,
                    progress
                });
            }
        }

        console.log(`\n🎯 RÉSULTAT: ${challenges.length} badges à afficher dans "Prochains défis"`);
        if (challenges.length === 0) {
            console.log('❌ PROBLÈME: Aucun badge ne respecte les conditions d\'affichage');
            console.log('🔧 Solution: Vérifier la logique shouldDisplay ou les données stats');
        } else {
            console.log('✅ SUCCESS: Les badges suivants devraient s\'afficher:');
            challenges.forEach(c => {
                console.log(`   - ${c.name}: ${c.current}/${c.required} (${Math.round(c.progress * 100)}%)`);
            });
        }

    } catch (error) {
        console.error('❌ Erreur complète:', error);
    }
}

debugComplet();