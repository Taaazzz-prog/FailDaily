-- Version simplifiée pour debug
CREATE OR REPLACE FUNCTION log_comprehensive_activity_debug(
    p_user_id uuid,
    p_action text,
    p_message text
) RETURNS uuid 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id uuid;
BEGIN
    -- Générer un ID unique
    v_log_id := gen_random_uuid();
    
    RAISE NOTICE 'Début fonction avec params: user_id=%, action=%, message=%', p_user_id, p_action, p_message;
    
    -- Insertion très basique
    INSERT INTO public.activity_logs (
        id,
        event_type,
        message,
        action,
        created_at
    ) VALUES (
        v_log_id,
        'activity',
        p_message,
        p_action,
        NOW()
    );
    
    RAISE NOTICE 'Insertion réussie avec ID: %', v_log_id;
    RETURN v_log_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERREUR dans fonction: %', SQLERRM;
    -- Ne pas insérer de log d'erreur pour éviter une boucle
    RETURN NULL;
END;
$$;

-- Test de la version debug
SELECT log_comprehensive_activity_debug(NULL, 'test_debug', 'Message de test debug') as debug_result;
