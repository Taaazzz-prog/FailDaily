-- Mise à jour de l'ENUM account_status pour supporter l'état 'pending'
ALTER TABLE users
  MODIFY account_status ENUM('active','pending','suspended','banned','deleted')
  DEFAULT 'active';

-- Table nécessaire pour les notifications push (utilisée par badges/features)
CREATE TABLE IF NOT EXISTS user_push_tokens (
  user_id CHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL,
  platform ENUM('web','android','ios') DEFAULT 'web',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (token),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
