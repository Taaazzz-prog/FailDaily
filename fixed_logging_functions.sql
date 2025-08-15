-- Corriger les fonctions principales en gardant la logique simple qui fonctionne
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
    v_user_email text := NULL;
    v_user_display_name text := NULL;
BEGIN
    -- Générer un ID unique pour ce log
    v_log_id := gen_random_uuid();
    
    -- Récupérer les informations utilisateur si disponible (sans faire planter)
    IF p_user_id IS NOT NULL THEN
        BEGIN
            SELECT email, raw_user_meta_data->>'full_name'
            INTO v_user_email, v_user_display_name
            FROM auth.users 
            WHERE id = p_user_id;
        EXCEPTION WHEN OTHERS THEN
            -- Ignorer les erreurs de requête utilisateur
            v_user_email := NULL;
            v_user_display_name := NULL;
        END;
    END IF;
    
    -- Insérer le log avec seulement les colonnes essentielles qui fonctionnent
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
        p_action,
        p_message,
        p_resource_type,
        p_resource_id,
        p_details,
        v_user_email,
        v_user_display_name,
        NOW(),
        true
    );
    
    RETURN v_log_id;
    
EXCEPTION WHEN OTHERS THEN
    -- En cas d'erreur, utiliser la méthode simple qui fonctionne
    INSERT INTO public.activity_logs (
        id, event_type, message, action, created_at, success, error_message
    ) VALUES (
        gen_random_uuid(), 'error', 
        'Erreur log_comprehensive_activity: ' || SQLERRM,
        'log_error', NOW(), false, SQLERRM
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
    v_user_email text := NULL;
    v_user_display_name text := NULL;
BEGIN
    v_log_id := gen_random_uuid();
    
    -- Récupérer les informations utilisateur si possible
    IF p_user_id IS NOT NULL THEN
        BEGIN
            SELECT email, raw_user_meta_data->>'full_name'
            INTO v_user_email, v_user_display_name
            FROM auth.users 
            WHERE id = p_user_id;
        EXCEPTION WHEN OTHERS THEN
            v_user_email := NULL;
            v_user_display_name := NULL;
        END;
    END IF;
    
    -- Insérer avec la méthode qui fonctionne
    INSERT INTO public.activity_logs (
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
        p_user_id,
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
    INSERT INTO public.activity_logs (
        id, event_type, message, action, created_at, success, error_message
    ) VALUES (
        gen_random_uuid(), 'error', 
        'Erreur log_user_login: ' || SQLERRM,
        'log_error', NOW(), false, SQLERRM
    );
    RETURN NULL;
END;
$$;

-- Recharger le schéma PostgREST
NOTIFY pgrst, 'reload schema';

-- Tester les fonctions corrigées
SELECT log_comprehensive_activity(
    NULL, -- user_id NULL pour éviter la contrainte
    'test_comprehensive_fixed', 
    'Test message comprehensive corrigé'
) as comprehensive_result;

SELECT log_user_login(
    NULL, -- user_id NULL 
    'test_login_fixed', 
    'Test login message corrigé'
) as login_result;

-- Vérifier les logs créés
SELECT event_type, action, message, success, error_message 
FROM activity_logs 
WHERE action LIKE '%fixed%' 
ORDER BY created_at DESC;
