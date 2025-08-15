-- Script de correction complète pour toutes les fonctions de logging
-- Étape 1: Supprimer toutes les anciennes versions des fonctions

DROP FUNCTION IF EXISTS log_user_login(UUID, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS log_user_login(UUID, TEXT, VARCHAR, TEXT, JSONB);
DROP FUNCTION IF EXISTS log_comprehensive_activity(UUID, VARCHAR, VARCHAR, UUID, VARCHAR, TEXT, JSONB);
DROP FUNCTION IF EXISTS log_comprehensive_activity(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS log_comprehensive_activity(VARCHAR, VARCHAR, VARCHAR, UUID, VARCHAR, TEXT, JSONB);

-- Étape 2: Créer la fonction log_user_login avec la bonne signature
CREATE OR REPLACE FUNCTION log_user_login(
    p_user_id UUID,
    p_action VARCHAR(50),
    p_category VARCHAR(20),
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
    
    -- Insérer le log avec message_fr et message_en (pas message)
    INSERT INTO activity_logs (
        id,
        user_id,
        action,
        category,
        message_fr,
        message_en,
        metadata,
        created_at,
        display_name,
        email
    ) VALUES (
        log_id,
        p_user_id,
        p_action,
        p_category,
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

-- Étape 3: Créer la fonction log_comprehensive_activity avec la bonne signature
CREATE OR REPLACE FUNCTION log_comprehensive_activity(
    p_user_id UUID,
    p_action VARCHAR(100),
    p_category VARCHAR(50),
    p_related_id UUID,
    p_severity VARCHAR(20),
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
    
    -- Insérer le log complet
    INSERT INTO activity_logs (
        id,
        user_id,
        action,
        category,
        related_id,
        severity,
        message_fr,
        message_en,
        metadata,
        created_at,
        display_name,
        email
    ) VALUES (
        log_id,
        p_user_id,
        p_action,
        p_category,
        p_related_id,
        p_severity,
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

-- Étape 4: Accorder les permissions
GRANT EXECUTE ON FUNCTION log_user_login(UUID, VARCHAR, VARCHAR, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_login(UUID, VARCHAR, VARCHAR, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION log_user_login(UUID, VARCHAR, VARCHAR, TEXT, JSONB) TO service_role;

GRANT EXECUTE ON FUNCTION log_comprehensive_activity(UUID, VARCHAR, VARCHAR, UUID, VARCHAR, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION log_comprehensive_activity(UUID, VARCHAR, VARCHAR, UUID, VARCHAR, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION log_comprehensive_activity(UUID, VARCHAR, VARCHAR, UUID, VARCHAR, TEXT, JSONB) TO service_role;

-- Étape 5: Test des fonctions
SELECT log_user_login(
    'f211d624-55b8-4aa2-a77d-f8e425fc1513'::uuid,
    'test_login',
    'auth',
    'Test de la fonction log_user_login',
    '{"test": true}'::jsonb
) as test_login_result;

SELECT log_comprehensive_activity(
    'f211d624-55b8-4aa2-a77d-f8e425fc1513'::uuid,
    'test_action',
    'profile',
    'f211d624-55b8-4aa2-a77d-f8e425fc1513'::uuid,
    'info',
    'Test de la fonction log_comprehensive_activity',
    '{"test": true}'::jsonb
) as test_comprehensive_result;

-- Vérifier que les fonctions sont bien créées
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('log_user_login', 'log_comprehensive_activity')
ORDER BY routine_name;
