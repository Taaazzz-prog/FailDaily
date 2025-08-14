-- Script ADDITIONNEL pour ajouter les fonctionnalités manquantes
-- PAS DE RESET - Juste des ajouts !

-- Vérifier que activity_logs existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
        RAISE EXCEPTION 'Table activity_logs non trouvée ! Exécutez d''abord create_activity_logs.sql';
    END IF;
END $$;

-- Fonction pour récupérer les logs par type avec les vraies données
CREATE OR REPLACE FUNCTION get_activity_logs_by_type(
    log_type text,
    period_hours integer DEFAULT NULL,
    max_limit integer DEFAULT 50
)
RETURNS TABLE (
    id uuid,
    log_timestamp timestamptz,
    level text,
    category text,
    message text,
    user_id uuid,
    user_name text,
    user_email text,
    details jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.created_at as log_timestamp,
        CASE 
            WHEN al.event_type LIKE '%error%' THEN 'error'
            WHEN al.event_type LIKE '%warning%' THEN 'warning'
            ELSE 'info'
        END as level,
        CASE al.event_type
            WHEN 'account_created' THEN 'Comptes'
            WHEN 'fail_created' THEN 'Fails'
            WHEN 'reaction_added' THEN 'Réactions'
            WHEN 'user_login' THEN 'Connexions'
            WHEN 'admin_action' THEN 'Admin'
            ELSE 'Système'
        END as category,
        al.message,
        al.user_id,
        COALESCE(p.display_name, p.username) as user_name,
        p.email as user_email,
        al.details
    FROM activity_logs al
    LEFT JOIN profiles p ON al.user_id = p.id
    WHERE 
        (log_type = 'all' OR 
         (log_type = 'connexions' AND al.event_type IN ('user_login', 'user_logout', 'login_failed')) OR
         (log_type = 'fails' AND al.event_type IN ('fail_created', 'fail_updated', 'fail_deleted')) OR
         (log_type = 'reactions' AND al.event_type = 'reaction_added') OR
         (log_type = 'erreurs' AND al.event_type LIKE '%error%') OR
         (log_type = 'admin' AND al.event_type LIKE 'admin_%') OR
         (log_type = 'securite' AND al.event_type IN ('login_failed', 'suspicious_activity')) OR
         (log_type = 'performances' AND al.event_type LIKE '%slow%'))
        AND (period_hours IS NULL OR al.created_at >= NOW() - (period_hours || ' hours')::interval)
    ORDER BY al.created_at DESC
    LIMIT max_limit;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour enregistrer les connexions (à appeler depuis l'app)
CREATE OR REPLACE FUNCTION log_user_login(p_user_id uuid, p_ip text DEFAULT NULL, p_user_agent text DEFAULT NULL)
RETURNS uuid AS $$
DECLARE
    user_name text;
    log_id uuid;
BEGIN
    SELECT COALESCE(display_name, username, email) INTO user_name 
    FROM profiles WHERE id = p_user_id;
    
    INSERT INTO activity_logs (event_type, user_id, message, details, ip_address, user_agent)
    VALUES (
        'user_login',
        p_user_id,
        'Connexion utilisateur: ' || COALESCE(user_name, 'Utilisateur inconnu'),
        jsonb_build_object(
            'user_name', user_name,
            'login_time', NOW()
        ),
        p_ip,
        p_user_agent
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Table pour les actions utilisateur avancées (suppression, modification de compte)
CREATE TABLE IF NOT EXISTS user_management_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid REFERENCES profiles(id) NOT NULL,
    target_user_id uuid REFERENCES profiles(id) NOT NULL,
    action_type text NOT NULL, -- 'delete_reaction', 'delete_fail', 'modify_account', 'change_role'
    target_object_id uuid, -- ID de l'objet affecté
    old_values jsonb,
    new_values jsonb,
    reason text,
    created_at timestamptz DEFAULT NOW()
);

-- Index pour les logs de gestion utilisateur
CREATE INDEX IF NOT EXISTS idx_user_mgmt_logs_admin ON user_management_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_user_mgmt_logs_target ON user_management_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_mgmt_logs_created_at ON user_management_logs(created_at DESC);

-- RLS pour user_management_logs
ALTER TABLE user_management_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view user management logs" ON user_management_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Fonction pour enregistrer les actions de gestion d'utilisateur
CREATE OR REPLACE FUNCTION log_user_management_action(
    p_admin_id uuid,
    p_target_user_id uuid,
    p_action_type text,
    p_target_object_id uuid DEFAULT NULL,
    p_old_values jsonb DEFAULT NULL,
    p_new_values jsonb DEFAULT NULL,
    p_reason text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    log_id uuid;
    admin_name text;
    target_name text;
BEGIN
    SELECT COALESCE(display_name, username) INTO admin_name FROM profiles WHERE id = p_admin_id;
    SELECT COALESCE(display_name, username) INTO target_name FROM profiles WHERE id = p_target_user_id;
    
    INSERT INTO user_management_logs 
    (admin_id, target_user_id, action_type, target_object_id, old_values, new_values, reason)
    VALUES (p_admin_id, p_target_user_id, p_action_type, p_target_object_id, p_old_values, p_new_values, p_reason)
    RETURNING id INTO log_id;
    
    -- Aussi ajouter dans activity_logs pour visibilité globale
    PERFORM log_activity(
        'admin_user_management',
        p_admin_id,
        p_target_user_id,
        admin_name || ' a effectué l''action "' || p_action_type || '" sur ' || target_name,
        jsonb_build_object(
            'action_type', p_action_type,
            'target_user', target_name,
            'reason', p_reason
        )
    );
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Insérer un log pour tester que le système fonctionne
INSERT INTO activity_logs (event_type, message, details) VALUES 
('system_upgrade', 'Système de logs avancé installé', '{"features": ["real_logs", "user_management"]}');

-- Vérification finale
SELECT 'Advanced logging system ready!' as status;
SELECT COUNT(*) as total_activity_logs FROM activity_logs;
SELECT 
    event_type,
    COUNT(*) as count
FROM activity_logs 
GROUP BY event_type 
ORDER BY count DESC;
