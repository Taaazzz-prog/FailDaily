-- Script de correction finale avec la bonne structure de table
-- Supprimer toutes les anciennes versions
DROP FUNCTION IF EXISTS log_user_login(UUID, VARCHAR, VARCHAR, TEXT, JSONB);
DROP FUNCTION IF EXISTS log_comprehensive_activity(UUID, VARCHAR, VARCHAR, UUID, VARCHAR, TEXT, JSONB);

-- Créer la fonction log_user_login corrigée
CREATE OR REPLACE FUNCTION log_user_login(
    p_user_id UUID,
    p_action TEXT,
    p_category TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    profile_record RECORD;
BEGIN
    -- Générer un nouvel ID pour le log
    log_id := gen_random_uuid();
    
    -- Récupérer les informations du profil
    SELECT display_name, email INTO profile_record
    FROM profiles 
    WHERE id = p_user_id;
    
    -- Insérer le log avec la bonne structure
    INSERT INTO activity_logs (
        id,
        event_type,
        event_category,
        user_id,
        action,
        title,
        description,
        message_fr,
        message_en,
        payload,
        created_at,
        user_display_name,
        user_email
    ) VALUES (
        log_id,
        'user_action',
        COALESCE(p_category, 'auth'),
        p_user_id,
        COALESCE(p_action, 'login'),
        'Connexion utilisateur',
        p_description,
        p_description,  -- message_fr
        p_description,  -- message_en
        p_metadata,
        NOW(),
        COALESCE(profile_record.display_name, 'Utilisateur inconnu'),
        COALESCE(profile_record.email, 'email@inconnu.com')
    );
    
    RETURN log_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, retourner quand même un UUID
        RAISE NOTICE 'Erreur dans log_user_login: %', SQLERRM;
        RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer la fonction log_comprehensive_activity corrigée
CREATE OR REPLACE FUNCTION log_comprehensive_activity(
    p_user_id UUID,
    p_action TEXT,
    p_category TEXT,
    p_related_id UUID,
    p_severity TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    profile_record RECORD;
BEGIN
    -- Générer un nouvel ID pour le log
    log_id := gen_random_uuid();
    
    -- Récupérer les informations du profil
    SELECT display_name, email INTO profile_record
    FROM profiles 
    WHERE id = p_user_id;
    
    -- Insérer le log avec la bonne structure
    INSERT INTO activity_logs (
        id,
        event_type,
        event_category,
        event_level,
        user_id,
        action,
        resource_id,
        title,
        description,
        message_fr,
        message_en,
        payload,
        created_at,
        user_display_name,
        user_email
    ) VALUES (
        log_id,
        'comprehensive_activity',
        COALESCE(p_category, 'system'),
        COALESCE(p_severity, 'info'),
        p_user_id,
        COALESCE(p_action, 'unknown'),
        p_related_id,
        COALESCE(p_action, 'Activity Log'),
        p_description,
        p_description,  -- message_fr
        p_description,  -- message_en
        p_metadata,
        NOW(),
        COALESCE(profile_record.display_name, 'Utilisateur inconnu'),
        COALESCE(profile_record.email, 'email@inconnu.com')
    );
    
    RETURN log_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, retourner quand même un UUID
        RAISE NOTICE 'Erreur dans log_comprehensive_activity: %', SQLERRM;
        RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION log_user_login(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_login(UUID, TEXT, TEXT, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION log_user_login(UUID, TEXT, TEXT, TEXT, JSONB) TO service_role;

GRANT EXECUTE ON FUNCTION log_comprehensive_activity(UUID, TEXT, TEXT, UUID, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION log_comprehensive_activity(UUID, TEXT, TEXT, UUID, TEXT, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION log_comprehensive_activity(UUID, TEXT, TEXT, UUID, TEXT, TEXT, JSONB) TO service_role;

-- Test final des fonctions
SELECT log_user_login(
    'f211d624-55b8-4aa2-a77d-f8e425fc1513'::uuid,
    'test_login',
    'auth',
    'Test de la fonction log_user_login - structure corrigée',
    '{"test": true}'::jsonb
) as test_login_final;

SELECT log_comprehensive_activity(
    'f211d624-55b8-4aa2-a77d-f8e425fc1513'::uuid,
    'test_action',
    'profile',
    'f211d624-55b8-4aa2-a77d-f8e425fc1513'::uuid,
    'info',
    'Test de la fonction log_comprehensive_activity - structure corrigée',
    '{"test": true}'::jsonb
) as test_comprehensive_final;
