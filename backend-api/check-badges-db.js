/**
 * Script pour vérifier les badges directement dans la base de données
 */

const mysql = require('mysql2/promise');

async function checkBadgesInDatabase() {
    console.log('🔍 Vérification directe dans la base de données...\n');

    const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3308, // Port Docker de la DB
        user: 'root',
        password: '@51008473@Alexia@',
        database: 'faildaily'
    });

    try {
        // 1. Trouver l'utilisateur Bruno
        console.log('1. Recherche de l\'utilisateur Bruno...');
        const [users] = await connection.execute(
            'SELECT id, email FROM users WHERE email = ?',
            ['bruno@taaazzz.be']
        );

        if (users.length === 0) {
            console.log('❌ Utilisateur Bruno non trouvé');
            return;
        }

        const userId = users[0].id;
        console.log(`✅ Utilisateur trouvé: ${users[0].email} (ID: ${userId})`);

        // 2. Compter les fails de Bruno
        console.log('\n2. Comptage des fails de Bruno...');
        const [failsCount] = await connection.execute(
            'SELECT COUNT(*) as count FROM fails WHERE user_id = ?',
            [userId]
        );
        console.log(`📊 Bruno a ${failsCount[0].count} fails`);

        // 3. Vérifier les badges de Bruno
        console.log('\n3. Vérification des badges de Bruno...');
        const [userBadges] = await connection.execute(
            'SELECT * FROM badges WHERE user_id = ?',
            [userId]
        );
        console.log(`🏆 Bruno a ${userBadges.length} badges débloqués`);

        if (userBadges.length > 0) {
            userBadges.forEach(badge => {
                console.log(`  - ${badge.name} (${badge.category}/${badge.rarity})`);
            });
        }

        // 4. Vérifier les définitions de badges
        console.log('\n4. Vérification des définitions de badges...');
        const [badgeDefinitions] = await connection.execute(
            'SELECT COUNT(*) as count FROM badge_definitions'
        );
        console.log(`📋 ${badgeDefinitions[0].count} définitions de badges dans la DB`);

        // 5. Vérifier les badges par catégorie
        console.log('\n5. Badges par catégorie:');
        const [categoryStats] = await connection.execute(`
            SELECT category, COUNT(*) as count 
            FROM badge_definitions 
            GROUP BY category 
            ORDER BY category
        `);
        
        categoryStats.forEach(stat => {
            console.log(`  ${stat.category}: ${stat.count} badges`);
        });

        // 6. Vérifier si Bruno devrait avoir des badges
        console.log('\n6. Badges que Bruno devrait avoir (selon ses fails):');
        const [expectedBadges] = await connection.execute(`
            SELECT bd.id, bd.name, bd.description, bd.requirement_type, bd.requirement_value
            FROM badge_definitions bd
            WHERE bd.requirement_type = 'fails_count' 
            AND bd.requirement_value <= ?
            ORDER BY bd.requirement_value
        `, [failsCount[0].count]);

        if (expectedBadges.length > 0) {
            console.log('📋 Badges attendus pour Bruno:');
            expectedBadges.forEach(badge => {
                console.log(`  🎯 ${badge.name} - Requis: ${badge.requirement_value} fails`);
            });

            // Vérifier lesquels sont manqués
            const [existingBadges] = await connection.execute(`
                SELECT badge_type FROM badges WHERE user_id = ? AND badge_type IS NOT NULL
            `, [userId]);
            
            const existingBadgeTypes = existingBadges.map(b => b.badge_type);
            const missingBadges = expectedBadges.filter(badge => !existingBadgeTypes.includes(badge.id));
            
            if (missingBadges.length > 0) {
                console.log('\n🚨 Badges manqués:');
                missingBadges.forEach(badge => {
                    console.log(`  ⚠️  ${badge.name} - Requis: ${badge.requirement_value} fails`);
                });
                
                console.log('\n💡 Solution: Exécuter le script fix-missing-badges.js');
            }
        }

        // 7. Vérifier quelques définitions de badges courage
        console.log('\n7. Exemples de badges courage:');
        const [courageBadges] = await connection.execute(`
            SELECT id, name, description, requirement_type, requirement_value
            FROM badge_definitions 
            WHERE category = 'courage' 
            ORDER BY requirement_value 
            LIMIT 5
        `);
        
        courageBadges.forEach(badge => {
            console.log(`  🦸 ${badge.name} - ${badge.requirement_type}: ${badge.requirement_value}`);
        });

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await connection.end();
    }
}

checkBadgesInDatabase();