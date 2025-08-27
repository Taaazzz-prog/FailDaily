-- User points storage and admin-configurable reaction points
-- Safe to run multiple times

SET @old_sql_mode := @@SESSION.sql_mode;
SET SESSION sql_mode = REPLACE(@@SESSION.sql_mode, 'STRICT_TRANS_TABLES', '');

-- Table: user_points (total per user)
CREATE TABLE IF NOT EXISTS user_points (
  user_id CHAR(36) NOT NULL,
  points_total INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user_point_events (history)
CREATE TABLE IF NOT EXISTS user_point_events (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  amount INT NOT NULL,
  source VARCHAR(50) NOT NULL,
  fail_id CHAR(36) NULL,
  reaction_type VARCHAR(50) NULL,
  meta LONGTEXT NULL COMMENT 'JSON data',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_point_events_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed app_config for reaction points if not present
INSERT INTO app_config (id, `key`, value, description, created_at, updated_at)
SELECT UUID(), 'reaction_points', '{"courage":5, "laugh":3, "empathy":2, "support":3}', 'Points attribués à l\'auteur lors d\'une réaction', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM app_config WHERE `key` = 'reaction_points');

-- Seed app_config for generic points if not present
INSERT INTO app_config (id, `key`, value, description, created_at, updated_at)
SELECT UUID(), 'points', '{"failCreate":10, "commentCreate":2, "reactionRemovePenalty":true}', 'Configuration générique des points (création fail, commentaire, etc.)', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM app_config WHERE `key` = 'points');

-- Seed moderation defaults if not present
INSERT INTO app_config (id, `key`, value, description, created_at, updated_at)
SELECT UUID(), 'moderation', '{"failReportThreshold":3, "commentReportThreshold":3, "panelAutoRefreshSec":20}', 'Configuration modération (seuils de signalements, etc.)', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM app_config WHERE `key` = 'moderation');

-- Manual insert examples (documentation purpose)
-- INSERT INTO user_points (user_id, points_total) VALUES ('<USER_UUID>', 100)
--   ON DUPLICATE KEY UPDATE points_total = VALUES(points_total);
-- INSERT INTO user_point_events (id, user_id, amount, source, fail_id, reaction_type, meta)
--   VALUES (UUID(), '<USER_UUID>', 10, 'admin', NULL, NULL, '{"reason":"bonus"}');

SET SESSION sql_mode = @old_sql_mode;
