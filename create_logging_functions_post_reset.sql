-- Script de création des fonctions de logging après reset DB
-- Toutes les fonctions avec types explicites pour éviter les erreurs "unknown"

-- 1. Fonction log_user_login avec types explicites
CREATE OR REPLACE FUNCTION public.log_user_login(
    p_user_id UUID,
    p_action TEXT,
    p_category TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    log_id UUID;
    profile_record RECORD;
BEGIN
    -- Générer un nouvel ID
    log_id := gen_random_uuid();
    
    -- Récupérer les informations du profil
    SELECT display_name, email INTO profile_record
    FROM public.profiles 
    WHERE id = p_user_id;
    
    -- Insérer le log
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
        user_email,
        success
    ) VALUES (
        log_id,
        'user_action'::text,
        COALESCE(p_category, 'auth')::text,
        p_user_id,
        COALESCE(p_action, 'login')::text,
        'Connexion utilisateur'::text,
        p_description::text,
        p_description::text,
        p_description::text,
        p_metadata,
        NOW(),
        COALESCE(profile_record.display_name, 'Utilisateur inconnu')::text,
        COALESCE(profile_record.email, 'email@inconnu.com')::text,
        true
    );
    
    RETURN log_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, logger l'erreur et retourner un UUID
        INSERT INTO public.activity_logs (
            id, event_type, event_category, action, title, description, 
            created_at, success, error_message
        ) VALUES (
            gen_random_uuid(), 'error'::text, 'system'::text, 'log_error'::text, 
            'Erreur log_user_login'::text, SQLERRM::text, NOW(), false, SQLERRM::text
        );
        RETURN gen_random_uuid();
END;
$$;

-- 2. Fonction log_comprehensive_activity avec types explicites
CREATE OR REPLACE FUNCTION public.log_comprehensive_activity(
    p_user_id UUID,
    p_action TEXT,
    p_category TEXT,
    p_related_id UUID,
    p_severity TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    log_id UUID;
    profile_record RECORD;
BEGIN
    -- Générer un nouvel ID
    log_id := gen_random_uuid();
    
    -- Récupérer les informations du profil si user_id fourni
    IF p_user_id IS NOT NULL THEN
        SELECT display_name, email INTO profile_record
        FROM public.profiles 
        WHERE id = p_user_id;
    END IF;
    
    -- Insérer le log
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
        user_email,
        success
    ) VALUES (
        log_id,
        'comprehensive_activity'::text,
        COALESCE(p_category, 'system')::text,
        COALESCE(p_severity, 'info')::text,
        p_user_id,
        COALESCE(p_action, 'unknown')::text,
        p_related_id,
        COALESCE(p_action, 'Activity Log')::text,
        p_description::text,
        p_description::text,
        p_description::text,
        p_metadata,
        NOW(),
        COALESCE(profile_record.display_name, 'Système')::text,
        COALESCE(profile_record.email, 'system@faildaily.com')::text,
        true
    );
    
    RETURN log_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, logger l'erreur et retourner un UUID
        INSERT INTO public.activity_logs (
            id, event_type, event_category, action, title, description, 
            created_at, success, error_message
        ) VALUES (
            gen_random_uuid(), 'error'::text, 'system'::text, 'log_error'::text, 
            'Erreur log_comprehensive_activity'::text, SQLERRM::text, NOW(), false, SQLERRM::text
        );
        RETURN gen_random_uuid();
END;
$$;

-- 3. Créer une fonction pour forcer PostgREST à recharger le schéma
CREATE OR REPLACE FUNCTION public.reload_schema()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Cette fonction force PostgREST à recharger le cache du schéma
    NOTIFY pgrst, 'reload schema';
    RETURN 'Schema reload signal sent';
END;
$$;

-- 4. Accorder toutes les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.log_user_login(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.log_comprehensive_activity(UUID, TEXT, TEXT, UUID, TEXT, TEXT, JSONB) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.reload_schema() TO authenticated, anon, service_role;

-- 5. Forcer PostgREST à recharger le schéma
SELECT public.reload_schema();

-- 6. Test final des fonctions
SELECT public.log_user_login(
    'f211d624-55b8-4aa2-a77d-f8e425fc1513'::uuid,
    'test_login'::text,
    'auth'::text,
    'Test après reset DB'::text,
    '{"reset": true, "timestamp": "2025-08-15"}'::jsonb
) as test_login_result;

SELECT public.log_comprehensive_activity(
    'f211d624-55b8-4aa2-a77d-f8e425fc1513'::uuid,
    'test_comprehensive'::text,
    'profile'::text,
    'f211d624-55b8-4aa2-a77d-f8e425fc1513'::uuid,
    'info'::text,
    'Test activité complète après reset DB'::text,
    '{"reset": true, "comprehensive": true, "timestamp": "2025-08-15"}'::jsonb
) as test_comprehensive_result;

-- 7. Vérifier que les fonctions sont bien créées
SELECT 
    routine_name as "Nom de la fonction",
    routine_type as "Type",
    data_type as "Type de retour"
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('log_user_login', 'log_comprehensive_activity')
ORDER BY routine_name;

-- 8. Message de succès
SELECT 'Fonctions de logging créées avec succès après reset DB!' as status;
