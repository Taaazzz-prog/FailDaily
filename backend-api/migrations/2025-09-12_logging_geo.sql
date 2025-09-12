-- Logging et géolocalisation basiques
START TRANSACTION;

-- Table des logs de requêtes HTTP
CREATE TABLE IF NOT EXISTS request_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NULL,
  method VARCHAR(10) NOT NULL,
  url VARCHAR(1024) NOT NULL,
  status_code INT NULL,
  response_ms INT NULL,
  ip_address VARCHAR(45) NULL,
  country_code VARCHAR(2) NULL,
  user_agent TEXT NULL,
  params JSON NULL,
  body JSON NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_user (user_id),
  KEY idx_status (status_code),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historique IP utilisateur
CREATE TABLE IF NOT EXISTS user_ip_history (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT NULL,
  country_code VARCHAR(2) NULL,
  first_seen TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  seen_count INT DEFAULT 1,
  UNIQUE KEY uniq_user_ip (user_id, ip_address),
  KEY idx_user (user_id),
  KEY idx_country (country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajout du pays sur les fails
ALTER TABLE fails ADD COLUMN country_code VARCHAR(2) NULL AFTER category;
ALTER TABLE fails ADD INDEX idx_fail_country (country_code);

COMMIT;

