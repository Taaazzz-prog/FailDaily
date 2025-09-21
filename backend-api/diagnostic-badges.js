/**
 * Script pour diagnostiquer le problème des badges
 */

const mysql = require('mysql2/promise');

async function diagnosticBadges() {
    console.log('🔍 Diagnostic approfondi des badges...\n');

    const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3308,
        user: 'root',
        password: '@51008473@Alexia@',
        database: 'faildaily'
    });

    try {
        const userId = '9f92d99e-5f70-427e-aebd-68ca8b727bd4'; // Bruno

        // 1. Vérifier les définitions avec fails_count
        console.log('1. Vérification des badges basés sur fails_count...');
        const [failsBadges] = await connection.execute(`
            SELECT id, name, requirement_type, requirement_value
            FROM badge_definitions 
            WHERE requirement_type = 'fails_count'
            ORDER BY requirement_value
        `);
        
        console.log(`📋 ${failsBadges.length} badges basés sur fails_count:`);
        failsBadges.forEach(badge => {
            console.log(`  - ${badge.name}: ${badge.requirement_value} fails`);
        });

        // 2. Vérifier les définitions avec fail_count (sans s)
        console.log('\n2. Vérification des badges basés sur fail_count...');
        const [failBadges] = await connection.execute(`
            SELECT id, name, requirement_type, requirement_value
            FROM badge_definitions 
            WHERE requirement_type = 'fail_count'
            ORDER BY requirement_value
        `);
        
        console.log(`📋 ${failBadges.length} badges basés sur fail_count:`);
        failBadges.forEach(badge => {
            console.log(`  - ${badge.name}: ${badge.requirement_value} fails`);
        });

        // 3. Compter les fails de Bruno
        const [brunoFails] = await connection.execute(`
            SELECT COUNT(*) as count FROM fails WHERE user_id = ?
        `, [userId]);
        
        console.log(`\n📊 Bruno a ${brunoFails[0].count} fails`);

        // 4. Trouver les badges manqués (fail_count)
        const failCount = brunoFails[0].count;
        const badgesToAward = failBadges.filter(badge => badge.requirement_value <= failCount);
        
        console.log(`\n🎯 Badges que Bruno devrait avoir (${badgesToAward.length}):`);
        for (const badge of badgesToAward) {
            console.log(`  🏆 ${badge.name} (requis: ${badge.requirement_value})`);
            
            // Attribuer le badge à Bruno
            try {
                const badgeId = require('crypto').randomUUID();
                await connection.execute(`
                    INSERT INTO badges (id, user_id, name, description, icon, category, rarity, badge_type, unlocked_at, created_at)
                    SELECT ?, ?, bd.name, bd.description, bd.icon, bd.category, bd.rarity, bd.id, NOW(), NOW()
                    FROM badge_definitions bd
                    WHERE bd.id = ?
                `, [badgeId, userId, badge.id]);
                
                console.log(`    ✅ Badge "${badge.name}" attribué`);
            } catch (error) {
                console.log(`    ⚠️  Erreur attribution: ${error.message}`);
            }
        }

        // 5. Vérifier les badges maintenant
        console.log('\n5. Badges de Bruno après attribution:');
        const [newUserBadges] = await connection.execute(
            'SELECT name, category, rarity FROM badges WHERE user_id = ?',
            [userId]
        );
        
        console.log(`🏆 Bruno a maintenant ${newUserBadges.length} badges:`);
        newUserBadges.forEach(badge => {
            console.log(`  - ${badge.name} (${badge.category}/${badge.rarity})`);
        });

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await connection.end();
    }
}

diagnosticBadges();