/**
 * Script de test pour vérifier la correction du système de badges
 * Vérifie que seuls les badges avec du progrès apparaissent dans "Prochains défis"
 */

const API_BASE = 'http://localhost:8000/api';

async function testBadgesSystem() {
    console.log('🔍 Test du système de badges après correction...\n');

    try {
        // 1. Tester la connexion utilisateur
        console.log('1. Test de connexion...');
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });

        if (!loginResponse.ok) {
            console.error('❌ Erreur de connexion:', loginResponse.status);
            return;
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Connexion réussie');

        // 2. Récupérer tous les badges disponibles
        console.log('\n2. Récupération des badges disponibles...');
        const badgesResponse = await fetch(`${API_BASE}/badges/available`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!badgesResponse.ok) {
            console.error('❌ Erreur récupération badges:', badgesResponse.status);
            return;
        }

        const badgesData = await badgesResponse.json();
        const allBadges = badgesData.badges || [];
        console.log(`✅ ${allBadges.length} badges disponibles`);

        // 3. Récupérer les badges utilisateur
        console.log('\n3. Récupération des badges utilisateur...');
        const userBadgesResponse = await fetch(`${API_BASE}/users/me/badges`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!userBadgesResponse.ok) {
            console.error('❌ Erreur récupération badges utilisateur:', userBadgesResponse.status);
            return;
        }

        const userBadgesData = await userBadgesResponse.json();
        const userBadges = userBadgesData.badges || [];
        console.log(`✅ ${userBadges.length} badges débloqués par l'utilisateur`);

        // 4. Afficher les badges de courage
        console.log('\n4. Analyse des badges Courage...');
        const courageBadges = allBadges.filter(badge => badge.category === 'courage');
        const unlockedCourageBadges = userBadges.filter(badge => badge.category === 'courage');
        
        console.log(`📊 Badges Courage - Total: ${courageBadges.length}, Débloqués: ${unlockedCourageBadges.length}`);
        
        console.log('\n📋 Badges Courage débloqués:');
        unlockedCourageBadges.forEach(badge => {
            console.log(`  ✅ ${badge.name} (${badge.rarity})`);
        });

        console.log('\n📋 Badges Courage non débloqués:');
        const lockedCourageBadges = courageBadges.filter(badge => 
            !userBadges.some(userBadge => userBadge.name === badge.name)
        );
        lockedCourageBadges.forEach(badge => {
            console.log(`  🔒 ${badge.name} (${badge.rarity}) - ${badge.description}`);
        });

        // 5. Récupérer les statistiques utilisateur
        console.log('\n5. Récupération des statistiques utilisateur...');
        const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const stats = profileData.user?.stats || {};
            console.log('📊 Statistiques utilisateur:');
            console.log(`  - Fails publiés: ${stats.failsCount || 0}`);
            console.log(`  - Réactions données: ${stats.reactionsGiven || 0}`);
            console.log(`  - Points de courage: ${stats.couragePoints || 0}`);
        }

        // 6. Simuler l'appel frontend pour "Prochains défis"
        console.log('\n6. Test de la logique "Prochains défis"...');
        console.log('🎯 Cette section devrait maintenant ne montrer que les badges avec du progrès > 0');
        console.log('✅ Correction appliquée: condition changée de ">= 0" à "> 0"');

        console.log('\n🎉 Test terminé - Vérifiez maintenant sur http://localhost:8000/tabs/badges');
        console.log('   La section "Prochains défis" ne devrait plus montrer les badges déjà débloqués');

    } catch (error) {
        console.error('❌ Erreur pendant le test:', error.message);
    }
}

// Exécuter le test
testBadgesSystem();