// Script pour créer un utilisateur de test avec authentification valide
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

console.log('🔐 Création d\'un utilisateur de test avec authentification...');

async function createTestUser() {
    try {
        const testEmail = 'bruno@taazzz.be';
        const testPassword = 'test123456';

        console.log('1. 📧 Création de l\'utilisateur auth...');

        // Créer l'utilisateur dans auth.users avec le service role
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true // Confirmer l'email automatiquement
        });

        if (authError) {
            console.error('❌ Erreur création auth user:', authError);
            return;
        }

        console.log('✅ Utilisateur auth créé:', {
            id: authUser.user.id,
            email: authUser.user.email
        });

        // 2. Créer le profil correspondant
        console.log('\n2. 👤 Création du profil utilisateur...');

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authUser.user.id,
                username: 'bruno_test',
                display_name: 'Bruno Test',
                bio: 'Bio de test pour Bruno',
                is_anonymous: false
            })
            .select()
            .single();

        if (profileError) {
            console.error('❌ Erreur création profil:', profileError);
            return;
        }

        console.log('✅ Profil créé:', profile);

        // 3. Créer les préférences
        console.log('\n3. ⚙️ Création des préférences...');

        const { data: preferences, error: prefsError } = await supabase
            .from('user_preferences')
            .insert({
                id: authUser.user.id,
                notifications_enabled: true,
                email_notifications: true,
                push_notifications: true,
                privacy_mode: false,
                show_real_name: true
            })
            .select()
            .single();

        if (prefsError) {
            console.error('❌ Erreur création préférences:', prefsError);
        } else {
            console.log('✅ Préférences créées:', preferences);
        }

        console.log('\n🎉 Utilisateur de test créé avec succès !');
        console.log(`📧 Email: ${testEmail}`);
        console.log(`🔑 Mot de passe: ${testPassword}`);
        console.log(`🆔 ID: ${authUser.user.id}`);
        console.log('\n📌 Instructions:');
        console.log('1. Vider le localStorage de l\'application (F12 > Application > Storage > Clear)');
        console.log('2. Se connecter avec ces identifiants');
        console.log('3. Tester la page edit-profile');

    } catch (error) {
        console.error('💥 Erreur générale:', error);
    }
}

createTestUser();
