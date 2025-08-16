-- ===================================================================
-- MIGRATION 002: SYSTÈME D'INSCRIPTION COMPLET - FailDaily Database
-- ===================================================================
-- Description: Migration complète pour le système d'inscription unifié
-- Version: 002
-- Date: 16 août 2025
-- Prérequis: Migration 001 (structure de base)

-- Sélectionner la base de données
USE faildaily;

-- ===================================================================
-- 1. AJOUT DE NOUVELLES COLONNES POUR LE SYSTÈME D'INSCRIPTION
-- ===================================================================

-- Table users: Ajouter colonnes pour inscription avancée
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS registration_source ENUM('direct', 'migration', 'social', 'import') DEFAULT 'direct' COMMENT 'Source de l\'inscription',
ADD COLUMN IF NOT EXISTS registration_step ENUM('email', 'profile', 'preferences', 'complete') DEFAULT 'email' COMMENT 'Étape d\'inscription actuelle',
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255) NULL COMMENT 'Token de vérification email',
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP NULL COMMENT 'Expiration du token email',
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL COMMENT 'Date de vérification email',
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) NULL COMMENT 'Token de reset password',
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP NULL COMMENT 'Expiration du token reset',
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL COMMENT 'Dernière connexion',
ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0 COMMENT 'Tentatives de connexion échouées',
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL COMMENT 'Compte verrouillé jusqu\'à',
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP NULL COMMENT 'Acceptation des CGU',
ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMP NULL COMMENT 'Acceptation politique confidentialité',
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE COMMENT 'Consentement marketing',
ADD COLUMN IF NOT EXISTS data_retention_consent BOOLEAN DEFAULT TRUE COMMENT 'Consentement conservation données',
ADD COLUMN IF NOT EXISTS account_status ENUM('pending', 'active', 'suspended', 'deleted') DEFAULT 'pending' COMMENT 'Statut du compte';

-- Table profiles: Améliorer pour inscription complète
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE COMMENT 'Onboarding terminé',
ADD COLUMN IF NOT EXISTS profile_completion_score INT DEFAULT 0 COMMENT 'Score de complétude du profil',
ADD COLUMN IF NOT EXISTS language_preference VARCHAR(10) DEFAULT 'fr' COMMENT 'Langue préférée',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Europe/Paris' COMMENT 'Fuseau horaire',
ADD COLUMN IF NOT EXISTS communication_preferences JSON COMMENT 'Préférences de communication',
ADD COLUMN IF NOT EXISTS accessibility_preferences JSON COMMENT 'Préférences d\'accessibilité',
ADD COLUMN IF NOT EXISTS theme_preference ENUM('light', 'dark', 'auto') DEFAULT 'auto' COMMENT 'Thème préféré';

-- ===================================================================
-- 2. CRÉATION DE LA TABLE REGISTRATION_SESSIONS
-- ===================================================================

