-- =========================================
-- MISE À JOUR TABLE PROFILES - FailDaily
-- =========================================
-- Ce script ajoute TOUTES les colonnes manquantes à votre table profiles
-- pour la conformité légale, les statistiques et les préférences

-- =========================================
-- 1. AJOUTER TOUTES LES COLONNES MANQUANTES
-- =========================================

-- Ajouter la colonne updated_at
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ajouter la colonne avatar_url
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Ajouter la colonne bio
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Ajouter les statistiques utilisateur
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{"totalFails": 0, "couragePoints": 0, "badges": []}';

-- Ajouter les préférences utilisateur
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- === COLONNES LÉGALES ===
-- Ajouter le consentement légal
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS legal_consent JSONB DEFAULT NULL;

-- Ajouter la vérification d'âge
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age_verification JSONB DEFAULT NULL;

-- Ajouter le statut de confirmation email
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT FALSE;

-- Ajouter le statut d'inscription complète
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS registration_completed BOOLEAN DEFAULT FALSE;

-- =========================================
-- 2. CRÉER LES INDEX SUPPLÉMENTAIRES
-- =========================================

-- Index pour les données légales (GIN pour JSONB)
CREATE INDEX IF NOT EXISTS idx_profiles_legal_consent ON public.profiles USING GIN (legal_consent);
CREATE INDEX IF NOT EXISTS idx_profiles_age_verification ON public.profiles USING GIN (age_verification);

-- Index pour les statistiques
CREATE INDEX IF NOT EXISTS idx_profiles_stats ON public.profiles USING GIN (stats);

-- Index pour les préférences
CREATE INDEX IF NOT EXISTS idx_profiles_preferences ON public.profiles USING GIN (preferences);

