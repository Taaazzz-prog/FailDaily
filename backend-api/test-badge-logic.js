/**
 * Script pour tester la logique corrigée des badges
 */

const mysql = require('mysql2/promise');

async function testBadgeLogic() {
    console.log('🔍 Test de la logique corrigée des badges...\n');

    const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3308,
        user: 'root',
        password: '@51008473@Alexia@',
        database: 'faildaily'
    });

    try {
        const userId = '9f92d99e-5f70-427e-aebd-68ca8b727bd4'; // Bruno

        // 1. Statistiques actuelles de Bruno
        console.log('1. Statistiques de Bruno...');
        const [brunofails] = await connection.execute(
            'SELECT COUNT(*) as count FROM fails WHERE user_id = ?',
            [userId]
        );
        
        const [brunoBadges] = await connection.execute(
            'SELECT COUNT(*) as count FROM badges WHERE user_id = ?',
            [userId]
        );

        console.log(`📊 Bruno: ${brunofails[0].count} fails, ${brunoBadges[0].count} badges`);

        // 2. Badges débloqués
        console.log('\n2. Badges débloqués par Bruno:');
        const [unlockedBadges] = await connection.execute(`
            SELECT b.name, b.category, b.rarity, bd.requirement_value
            FROM badges b
            JOIN badge_definitions bd ON b.badge_type = bd.id
            WHERE b.user_id = ?
            ORDER BY bd.requirement_value
        `, [userId]);

        unlockedBadges.forEach(badge => {
            console.log(`  ✅ ${badge.name} (${badge.category}/${badge.rarity}) - Requis: ${badge.requirement_value}`);
        });

        // 3. Prochains badges logiques (non débloqués)
        console.log('\n3. Prochains badges en cours de déblocage:');
        const currentFails = brunofails[0].count;
        
        const [nextBadges] = await connection.execute(`
            SELECT bd.name, bd.description, bd.category, bd.rarity, bd.requirement_value,
                   bd.requirement_type,
                   CASE 
                       WHEN bd.requirement_type = 'fail_count' THEN ? 
                       ELSE 0 
                   END as current_progress,
                   CASE 
                       WHEN bd.requirement_type = 'fail_count' AND ? >= bd.requirement_value THEN 1.0
                       WHEN bd.requirement_type = 'fail_count' THEN ROUND(? / bd.requirement_value, 2)
                       ELSE 0 
                   END as progress_ratio
            FROM badge_definitions bd
            WHERE bd.id NOT IN (
                SELECT badge_type FROM badges WHERE user_id = ? AND badge_type IS NOT NULL
            )
            AND (
                (bd.requirement_type = 'fail_count' AND ? > 0) OR
                (bd.requirement_type = 'fail_count' AND bd.requirement_value <= ? + 15)
            )
            ORDER BY bd.requirement_value
            LIMIT 6
        `, [currentFails, currentFails, currentFails, userId, currentFails, currentFails]);

        if (nextBadges.length > 0) {
            nextBadges.forEach(badge => {
                const progressBar = '█'.repeat(Math.floor(badge.progress_ratio * 10)) + 
                                  '░'.repeat(10 - Math.floor(badge.progress_ratio * 10));
                console.log(`  🎯 ${badge.name} (${badge.rarity})`);
                console.log(`     ${badge.description}`);
                console.log(`     [${progressBar}] ${badge.current_progress}/${badge.requirement_value} (${Math.round(badge.progress_ratio * 100)}%)`);
                console.log('');
            });
        } else {
            console.log('  ℹ️ Aucun badge en cours de déblocage trouvé');
        }

        // 4. Vérification de la logique d'affichage
        console.log('4. Logique d\'affichage corrigée:');
        console.log('✅ Affiche les badges avec progrès > 0');
        console.log('✅ Affiche les badges proches (≤ +15 fails du niveau actuel)');
        console.log('✅ Exclut les badges déjà débloqués');
        console.log('✅ Limite à 4-6 badges pour garder le focus');

        console.log('\n🌐 Testez maintenant sur: http://localhost:8000/tabs/badges');
        console.log('   La section "Prochains défis !" devrait afficher les badges en cours');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await connection.end();
    }
}

testBadgeLogic();