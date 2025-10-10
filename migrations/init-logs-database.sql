-- Script d'initialisation base de données logs séparée
-- FailDaily Logs Database Schema

CREATE DATABASE IF NOT EXISTS faildaily_logs;
USE faildaily_logs;

-- Table principale des logs d'activité
CREATE TABLE activity_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  level VARCHAR(20) NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  details JSON DEFAULT NULL,
  user_id CHAR(36) DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_level (level),
  INDEX idx_action (action),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_level_action (level, action),
  INDEX idx_user_action (user_id, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des métriques de performance
CREATE TABLE performance_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_time_ms INT NOT NULL,
  status_code INT NOT NULL,
  user_id CHAR(36) DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_endpoint (endpoint),
  INDEX idx_method (method),
  INDEX idx_response_time (response_time_ms),
  INDEX idx_status_code (status_code),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des erreurs système
CREATE TABLE error_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  error_code VARCHAR(50) DEFAULT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT DEFAULT NULL,
  context JSON DEFAULT NULL,
  user_id CHAR(36) DEFAULT NULL,
  request_data JSON DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_error_code (error_code),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des audits de sécurité
CREATE TABLE security_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL, -- login_attempt, failed_auth, permission_denied, etc.
  severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  description TEXT NOT NULL,
  user_id CHAR(36) DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  additional_data JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_type (event_type),
  INDEX idx_severity (severity),
  INDEX idx_user_id (user_id),
  INDEX idx_ip_address (ip_address),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vue pour statistiques rapides
CREATE VIEW logs_stats AS
SELECT 
  DATE(created_at) as log_date,
  level,
  action,
  COUNT(*) as count
FROM activity_logs
GROUP BY DATE(created_at), level, action
ORDER BY log_date DESC, count DESC;

-- Vue pour monitoring en temps réel
CREATE VIEW logs_realtime AS
SELECT 
  id,
  level,
  action,
  message,
  user_id,
  created_at
FROM activity_logs
WHERE created_at >= NOW() - INTERVAL 1 HOUR
ORDER BY created_at DESC;

-- Procédure de nettoyage automatique
DELIMITER //
CREATE PROCEDURE CleanOldLogs(IN retention_days INT)
BEGIN
  DECLARE deleted_count INT;
  
  DELETE FROM activity_logs 
  WHERE created_at < NOW() - INTERVAL retention_days DAY;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  DELETE FROM performance_logs 
  WHERE created_at < NOW() - INTERVAL retention_days DAY;
  
  DELETE FROM error_logs 
  WHERE created_at < NOW() - INTERVAL retention_days DAY;
  
  DELETE FROM security_logs 
  WHERE created_at < NOW() - INTERVAL retention_days DAY;
  
  SELECT CONCAT('Deleted ', deleted_count, ' logs older than ', retention_days, ' days') as result;
END //
DELIMITER ;

-- Trigger pour archivage automatique
DELIMITER //
CREATE TRIGGER archive_old_logs
AFTER INSERT ON activity_logs
FOR EACH ROW
BEGIN
  -- Nettoyage automatique si plus de 100k logs
  IF (SELECT COUNT(*) FROM activity_logs) > 100000 THEN
    DELETE FROM activity_logs 
    WHERE created_at < NOW() - INTERVAL 30 DAY 
    LIMIT 1000;
  END IF;
END //
DELIMITER ;

-- Insertion des premiers logs système
INSERT INTO activity_logs (id, level, action, message, created_at) VALUES
(UUID(), 'info', 'system_init', 'Base de données logs initialisée', NOW()),
(UUID(), 'info', 'system_init', 'Tables créées avec succès', NOW()),
(UUID(), 'info', 'system_init', 'Index de performance configurés', NOW());

-- Affichage des statistiques finales
SELECT 
  'activity_logs' as table_name,
  COUNT(*) as row_count,
  MAX(created_at) as latest_entry
FROM activity_logs

UNION ALL

SELECT 
  'performance_logs' as table_name,
  COUNT(*) as row_count,
  MAX(created_at) as latest_entry
FROM performance_logs

UNION ALL

SELECT 
  'error_logs' as table_name,
  COUNT(*) as row_count,
  MAX(created_at) as latest_entry  
FROM error_logs

UNION ALL

SELECT 
  'security_logs' as table_name,
  COUNT(*) as row_count,
  MAX(created_at) as latest_entry
FROM security_logs;