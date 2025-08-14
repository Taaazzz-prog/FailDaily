-- ========================================
-- SYSTÈME DE LOGS ULTRA-COMPLET FAILDAILY
-- ========================================
-- Ce système capture TOUTES les actions utilisateurs depuis la création du compte
-- avec une granularité parfaite pour le debugging et l'audit

-- 1. TABLE PRINCIPALE DES LOGS D'ACTIVITÉ (version étendue)
DROP TABLE IF EXISTS activity_logs CASCADE;
CREATE TABLE activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informations de base
    event_type text NOT NULL,
    event_category text NOT NULL, -- 'auth', 'profile', 'fail', 'reaction', 'badge', 'navigation', 'admin', 'system'
    event_level text NOT NULL DEFAULT 'info', -- 'debug', 'info', 'warning', 'error', 'critical'
    
    -- Contexte utilisateur
    user_id uuid REFERENCES profiles(id),
    user_email text,
    user_display_name text,
    user_role text,
    
    -- Détails de l'événement
    action text NOT NULL, -- Action spécifique (ex: 'create_account', 'login', 'add_reaction')
    resource_type text, -- Type de ressource affectée ('profile', 'fail', 'reaction', etc.)
    resource_id uuid, -- ID de la ressource
    target_user_id uuid REFERENCES profiles(id), -- Pour les actions sur d'autres utilisateurs
    
    -- Messages et données
    title text NOT NULL, -- Titre court et descriptif
    description text, -- Description détaillée
    message_fr text, -- Message en français pour l'interface
    message_en text, -- Message en anglais pour l'interface
    
    -- Métadonnées techniques
    payload jsonb, -- Données complètes de l'action
    old_values jsonb, -- Valeurs avant modification
    new_values jsonb, -- Nouvelles valeurs
    diff_values jsonb, -- Différences calculées
    
    -- Contexte technique
    ip_address inet,
    user_agent text,
    browser_info jsonb,
    device_info jsonb,
    session_id text,
    request_id text,
    
    -- Métriques de performance
    execution_time_ms integer,
    memory_usage_mb decimal,
    api_endpoint text,
    response_status integer,
    
    -- Géolocalisation (optionnel)
    country text,
    city text,
    coordinates point,
    
    -- Audit et traçabilité
    correlation_id uuid, -- Pour grouper des actions liées
    parent_event_id uuid REFERENCES activity_logs(id), -- Pour les actions en cascade
    success boolean NOT NULL DEFAULT true,
    error_code text,
    error_message text,
    stack_trace text,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz,
    
    -- Métadonnées système
    app_version text,
    environment text DEFAULT 'production', -- 'development', 'staging', 'production'
    
    -- Index et contraintes
    CONSTRAINT valid_event_level CHECK (event_level IN ('debug', 'info', 'warning', 'error', 'critical')),
    CONSTRAINT valid_event_category CHECK (event_category IN ('auth', 'profile', 'fail', 'reaction', 'badge', 'navigation', 'admin', 'system', 'security'))
);

