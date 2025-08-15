-- Supprimer EXACTEMENT les fonctions avec leurs signatures complètes
DROP FUNCTION IF EXISTS log_comprehensive_activity(text, text, text, text, text, text, text, text, text, jsonb, jsonb, jsonb, text, text, text, boolean, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS log_user_login(uuid, text, text) CASCADE;

-- Maintenant je peux créer les nouvelles versions proprement
CREATE OR REPLACE FUNCTION log_comprehensive_activity(
    p_user_id uuid,
    p_action text,
    p_message text,
    p_resource_id uuid DEFAULT NULL,
    p_resource_type text DEFAULT NULL,
    p_event_type text DEFAULT 'activity',
    p_details jsonb DEFAULT '{}'::jsonb
) RETURNS uuid 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id uuid;
    v_user_info record;
BEGIN
    -- Générer un ID unique pour ce log
    v_log_id := gen_random_uuid();
    
    -- Récupérer les informations utilisateur si disponible
    IF p_user_id IS NOT NULL THEN
        SELECT email, raw_user_meta_data->>'full_name' as display_name
        INTO v_user_info
        FROM auth.users 
        WHERE id = p_user_id;
    END IF;
    
    -- Insérer le log avec les vraies colonnes de la table
    INSERT INTO public.activity_logs (
        id,
        event_type,
        user_id,
        message,
        action,
        title,
        description,
        resource_type,
        resource_id,
        payload,
        details,
        user_email,
        user_display_name,
        created_at,
        success
    ) VALUES (
        v_log_id,
        p_event_type,
        p_user_id,
        p_message,
        p_action,
        p_action, -- title = action
        p_message, -- description = message
        p_resource_type,
        p_resource_id,
        p_details,
        p_details,
        v_user_info.email,
        v_user_info.display_name,
        NOW(),
        true
    );
    
    RETURN v_log_id;
    
EXCEPTION WHEN OTHERS THEN
    -- En cas d'erreur, log basique
    INSERT INTO public.activity_logs (
        id, event_type, message, action, title, description, 
        created_at, success, error_message
    ) VALUES (
        gen_random_uuid(), 'error', 
        'Erreur log_comprehensive_activity: ' || SQLERRM,
        'log_error', 'Erreur Système', SQLERRM, 
        NOW(), false, SQLERRM
    );
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION log_user_login(
    p_user_id uuid,
    p_action text,
    p_message text,
    p_user_agent text DEFAULT NULL,
    p_details jsonb DEFAULT '{}'::jsonb
) RETURNS uuid 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id uuid;
    v_user_info record;
BEGIN
    v_log_id := gen_random_uuid();
    
    -- Récupérer les informations utilisateur
    IF p_user_id IS NOT NULL THEN
        SELECT email, raw_user_meta_data->>'full_name' as display_name
        INTO v_user_info
        FROM auth.users 
        WHERE id = p_user_id;
    END IF;
    
    -- Insérer avec les vraies colonnes de la table
    INSERT INTO public.activity_logs (
        id,
        event_type,
        user_id,
        message,
        action,
        title,
        description,
        user_agent,
        payload,
        details,
        user_email,
        user_display_name,
        created_at,
        success
    ) VALUES (
        v_log_id,
        'authentication',
        p_user_id,
        p_message,
        p_action,
        p_action,
        p_message,
        p_user_agent,
        p_details,
        p_details,
        v_user_info.email,
        v_user_info.display_name,
        NOW(),
        true
    );
    
    RETURN v_log_id;
    
EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.activity_logs (
        id, event_type, message, action, title, description,
        created_at, success, error_message
    ) VALUES (
        gen_random_uuid(), 'error', 
        'Erreur log_user_login: ' || SQLERRM,
        'log_error', 'Erreur Système', SQLERRM, 
        NOW(), false, SQLERRM
    );
    RETURN NULL;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION log_comprehensive_activity TO anon, authenticated;
GRANT EXECUTE ON FUNCTION log_user_login TO anon, authenticated;

-- Recharger le schéma PostgREST
NOTIFY pgrst, 'reload schema';

-- Test simple direct
SELECT log_comprehensive_activity(
    gen_random_uuid(), 
    'test_action', 
    'Test message'
) as test_comprehensive_result;

SELECT log_user_login(
    gen_random_uuid(), 
    'test_login', 
    'Test login message'
) as test_login_result;

-- Vérifier les fonctions uniques
SELECT routine_name as "Fonction", data_type as "Retour"
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('log_comprehensive_activity', 'log_user_login')
ORDER BY routine_name;

-- Vérifier les logs créés
SELECT event_type, action, message, created_at 
FROM activity_logs 
WHERE action IN ('test_action', 'test_login') 
ORDER BY created_at DESC;
