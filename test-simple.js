// Script simple de test Supabase
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function testSimple() {
    console.log('🔍 Test simple...');

    // Test plusieurs tables
    console.log('--- Test fails ---');
    const { data: fails } = await supabase.from('fails').select('*').limit(2);
    console.log('Fails:', fails?.length || 0, 'records');

    console.log('--- Test badges ---');
    const { data: badges } = await supabase.from('badges').select('*').limit(2);
    console.log('Badges:', badges?.length || 0, 'records');

    console.log('--- Test profiles ---');
    const { data: profiles } = await supabase.from('profiles').select('*').limit(2);
    console.log('Profiles:', profiles?.length || 0, 'records');

    // Si on trouve des fails, essayons de trouver les profils correspondants
    if (fails && fails.length > 0) {
        console.log('--- Recherche profil pour fail ---');
        const userId = fails[0].user_id;
        console.log('User ID du fail:', userId);

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        console.log('Profil trouvé:', profile ? 'OUI' : 'NON');
        if (profile) {
            console.log('Profil:', profile.username, profile.display_name);

            // Test de mise à jour
            const { data: updated, error: updateError } = await supabase
                .from('profiles')
                .update({ bio: 'TEST FONCTIONNEL - ' + Date.now() })
                .eq('id', userId)
                .select('bio')
                .single();

            console.log('Mise à jour:', updateError ? 'ERREUR' : 'SUCCÈS');
            if (updated) console.log('Nouvelle bio:', updated.bio);
        }
    }
} testSimple();
