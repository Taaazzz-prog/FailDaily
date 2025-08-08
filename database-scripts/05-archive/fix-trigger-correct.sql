-- =========================================
-- SOLUTION DÉFINITIVE : TRIGGER CORRECT
-- =========================================

-- 1. Supprimer l'ancien trigger défaillant
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Créer la fonction trigger CORRECTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_username TEXT;
    user_email TEXT;
    user_display_name TEXT;
BEGIN
    -- Extraire l'email (obligatoire)
    user_email := COALESCE(NEW.email, '');
    
    -- Extraire le username depuis les métadonnées ou générer un par défaut
    user_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'user_name',
        NEW.raw_user_meta_data->>'display_name',
        SPLIT_PART(user_email, '@', 1), -- Utiliser la partie avant @ de l'email
        'user_' || SUBSTRING(NEW.id::text, 1, 8) -- Fallback avec ID court
    );
    
    -- Extraire le display_name
    user_display_name := COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'displayName',
        NEW.raw_user_meta_data->>'full_name',
        user_username
    );
    
    -- Créer le profil avec TOUTES les colonnes obligatoires
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
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log l'erreur et créer un profil minimal
        RAISE WARNING 'Erreur création profil pour user %: %, création profil minimal', NEW.id, SQLERRM;
        
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
        ) ON CONFLICT (id) DO NOTHING;
        
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recréer le trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Vérifier que le trigger est créé
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- 5. Vérifier la structure de la table profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'TRIGGER CORRECT INSTALLÉ - Testez maintenant l''inscription' as status;
