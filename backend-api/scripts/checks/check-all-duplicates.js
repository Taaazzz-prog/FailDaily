const { executeQuery } = require('./src/config/database');

async function checkAllDuplicates() {
    try {
        console.log('🔍 Recherche de tous les doublons potentiels...\n');
        
        // Vérifier tous les types de requirements
        const allBadges = await executeQuery('SELECT * FROM badge_definitions ORDER BY requirement_type, requirement_value');
        
        // Grouper par type et valeur
        const groups = {};
        allBadges.forEach(badge => {
            const key = `${badge.requirement_type}_${badge.requirement_value}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(badge);
        });
        
        // Identifier les doublons
        let duplicatesFound = false;
        Object.keys(groups).forEach(key => {
            if (groups[key].length > 1) {
                duplicatesFound = true;
                const [type, value] = key.split('_');
                console.log(`⚠️ DOUBLON: ${type} = ${value} (${groups[key].length} badges)`);
                groups[key].forEach(badge => {
                    console.log(`   - ${badge.id}: ${badge.name} (${badge.category})`);
                });
                console.log('');
            }
        });
        
        if (!duplicatesFound) {
            console.log('✅ Aucun doublon détecté !');
        }
        
        // Résumé par catégorie
        console.log('\n📊 Résumé par catégorie:');
        const categories = {};
        allBadges.forEach(badge => {
            if (!categories[badge.category]) categories[badge.category] = 0;
            categories[badge.category]++;
        });
        
        Object.keys(categories).sort().forEach(cat => {
            console.log(`${cat}: ${categories[cat]} badges`);
        });
        
        console.log(`\nTotal: ${allBadges.length} badges`);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

checkAllDuplicates();
