/**
 * Script de test pour vérifier la correction du système de badges avec le compte de Bruno
 */

const API_BASE = 'http://localhost:8000/api';

async function testBadgesWithBrunoAccount() {
    console.log('🔍 Test du système de badges avec le compte de Bruno...\n');

    try {
        // 1. Connexion avec le compte Bruno
        console.log('1. Connexion avec bruno@taaazzz.be...');
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'bruno@taaazzz.be',
                password: '@51008473@'
            })
        });

        if (!loginResponse.ok) {
            console.error('❌ Erreur de connexion:', loginResponse.status);
            const errorText = await loginResponse.text();
            console.error('Détails:', errorText);
            return;
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Connexion réussie avec le compte Bruno');

        // 2. Récupérer les badges utilisateur
        console.log('\n2. Récupération des badges de Bruno...');
        const userBadgesResponse = await fetch(`${API_BASE}/users/me/badges`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!userBadgesResponse.ok) {
            console.error('❌ Erreur récupération badges:', userBadgesResponse.status);
            return;
        }

        const userBadgesData = await userBadgesResponse.json();
        const userBadges = userBadgesData.badges || [];
        console.log(`✅ ${userBadges.length} badges débloqués par Bruno`);

        console.log('\n📋 Badges débloqués par Bruno:');
        userBadges.forEach(badge => {
            console.log(`  🏆 ${badge.name} (${badge.category}/${badge.rarity}) - ${badge.description}`);
        });

        // 3. Récupérer tous les badges disponibles
        console.log('\n3. Récupération de tous les badges disponibles...');
        const allBadgesResponse = await fetch(`${API_BASE}/badges/available`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!allBadgesResponse.ok) {
            console.error('❌ Erreur récupération tous les badges:', allBadgesResponse.status);
            return;
        }

        const allBadgesData = await allBadgesResponse.json();
        const allBadges = allBadgesData.badges || [];
        console.log(`✅ ${allBadges.length} badges disponibles au total`);

        // 4. Analyser les badges Courage spécifiquement
        console.log('\n4. Analyse des badges Courage...');
        const courageBadges = allBadges.filter(badge => badge.category === 'courage');
        const unlockedCourageBadges = userBadges.filter(badge => badge.category === 'courage');
        const lockedCourageBadges = courageBadges.filter(badge => 
            !userBadges.some(userBadge => userBadge.name === badge.name)
        );

        console.log(`📊 Badges Courage - Total: ${courageBadges.length}, Débloqués: ${unlockedCourageBadges.length}, Verrouillés: ${lockedCourageBadges.length}`);
        
        console.log('\n✅ Badges Courage débloqués:');
        unlockedCourageBadges.forEach(badge => {
            console.log(`  🏆 ${badge.name} (${badge.rarity})`);
        });

        console.log('\n🔒 Badges Courage non débloqués:');
        lockedCourageBadges.forEach(badge => {
            console.log(`  ⭕ ${badge.name} (${badge.rarity}) - ${badge.description}`);
        });

        // 5. Récupérer le profil pour les stats
        console.log('\n5. Récupération des statistiques de Bruno...');
        const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const stats = profileData.user?.stats || {};
            console.log('📊 Statistiques de Bruno:');
            console.log(`  - Fails publiés: ${stats.failsCount || 0}`);
            console.log(`  - Réactions données: ${stats.reactionsGiven || 0}`);
            console.log(`  - Points de courage: ${stats.couragePoints || 0}`);
            console.log(`  - Commentaires: ${stats.commentsCount || 0}`);
        }

        console.log('\n🎯 Résumé de la correction:');
        console.log('✅ Condition modifiée: "progress.current >= 0" → "progress.current > 0"');
        console.log('✅ Résultat attendu: Seuls les badges avec du progrès réel apparaissent dans "Prochains défis"');
        console.log('✅ Les badges déjà débloqués ne devraient plus apparaître dans cette section');

        console.log('\n🌐 Testez maintenant sur: http://localhost:8000/tabs/badges');
        console.log('   → Connectez-vous avec bruno@taaazzz.be');
        console.log('   → Vérifiez la section "Prochains défis !" en bas de page');
        console.log('   → Les badges déjà débloqués ne devraient plus y apparaître');

    } catch (error) {
        console.error('❌ Erreur pendant le test:', error.message);
    }
}

// Exécuter le test
testBadgesWithBrunoAccount();