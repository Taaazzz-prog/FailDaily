const { executeQuery } = require('./src/config/database');

async function getRealStats() {
    try {
        console.log('📊 Récupération des statistiques réelles...\n');
        
        // Compter les utilisateurs
        const users = await executeQuery('SELECT COUNT(*) as count FROM users');
        console.log(`👥 Utilisateurs totaux: ${users[0].count}`);
        
        // Compter les utilisateurs actifs (connectés dans les 30 derniers jours)
        const activeUsers = await executeQuery(`
            SELECT COUNT(*) as count FROM users 
            WHERE last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);
        console.log(`🟢 Utilisateurs actifs (30j): ${activeUsers[0].count}`);
        
        // Compter les fails publiés
        const fails = await executeQuery('SELECT COUNT(*) as count FROM fails');
        console.log(`📝 Fails publiés: ${fails[0].count}`);
        
        // Compter les réactions
        const reactions = await executeQuery('SELECT COUNT(*) as count FROM reactions');
        console.log(`❤️ Réactions totales: ${reactions[0].count}`);
        
        // Compter les badges attribués
        const userBadges = await executeQuery('SELECT COUNT(*) as count FROM user_badges');
        console.log(`🏆 Badges attribués: ${userBadges[0].count}`);
        
        // Compter les commentaires
        const comments = await executeQuery('SELECT COUNT(*) as count FROM comments');
        console.log(`💬 Commentaires: ${comments[0].count}`);
        
        // Stats des badges par catégorie
        const badgesByCategory = await executeQuery(`
            SELECT category, COUNT(*) as count 
            FROM badge_definitions 
            GROUP BY category 
            ORDER BY count DESC
        `);
        console.log('\n🏆 Badges par catégorie:');
        badgesByCategory.forEach(cat => {
            console.log(`   ${cat.category}: ${cat.count} badges`);
        });
        
        // Total badges disponibles
        const totalBadges = await executeQuery('SELECT COUNT(*) as count FROM badge_definitions');
        console.log(`\n🎯 Total badges disponibles: ${totalBadges[0].count}`);
        
        // Utilisateurs avec le plus de fails (sans username)
        const topUsers = await executeQuery(`
            SELECT u.email, COUNT(f.id) as fail_count
            FROM users u
            LEFT JOIN fails f ON u.id = f.user_id
            GROUP BY u.id, u.email
            ORDER BY fail_count DESC
            LIMIT 5
        `);
        console.log('\n🔝 Top utilisateurs par fails:');
        topUsers.forEach((user, index) => {
            const emailShort = user.email.split('@')[0];
            console.log(`   ${index + 1}. ${emailShort}: ${user.fail_count} fails`);
        });
        
        // Fails les plus récents
        const recentFails = await executeQuery(`
            SELECT COUNT(*) as count 
            FROM fails 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `);
        console.log(`\n📅 Fails cette semaine: ${recentFails[0].count}`);
        
        // Moyenne de réactions par fail
        const avgReactions = await executeQuery(`
            SELECT AVG(reaction_count) as avg_reactions
            FROM (
                SELECT f.id, COUNT(r.id) as reaction_count
                FROM fails f
                LEFT JOIN reactions r ON f.id = r.fail_id
                GROUP BY f.id
            ) as fail_reactions
        `);
        console.log(`📊 Réactions moyennes par fail: ${parseFloat(avgReactions[0].avg_reactions || 0).toFixed(1)}`);
        
        // Résumé JSON pour la présentation
        console.log('\n💾 DONNÉES POUR LA PRÉSENTATION:');
        console.log(JSON.stringify({
            utilisateurs_totaux: users[0].count,
            utilisateurs_actifs: activeUsers[0].count,
            fails_publies: fails[0].count,
            reactions_totales: reactions[0].count,
            badges_attribues: userBadges[0].count,
            commentaires: comments[0].count,
            badges_disponibles: totalBadges[0].count,
            fails_cette_semaine: recentFails[0].count,
            reactions_moyennes: parseFloat(avgReactions[0].avg_reactions || 0).toFixed(1)
        }, null, 2));
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

getRealStats();
