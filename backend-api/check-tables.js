const { executeQuery } = require('./src/config/database');

async function checkTables() {
    try {
        console.log('🔍 Vérification des tables existantes...\n');
        
        // Lister toutes les tables
        const tables = await executeQuery("SHOW TABLES");
        console.log('📋 Tables existantes:');
        tables.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`${index + 1}. ${tableName}`);
        });
        
        // Maintenant récupérer les stats avec les bonnes tables
        const tableCount = tables.length;
        
        // Vérifier si les tables existent avant de les requêter
        const tableNames = tables.map(t => Object.values(t)[0]);
        
        const stats = {
            tables: tableCount,
            users: 0,
            fails: 0,
            reactions: 0,
            comments: 0,
            badges: 0,
            apiEndpoints: 16
        };
        
        // Statistiques conditionnelles
        if (tableNames.includes('users')) {
            const userStats = await executeQuery("SELECT COUNT(*) as total FROM users");
            stats.users = userStats[0].total;
        }
        
        if (tableNames.includes('fails')) {
            const failStats = await executeQuery("SELECT COUNT(*) as total FROM fails");
            stats.fails = failStats[0].total;
        }
        
        if (tableNames.includes('reactions')) {
            const reactionStats = await executeQuery("SELECT COUNT(*) as total FROM reactions");
            stats.reactions = reactionStats[0].total;
        }
        
        if (tableNames.includes('comments')) {
            const commentStats = await executeQuery("SELECT COUNT(*) as total FROM comments");
            stats.comments = commentStats[0].total;
        }
        
        if (tableNames.includes('badge_definitions')) {
            const badgeStats = await executeQuery("SELECT COUNT(*) as total FROM badge_definitions");
            stats.badges = badgeStats[0].total;
            
            const badgeCategories = await executeQuery("SELECT category, COUNT(*) as count FROM badge_definitions GROUP BY category ORDER BY count DESC");
            stats.badgeCategories = badgeCategories;
        }
        
        console.log('\n📊 Statistiques collectées:');
        console.log(JSON.stringify(stats, null, 2));
        
        return stats;
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        return null;
    }
}

checkTables();
