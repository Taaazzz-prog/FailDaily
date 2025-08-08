-- =========================================
-- DIAGNOSTIC COMPLET ET DÉBOGAGE
-- =========================================

-- 1. Vérifier l'état actuel des triggers
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- 2. Vérifier la fonction trigger
SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- 3. Vérifier la table profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Vérifier les contraintes sur la table profiles
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles'
AND tc.table_schema = 'public';

-- 5. Tester la création d'un profil manuellement
SELECT 'Test insertion manuelle dans profiles' as test;

-- 6. Vérifier les permissions
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename = 'profiles';

-- 7. Vérifier les politiques RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 8. Créer une version de debug du trigger
DROP FUNCTION IF EXISTS public.handle_new_user_debug() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user_debug()
RETURNS trigger AS $$
DECLARE
    user_username TEXT;
    user_email TEXT;
    user_display_name TEXT;
    debug_info TEXT;
BEGIN
    -- Log des données reçues
    debug_info := 'NEW.id: ' || COALESCE(NEW.id::text, 'NULL') || 
                  ', NEW.email: ' || COALESCE(NEW.email, 'NULL') ||
                  ', metadata: ' || COALESCE(NEW.raw_user_meta_data::text, 'NULL');
    
    RAISE WARNING 'DEBUG handle_new_user: %', debug_info;
    
    -- Extraire l'email (obligatoire)
    user_email := COALESCE(NEW.email, '');
    
    -- Extraire le username depuis les métadonnées ou générer un par défaut
    user_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'user_name',
        NEW.raw_user_meta_data->>'display_name',
        SPLIT_PART(user_email, '@', 1),
        'user_' || SUBSTRING(NEW.id::text, 1, 8)
    );
    
    -- Extraire le display_name
    user_display_name := COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'displayName',
        NEW.raw_user_meta_data->>'full_name',
        user_username
    );
    
    RAISE WARNING 'DEBUG extracted values - username: %, email: %, display_name: %', 
                  user_username, user_email, user_display_name;
    
    -- Créer le profil
    INSERT INTO public.profiles (
        id,
        username,
        email,
        display_name,
        avatar_url,
        bio,
        stats,
        preferences,
        created_at,
        updated_at,
        legal_consent,
        age_verification,
        email_confirmed,
        registration_completed
    ) VALUES (
        NEW.id,
        user_username,
        user_email,
        user_display_name,
        NEW.raw_user_meta_data->>'avatar_url',
        '',
        '{}',
        '{}',
        NOW(),
        NOW(),
        NEW.raw_user_meta_data->'legal_consent',
        NEW.raw_user_meta_data->'age_verification',
        COALESCE((NEW.raw_user_meta_data->>'email_confirmed')::boolean, false),
        COALESCE((NEW.raw_user_meta_data->>'registration_completed')::boolean, false)
    );
    
    RAISE WARNING 'DEBUG profil créé avec succès pour user %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'DEBUG ERREUR création profil pour user %: % - %', NEW.id, SQLSTATE, SQLERRM;
        
        -- Essayer insertion minimale
        BEGIN
            INSERT INTO public.profiles (
                id,
                username,
                email,
                display_name,
                avatar_url,
                bio,
                stats,
                preferences,
                created_at,
                updated_at,
                legal_consent,
                age_verification,
                email_confirmed,
                registration_completed
            ) VALUES (
                NEW.id,
                'user_' || SUBSTRING(NEW.id::text, 1, 8),
                COALESCE(NEW.email, ''),
                'Utilisateur',
                NULL,
                '',
                '{}',
                '{}',
                NOW(),
                NOW(),
                '{}',
                '{}',
                false,
                false
            );
            RAISE WARNING 'DEBUG profil minimal créé pour user %', NEW.id;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'DEBUG ERREUR même profil minimal échoue: % - %', SQLSTATE, SQLERRM;
        END;
        
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Remplacer le trigger par la version debug
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_debug();

SELECT 'TRIGGER DEBUG INSTALLÉ - Testez inscription et vérifiez les logs' as status;
