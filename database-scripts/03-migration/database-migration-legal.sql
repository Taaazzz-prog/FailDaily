-- Migration pour ajouter les champs légaux et de vérification d'âge
-- À exécuter dans Supabase SQL Editor

-- 1. Ajouter les colonnes pour le consentement légal
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS legal_consent JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS age_verification JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS registration_completed BOOLEAN DEFAULT FALSE;

-- 2. Créer un index pour optimiser les requêtes sur le consentement légal
CREATE INDEX IF NOT EXISTS idx_profiles_legal_consent 
ON profiles USING GIN (legal_consent);

-- 3. Créer un index pour les vérifications d'âge
CREATE INDEX IF NOT EXISTS idx_profiles_age_verification 
ON profiles USING GIN (age_verification);

-- 4. Fonction pour valider la structure du consentement légal
CREATE OR REPLACE FUNCTION validate_legal_consent(consent JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier que le consentement contient les champs requis
    IF consent IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Vérifier les champs obligatoires
    IF NOT (
        consent ? 'documentsAccepted' AND
        consent ? 'consentDate' AND
        consent ? 'consentVersion' AND
        consent ? 'marketingOptIn'
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Vérifier que documentsAccepted est un array et contient au minimum les CGU
    IF NOT (
        jsonb_typeof(consent->'documentsAccepted') = 'array' AND
        consent->'documentsAccepted' @> '["terms-of-service"]'::jsonb
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 5. Fonction pour valider la vérification d'âge
CREATE OR REPLACE FUNCTION validate_age_verification(age_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    IF age_data IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Vérifier les champs obligatoires
    IF NOT (
        age_data ? 'birthDate' AND
        age_data ? 'isMinor' AND
        age_data ? 'needsParentalConsent'
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Si mineur, vérifier l'email du parent
    IF (age_data->>'needsParentalConsent')::boolean = true THEN
        IF NOT (age_data ? 'parentEmail' AND age_data->>'parentEmail' != '') THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 6. Contrainte pour valider le consentement légal
ALTER TABLE profiles 
ADD CONSTRAINT check_legal_consent 
CHECK (legal_consent IS NULL OR validate_legal_consent(legal_consent));

-- 7. Contrainte pour valider la vérification d'âge
ALTER TABLE profiles 
ADD CONSTRAINT check_age_verification 
CHECK (age_verification IS NULL OR validate_age_verification(age_verification));

-- 8. Politique RLS pour que les utilisateurs ne puissent voir que leur propre profil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Créer les nouvelles politiques
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 9. Fonction trigger pour créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (
        id, 
        username, 
        display_name, 
        email,
        created_at,
        updated_at,
        email_confirmed,
        registration_completed
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
        NEW.email,
        NOW(),
        NOW(),
        COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE),
        FALSE -- Le processus d'inscription n'est pas encore terminé
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS create_profile_on_signup_trigger ON auth.users;

-- Créer le nouveau trigger
CREATE TRIGGER create_profile_on_signup_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_on_signup();

-- 10. Fonction pour finaliser l'inscription avec les données légales
CREATE OR REPLACE FUNCTION complete_registration(
    user_id UUID,
    legal_consent_data JSONB,
    age_verification_data JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier que l'utilisateur existe et n'a pas encore complété son inscription
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND (registration_completed IS FALSE OR registration_completed IS NULL)
    ) THEN
        RAISE EXCEPTION 'Utilisateur introuvable ou inscription déjà complétée';
    END IF;
    
    -- Valider les données
    IF NOT validate_legal_consent(legal_consent_data) THEN
        RAISE EXCEPTION 'Données de consentement légal invalides';
    END IF;
    
    IF NOT validate_age_verification(age_verification_data) THEN
        RAISE EXCEPTION 'Données de vérification d''âge invalides';
    END IF;
    
    -- Mettre à jour le profil
    UPDATE profiles SET
        legal_consent = legal_consent_data,
        age_verification = age_verification_data,
        registration_completed = TRUE,
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de la finalisation de l''inscription: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Vue pour récupérer les données utilisateur complètes
CREATE OR REPLACE VIEW user_profiles_complete AS
SELECT 
    p.id,
    p.username,
    p.display_name,
    p.email,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    p.legal_consent,
    p.age_verification,
    p.email_confirmed,
    p.registration_completed,
    p.stats,
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
    END as is_currently_minor
FROM profiles p;

-- Donner les permissions sur la vue
GRANT SELECT ON user_profiles_complete TO authenticated;

-- 12. Fonction pour vérifier le statut de completion de l'inscription
CREATE OR REPLACE FUNCTION check_registration_status(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    profile_record RECORD;
    result JSONB;
BEGIN
    SELECT * INTO profile_record
    FROM profiles
    WHERE id = user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'exists', false,
            'email_confirmed', false,
            'registration_completed', false,
            'needs_legal_consent', true,
            'needs_age_verification', true
        );
    END IF;
    
    result := jsonb_build_object(
        'exists', true,
        'email_confirmed', COALESCE(profile_record.email_confirmed, false),
        'registration_completed', COALESCE(profile_record.registration_completed, false),
        'needs_legal_consent', profile_record.legal_consent IS NULL,
        'needs_age_verification', profile_record.age_verification IS NULL,
        'username', profile_record.username,
        'display_name', profile_record.display_name
    );
    
    -- Ajouter les informations sur l'âge si disponibles
    IF profile_record.age_verification IS NOT NULL THEN
        result := result || jsonb_build_object(
            'is_minor', profile_record.age_verification->>'isMinor',
            'needs_parental_consent', profile_record.age_verification->>'needsParentalConsent'
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commenter pour information : 
-- Cette migration ajoute tout le nécessaire pour gérer :
-- 1. Le consentement légal (CGU, politique de confidentialité, etc.)
-- 2. La vérification d'âge avec consentement parental si nécessaire
-- 3. Le suivi du statut de completion de l'inscription
-- 4. Les validations automatiques des données
-- 5. Les politiques de sécurité RLS
-- 6. Les fonctions utilitaires pour l'application

-- Pour désactiver temporairement la confirmation d'email en développement :
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;
-- UPDATE profiles SET email_confirmed = TRUE WHERE email_confirmed = FALSE;
