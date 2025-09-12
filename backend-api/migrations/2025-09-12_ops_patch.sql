-- FailDaily - Patch opérations (tables + index)
-- Date: 2025-09-12
-- Objectifs:
--  1) Ajouter tables manquantes: email_verification_tokens, user_push_tokens, push_errors, error_logs
--  2) Étendre statut de modération: ajouter 'rejected'
--  3) Créer des index de performance recommandés

START TRANSACTION;

/* ------------------------------------------------------------------ */
/* 1) Tables manquantes                                                */
/* ------------------------------------------------------------------ */

-- Tokens de vérification d'email
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_email_token (token),
  KEY idx_evt_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tokens push par utilisateur
CREATE TABLE IF NOT EXISTS user_push_tokens (
  user_id CHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL,
  platform ENUM('web','android','ios') DEFAULT 'web',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (token),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Logs d'échecs push (FCM)
CREATE TABLE IF NOT EXISTS push_errors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  error_type VARCHAR(50) NOT NULL,
  status_code INT NULL,
  message TEXT,
  tokens_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Journalisation des erreurs applicatives
CREATE TABLE IF NOT EXISTS error_logs (
  id VARCHAR(16) NOT NULL PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  message TEXT,
  stack TEXT,
  url VARCHAR(500),
  method VARCHAR(10),
  user_id CHAR(36) NULL,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created (created_at),
  INDEX idx_type (type),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ------------------------------------------------------------------ */
/* 2) Modération: ajouter le statut 'rejected'                         */
/* ------------------------------------------------------------------ */

ALTER TABLE fail_moderation
  MODIFY COLUMN status ENUM('under_review','hidden','approved','rejected') NOT NULL DEFAULT 'under_review';

-- (Optionnel) si vous souhaitez le même statut pour les commentaires
 ALTER TABLE comment_moderation
   MODIFY COLUMN status ENUM('under_review','hidden','approved','rejected') NOT NULL DEFAULT 'under_review';

/* ------------------------------------------------------------------ */
/* 3) Index de performance                                             */
/* ------------------------------------------------------------------ */

-- Fails
ALTER TABLE fails ADD INDEX idx_fails_user_created (user_id, created_at);
ALTER TABLE fails ADD INDEX idx_fails_category_created (category, created_at);

-- Reactions
ALTER TABLE reactions ADD INDEX idx_reactions_fail_type (fail_id, reaction_type);
ALTER TABLE reactions ADD INDEX idx_reactions_user_created (user_id, created_at);

-- Comments
ALTER TABLE comments ADD INDEX idx_comments_fail_created (fail_id, created_at);
ALTER TABLE comments ADD INDEX idx_comments_user_created (user_id, created_at);

-- User badges (un index unique existe déjà sur (user_id, badge_id))
ALTER TABLE user_badges ADD INDEX idx_user_badges_unlocked (unlocked_at);

-- Fail moderation
ALTER TABLE fail_moderation ADD INDEX idx_fail_moderation_status (status);
ALTER TABLE fail_moderation ADD INDEX idx_fail_moderation_updated (updated_at);

-- Profiles
ALTER TABLE profiles ADD INDEX idx_profiles_display_name (display_name);
ALTER TABLE profiles ADD INDEX idx_profiles_registration (registration_completed);

COMMIT;

-- Remarques:
-- - Si certains index existent déjà, exécuter ce script avec l'option --force
--   (ou supprimez manuellement les lignes concernées) afin d’ignorer les erreurs
--   "Duplicate key name".
-- - MySQL ne supporte pas IF NOT EXISTS pour ADD INDEX; les erreurs peuvent être ignorées.

