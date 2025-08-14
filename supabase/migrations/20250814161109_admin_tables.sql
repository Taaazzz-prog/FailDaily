-- ===== TABLES POUR LE PANNEAU D'ADMINISTRATION =====

-- Table pour les logs système
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    level TEXT CHECK (level IN ('info', 'warning', 'error', 'debug')) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les logs système
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

-- Table pour les logs de réactions détaillés
CREATE TABLE IF NOT EXISTS reaction_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_email TEXT,
    user_name TEXT,
    fail_id UUID NOT NULL,
    fail_title TEXT,
    fail_author_name TEXT,
    reaction_type TEXT NOT NULL,
    points_awarded INTEGER DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les logs de réactions
CREATE INDEX IF NOT EXISTS idx_reaction_logs_timestamp ON reaction_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reaction_logs_user_id ON reaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reaction_logs_fail_id ON reaction_logs(fail_id);
CREATE INDEX IF NOT EXISTS idx_reaction_logs_reaction_type ON reaction_logs(reaction_type);

-- Table pour les activités utilisateurs
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_email TEXT,
    user_name TEXT,
    action TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    fail_id UUID,
    reaction_type TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les activités utilisateurs
CREATE INDEX IF NOT EXISTS idx_user_activities_timestamp ON user_activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_action ON user_activities(action);

-- Table pour la configuration de l'application
CREATE TABLE IF NOT EXISTS app_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer la configuration par défaut des points
INSERT INTO app_config (key, value, description) 
VALUES (
    'points_config',
    '{
        "createFailPoints": 10,
        "courageReactionPoints": 2,
        "laughReactionPoints": 1,
        "empathyReactionPoints": 2,
        "supportReactionPoints": 2,
        "dailyBonusPoints": 5
    }'::jsonb,
    'Configuration des points attribués pour différentes actions'
) ON CONFLICT (key) DO NOTHING;

-- ===== FONCTIONS RPC POUR L'ANALYSE DE LA BASE DE DONNÉES =====