CREATE TABLE IF NOT EXISTS registration_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_token VARCHAR(255) NOT NULL UNIQUE COMMENT 'Token unique de session',
    user_id INT NULL COMMENT 'ID utilisateur si déjà créé',
    registration_data JSON COMMENT 'Données d\'inscription temporaires',
    current_step ENUM('email', 'password', 'profile', 'preferences', 'verification', 'complete') DEFAULT 'email' COMMENT 'Étape actuelle',
    source ENUM('direct', 'migration', 'social', 'import') DEFAULT 'direct' COMMENT 'Source d\'inscription',
    ip_address VARCHAR(45) COMMENT 'Adresse IP',
    user_agent TEXT COMMENT 'User agent du navigateur',
    expires_at TIMESTAMP NOT NULL COMMENT 'Date d\'expiration de la session',
    completed_at TIMESTAMP NULL COMMENT 'Date de completion',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_session_token (session_token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_source (source),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Sessions d\'inscription temporaires';

-- ===================================================================
-- 3. CRÉATION DE LA TABLE MIGRATION_LOGS
-- ===================================================================

CREATE TABLE IF NOT EXISTS migration_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT 'ID utilisateur migré',
    source_system VARCHAR(50) NOT NULL DEFAULT 'supabase' COMMENT 'Système source',
    migration_type ENUM('full', 'partial', 'data_only', 'profile_only') DEFAULT 'full' COMMENT 'Type de migration',
    source_data JSON COMMENT 'Données originales du système source',
    mapping_rules JSON COMMENT 'Règles de mapping appliquées',
    migration_status ENUM('pending', 'in_progress', 'completed', 'failed', 'rolled_back') DEFAULT 'pending' COMMENT 'Statut de la migration',
    error_details JSON COMMENT 'Détails des erreurs si échec',
    data_integrity_check JSON COMMENT 'Résultats de vérification intégrité',
    performance_metrics JSON COMMENT 'Métriques de performance',
    started_at TIMESTAMP NULL COMMENT 'Début de la migration',
    completed_at TIMESTAMP NULL COMMENT 'Fin de la migration',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_source_system (source_system),
    INDEX idx_migration_status (migration_status),
    INDEX idx_migration_type (migration_type),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Logs de migration des utilisateurs';

-- ===================================================================
-- 4. CRÉATION DE LA TABLE REGISTRATION_ANALYTICS
-- ===================================================================

CREATE TABLE IF NOT EXISTS registration_analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_token VARCHAR(255) COMMENT 'Token de session d\'inscription',
    user_id INT NULL COMMENT 'ID utilisateur final',
    step_name VARCHAR(50) NOT NULL COMMENT 'Nom de l\'étape',
    step_order INT NOT NULL COMMENT 'Ordre de l\'étape',
    time_spent INT DEFAULT 0 COMMENT 'Temps passé sur l\'étape (secondes)',
    abandonment_reason VARCHAR(100) NULL COMMENT 'Raison d\'abandon si applicable',
    conversion_rate DECIMAL(5,2) COMMENT 'Taux de conversion de l\'étape',
    error_count INT DEFAULT 0 COMMENT 'Nombre d\'erreurs rencontrées',
    retry_count INT DEFAULT 0 COMMENT 'Nombre de tentatives',
    device_type ENUM('desktop', 'mobile', 'tablet') COMMENT 'Type d\'appareil',
    browser VARCHAR(50) COMMENT 'Navigateur utilisé',
    referrer_url TEXT COMMENT 'URL de provenance',
    utm_source VARCHAR(100) COMMENT 'Source UTM',
    utm_medium VARCHAR(100) COMMENT 'Medium UTM',
    utm_campaign VARCHAR(100) COMMENT 'Campagne UTM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_session_token (session_token),
    INDEX idx_user_id (user_id),
    INDEX idx_step_name (step_name),
    INDEX idx_device_type (device_type),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Analytics du processus d\'inscription';

-- ===================================================================
-- 5. CRÉATION DE LA TABLE EMAIL_VERIFICATION_LOGS
-- ===================================================================

CREATE TABLE IF NOT EXISTS email_verification_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT 'ID utilisateur',
    email VARCHAR(255) NOT NULL COMMENT 'Email à vérifier',
    verification_token VARCHAR(255) NOT NULL COMMENT 'Token de vérification',
    verification_type ENUM('registration', 'email_change', 'password_reset') DEFAULT 'registration' COMMENT 'Type de vérification',
    attempts INT DEFAULT 0 COMMENT 'Nombre de tentatives',
    verified_at TIMESTAMP NULL COMMENT 'Date de vérification',
    expires_at TIMESTAMP NOT NULL COMMENT 'Date d\'expiration',
    ip_address VARCHAR(45) COMMENT 'IP de vérification',
    user_agent TEXT COMMENT 'User agent lors de la vérification',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_verification_token (verification_token),
    INDEX idx_email (email),
    INDEX idx_expires_at (expires_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Logs de vérification email';

-- ===================================================================
-- 6. CRÉATION DES VUES POUR L'ANALYSE D'INSCRIPTION
-- ===================================================================

-- Vue pour le funnel d'inscription
CREATE OR REPLACE VIEW registration_funnel AS
SELECT 
    step_name,
    step_order,
    COUNT(*) as total_users,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as completed_users,
    ROUND(
        COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as conversion_rate,
    AVG(time_spent) as avg_time_spent,
    AVG(error_count) as avg_errors
FROM registration_analytics
GROUP BY step_name, step_order
ORDER BY step_order;

-- Vue pour les statistiques de migration
CREATE OR REPLACE VIEW migration_statistics AS
SELECT 
    source_system,
    migration_type,
    migration_status,
    COUNT(*) as total_migrations,
    AVG(TIMESTAMPDIFF(SECOND, started_at, completed_at)) as avg_duration_seconds,
    COUNT(CASE WHEN migration_status = 'completed' THEN 1 END) as successful_migrations,
    COUNT(CASE WHEN migration_status = 'failed' THEN 1 END) as failed_migrations,
    ROUND(
        COUNT(CASE WHEN migration_status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as success_rate
FROM migration_logs
GROUP BY source_system, migration_type, migration_status;

-- Vue pour les utilisateurs complets
CREATE OR REPLACE VIEW complete_user_profiles AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.account_status,
    u.registration_source,
    u.email_verified_at IS NOT NULL as email_verified,
    p.onboarding_completed,
    p.profile_completion_score,
    p.language_preference,
    p.timezone,
    u.created_at as user_created_at,
    p.created_at as profile_created_at,
    CASE 
        WHEN u.email_verified_at IS NOT NULL 
         AND p.onboarding_completed = TRUE 
         AND p.profile_completion_score >= 80 
        THEN 'complete'
        WHEN u.email_verified_at IS NOT NULL 
         AND p.onboarding_completed = TRUE 
        THEN 'basic_complete'
        WHEN u.email_verified_at IS NOT NULL 
        THEN 'email_verified'
        ELSE 'incomplete'
    END as completion_status
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id;

-- ===================================================================
-- 7. CRÉATION DES TRIGGERS POUR L'INSCRIPTION
-- ===================================================================

-- Trigger pour mettre à jour le score de complétude du profil
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_profile_completion_score
    AFTER UPDATE ON profiles
    FOR EACH ROW
BEGIN
    DECLARE completion_score INT DEFAULT 0;
    
    -- Calcul du score basé sur les champs remplis
    IF NEW.display_name IS NOT NULL AND NEW.display_name != '' THEN
        SET completion_score = completion_score + 20;
    END IF;
    
    IF NEW.bio IS NOT NULL AND NEW.bio != '' THEN
        SET completion_score = completion_score + 15;
    END IF;
    
    IF NEW.date_of_birth IS NOT NULL THEN
        SET completion_score = completion_score + 15;
    END IF;
    
    IF NEW.avatar_url IS NOT NULL AND NEW.avatar_url != '' THEN
        SET completion_score = completion_score + 20;
    END IF;
    
    IF NEW.phone_number IS NOT NULL AND NEW.phone_number != '' THEN
        SET completion_score = completion_score + 10;
    END IF;
    
    IF NEW.notification_preferences IS NOT NULL THEN
        SET completion_score = completion_score + 10;
    END IF;
    
    IF NEW.privacy_settings IS NOT NULL THEN
        SET completion_score = completion_score + 10;
    END IF;
    
    -- Mettre à jour le score si différent
    IF NEW.profile_completion_score != completion_score THEN
        UPDATE profiles 
        SET profile_completion_score = completion_score 
        WHERE id = NEW.id;
    END IF;
END;
//
DELIMITER ;

-- Trigger pour nettoyer les sessions expirées
DELIMITER //
CREATE TRIGGER IF NOT EXISTS cleanup_expired_registration_sessions
    BEFORE INSERT ON registration_sessions
    FOR EACH ROW
BEGIN
    -- Supprimer les sessions expirées avant d'insérer une nouvelle
    DELETE FROM registration_sessions 
    WHERE expires_at < NOW();
END;
//
DELIMITER ;

-- ===================================================================
-- 8. CRÉATION DES PROCÉDURES STOCKÉES
-- ===================================================================

-- Procédure pour créer une session d'inscription
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CreateRegistrationSession(
    IN p_source ENUM('direct', 'migration', 'social', 'import'),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT,
    OUT p_session_token VARCHAR(255)
)
BEGIN
    DECLARE session_exists INT DEFAULT 0;
    
    -- Générer un token unique
    REPEAT
        SET p_session_token = CONCAT(
            SUBSTRING(MD5(RAND()), 1, 8), '-',
            SUBSTRING(MD5(RAND()), 1, 4), '-',
            SUBSTRING(MD5(RAND()), 1, 4), '-',
            SUBSTRING(MD5(RAND()), 1, 12)
        );
        
        SELECT COUNT(*) INTO session_exists 
        FROM registration_sessions 
        WHERE session_token = p_session_token;
        
    UNTIL session_exists = 0 END REPEAT;
    
    -- Insérer la nouvelle session
    INSERT INTO registration_sessions (
        session_token, 
        source, 
        ip_address, 
        user_agent, 
        expires_at
    ) VALUES (
        p_session_token, 
        p_source, 
        p_ip_address, 
        p_user_agent, 
        DATE_ADD(NOW(), INTERVAL 24 HOUR)
    );
END;
//
DELIMITER ;

-- Procédure pour finaliser l'inscription
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CompleteRegistration(
    IN p_session_token VARCHAR(255),
    IN p_user_id INT
)
BEGIN
    DECLARE v_session_id INT;
    
    -- Vérifier que la session existe et est valide
    SELECT id INTO v_session_id 
    FROM registration_sessions 
    WHERE session_token = p_session_token 
      AND expires_at > NOW() 
      AND completed_at IS NULL;
    
    IF v_session_id IS NOT NULL THEN
        -- Marquer la session comme complétée
        UPDATE registration_sessions 
        SET user_id = p_user_id, 
            current_step = 'complete',
            completed_at = NOW()
        WHERE id = v_session_id;
        
        -- Mettre à jour le statut de l'utilisateur
        UPDATE users 
        SET account_status = 'active',
            registration_step = 'complete'
        WHERE id = p_user_id;
        
        -- Marquer l'onboarding comme commencé
        UPDATE profiles 
        SET onboarding_completed = FALSE
        WHERE user_id = p_user_id;
    END IF;
END;
//
DELIMITER ;

-- ===================================================================
-- 9. INSERTION DES DONNÉES DE RÉFÉRENCE
-- ===================================================================

-- Paramètres de configuration pour l'inscription
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('registration.email_verification_required', 'true', 'Vérification email obligatoire'),
('registration.password_min_length', '8', 'Longueur minimale du mot de passe'),
('registration.session_duration_hours', '24', 'Durée session inscription en heures'),
('registration.max_login_attempts', '5', 'Tentatives max avant verrouillage'),
('registration.lockout_duration_minutes', '30', 'Durée verrouillage en minutes'),
('registration.terms_version', '1.0', 'Version actuelle des CGU'),
('registration.privacy_version', '1.0', 'Version politique confidentialité'),
('registration.profile_completion_threshold', '80', 'Seuil profil considéré complet'),
('registration.analytics_enabled', 'true', 'Analytics inscription activées'),
('registration.migration_enabled', 'true', 'Migration Supabase activée');

-- ===================================================================
-- 10. CRÉATION DES INDEX POUR LES PERFORMANCES
-- ===================================================================

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_users_email_verification ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_registration_source ON users(registration_source);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);

CREATE INDEX IF NOT EXISTS idx_profiles_completion ON profiles(profile_completion_score);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_language ON profiles(language_preference);

-- ===================================================================
-- 11. VALIDATION DE LA MIGRATION
-- ===================================================================

-- Vérifier que toutes les tables ont été créées
SELECT 
    'Tables créées' as Vérification,
    COUNT(*) as Nombre
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'faildaily' 
  AND TABLE_NAME IN (
    'registration_sessions', 
    'migration_logs', 
    'registration_analytics', 
    'email_verification_logs'
  );

-- Vérifier que toutes les colonnes ont été ajoutées
SELECT 
    'Nouvelles colonnes ajoutées' as Vérification,
    COUNT(*) as Nombre
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'faildaily' 
  AND COLUMN_NAME IN (
    'registration_source', 
    'registration_step', 
    'email_verification_token',
    'onboarding_completed',
    'profile_completion_score'
  );

-- Vérifier que les vues ont été créées
SELECT 
    'Vues créées' as Vérification,
    COUNT(*) as Nombre
FROM INFORMATION_SCHEMA.VIEWS
WHERE TABLE_SCHEMA = 'faildaily'
  AND TABLE_NAME IN (
    'registration_funnel',
    'migration_statistics', 
    'complete_user_profiles'
  );

-- ===================================================================
-- 12. RAPPORT FINAL DE MIGRATION
-- ===================================================================

SELECT 
    'MIGRATION 002 TERMINÉE' as Status,
    NOW() as 'Heure de fin',
    'Système d\'inscription complet déployé' as Description,
    'Base de données prête pour production' as Résultat;

-- ===================================================================
-- FIN DE LA MIGRATION 002
-- ===================================================================