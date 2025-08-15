-- Corriger la fonction log_comprehensive_activity pour utiliser les bonnes colonnes
DROP FUNCTION IF EXISTS log_comprehensive_activity;

CREATE OR REPLACE FUNCTION log_comprehensive_activity(
    p_event_type text,
    p_event_category text,
    p_action text,
    p_title text,
    p_user_id text DEFAULT NULL,
    p_resource_type text DEFAULT NULL,
    p_resource_id text DEFAULT NULL,
    p_target_user_id text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_payload jsonb DEFAULT NULL,
    p_old_values jsonb DEFAULT NULL,
    p_new_values jsonb DEFAULT NULL,
    p_ip_address text DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_session_id text DEFAULT NULL,
    p_success boolean DEFAULT true,
    p_error_code text DEFAULT NULL,
    p_error_message text DEFAULT NULL,
    p_correlation_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id uuid;
    v_user_uuid uuid;
    v_resource_uuid uuid;
    v_target_uuid uuid;
    v_correlation_uuid uuid;
    v_user_email text;
    v_user_display_name text;
    v_user_role text;
BEGIN
    -- Convertir les IDs string en UUID (si valides)
    BEGIN
        v_user_uuid := CASE 
            WHEN p_user_id IS NOT NULL AND p_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
            THEN p_user_id::uuid 
            ELSE NULL 
        END;
        
        v_resource_uuid := CASE 
            WHEN p_resource_id IS NOT NULL AND p_resource_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
            THEN p_resource_id::uuid 
            ELSE NULL 
        END;
        
        v_target_uuid := CASE 
            WHEN p_target_user_id IS NOT NULL AND p_target_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
            THEN p_target_user_id::uuid 
            ELSE NULL 
        END;
        
        v_correlation_uuid := CASE 
            WHEN p_correlation_id IS NOT NULL AND p_correlation_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
            THEN p_correlation_id::uuid 
            ELSE gen_random_uuid()
        END;
    EXCEPTION WHEN OTHERS THEN
        v_correlation_uuid := gen_random_uuid();
    END;

    -- Récupérer les infos utilisateur si disponibles
    IF v_user_uuid IS NOT NULL THEN
        SELECT email, display_name, role 
        INTO v_user_email, v_user_display_name, v_user_role
        FROM profiles 
        WHERE id = v_user_uuid;
    END IF;

    -- Insérer le log avec les bonnes colonnes (PAS de colonne message)
    INSERT INTO activity_logs (
        event_type,
        event_category,
        event_level,
        action,
        title,
        description,
        message_fr,
        message_en,
        user_id,
        user_email,
        user_display_name,
        user_role,
        resource_type,
        resource_id,
        target_user_id,
        payload,
        old_values,
        new_values,
        ip_address,
        user_agent,
        session_id,
        correlation_id,
        success,
        error_code,
        error_message,
        created_at
    ) VALUES (
        p_event_type,
        p_event_category,
        CASE WHEN p_success THEN 'info'::text ELSE 'error'::text END, -- event_level
        p_action,
        p_title,
        p_description,
        p_error_message, -- message_fr
        p_error_message, -- message_en
        v_user_uuid,
        COALESCE(v_user_email, 'unknown'),
        COALESCE(v_user_display_name, 'Unknown User'),
        COALESCE(v_user_role, 'user'),
        p_resource_type,
        v_resource_uuid,
        v_target_uuid,
        p_payload,
        p_old_values,
        p_new_values,
        CASE WHEN p_ip_address IS NOT NULL THEN p_ip_address::inet ELSE NULL END,
        p_user_agent,
        p_session_id,
        v_correlation_uuid,
        p_success,
        p_error_code,
        p_error_message,
        NOW()
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur dans log_comprehensive_activity: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Test de la fonction corrigée
SELECT log_comprehensive_activity(
    'auth',
    'auth',
    'test_fixed',
    'Test fonction corrigée',
    'test-user-id',
    'profile',
    'test-resource-id',
    NULL,
    'Test après correction colonnes',
    '{"test": "correction"}',
    NULL,
    NULL,
    '127.0.0.1',
    'Test Browser',
    'test_session',
    true,
    NULL,
    NULL,
    'correlation_test'
) as log_id;

SELECT 'FONCTION CORRIGÉE - Colonnes alignées avec la vraie structure' as status;
