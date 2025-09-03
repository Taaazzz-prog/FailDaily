const { executeQuery } = require('./src/config/database');

async function removeDuplicateBadges() {
    try {
        // IDs des badges doublons à supprimer (série fail-master-*)
        const duplicateIds = [
            'fail-master-5',    // Doublon de fails-5
            'fail-master-10',   // Doublon de fails-10  
            'fail-master-25',   // Doublon de fails-25
            'fail-master-50',   // Doublon de fails-50
            'fail-master-100'   // Doublon de fails-100
        ];
        
        console.log('🔍 Vérification des badges à supprimer...');
        
        // Vérifier d'abord quels badges existent
        for (const id of duplicateIds) {
            const badge = await executeQuery('SELECT * FROM badge_definitions WHERE id = ?', [id]);
            if (badge.length > 0) {
                console.log(`✅ Trouvé: ${id} - ${badge[0].name} (${badge[0].requirement_value} fails)`);
            } else {
                console.log(`❌ Non trouvé: ${id}`);
            }
        }
        
        console.log('\n🗑️ Suppression des badges doublons...');
        
        // Supprimer les badges doublons
        for (const id of duplicateIds) {
            try {
                const result = await executeQuery('DELETE FROM badge_definitions WHERE id = ?', [id]);
                if (result.affectedRows > 0) {
                    console.log(`✅ Supprimé: ${id}`);
                } else {
                    console.log(`⚠️ Aucune ligne affectée pour: ${id}`);
                }
            } catch (error) {
                console.error(`❌ Erreur lors de la suppression de ${id}:`, error.message);
            }
        }
        
        console.log('\n📊 Vérification finale des badges fail_count restants...');
        const remainingBadges = await executeQuery('SELECT id, name, requirement_value FROM badge_definitions WHERE requirement_type = "fail_count" ORDER BY requirement_value');
        
        remainingBadges.forEach(badge => {
            console.log(`${badge.requirement_value} fails: ${badge.id} - ${badge.name}`);
        });
        
        console.log(`\n🎉 Nettoyage terminé ! ${duplicateIds.length} badges doublons supprimés.`);
        
    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}

removeDuplicateBadges();
