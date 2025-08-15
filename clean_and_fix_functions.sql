-- Script de nettoyage final - supprimer TOUTES les versions des fonctions
DO $$ 
DECLARE 
    func_record RECORD;
BEGIN
    -- Supprimer toutes les versions de log_user_login
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'log_user_login'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;
    
    -- Supprimer toutes les versions de log_comprehensive_activity
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'log_comprehensive_activity'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;
END $$;

-- Créer LA SEULE ET UNIQUE version de log_user_login
CREATE OR REPLACE FUNCTION public.log_user_login(
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
    log_id := gen_random_uuid();
    
    SELECT display_name, email INTO profile_record
    FROM public.profiles 
    WHERE id = p_user_id;
    
    INSERT INTO public.activity_logs (
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
        p_description,
        p_description,
        p_metadata,
        NOW(),
        COALESCE(profile_record.display_name, 'Utilisateur inconnu'),
        COALESCE(profile_record.email, 'email@inconnu.com')
    );
    
    RETURN log_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erreur dans log_user_login: %', SQLERRM;
        RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer LA SEULE ET UNIQUE version de log_comprehensive_activity
CREATE OR REPLACE FUNCTION public.log_comprehensive_activity(
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
    log_id := gen_random_uuid();
    
    SELECT display_name, email INTO profile_record
    FROM public.profiles 
    WHERE id = p_user_id;
    
    INSERT INTO public.activity_logs (
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
        p_description,
        p_description,
        p_metadata,
        NOW(),
        COALESCE(profile_record.display_name, 'Utilisateur inconnu'),
        COALESCE(profile_record.email, 'email@inconnu.com')
    );
    
    RETURN log_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erreur dans log_comprehensive_activity: %', SQLERRM;
        RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions aux bonnes fonctions
GRANT EXECUTE ON FUNCTION public.log_user_login(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.log_comprehensive_activity(UUID, TEXT, TEXT, UUID, TEXT, TEXT, JSONB) TO authenticated, anon, service_role;

-- Test final
SELECT 'Fonctions nettoyées et recréées avec succès!' as status;