-- Index optimisés pour les requêtes fréquentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_event_type ON activity_logs(event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_event_category ON activity_logs(event_category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_resource_type ON activity_logs(resource_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_correlation_id ON activity_logs(correlation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_success_error ON activity_logs(success, error_code) WHERE success = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_search ON activity_logs USING gin(to_tsvector('french', title || ' ' || description));

-- 2. TABLE DES SESSIONS UTILISATEUR
CREATE TABLE IF NOT EXISTS user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    session_start timestamptz NOT NULL DEFAULT now(),
    session_end timestamptz,
    duration_minutes integer,
    ip_address inet,
    user_agent text,
    device_fingerprint text,
    is_mobile boolean,
    browser text,
    os text,
    country text,
    city text,
    activities_count integer DEFAULT 0,
    last_activity timestamptz DEFAULT now(),
    logout_type text -- 'manual', 'timeout', 'forced', 'system'
);

-- 3. TABLE DES MÉTRIQUES D'UTILISATION
CREATE TABLE IF NOT EXISTS usage_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    metric_date date NOT NULL DEFAULT current_date,
    
    -- Compteurs d'actions
    logins_count integer DEFAULT 0,
    fails_created integer DEFAULT 0,
    fails_viewed integer DEFAULT 0,
    reactions_given integer DEFAULT 0,
    reactions_received integer DEFAULT 0,
    profile_updates integer DEFAULT 0,
    badges_earned integer DEFAULT 0,
    
    -- Métriques d'engagement
    session_duration_minutes integer DEFAULT 0,
    pages_visited text[],
    features_used text[],
    time_spent_per_section jsonb,
    
    -- Qualité de l'expérience
    errors_encountered integer DEFAULT 0,
    slow_requests integer DEFAULT 0,
    successful_actions integer DEFAULT 0,
    
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    UNIQUE(user_id, metric_date)
);

-- 4. FONCTION UNIVERSELLE DE LOGGING
CREATE OR REPLACE FUNCTION log_comprehensive_activity(
    p_event_type text,
    p_event_category text,
    p_action text,
    p_title text,
    p_user_id uuid DEFAULT NULL,
    p_resource_type text DEFAULT NULL,
    p_resource_id uuid DEFAULT NULL,
    p_target_user_id uuid DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_payload jsonb DEFAULT NULL,
    p_old_values jsonb DEFAULT NULL,
    p_new_values jsonb DEFAULT NULL,
    p_ip_address text DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_session_id text DEFAULT NULL,
    p_success boolean DEFAULT true,
    p_error_message text DEFAULT NULL,
    p_execution_time_ms integer DEFAULT NULL,
    p_correlation_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    log_id uuid;
    user_info record;
    diff_json jsonb;
BEGIN
    -- Récupérer les informations utilisateur si user_id fourni
    IF p_user_id IS NOT NULL THEN
        SELECT 
            email, 
            COALESCE(display_name, username) as display_name, 
            role 
        INTO user_info 
        FROM profiles 
        WHERE id = p_user_id;
    END IF;
    
    -- Calculer les différences si old_values et new_values fournis
    IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
        diff_json := jsonb_build_object();
        FOR key IN SELECT * FROM jsonb_object_keys(p_new_values) LOOP
            IF (p_old_values->key) IS DISTINCT FROM (p_new_values->key) THEN
                diff_json := diff_json || jsonb_build_object(
                    key, jsonb_build_object(
                        'from', p_old_values->key,
                        'to', p_new_values->key
                    )
                );
            END IF;
        END LOOP;
    END IF;
    
    -- Insérer le log
    INSERT INTO activity_logs (
        event_type, event_category, action, title, description,
        user_id, user_email, user_display_name, user_role,
        resource_type, resource_id, target_user_id,
        payload, old_values, new_values, diff_values,
        ip_address, user_agent, session_id,
        success, error_message, execution_time_ms,
        correlation_id,
        message_fr -- On peut générer automatiquement selon le type
    )
    VALUES (
        p_event_type, p_event_category, p_action, p_title, p_description,
        p_user_id, user_info.email, user_info.display_name, user_info.role,
        p_resource_type, p_resource_id, p_target_user_id,
        p_payload, p_old_values, p_new_values, diff_json,
        p_ip_address::inet, p_user_agent, p_session_id,
        p_success, p_error_message, p_execution_time_ms,
        COALESCE(p_correlation_id, gen_random_uuid()),
        CASE p_action
            WHEN 'create_account' THEN 'Nouveau compte créé'
            WHEN 'login' THEN 'Connexion réussie'
            WHEN 'logout' THEN 'Déconnexion'
            WHEN 'create_fail' THEN 'Nouveau fail créé'
            WHEN 'add_reaction' THEN 'Réaction ajoutée'
            WHEN 'update_profile' THEN 'Profil mis à jour'
            WHEN 'earn_badge' THEN 'Badge obtenu'
            ELSE p_title
        END
    )
    RETURNING id INTO log_id;
    
    -- Mettre à jour les métriques d'utilisation
    PERFORM update_usage_metrics(p_user_id, p_action);
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- 5. FONCTION DE MISE À JOUR DES MÉTRIQUES
CREATE OR REPLACE FUNCTION update_usage_metrics(
    p_user_id uuid,
    p_action text
)
RETURNS void AS $$
BEGIN
    IF p_user_id IS NULL THEN RETURN; END IF;
    
    INSERT INTO usage_metrics (user_id, metric_date)
    VALUES (p_user_id, current_date)
    ON CONFLICT (user_id, metric_date) DO NOTHING;
    
    UPDATE usage_metrics 
    SET 
        updated_at = now(),
        logins_count = CASE WHEN p_action = 'login' THEN logins_count + 1 ELSE logins_count END,
        fails_created = CASE WHEN p_action = 'create_fail' THEN fails_created + 1 ELSE fails_created END,
        fails_viewed = CASE WHEN p_action = 'view_fail' THEN fails_viewed + 1 ELSE fails_viewed END,
        reactions_given = CASE WHEN p_action = 'add_reaction' THEN reactions_given + 1 ELSE reactions_given END,
        profile_updates = CASE WHEN p_action = 'update_profile' THEN profile_updates + 1 ELSE profile_updates END,
        badges_earned = CASE WHEN p_action = 'earn_badge' THEN badges_earned + 1 ELSE badges_earned END,
        successful_actions = CASE WHEN p_action NOT LIKE '%error%' THEN successful_actions + 1 ELSE successful_actions END,
        errors_encountered = CASE WHEN p_action LIKE '%error%' THEN errors_encountered + 1 ELSE errors_encountered END
    WHERE user_id = p_user_id AND metric_date = current_date;
END;
$$ LANGUAGE plpgsql;

-- 6. TRIGGERS AUTOMATIQUES POUR TOUS LES ÉVÉNEMENTS

-- Trigger pour création de profil
CREATE OR REPLACE FUNCTION trigger_comprehensive_profile_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_comprehensive_activity(
        'profile_created',
        'auth',
        'create_account',
        'Nouveau compte utilisateur créé',
        NEW.id,
        'profile',
        NEW.id,
        NULL,
        'Compte créé avec email: ' || NEW.email,
        jsonb_build_object(
            'email', NEW.email,
            'username', NEW.username,
            'display_name', NEW.display_name,
            'created_at', NEW.created_at
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour création de fail
CREATE OR REPLACE FUNCTION trigger_comprehensive_fail_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_comprehensive_activity(
        'fail_created',
        'fail',
        'create_fail',
        'Nouveau fail créé: ' || NEW.title,
        NEW.user_id,
        'fail',
        NEW.id,
        NULL,
        'Fail créé dans la catégorie: ' || COALESCE(NEW.category, 'Non catégorisé'),
        jsonb_build_object(
            'title', NEW.title,
            'anonymous', NEW.anonymous,
            'category', NEW.category,
            'created_at', NEW.created_at
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour ajout de réaction
CREATE OR REPLACE FUNCTION trigger_comprehensive_reaction_added()
RETURNS TRIGGER AS $$
DECLARE
    fail_info record;
BEGIN
    -- Récupérer les informations du fail
    SELECT 
        f.title, 
        f.user_id as author_id,
        p.display_name as author_name
    INTO fail_info
    FROM fails f
    LEFT JOIN profiles p ON f.user_id = p.id
    WHERE f.id = NEW.fail_id;
    
    PERFORM log_comprehensive_activity(
        'reaction_added',
        'reaction',
        'add_reaction',
        'Réaction "' || NEW.reaction_type || '" ajoutée',
        NEW.user_id,
        'reaction',
        NEW.id,
        fail_info.author_id,
        'Réaction ajoutée au fail: ' || COALESCE(fail_info.title, 'Fail supprimé'),
        jsonb_build_object(
            'reaction_type', NEW.reaction_type,
            'fail_id', NEW.fail_id,
            'fail_title', fail_info.title,
            'fail_author', fail_info.author_name,
            'created_at', NEW.created_at
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour de profil
CREATE OR REPLACE FUNCTION trigger_comprehensive_profile_updated()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_comprehensive_activity(
        'profile_updated',
        'profile',
        'update_profile',
        'Profil utilisateur mis à jour',
        NEW.id,
        'profile',
        NEW.id,
        NULL,
        'Modifications du profil utilisateur',
        NULL,
        row_to_json(OLD),
        row_to_json(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. APPLICATION DES TRIGGERS

-- Supprimer les anciens triggers
DROP TRIGGER IF EXISTS trigger_profile_created ON profiles;
DROP TRIGGER IF EXISTS trigger_fail_created ON fails;
DROP TRIGGER IF EXISTS trigger_reaction_added ON reactions;
DROP TRIGGER IF EXISTS trigger_profile_updated ON profiles;

-- Créer les nouveaux triggers
CREATE TRIGGER trigger_comprehensive_profile_created
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_comprehensive_profile_created();

CREATE TRIGGER trigger_comprehensive_fail_created
    AFTER INSERT ON fails
    FOR EACH ROW EXECUTE FUNCTION trigger_comprehensive_fail_created();

CREATE TRIGGER trigger_comprehensive_reaction_added
    AFTER INSERT ON reactions
    FOR EACH ROW EXECUTE FUNCTION trigger_comprehensive_reaction_added();

CREATE TRIGGER trigger_comprehensive_profile_updated
    AFTER UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_comprehensive_profile_updated();

-- 8. FONCTIONS DE REQUÊTE AVANCÉES

-- Fonction pour récupérer l'historique complet d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_complete_history(
    p_user_id uuid,
    p_limit integer DEFAULT 100
)
RETURNS TABLE(
    log_id uuid,
    timestamp timestamptz,
    category text,
    action text,
    title text,
    description text,
    resource_type text,
    success boolean,
    execution_time_ms integer,
    details jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.created_at,
        al.event_category,
        al.action,
        al.title,
        al.description,
        al.resource_type,
        al.success,
        al.execution_time_ms,
        al.payload
    FROM activity_logs al
    WHERE al.user_id = p_user_id
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les statistiques d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_activity_stats(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
    stats jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_activities', COUNT(*),
        'successful_activities', COUNT(*) FILTER (WHERE success = true),
        'failed_activities', COUNT(*) FILTER (WHERE success = false),
        'categories', jsonb_object_agg(
            event_category, 
            COUNT(*)
        ),
        'actions_today', COUNT(*) FILTER (WHERE created_at >= current_date),
        'actions_this_week', COUNT(*) FILTER (WHERE created_at >= current_date - interval '7 days'),
        'actions_this_month', COUNT(*) FILTER (WHERE created_at >= current_date - interval '30 days'),
        'last_activity', MAX(created_at),
        'first_activity', MIN(created_at)
    ) INTO stats
    FROM activity_logs
    WHERE user_id = p_user_id;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- 9. POLITIQUES DE SÉCURITÉ (RLS)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Policy pour que les admins voient tout
CREATE POLICY "admin_full_access_logs" ON activity_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy pour que les utilisateurs voient leurs propres logs
CREATE POLICY "user_own_logs" ON activity_logs
    FOR SELECT USING (user_id = auth.uid());

-- Permissions
GRANT ALL ON activity_logs TO authenticated;
GRANT ALL ON user_sessions TO authenticated;
GRANT ALL ON usage_metrics TO authenticated;

-- 10. INSERTION D'UN LOG DE DÉMARRAGE DU SYSTÈME
SELECT log_comprehensive_activity(
    'system_upgrade',
    'system',
    'install_comprehensive_logging',
    'Système de logs ultra-complet installé',
    NULL,
    'system',
    NULL,
    NULL,
    'Installation du système de logging complet avec toutes les fonctionnalités de traçabilité',
    jsonb_build_object(
        'version', '2.0',
        'features', ARRAY['comprehensive_logging', 'user_tracking', 'performance_metrics', 'audit_trail'],
        'tables_created', ARRAY['activity_logs', 'user_sessions', 'usage_metrics']
    )
);

COMMENT ON TABLE activity_logs IS 'Table principale pour tous les logs d''activité avec granularité ultra-fine';
COMMENT ON TABLE user_sessions IS 'Suivi des sessions utilisateur pour l''analyse comportementale';
COMMENT ON TABLE usage_metrics IS 'Métriques d''utilisation agrégées par utilisateur et par jour';
