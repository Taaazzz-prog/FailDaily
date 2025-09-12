const { executeQuery } = require('./src/config/database');

async function getDatabaseStats() {
    try {
        console.log('🔍 Collecte des statistiques de la base de données...\n');
        
        // Statistiques générales
        const tableCount = await executeQuery("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE()");
        
        // Statistiques des badges
        const badgeStats = await executeQuery("SELECT COUNT(*) as total FROM badge_definitions");
        const badgeCategories = await executeQuery("SELECT category, COUNT(*) as count FROM badge_definitions GROUP BY category ORDER BY count DESC");
        
        // Statistiques des utilisateurs
        const userStats = await executeQuery("SELECT COUNT(*) as total FROM users");
        
        // Statistiques des fails
        const failStats = await executeQuery("SELECT COUNT(*) as total FROM fails");
        
        // Statistiques des réactions
        const reactionStats = await executeQuery("SELECT COUNT(*) as total FROM fail_reactions");
        
        // Statistiques des commentaires
        const commentStats = await executeQuery("SELECT COUNT(*) as total FROM comments");
        
        // Points API
        const apiEndpoints = 16; // Compté manuellement depuis la structure des routes
        
        console.log('📊 Statistiques de la base de données:');
        console.log(`Tables: ${tableCount[0].count}`);
        console.log(`Utilisateurs: ${userStats[0].total}`);
        console.log(`Fails: ${failStats[0].total}`);
        console.log(`Réactions: ${reactionStats[0].total}`);
        console.log(`Commentaires: ${commentStats[0].total}`);
        console.log(`Points API: ${apiEndpoints}`);
        console.log(`Total badges: ${badgeStats[0].total}`);
        
        console.log('\n🏆 Répartition des badges par catégorie:');
        badgeCategories.forEach(cat => {
            console.log(`${cat.category}: ${cat.count} badges`);
        });
        
        // Retourner les données pour mise à jour
        return {
            tables: tableCount[0].count,
            users: userStats[0].total,
            fails: failStats[0].total,
            reactions: reactionStats[0].total,
            comments: commentStats[0].total,
            badges: badgeStats[0].total,
            apiEndpoints: apiEndpoints,
            badgeCategories: badgeCategories
        };
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        return null;
    }
}

getDatabaseStats().then(stats => {
    if (stats) {
        console.log('\n✅ Données collectées avec succès!');
        console.log(JSON.stringify(stats, null, 2));
    }
});
