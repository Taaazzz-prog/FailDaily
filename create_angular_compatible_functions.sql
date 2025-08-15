-- FONCTION COMPATIBLE AVEC LE CODE ANGULAR EXISTANT
-- Cette fonction a EXACTEMENT les paramètres que le service Angular attend

DROP FUNCTION IF EXISTS log_comprehensive_activity CASCADE;

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
) RETURNS uuid 
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
        SELECT email, raw_user_meta_data->>'full_name', 'user'
        INTO v_user_email, v_user_display_name, v_user_role
        FROM auth.users 
        WHERE id = v_user_uuid;
    END IF;

    -- Insérer le log avec TOUTES les colonnes de la vraie table
    INSERT INTO activity_logs (
        event_type,
        event_category,
        action,
        title,
        description,
        message,
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
        p_action,
        p_title,
        p_description,
        COALESCE(p_error_message, p_description, p_title), -- message obligatoire
        v_user_uuid,
        v_user_email,
        v_user_display_name,
        v_user_role,
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
    -- En cas d'erreur, log basique
    INSERT INTO activity_logs (
        id, event_type, message, action, created_at, success, error_message
    ) VALUES (
        gen_random_uuid(), 'error', 
        'Erreur log_comprehensive_activity: ' || SQLERRM,
        'log_error', NOW(), false, SQLERRM
    );
    RETURN NULL;
END;
$$;

-- Créer aussi log_user_login pour être compatible
CREATE OR REPLACE FUNCTION log_user_login(
    p_user_id text,
    p_action text DEFAULT 'login',
    p_message text DEFAULT 'User login',
    p_user_agent text DEFAULT NULL,
    p_details jsonb DEFAULT NULL
) RETURNS uuid 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id uuid;
    v_user_uuid uuid;
    v_user_email text;
    v_user_display_name text;
BEGIN
    v_log_id := gen_random_uuid();
    
    -- Convertir user_id en UUID si valide
    BEGIN
        v_user_uuid := CASE 
            WHEN p_user_id IS NOT NULL AND p_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
            THEN p_user_id::uuid 
            ELSE NULL 
        END;
    EXCEPTION WHEN OTHERS THEN
        v_user_uuid := NULL;
    END;
    
    -- Récupérer les informations utilisateur
    IF v_user_uuid IS NOT NULL THEN
        SELECT email, raw_user_meta_data->>'full_name'
        INTO v_user_email, v_user_display_name
        FROM auth.users 
        WHERE id = v_user_uuid;
    END IF;
    
    -- Insérer le log
    INSERT INTO activity_logs (
        id,
        event_type,
        user_id,
        message,
        action,
        title,
        description,
        user_agent,
        details,
        user_email,
        user_display_name,
        created_at,
        success
    ) VALUES (
        v_log_id,
        'authentication',
        v_user_uuid,
        p_message,
        p_action,
        p_action,
        p_message,
        p_user_agent,
        p_details,
        v_user_email,
        v_user_display_name,
        NOW(),
        true
    );
    
    RETURN v_log_id;
    
EXCEPTION WHEN OTHERS THEN
    INSERT INTO activity_logs (
        id, event_type, message, action, created_at, success, error_message
    ) VALUES (
        gen_random_uuid(), 'error', 
        'Erreur log_user_login: ' || SQLERRM,
        'log_error', NOW(), false, SQLERRM
    );
    RETURN NULL;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION log_comprehensive_activity TO anon, authenticated;
GRANT EXECUTE ON FUNCTION log_user_login TO anon, authenticated;

-- Recharger PostgREST
NOTIFY pgrst, 'reload schema';

-- Test avec les VRAIS paramètres de votre service Angular
SELECT log_comprehensive_activity(
    'auth_signup'::text,
    'auth'::text, 
    'signup'::text,
    'Inscription utilisateur'::text,
    null::text, -- user_id
    null::text, -- resource_type  
    null::text, -- resource_id
    null::text, -- target_user_id
    'Test inscription depuis Angular'::text, -- description
    '{"test": "data"}'::jsonb, -- payload
    null::jsonb, -- old_values
    null::jsonb, -- new_values
    '127.0.0.1'::text, -- ip_address
    'Test User Agent'::text, -- user_agent
    'test-session-id'::text, -- session_id
    true, -- success
    null::text, -- error_code
    null::text, -- error_message
    null::text -- correlation_id
) as test_result;

-- Vérifier que ça marche
SELECT event_type, event_category, action, title, description, success 
FROM activity_logs 
WHERE action = 'signup' 
ORDER BY created_at DESC 
LIMIT 1;