-- Index pour le statut d'inscription
CREATE INDEX IF NOT EXISTS idx_profiles_registration_completed ON public.profiles (registration_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_email_confirmed ON public.profiles (email_confirmed);

-- =========================================
-- 3. CRÉER LES FONCTIONS DE VALIDATION
-- =========================================

-- Fonction pour valider la structure du consentement légal
CREATE OR REPLACE FUNCTION validate_legal_consent(consent JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    IF consent IS NULL THEN
        RETURN TRUE; -- NULL est autorisé
    END IF;
    
    -- Vérifier la structure minimale
    IF NOT (
        consent ? 'documentsAccepted' AND
        consent ? 'consentDate' AND
        consent ? 'consentVersion' AND
        consent ? 'marketingOptIn'
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Vérifier que documentsAccepted est un array contenant au moins terms-of-service
    IF NOT (
        jsonb_typeof(consent->'documentsAccepted') = 'array' AND
        consent->'documentsAccepted' @> '["terms-of-service"]'::jsonb
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour valider la vérification d'âge
CREATE OR REPLACE FUNCTION validate_age_verification(age_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    IF age_data IS NULL THEN
        RETURN TRUE; -- NULL est autorisé
    END IF;
    
    -- Vérifier la structure minimale
    IF NOT (
        age_data ? 'birthDate' AND
        age_data ? 'isMinor' AND
        age_data ? 'needsParentalConsent'
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Si consentement parental nécessaire, vérifier l'email parent
    IF (age_data->>'needsParentalConsent')::boolean = true THEN
        IF NOT (age_data ? 'parentEmail' AND age_data->>'parentEmail' != '') THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 4. AJOUTER LES CONTRAINTES DE VALIDATION (SÉCURISÉ)
-- =========================================

-- Contrainte pour valider le consentement légal
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_legal_consent' 
        AND table_name = 'profiles'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT check_legal_consent 
        CHECK (validate_legal_consent(legal_consent));
    END IF;
END $$;

-- Contrainte pour valider la vérification d'âge
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_age_verification' 
        AND table_name = 'profiles'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT check_age_verification 
        CHECK (validate_age_verification(age_verification));
    END IF;
END $$;

-- Contrainte pour valider l'email
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_email_format' 
        AND table_name = 'profiles'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT check_email_format 
        CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;
END $$;

-- Contrainte pour valider le username
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_username_length' 
        AND table_name = 'profiles'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT check_username_length 
        CHECK (username IS NULL OR (length(username) >= 3 AND length(username) <= 30));
    END IF;
END $$;

-- =========================================
-- 5. CRÉER LES FONCTIONS RPC POUR L'APPLICATION
-- =========================================

-- Fonction pour créer un profil manuellement
CREATE OR REPLACE FUNCTION create_profile_manually(
    user_id UUID,
    user_email TEXT,
    username TEXT
)
RETURNS JSONB AS $$
DECLARE
    new_profile profiles%ROWTYPE;
BEGIN
    INSERT INTO profiles (
        id,
        username,
        email,
        display_name,
        email_confirmed,
        registration_completed,
        created_at,
        updated_at,
        stats,
        preferences
    )
    VALUES (
        user_id,
        username,
        user_email,
        username,
        true,
        false,
        NOW(),
        NOW(),
        '{"totalFails": 0, "couragePoints": 0, "badges": []}',
        '{}'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = COALESCE(EXCLUDED.username, profiles.username),
        display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
        updated_at = NOW()
    RETURNING * INTO new_profile;

    RETURN row_to_json(new_profile)::JSONB;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour finaliser l'inscription avec les données légales
CREATE OR REPLACE FUNCTION complete_user_registration(
    user_id UUID,
    legal_consent_data JSONB,
    age_verification_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    updated_profile profiles%ROWTYPE;
BEGIN
    UPDATE profiles
    SET
        legal_consent = legal_consent_data,
        age_verification = age_verification_data,
        registration_completed = TRUE,
        updated_at = NOW()
    WHERE id = user_id
    RETURNING * INTO updated_profile;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found for user_id: %', user_id;
    END IF;

    RETURN row_to_json(updated_profile)::JSONB;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error completing registration: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier le statut de l'inscription
CREATE OR REPLACE FUNCTION check_user_registration_status(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    profile_data profiles%ROWTYPE;
    result JSONB;
BEGIN
    SELECT * INTO profile_data FROM profiles WHERE id = user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'exists', false,
            'hasLegalConsent', false,
            'hasAgeVerification', false,
            'registrationCompleted', false
        );
    END IF;

    result := jsonb_build_object(
        'exists', true,
        'hasLegalConsent', (profile_data.legal_consent IS NOT NULL),
        'hasAgeVerification', (profile_data.age_verification IS NOT NULL),
        'registrationCompleted', COALESCE(profile_data.registration_completed, false),
        'profile', row_to_json(profile_data)
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour les statistiques utilisateur
CREATE OR REPLACE FUNCTION update_user_stats(
    user_id UUID,
    new_stats JSONB
)
RETURNS JSONB AS $$
DECLARE
    updated_profile profiles%ROWTYPE;
BEGIN
    UPDATE profiles
    SET
        stats = new_stats,
        updated_at = NOW()
    WHERE id = user_id
    RETURNING * INTO updated_profile;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found for user_id: %', user_id;
    END IF;

    RETURN row_to_json(updated_profile)::JSONB;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating stats: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================
-- 6. CRÉER LA VUE COMPLÈTE POUR L'APPLICATION
-- =========================================

CREATE OR REPLACE VIEW user_profiles_complete AS
SELECT 
    p.id,
    p.username,
    p.display_name,
    p.email,
    p.avatar_url,
    p.bio,
    p.created_at,
    p.updated_at,
    p.legal_consent,
    p.age_verification,
    p.email_confirmed,
    p.registration_completed,
    p.stats,
    p.preferences,
    -- Calculer l'âge à partir de la date de naissance
    CASE 
        WHEN p.age_verification->>'birthDate' IS NOT NULL THEN
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, (p.age_verification->>'birthDate')::date))
        ELSE NULL
    END as calculated_age,
    -- Vérifier si l'utilisateur est mineur
    CASE 
        WHEN p.age_verification->>'birthDate' IS NOT NULL THEN
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, (p.age_verification->>'birthDate')::date)) < 18
        ELSE NULL
    END as is_currently_minor,
    -- Statut de conformité légale
    CASE 
        WHEN p.legal_consent IS NOT NULL AND p.age_verification IS NOT NULL THEN 'complete'
        WHEN p.legal_consent IS NOT NULL OR p.age_verification IS NOT NULL THEN 'partial'
        ELSE 'none'
    END as legal_compliance_status
FROM profiles p;

-- =========================================
-- 7. ACCORDER LES PERMISSIONS
-- =========================================

-- Permissions pour les fonctions RPC
GRANT EXECUTE ON FUNCTION create_profile_manually(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_profile_manually(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION complete_user_registration(UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_registration_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_stats(UUID, JSONB) TO authenticated;

-- Permissions pour la vue
GRANT SELECT ON user_profiles_complete TO authenticated;

-- =========================================
-- 8. VÉRIFICATIONS FINALES
-- =========================================

-- Vérifier la nouvelle structure de la table profiles
SELECT 
    'STRUCTURE PROFILES MISE À JOUR' as status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les contraintes
SELECT 
    'CONTRAINTES PROFILES' as status,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY constraint_name;

-- Vérifier les index
SELECT 
    'INDEX PROFILES' as status,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'profiles' 
AND schemaname = 'public'
ORDER BY indexname;

-- Compter les profils existants
SELECT 
    'PROFILS EXISTANTS' as status,
    COUNT(*) as profile_count,
    COUNT(CASE WHEN legal_consent IS NOT NULL THEN 1 END) as with_legal_consent,
    COUNT(CASE WHEN age_verification IS NOT NULL THEN 1 END) as with_age_verification,
    COUNT(CASE WHEN registration_completed = true THEN 1 END) as registration_completed
FROM public.profiles;

-- =========================================
-- MISE À JOUR PROFILES TERMINÉE !
-- =========================================

-- 🎉 SUCCÈS ! 🎉
-- Votre table profiles a été mise à jour avec :
-- 
-- ✅ Toutes les colonnes nécessaires (updated_at, avatar_url, bio, stats, preferences)
-- ✅ Colonnes légales complètes (legal_consent, age_verification, email_confirmed, registration_completed)
-- ✅ Index optimisés pour les performances
-- ✅ Contraintes de validation pour la sécurité des données
-- ✅ Fonctions RPC pour l'application (création profil, inscription, vérification statut)
-- ✅ Vue complète avec calcul d'âge et statut de conformité
-- ✅ Permissions appropriées
-- 
-- VOTRE TABLE PROFILES EST MAINTENANT COMPLÈTE ET CONFORME !
-- Elle supporte maintenant la vérification d'âge, le consentement légal, 
-- les statistiques utilisateur et toutes les fonctionnalités avancées.