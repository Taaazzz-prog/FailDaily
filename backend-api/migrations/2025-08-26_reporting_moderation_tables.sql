-- Reporting & Moderation tables for FailDaily
-- MySQL 8+/9+, utf8mb4

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

-- Table: fail_reports (who reported which fail, with reason)
CREATE TABLE IF NOT EXISTS `fail_reports` (
  `id` CHAR(36) NOT NULL,
  `fail_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `reason` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_fail_report` (`fail_id`, `user_id`),
  KEY `idx_fail_reports_fail` (`fail_id`),
  KEY `idx_fail_reports_user` (`user_id`),
  CONSTRAINT `fk_fail_reports_fail` FOREIGN KEY (`fail_id`) REFERENCES `fails` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fail_reports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: fail_moderation (current moderation status of a fail)
CREATE TABLE IF NOT EXISTS `fail_moderation` (
  `fail_id` CHAR(36) NOT NULL,
  `status` ENUM('under_review','hidden','approved') NOT NULL DEFAULT 'under_review',
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`fail_id`),
  CONSTRAINT `fk_fail_moderation_fail` FOREIGN KEY (`fail_id`) REFERENCES `fails` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: comment_reports (who reported which comment)
CREATE TABLE IF NOT EXISTS `comment_reports` (
  `id` CHAR(36) NOT NULL,
  `comment_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `reason` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_comment_report` (`comment_id`, `user_id`),
  KEY `idx_comment_reports_comment` (`comment_id`),
  KEY `idx_comment_reports_user` (`user_id`),
  CONSTRAINT `fk_comment_reports_comment` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_reports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: comment_moderation (current moderation status of a comment)
CREATE TABLE IF NOT EXISTS `comment_moderation` (
  `comment_id` CHAR(36) NOT NULL,
  `status` ENUM('under_review','hidden','approved') NOT NULL DEFAULT 'under_review',
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_id`),
  CONSTRAINT `fk_comment_moderation_comment` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;

