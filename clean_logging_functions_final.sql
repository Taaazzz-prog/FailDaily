-- Nettoyer TOUTES les fonctions de logging existantes
DROP FUNCTION IF EXISTS log_comprehensive_activity CASCADE;
DROP FUNCTION IF EXISTS log_user_login CASCADE;
DROP FUNCTION IF EXISTS test_logging_functions CASCADE;

-- Créer UNE SEULE fonction log_comprehensive_activity propre
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
        p_action, -- title = action pour simplicité
        p_message, -- description = message pour simplicité
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
    -- En cas d'erreur, insérer un log d'erreur basique
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

-- Créer UNE SEULE fonction log_user_login propre
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
    -- En cas d'erreur, insérer un log d'erreur basique
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

-- Fonction simple pour tester
CREATE OR REPLACE FUNCTION test_logging_simple()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_result1 uuid;
    v_result2 uuid;
BEGIN
    -- Test avec types explicites
    v_result1 := log_comprehensive_activity(
        gen_random_uuid()::uuid, 
        'test_action'::text, 
        'Test message comprehensive'::text
    );
    
    -- Test log_user_login avec types explicites
    v_result2 := log_user_login(
        gen_random_uuid()::uuid,
        'test_login'::text,
        'Test message login'::text
    );
    
    IF v_result1 IS NOT NULL AND v_result2 IS NOT NULL THEN
        RETURN 'SUCCESS: Fonctions testées avec succès! IDs: ' || v_result1 || ', ' || v_result2;
    ELSE
        RETURN 'ERROR: Échec du test des fonctions';
    END IF;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION log_comprehensive_activity TO anon, authenticated;
GRANT EXECUTE ON FUNCTION log_user_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION test_logging_simple TO anon, authenticated;

-- Recharger le schéma PostgREST
NOTIFY pgrst, 'reload schema';

-- Tester les fonctions
SELECT test_logging_simple() as test_result;

-- Vérifier les fonctions créées
SELECT routine_name as "Fonction", routine_type as "Type", data_type as "Retour"
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('log_comprehensive_activity', 'log_user_login', 'test_logging_simple')
ORDER BY routine_name;

-- Vérifier qu'on a bien des logs dans la table
SELECT COUNT(*) as "Nombre de logs", event_type, action 
FROM activity_logs 
GROUP BY event_type, action
ORDER BY event_type;
