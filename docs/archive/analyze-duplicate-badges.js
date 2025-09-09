const { executeQuery } = require('./backend-api/src/config/database');

async function analyzeFailCountBadges() {
    try {
        const badges = await executeQuery('SELECT id, name, requirement_type, requirement_value FROM badge_definitions WHERE requirement_type = "fail_count" ORDER BY requirement_value');
        
        console.log('=== BADGES FAIL_COUNT ===');
        badges.forEach(b => console.log(`${b.requirement_value} fails: ${b.id} - ${b.name}`));
        
        // Grouper par requirement_value pour identifier les doublons
        const groups = {};
        badges.forEach(badge => {
            if (!groups[badge.requirement_value]) {
                groups[badge.requirement_value] = [];
            }
            groups[badge.requirement_value].push(badge);
        });
        
        console.log('\n=== DOUBLONS DÉTECTÉS ===');
        Object.keys(groups).forEach(value => {
            if (groups[value].length > 1) {
                console.log(`\n${value} fails (${groups[value].length} badges):`);
                groups[value].forEach(badge => {
                    console.log(`  - ${badge.id}: ${badge.name}`);
                });
            }
        });
        
    } catch (error) {
        console.error('Erreur:', error);
    }
}

analyzeFailCountBadges();
