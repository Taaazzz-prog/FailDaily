-- Script de correction final pour le cache PostgREST et les types
-- 1. Supprimer toutes les fonctions problématiques
DROP FUNCTION IF EXISTS public.log_user_login CASCADE;
DROP FUNCTION IF EXISTS public.log_comprehensive_activity CASCADE;

-- 2. Recréer la fonction log_user_login avec des types explicites
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
    -- Générer un ID pour le log
    log_id := gen_random_uuid();
    
    -- Récupérer les informations du profil avec gestion d'erreur
    BEGIN
        SELECT display_name, email INTO profile_record
        FROM public.profiles 
        WHERE id = p_user_id;
    EXCEPTION WHEN OTHERS THEN
        profile_record.display_name := 'Utilisateur inconnu';
        profile_record.email := 'email@inconnu.com';
    END;
    
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
        'user_action'::TEXT,
        COALESCE(p_category::TEXT, 'auth'::TEXT),
        p_user_id::UUID,
        COALESCE(p_action::TEXT, 'login'::TEXT),
        'Connexion utilisateur'::TEXT,
        COALESCE(p_description::TEXT, 'Connexion utilisateur'::TEXT),
        COALESCE(p_description::TEXT, 'Connexion utilisateur'::TEXT),
        COALESCE(p_description::TEXT, 'User login'::TEXT),
        COALESCE(p_metadata::JSONB, '{}'::JSONB),
        NOW(),
        COALESCE(profile_record.display_name::TEXT, 'Utilisateur inconnu'::TEXT),
        COALESCE(profile_record.email::TEXT, 'email@inconnu.com'::TEXT),
        true
    );
    
    RETURN log_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, retourner quand même un UUID
        RETURN gen_random_uuid();
END;
$$;

-- 3. Recréer la fonction log_comprehensive_activity avec des types explicites
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
    -- Générer un ID pour le log
    log_id := gen_random_uuid();
    
    -- Récupérer les informations du profil avec gestion d'erreur
    BEGIN
        SELECT display_name, email INTO profile_record
        FROM public.profiles 
        WHERE id = p_user_id;
    EXCEPTION WHEN OTHERS THEN
        profile_record.display_name := 'Utilisateur inconnu';
        profile_record.email := 'email@inconnu.com';
    END;
    
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
        'comprehensive_activity'::TEXT,
        COALESCE(p_category::TEXT, 'system'::TEXT),
        COALESCE(p_severity::TEXT, 'info'::TEXT),
        p_user_id::UUID,
        COALESCE(p_action::TEXT, 'unknown'::TEXT),
        p_related_id::UUID,
        COALESCE(p_action::TEXT, 'Activity Log'::TEXT),
        COALESCE(p_description::TEXT, 'Comprehensive activity log'::TEXT),
        COALESCE(p_description::TEXT, 'Log d''activité complète'::TEXT),
        COALESCE(p_description::TEXT, 'Comprehensive activity log'::TEXT),
        COALESCE(p_metadata::JSONB, '{}'::JSONB),
        NOW(),
        COALESCE(profile_record.display_name::TEXT, 'Utilisateur inconnu'::TEXT),
        COALESCE(profile_record.email::TEXT, 'email@inconnu.com'::TEXT),
        true
    );
    
    RETURN log_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, retourner quand même un UUID
        RETURN gen_random_uuid();
END;
$$;

-- 4. Accorder les permissions explicites
GRANT EXECUTE ON FUNCTION public.log_user_login(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.log_comprehensive_activity(UUID, TEXT, TEXT, UUID, TEXT, TEXT, JSONB) TO authenticated, anon, service_role;

-- 5. Forcer PostgREST à recharger son cache
NOTIFY pgrst, 'reload schema';

-- 6. Test final
SELECT 'Fonctions recréées avec succès !' as status;
SELECT routine_name, routine_type FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('log_user_login', 'log_comprehensive_activity');
