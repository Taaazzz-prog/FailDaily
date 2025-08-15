-- Recréer la fonction avec des types explicites et casts stricts
DROP FUNCTION IF EXISTS log_comprehensive_activity;

-- Fonction avec signature stricte pour Supabase API
CREATE OR REPLACE FUNCTION public.log_comprehensive_activity(
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
SET search_path = public
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
    -- Générer un ID unique pour ce log
    v_log_id := gen_random_uuid();
    
    -- Convertir les IDs string en UUID (si valides)
    BEGIN
        -- User ID
        IF p_user_id IS NOT NULL AND p_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            v_user_uuid := p_user_id::uuid;
        END IF;
        
        -- Resource ID  
        IF p_resource_id IS NOT NULL AND p_resource_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            v_resource_uuid := p_resource_id::uuid;
        END IF;
        
        -- Target User ID
        IF p_target_user_id IS NOT NULL AND p_target_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            v_target_uuid := p_target_user_id::uuid;
        END IF;
        
        -- Correlation ID
        IF p_correlation_id IS NOT NULL AND p_correlation_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            v_correlation_uuid := p_correlation_id::uuid;
        ELSE
            v_correlation_uuid := gen_random_uuid();
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- En cas d'erreur de conversion UUID
        v_correlation_uuid := gen_random_uuid();
        RAISE NOTICE 'Erreur conversion UUID: %', SQLERRM;
    END;

    -- Récupérer les infos utilisateur si disponibles
    IF v_user_uuid IS NOT NULL THEN
        BEGIN
            SELECT email, display_name, role 
            INTO v_user_email, v_user_display_name, v_user_role
            FROM public.profiles 
            WHERE id = v_user_uuid;
        EXCEPTION WHEN OTHERS THEN
            -- Ignorer les erreurs de profil
            NULL;
        END;
    END IF;

    -- Insérer le log avec gestion d'erreur robuste
    BEGIN
        INSERT INTO public.activity_logs (
            id,
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
            v_log_id,
            COALESCE(p_event_type, 'unknown'),
            COALESCE(p_event_category, 'system'),
            CASE WHEN COALESCE(p_success, true) THEN 'info'::text ELSE 'error'::text END,
            COALESCE(p_action, 'unknown'),
            COALESCE(p_title, 'Log entry'),
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
            COALESCE(p_payload, '{}'::jsonb),
            p_old_values,
            p_new_values,
            CASE WHEN p_ip_address IS NOT NULL THEN p_ip_address::inet ELSE NULL END,
            p_user_agent,
            p_session_id,
            v_correlation_uuid,
            COALESCE(p_success, true),
            p_error_code,
            p_error_message,
            NOW()
        );
        
        RETURN v_log_id;
        
    EXCEPTION WHEN OTHERS THEN
        -- En cas d'erreur d'insertion, logger l'erreur
        RAISE NOTICE 'Erreur insertion activity_logs: %', SQLERRM;
        RETURN NULL;
    END;
    
END;
$$;

-- Accorder les permissions appropriées
GRANT EXECUTE ON FUNCTION public.log_comprehensive_activity TO anon, authenticated;

-- Test immédiat
SELECT public.log_comprehensive_activity(
    'system',
    'system',
    'function_update',
    'Fonction recréée avec types stricts',
    NULL,
    NULL,
    NULL,
    NULL,
    'Test de la fonction avec signature stricte pour Supabase',
    '{"version": "strict_types", "timestamp": "2025-08-15"}'::jsonb,
    NULL,
    NULL,
    '127.0.0.1',
    'PostgreSQL Direct',
    'system_session',
    true,
    NULL,
    'Test de correction des types',
    NULL
) as new_log_id;

SELECT 'FONCTION RECREEE AVEC TYPES STRICTS - Testez maintenant l''API' as status;
