// Script de test pour vérifier la mise à jour du profil
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase locale
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileUpdate() {
    try {
        console.log('🔍 Test de mise à jour du profil...');

        // 1. Lister les profils disponibles
        console.log('📋 Récupération des profils disponibles...');
        const { data: profiles, error: listError } = await supabase
            .from('profiles')
            .select('id, username, display_name')
            .limit(5);

        if (listError) {
            console.error('❌ Erreur listing:', listError);
            return;
        }

        console.log('👥 Profils disponibles:', profiles);

        if (!profiles || profiles.length === 0) {
            console.log('❌ Aucun profil trouvé');
            return;
        }

        // Utiliser le premier profil disponible
        const userId = profiles[0].id;
        console.log('🎯 Test avec utilisateur:', profiles[0].username, userId);

        // 2. Récupérer le profil actuel complet
        console.log('📖 Récupération du profil complet...');
        const { data: currentProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (fetchError) {
            console.error('❌ Erreur récupération:', fetchError);
            return;
        }

        console.log('✅ Profil actuel:', {
            display_name: currentProfile.display_name,
            bio: currentProfile.bio,
            preferences: currentProfile.preferences
        });

        // 3. Mettre à jour le profil
        console.log('🔄 Mise à jour du profil...');
        const updatedData = {
            display_name: currentProfile.username + '_test_updated',
            bio: 'Bio mise à jour depuis le script de test - ' + new Date().toLocaleString(),
            preferences: {
                ...currentProfile.preferences,
                darkMode: true,
                theme: 'dark',
                notifications: {
                    encouragement: true,
                    reminderFrequency: 'daily'
                }
            },
            updated_at: new Date().toISOString()
        };

        const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update(updatedData)
            .eq('id', userId)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Erreur mise à jour:', updateError);
            return;
        }

        console.log('✅ Profil mis à jour:', {
            display_name: updatedProfile.display_name,
            bio: updatedProfile.bio,
            preferences: updatedProfile.preferences
        });

        console.log('✅ Test terminé avec succès ! Les données ont été modifiées.');
        console.log('💡 Conseil: Vérifiez dans Supabase Studio (http://127.0.0.1:54323) pour voir les changements.');

    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
} testProfileUpdate();
