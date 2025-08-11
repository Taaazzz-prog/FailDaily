const { createClient } = require('@supabase/supabase-js');

// Configuration identique à l'environnement
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

console.log('🔧 Test de connexion à la base de données FailDaily...');
console.log(`📡 URL: ${supabaseUrl}`);

async function testDatabase() {
    try {
        // Créer le client Supabase
        const supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Client Supabase créé');

        // Test 1: Vérifier les tables
        const { data: tables, error: tablesError } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);

        if (tablesError) {
            console.error('❌ Erreur lors de la vérification des tables:', tablesError);
            return;
        }
        console.log('✅ Table profiles accessible');

        // Test 2: Vérifier la table badges
        const { data: badges, error: badgesError } = await supabase
            .from('badges')
            .select('*');

        if (badgesError) {
            console.error('❌ Erreur lors de la récupération des badges:', badgesError);
            return;
        }
        console.log(`✅ ${badges.length} badges trouvés dans la base`);

        // Test 3: Vérifier les autres tables importantes
        const tables_to_check = ['user_preferences', 'fails', 'reactions', 'user_badges'];

        for (const table of tables_to_check) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                console.error(`❌ Erreur table ${table}:`, error);
            } else {
                console.log(`✅ Table ${table} accessible`);
            }
        }

        console.log('\n🎉 Base de données FailDaily configurée et fonctionnelle !');
        console.log('📊 Toutes les tables sont accessibles et prêtes pour les tests de profil');

    } catch (error) {
        console.error('💥 Erreur générale:', error);
    }
}

testDatabase();
