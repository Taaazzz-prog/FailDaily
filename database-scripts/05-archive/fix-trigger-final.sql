-- =========================================
-- CORRECTIF FINAL : PROBLÈME IDENTIFIÉ DANS LE TRIGGER
-- =========================================
-- L'erreur "Database error updating user" indique que le trigger handle_new_user échoue

-- 1. SUPPRIMER COMPLÈTEMENT LE TRIGGER DÉFAILLANT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS create_profile_on_signup();

-- 2. DÉSACTIVER COMPLÈTEMENT LES TRIGGERS AUTOMATIQUES
-- Cela permettra à Supabase de créer les utilisateurs sans erreur

-- 3. CRÉER UNE FONCTION MANUELLE POUR CRÉER LES PROFILS
CREATE OR REPLACE FUNCTION create_profile_manually(
    user_id UUID,
    user_email TEXT,
    username TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    final_username TEXT;
    counter INTEGER := 0;
    profile_result profiles%ROWTYPE;
BEGIN
    -- Générer un nom d'utilisateur unique
    final_username := COALESCE(username, split_part(user_email, '@', 1), 'user');
    final_username := lower(regexp_replace(final_username, '[^a-zA-Z0-9_]', '_', 'g'));
    
    -- S'assurer qu'il est unique
    WHILE EXISTS (SELECT 1 FROM profiles WHERE profiles.username = final_username) LOOP
        counter := counter + 1;
        final_username := COALESCE(username, split_part(user_email, '@', 1), 'user') || '_' || counter;
    END LOOP;
    
    -- Insérer le profil
    INSERT INTO profiles (
        id, username, email, display_name, 
        email_confirmed, registration_completed,
        stats, preferences, created_at, updated_at
    ) VALUES (
        user_id, final_username, user_email, final_username,
        true, false,
        '{"badges": [], "totalFails": 0, "couragePoints": 0}'::jsonb,
        '{}'::jsonb,
        NOW(), NOW()
    )
    RETURNING * INTO profile_result;
    
    RETURN row_to_json(profile_result)::JSONB;
END;
$$;

-- 4. DONNER LES PERMISSIONS
GRANT EXECUTE ON FUNCTION create_profile_manually(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_profile_manually(UUID, TEXT, TEXT) TO anon;

-- 5. CRÉER LES PROFILS MANQUANTS POUR LES UTILISATEURS EXISTANTS
INSERT INTO profiles (id, username, email, display_name, email_confirmed, registration_completed, stats, preferences)
SELECT 
    u.id,
    'user_' || substring(u.id::text, 1, 8),
    u.email,
    COALESCE(u.raw_user_meta_data->>'display_name', 'user_' || substring(u.id::text, 1, 8)),
    (u.email_confirmed_at IS NOT NULL),
    false,
    '{"badges": [], "totalFails": 0, "couragePoints": 0}'::jsonb,
    '{}'::jsonb
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 6. VÉRIFICATION FINALE
SELECT 
    'TRIGGER REMOVED - MANUAL PROFILE CREATION ENABLED' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN email_confirmed THEN 1 END) as confirmed_profiles
FROM profiles;

-- INSTRUCTIONS IMPORTANTES :
-- 1. Maintenant l'inscription Supabase devrait fonctionner sans erreur
-- 2. Vous devrez créer les profils manuellement dans votre code Angular
-- 3. Modifiez votre service pour appeler create_profile_manually après signUp
