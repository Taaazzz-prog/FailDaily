-- Création de la table pour capturer TOUS les événements importants
CREATE TABLE IF NOT EXISTS activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL, -- 'account_created', 'user_login', 'fail_created', 'reaction_added', etc.
    user_id uuid REFERENCES profiles(id),
    target_id uuid, -- ID de l'objet affecté (fail_id, reaction_id, etc.)
    message text NOT NULL,
    details jsonb, -- Métadonnées supplémentaires
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_activity_logs_event_type ON activity_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy pour les admins seulement
CREATE POLICY "Admin can view all activity logs" ON activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Fonction pour enregistrer automatiquement les événements importants
CREATE OR REPLACE FUNCTION log_activity(
    p_event_type text,
    p_user_id uuid DEFAULT NULL,
    p_target_id uuid DEFAULT NULL,
    p_message text DEFAULT NULL,
    p_details jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    log_id uuid;
BEGIN
    INSERT INTO activity_logs (event_type, user_id, target_id, message, details)
    VALUES (p_event_type, p_user_id, p_target_id, p_message, p_details)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour capturer les créations de comptes
CREATE OR REPLACE FUNCTION trigger_log_profile_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_activity(
        'account_created',
        NEW.id,
        NULL,
        'Nouveau compte créé: ' || COALESCE(NEW.display_name, NEW.username, NEW.email),
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

-- Trigger pour capturer les créations de fails
CREATE OR REPLACE FUNCTION trigger_log_fail_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_activity(
        'fail_created',
        NEW.user_id,
        NEW.id,
        'Nouveau fail créé: ' || NEW.title,
        jsonb_build_object(
            'title', NEW.title,
            'anonymous', NEW.anonymous,
            'category', NEW.category
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour capturer les réactions
CREATE OR REPLACE FUNCTION trigger_log_reaction_added()
RETURNS TRIGGER AS $$
DECLARE
    fail_title text;
BEGIN
    -- Récupérer le titre du fail
    SELECT title INTO fail_title FROM fails WHERE id = NEW.fail_id;
    
    PERFORM log_activity(
        'reaction_added',
        NEW.user_id,
        NEW.id,
        'Réaction "' || NEW.reaction_type || '" ajoutée au fail: ' || COALESCE(fail_title, 'Fail inconnu'),
        jsonb_build_object(
            'reaction_type', NEW.reaction_type,
            'fail_id', NEW.fail_id,
            'fail_title', fail_title
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer les triggers
DROP TRIGGER IF EXISTS trigger_profile_created ON profiles;
CREATE TRIGGER trigger_profile_created
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_log_profile_created();

DROP TRIGGER IF EXISTS trigger_fail_created ON fails;
CREATE TRIGGER trigger_fail_created
    AFTER INSERT ON fails
    FOR EACH ROW EXECUTE FUNCTION trigger_log_fail_created();

DROP TRIGGER IF EXISTS trigger_reaction_added ON reactions;
CREATE TRIGGER trigger_reaction_added
    AFTER INSERT ON reactions
    FOR EACH ROW EXECUTE FUNCTION trigger_log_reaction_added();

-- Insérer quelques logs de test pour les événements récents
INSERT INTO activity_logs (event_type, message, details, created_at) VALUES
('system_startup', 'Système de logs activé', '{"version": "1.0"}', NOW()),
('admin_action', 'Panel admin accédé', '{"action": "dashboard_view"}', NOW() - interval '5 minutes');

-- Vérification
SELECT 'Logs system initialized successfully' as status;
SELECT COUNT(*) as total_logs FROM activity_logs;
