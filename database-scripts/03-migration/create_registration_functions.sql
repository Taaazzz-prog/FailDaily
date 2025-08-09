-- =========================================
-- FONCTIONS RPC POUR L'INSCRIPTION UTILISATEUR
-- =========================================
-- Ces fonctions permettent de finaliser l'inscription avec les données légales

-- =========================================
-- 1. FONCTION POUR FINALISER L'INSCRIPTION
-- =========================================

CREATE OR REPLACE FUNCTION complete_user_registration(
    user_id UUID,
    legal_consent_data JSONB,
    age_verification_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Vérifier que l'utilisateur existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
        RAISE EXCEPTION 'Utilisateur non trouvé';
    END IF;

    -- Mettre à jour le profil avec les données légales
    UPDATE public.profiles 
    SET 
        legal_consent = legal_consent_data,
        age_verification = age_verification_data,
        registration_completed = true,
        updated_at = NOW()
    WHERE id = user_id;

    -- Si le profil n'existe pas encore, le créer
    IF NOT FOUND THEN
        INSERT INTO public.profiles (
            id,
            legal_consent,
            age_verification,
            registration_completed,
            created_at,
            updated_at
        ) VALUES (
            user_id,
            legal_consent_data,
            age_verification_data,
            true,
            NOW(),
            NOW()
        );
    END IF;

    -- Retourner le statut de succès
    result := jsonb_build_object(
        'success', true,
        'user_id', user_id,
        'registration_completed', true,
        'completed_at', NOW()
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, retourner les détails
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'user_id', user_id
        );
        RETURN result;
END;
$$;

-- =========================================
-- 2. FONCTION POUR VÉRIFIER LE STATUT D'INSCRIPTION
-- =========================================

CREATE OR REPLACE FUNCTION check_user_registration_status(
    user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_record RECORD;
    result JSONB;
BEGIN
    -- Récupérer le profil utilisateur
    SELECT 
        id,
        registration_completed,
        legal_consent,
        age_verification,
        email_confirmed,
        created_at,
        updated_at
    INTO profile_record
    FROM public.profiles 
    WHERE id = user_id;

    -- Si pas de profil trouvé
    IF NOT FOUND THEN
        result := jsonb_build_object(
            'exists', false,
            'registration_completed', false,
            'needs_completion', true,
            'user_id', user_id
        );
        RETURN result;
    END IF;

    -- Construire la réponse avec les détails du statut
    result := jsonb_build_object(
        'exists', true,
        'user_id', user_id,
        'registration_completed', COALESCE(profile_record.registration_completed, false),
        'email_confirmed', COALESCE(profile_record.email_confirmed, false),
        'has_legal_consent', (profile_record.legal_consent IS NOT NULL),
        'has_age_verification', (profile_record.age_verification IS NOT NULL),
        'needs_completion', NOT COALESCE(profile_record.registration_completed, false),
        'created_at', profile_record.created_at,
        'updated_at', profile_record.updated_at
    );

    -- Ajouter des détails sur le consentement parental si applicable
    IF profile_record.age_verification IS NOT NULL THEN
        result := result || jsonb_build_object(
            'is_minor', COALESCE((profile_record.age_verification->>'isMinor')::boolean, false),
            'needs_parental_consent', COALESCE((profile_record.age_verification->>'needsParentalConsent')::boolean, false),
            'parent_email', profile_record.age_verification->>'parentEmail'
        );
    END IF;

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, retourner les détails
        result := jsonb_build_object(
            'exists', false,
            'error', SQLERRM,
            'user_id', user_id
        );
        RETURN result;
END;
$$;

-- =========================================
-- 3. FONCTION POUR VALIDER LE CONSENTEMENT PARENTAL
-- =========================================

CREATE OR REPLACE FUNCTION validate_parental_consent(
    user_id UUID,
    parent_token TEXT,
    parent_consent_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    current_age_verification JSONB;
BEGIN
    -- Récupérer les données de vérification d'âge actuelles
    SELECT age_verification INTO current_age_verification
    FROM public.profiles 
    WHERE id = user_id;

    -- Vérifier que l'utilisateur existe et a besoin d'un consentement parental
    IF current_age_verification IS NULL OR 
       NOT COALESCE((current_age_verification->>'needsParentalConsent')::boolean, false) THEN
        RAISE EXCEPTION 'Consentement parental non requis pour cet utilisateur';
    END IF;

    -- Mettre à jour avec le consentement parental
    UPDATE public.profiles 
    SET 
        age_verification = current_age_verification || jsonb_build_object(
            'parentConsentDate', NOW(),
            'parentConsentValidated', true,
            'parentConsentData', parent_consent_data
        ),
        registration_completed = true,
        updated_at = NOW()
    WHERE id = user_id;

    -- Retourner le succès
    result := jsonb_build_object(
        'success', true,
        'user_id', user_id,
        'parental_consent_validated', true,
        'registration_completed', true,
        'validated_at', NOW()
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'user_id', user_id
        );
        RETURN result;
END;
$$;

-- =========================================
-- 4. PERMISSIONS ET SÉCURITÉ
-- =========================================

-- Permettre l'exécution de ces fonctions aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION complete_user_registration(UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_registration_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_parental_consent(UUID, TEXT, JSONB) TO authenticated;

-- Commentaires pour la documentation
COMMENT ON FUNCTION complete_user_registration(UUID, JSONB, JSONB) IS 'Finalise l''inscription utilisateur avec les données légales et de vérification d''âge';
COMMENT ON FUNCTION check_user_registration_status(UUID) IS 'Vérifie le statut d''inscription d''un utilisateur';
COMMENT ON FUNCTION validate_parental_consent(UUID, TEXT, JSONB) IS 'Valide le consentement parental pour les utilisateurs mineurs';

-- =========================================
-- FONCTIONS CRÉÉES AVEC SUCCÈS
-- =========================================
-- Ces fonctions permettent maintenant :
-- 1. De finaliser l'inscription avec les données légales
-- 2. De vérifier le statut d'inscription d'un utilisateur  
-- 3. De gérer le consentement parental pour les mineurs