-- Fonction pour trouver les réactions orphelines
CREATE OR REPLACE FUNCTION find_orphaned_reactions()
RETURNS TABLE(reaction_id UUID, fail_id UUID, user_id UUID, created_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT r.id, r.fail_id, r.user_id, r.created_at
    FROM reactions r
    LEFT JOIN fails f ON r.fail_id = f.id
    WHERE f.id IS NULL;
$$;

-- Fonction pour trouver les compteurs de réactions incorrects
CREATE OR REPLACE FUNCTION find_invalid_reaction_counts()
RETURNS TABLE(
    fail_id UUID, 
    fail_title TEXT,
    stored_courage INTEGER,
    actual_courage BIGINT,
    stored_laugh INTEGER,
    actual_laugh BIGINT,
    stored_empathy INTEGER,
    actual_empathy BIGINT,
    stored_support INTEGER,
    actual_support BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH reaction_counts AS (
        SELECT 
            f.id,
            f.title,
            COALESCE((f.reactions->>'courage')::integer, 0) as stored_courage,
            COALESCE((f.reactions->>'laugh')::integer, 0) as stored_laugh,
            COALESCE((f.reactions->>'empathy')::integer, 0) as stored_empathy,
            COALESCE((f.reactions->>'support')::integer, 0) as stored_support,
            COUNT(CASE WHEN r.reaction_type = 'courage' THEN 1 END) as actual_courage,
            COUNT(CASE WHEN r.reaction_type = 'laugh' THEN 1 END) as actual_laugh,
            COUNT(CASE WHEN r.reaction_type = 'empathy' THEN 1 END) as actual_empathy,
            COUNT(CASE WHEN r.reaction_type = 'support' THEN 1 END) as actual_support
        FROM fails f
        LEFT JOIN reactions r ON f.id = r.fail_id
        GROUP BY f.id, f.title, f.reactions
    )
    SELECT 
        id as fail_id,
        title as fail_title,
        stored_courage,
        actual_courage,
        stored_laugh,
        actual_laugh,
        stored_empathy,
        actual_empathy,
        stored_support,
        actual_support
    FROM reaction_counts
    WHERE stored_courage != actual_courage 
       OR stored_laugh != actual_laugh
       OR stored_empathy != actual_empathy
       OR stored_support != actual_support;
$$;

-- Fonction pour obtenir les statistiques globales
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE(
    total_users BIGINT,
    total_fails BIGINT,
    total_reactions BIGINT,
    total_system_logs BIGINT,
    total_reaction_logs BIGINT,
    average_reactions_per_fail NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        (SELECT COUNT(*) FROM profiles) as total_users,
        (SELECT COUNT(*) FROM fails) as total_fails,
        (SELECT COUNT(*) FROM reactions) as total_reactions,
        (SELECT COUNT(*) FROM system_logs) as total_system_logs,
        (SELECT COUNT(*) FROM reaction_logs) as total_reaction_logs,
        CASE 
            WHEN (SELECT COUNT(*) FROM fails) > 0 
            THEN (SELECT COUNT(*)::NUMERIC FROM reactions) / (SELECT COUNT(*) FROM fails)
            ELSE 0
        END as average_reactions_per_fail;
$$;

-- ===== POLITIQUES DE SÉCURITÉ (RLS) =====

-- Activer RLS sur les nouvelles tables
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Politiques pour system_logs (admin only)
CREATE POLICY "Admins can read system_logs" ON system_logs 
    FOR SELECT USING (true);

CREATE POLICY "System can insert system_logs" ON system_logs 
    FOR INSERT WITH CHECK (true);

-- Politiques pour reaction_logs (admin only)
CREATE POLICY "Admins can read reaction_logs" ON reaction_logs 
    FOR SELECT USING (true);

CREATE POLICY "System can insert reaction_logs" ON reaction_logs 
    FOR INSERT WITH CHECK (true);

-- Politiques pour user_activities (admin only)
CREATE POLICY "Admins can read user_activities" ON user_activities 
    FOR SELECT USING (true);

CREATE POLICY "System can insert user_activities" ON user_activities 
    FOR INSERT WITH CHECK (true);

-- Politiques pour app_config (admin only)
CREATE POLICY "Admins can manage app_config" ON app_config 
    FOR ALL USING (true);

-- ===== TRIGGERS POUR LOGGING AUTOMATIQUE =====

-- Function pour logger les créations de fails
CREATE OR REPLACE FUNCTION log_fail_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_activities (user_id, user_email, user_name, action, details, fail_id)
    SELECT 
        NEW.user_id,
        p.email,
        p.display_name,
        'create_fail',
        jsonb_build_object(
            'fail_id', NEW.id,
            'fail_title', NEW.title,
            'fail_category', NEW.category,
            'is_public', NEW.is_public
        ),
        NEW.id
    FROM profiles p WHERE p.id = NEW.user_id;
    
    RETURN NEW;
END;
$$;

-- Trigger pour logger les créations de fails
DROP TRIGGER IF EXISTS trigger_log_fail_creation ON fails;
CREATE TRIGGER trigger_log_fail_creation
    AFTER INSERT ON fails
    FOR EACH ROW
    EXECUTE FUNCTION log_fail_creation();

-- Function pour logger les réactions
CREATE OR REPLACE FUNCTION log_reaction_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_activities (user_id, user_email, user_name, action, details, fail_id, reaction_type)
    SELECT 
        NEW.user_id,
        p.email,
        p.display_name,
        'add_reaction',
        jsonb_build_object(
            'reaction_id', NEW.id,
            'reaction_type', NEW.reaction_type,
            'fail_id', NEW.fail_id
        ),
        NEW.fail_id,
        NEW.reaction_type
    FROM profiles p WHERE p.id = NEW.user_id;
    
    -- Aussi ajouter à reaction_logs
    INSERT INTO reaction_logs (
        user_id, user_email, user_name, fail_id, fail_title, 
        fail_author_name, reaction_type, points_awarded
    )
    SELECT 
        NEW.user_id,
        p.email,
        p.display_name,
        NEW.fail_id,
        f.title,
        author.display_name,
        NEW.reaction_type,
        CASE NEW.reaction_type
            WHEN 'courage' THEN 2
            WHEN 'empathy' THEN 2
            WHEN 'support' THEN 2
            WHEN 'laugh' THEN 1
            ELSE 1
        END
    FROM profiles p
    JOIN fails f ON f.id = NEW.fail_id
    JOIN profiles author ON author.id = f.user_id
    WHERE p.id = NEW.user_id;
    
    RETURN NEW;
END;
$$;

-- Trigger pour logger les réactions
DROP TRIGGER IF EXISTS trigger_log_reaction_creation ON reactions;
CREATE TRIGGER trigger_log_reaction_creation
    AFTER INSERT ON reactions
    FOR EACH ROW
    EXECUTE FUNCTION log_reaction_creation();

-- ===== FONCTION POUR NETTOYER LES ANCIENS LOGS =====

CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS TABLE(
    deleted_system_logs BIGINT,
    deleted_reaction_logs BIGINT,
    deleted_user_activities BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cutoff_date TIMESTAMPTZ;
    system_deleted BIGINT;
    reaction_deleted BIGINT;
    activity_deleted BIGINT;
BEGIN
    cutoff_date := NOW() - (days_to_keep || ' days')::INTERVAL;
    
    -- Supprimer les anciens logs système
    WITH deleted AS (
        DELETE FROM system_logs 
        WHERE created_at < cutoff_date 
        RETURNING id
    )
    SELECT COUNT(*) INTO system_deleted FROM deleted;
    
    -- Supprimer les anciens logs de réactions
    WITH deleted AS (
        DELETE FROM reaction_logs 
        WHERE created_at < cutoff_date 
        RETURNING id
    )
    SELECT COUNT(*) INTO reaction_deleted FROM deleted;
    
    -- Supprimer les anciennes activités utilisateurs
    WITH deleted AS (
        DELETE FROM user_activities 
        WHERE created_at < cutoff_date 
        RETURNING id
    )
    SELECT COUNT(*) INTO activity_deleted FROM deleted;
    
    RETURN QUERY SELECT system_deleted, reaction_deleted, activity_deleted;
END;
$$;
