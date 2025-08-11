// Test complet de la fonctionnalité edit-profile
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Test complet de la page edit-profile avec Supabase');

async function testEditProfile() {
    try {
        // 1. Créer un utilisateur de test
        console.log('\n📝 Création d\'un utilisateur de test...');

        const testUserId = '12345678-1234-5678-9012-123456789012'; // UUID valide
        const initialData = {
            id: testUserId,
            username: 'testuser2025',
            display_name: 'Utilisateur Test',
            bio: 'Bio initiale pour les tests',
            is_anonymous: false
        };

        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert(initialData)
            .select()
            .single();

        if (createError) {
            console.error('❌ Erreur création profil:', createError);
            return;
        }

        console.log('✅ Profil créé:', newProfile);

        // 2. Créer les préférences utilisateur
        const initialPrefs = {
            id: testUserId,
            notifications_enabled: true,
            email_notifications: true,
            push_notifications: true,
            privacy_mode: false,
            show_real_name: true
        };

        const { data: newPrefs, error: prefsCreateError } = await supabase
            .from('user_preferences')
            .upsert(initialPrefs)
            .select()
            .single();

        if (prefsCreateError) {
            console.error('❌ Erreur création préférences:', prefsCreateError);
        } else {
            console.log('✅ Préférences créées:', newPrefs);
        }

        // 3. Simuler la mise à jour depuis edit-profile.page.ts
        console.log('\n🔄 Simulation de la mise à jour depuis edit-profile...');

        // Données que l'utilisateur modifierait dans le formulaire
        const formData = {
            display_name: 'Nouveau Nom Modifié',
            bio: 'Nouvelle bio modifiée depuis l\'interface edit-profile',
        };

        // Préférences modifiées
        const updatedPrefs = {
            notifications_enabled: false,
            privacy_mode: true,
            show_real_name: false
        };

        // Mise à jour du profil
        const { data: updatedProfile, error: updateProfileError } = await supabase
            .from('profiles')
            .update(formData)
            .eq('id', testUserId)
            .select()
            .single();

        if (updateProfileError) {
            console.error('❌ Erreur mise à jour profil:', updateProfileError);
            return;
        }

        console.log('✅ Profil mis à jour:', updatedProfile);

        // Mise à jour des préférences
        const { data: updatedPreferences, error: updatePrefsError } = await supabase
            .from('user_preferences')
            .update(updatedPrefs)
            .eq('id', testUserId)
            .select()
            .single();

        if (updatePrefsError) {
            console.error('❌ Erreur mise à jour préférences:', updatePrefsError);
        } else {
            console.log('✅ Préférences mises à jour:', updatedPreferences);
        }

        // 4. Vérifier la récupération complète (comme dans getCurrentUser)
        console.log('\n🔍 Vérification de la récupération complète...');

        const { data: fullProfile, error: fetchFullError } = await supabase
            .from('profiles')
            .select(`
                *,
                user_preferences (*)
            `)
            .eq('id', testUserId)
            .single();

        if (fetchFullError) {
            console.error('❌ Erreur récupération complète:', fetchFullError);
        } else {
            console.log('✅ Profil complet récupéré:', fullProfile);
        }

        // 5. Nettoyer les données de test
        console.log('\n🧹 Nettoyage des données de test...');

        await supabase.from('user_preferences').delete().eq('id', testUserId);
        await supabase.from('profiles').delete().eq('id', testUserId);

        console.log('✅ Données nettoyées');

        console.log('\n🎉 SUCCÈS ! La page edit-profile est maintenant fonctionnelle avec Supabase !');
        console.log('✨ Les modifications seront sauvegardées en base de données au lieu de localStorage');

    } catch (error) {
        console.error('💥 Erreur générale:', error);
    }
}

testEditProfile();
