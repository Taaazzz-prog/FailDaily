-- ====================================================================
-- SCRIPT DE MIGRATION FAILDAILY - POSTGRESQL VERS MYSQL
-- Générée le 15 août 2025
-- Compatible avec phpMyAdmin / MySQL 8.0+
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS `faildaily` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `faildaily`;

-- ====================================================================
-- TABLE: users (AUTHENTIFICATION - TABLE PRINCIPALE)
-- ====================================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_confirmed` boolean DEFAULT false,
  `password_hash` varchar(255) DEFAULT NULL COMMENT 'Sera géré par votre système auth',
  `role` varchar(50) DEFAULT 'user',
  `last_login` timestamp NULL DEFAULT NULL,
  `login_count` int DEFAULT 0,
  `account_status` enum('active','suspended','deleted') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_status` (`account_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: profiles (DONNÉES UTILISATEUR - LIÉE À users)
-- ====================================================================
DROP TABLE IF EXISTS `profiles`;
CREATE TABLE `profiles` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `avatar_url` text,
  `bio` text,
  `registration_completed` boolean DEFAULT false,
  `legal_consent` longtext COMMENT 'JSON data',
  `age_verification` longtext COMMENT 'JSON data',
  `preferences` longtext COMMENT 'JSON data',
  `stats` longtext COMMENT 'JSON data',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `username` (`username`),
  CONSTRAINT `profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: badge_definitions
-- ====================================================================
DROP TABLE IF EXISTS `badge_definitions`;
CREATE TABLE `badge_definitions` (
  `id` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `icon` varchar(100) NOT NULL,
  `category` varchar(50) NOT NULL,
  `rarity` varchar(50) NOT NULL,
  `requirement_type` varchar(50) NOT NULL,
  `requirement_value` int NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- DONNÉES DES BADGES (IMPORTANT : NE PAS SUPPRIMER !)
-- ====================================================================
INSERT INTO `badge_definitions` (`id`, `name`, `description`, `icon`, `category`, `rarity`, `requirement_type`, `requirement_value`, `created_at`) VALUES
('first-fail', 'Premier Pas', 'Félicitations pour votre premier fail partagé !', 'footsteps-outline', 'COURAGE', 'common', 'fail_count', 1, '2025-08-08 16:22:31'),
('fail-master-5', 'Apprenti', 'Partager 5 fails', 'school-outline', 'COURAGE', 'common', 'fail_count', 5, '2025-08-08 16:22:31'),
('fail-master-10', 'Collectionneur', 'Partager 10 fails', 'library-outline', 'COURAGE', 'common', 'fail_count', 10, '2025-08-08 16:22:31'),
('courage-hearts-10', 'Cœur Brave', 'Recevoir 10 cœurs de courage', 'heart-outline', 'COURAGE', 'common', 'reactions_received', 10, '2025-08-08 16:34:14'),
('courage-hearts-50', 'Cœur Courageux', 'Recevoir 50 cœurs de courage', 'heart-outline', 'COURAGE', 'rare', 'reactions_received', 50, '2025-08-08 16:34:14'),
('courage-hearts-100', 'Héros du Courage', 'Recevoir 100 cœurs de courage', 'medal-outline', 'COURAGE', 'epic', 'reactions_received', 100, '2025-08-08 16:34:14'),
('courage-hearts-500', 'Légende du Courage', 'Recevoir 500 cœurs de courage', 'trophy-outline', 'COURAGE', 'legendary', 'reactions_received', 500, '2025-08-08 16:34:14'),
('fail-master-25', 'Narrateur', 'Partager 25 fails', 'book-outline', 'COURAGE', 'rare', 'fail_count', 25, '2025-08-08 16:34:14'),
('fail-master-50', 'Grand Collectionneur', 'Partager 50 fails', 'albums-outline', 'COURAGE', 'rare', 'fail_count', 50, '2025-08-08 16:34:14'),
('fail-master-100', 'Maître des Fails', 'Partager 100 fails', 'ribbon-outline', 'COURAGE', 'epic', 'fail_count', 100, '2025-08-08 16:34:14'),
('fail-master-365', 'Chroniqueur Légendaire', 'Partager 365 fails (un an !)', 'calendar-number-outline', 'COURAGE', 'legendary', 'fail_count', 365, '2025-08-08 16:34:14'),
('daily-streak-3', 'Régulier', '3 jours de partage consécutifs', 'checkmark-outline', 'PERSEVERANCE', 'common', 'streak_days', 3, '2025-08-08 16:34:14'),
('daily-streak-7', 'Persévérant', '7 jours de partage consécutifs', 'calendar-outline', 'PERSEVERANCE', 'common', 'streak_days', 7, '2025-08-08 16:34:14'),
('daily-streak-14', 'Déterminé', '14 jours de partage consécutifs', 'flame-outline', 'PERSEVERANCE', 'rare', 'streak_days', 14, '2025-08-08 16:34:14'),
('daily-streak-30', 'Marathonien', '30 jours de partage consécutifs', 'fitness-outline', 'PERSEVERANCE', 'rare', 'streak_days', 30, '2025-08-08 16:34:14'),
('daily-streak-60', 'Titan de la Régularité', '60 jours de partage consécutifs', 'barbell-outline', 'PERSEVERANCE', 'epic', 'streak_days', 60, '2025-08-08 16:34:14'),
('daily-streak-100', 'Centurion', '100 jours de partage consécutifs', 'shield-outline', 'PERSEVERANCE', 'epic', 'streak_days', 100, '2025-08-08 16:34:14'),
('daily-streak-365', 'Immortel', '365 jours de partage consécutifs', 'infinite-outline', 'PERSEVERANCE', 'legendary', 'streak_days', 365, '2025-08-08 16:34:14'),
('comeback-king', 'Roi du Comeback', 'Reprendre après une pause de 30 jours', 'refresh-outline', 'PERSEVERANCE', 'rare', 'comeback_count', 1, '2025-08-08 16:34:14'),
('never-give-up', 'Jamais Abandonner', 'Maintenir 5 streaks de plus de 7 jours', 'flag-outline', 'PERSEVERANCE', 'epic', 'long_streaks', 5, '2025-08-08 16:34:14'),
('iron-will', 'Volonté de Fer', 'Repartager après 10 échecs consécutifs', 'hammer-outline', 'PERSEVERANCE', 'legendary', 'resilience_count', 10, '2025-08-08 16:34:14'),
('funny-fail', 'Comédien Amateur', 'Un fail qui a fait rire 25 personnes', 'happy-outline', 'HUMOUR', 'common', 'laugh_reactions', 25, '2025-08-08 16:34:14'),
('comedian', 'Comédien', 'Un fail qui a fait rire 50 personnes', 'theater-outline', 'HUMOUR', 'rare', 'laugh_reactions', 50, '2025-08-08 16:34:14'),
('humor-king', 'Roi du Rire', 'Un fail qui a fait rire 100 personnes', 'sparkles-outline', 'HUMOUR', 'epic', 'laugh_reactions', 100, '2025-08-08 16:34:14'),
('viral-laugh', 'Sensation Virale', 'Un fail qui a fait rire 500 personnes', 'trending-up-outline', 'HUMOUR', 'legendary', 'laugh_reactions', 500, '2025-08-08 16:34:14'),
('class-clown', 'Rigolo de Service', 'Recevoir 100 réactions de rire au total', 'musical-note-outline', 'HUMOUR', 'rare', 'total_laughs', 100, '2025-08-08 16:34:14'),
('stand-up-master', 'Maître du Stand-Up', 'Recevoir 500 réactions de rire au total', 'mic-outline', 'HUMOUR', 'epic', 'total_laughs', 500, '2025-08-08 16:34:14'),
('laughter-legend', 'Légende du Rire', 'Recevoir 1000 réactions de rire au total', 'star-outline', 'HUMOUR', 'legendary', 'total_laughs', 1000, '2025-08-08 16:34:14'),
('mood-lifter', 'Remonteur de Moral', '50 fails marqués comme "drôles"', 'sunny-outline', 'HUMOUR', 'epic', 'funny_fails', 50, '2025-08-08 16:34:14'),
('supportive-soul', 'Âme Bienveillante', 'Donner 50 réactions de soutien', 'heart-half-outline', 'ENTRAIDE', 'common', 'support_given', 50, '2025-08-08 16:34:14'),
('empathy-expert', 'Expert en Empathie', 'Donner 25 réactions d\'empathie', 'sad-outline', 'ENTRAIDE', 'common', 'empathy_given', 25, '2025-08-08 16:34:14'),
('community-helper', 'Assistant Communautaire', 'Aider 10 membres de la communauté', 'people-outline', 'ENTRAIDE', 'rare', 'help_count', 10, '2025-08-08 16:34:14'),
('guardian-angel', 'Ange Gardien', 'Aider 25 membres de la communauté', 'medical-outline', 'ENTRAIDE', 'epic', 'help_count', 25, '2025-08-08 16:34:14'),
('mentor', 'Mentor', 'Commenter constructivement 100 fails', 'chatbox-outline', 'ENTRAIDE', 'rare', 'helpful_comments', 100, '2025-08-08 16:34:14'),
('wise-counselor', 'Conseiller Sage', 'Commenter constructivement 250 fails', 'library-outline', 'ENTRAIDE', 'epic', 'helpful_comments', 250, '2025-08-08 16:34:14'),
('community-pillar', 'Pilier de la Communauté', 'Être actif pendant 6 mois consécutifs', 'home-outline', 'ENTRAIDE', 'legendary', 'active_months', 6, '2025-08-08 16:34:14'),
('good-vibes', 'Bonnes Vibrations', 'Donner 1000 réactions positives au total', 'thumbs-up-outline', 'ENTRAIDE', 'epic', 'positive_reactions', 1000, '2025-08-08 16:34:14'),
('life-coach', 'Coach de Vie', 'Aider 100 personnes avec des conseils', 'fitness-outline', 'ENTRAIDE', 'legendary', 'advice_given', 100, '2025-08-08 16:34:14'),
('bounce-back', 'Rebond', 'Se relever après un fail difficile', 'arrow-up-outline', 'RESILIENCE', 'common', 'bounce_back_count', 1, '2025-08-08 16:34:14'),
('resilience-rookie', 'Apprenti Résilient', 'Partager 5 fails de résilience', 'leaf-outline', 'RESILIENCE', 'common', 'resilience_fails', 5, '2025-08-08 16:34:14'),
('resilience-champion', 'Champion de Résilience', 'Partager 20 fails de résilience', 'refresh-outline', 'RESILIENCE', 'rare', 'resilience_fails', 20, '2025-08-08 16:34:14'),
('phoenix', 'Phénix', 'Renaître de 10 échecs majeurs', 'flame-outline', 'RESILIENCE', 'epic', 'major_comebacks', 10, '2025-08-08 16:34:14'),
('unbreakable', 'Incassable', 'Maintenir un état d\'esprit positif 100 jours', 'diamond-outline', 'RESILIENCE', 'epic', 'positive_days', 100, '2025-08-08 16:34:14'),
('survivor', 'Survivant', 'Surmonter 50 défis personnels', 'shield-checkmark-outline', 'RESILIENCE', 'legendary', 'challenges_overcome', 50, '2025-08-08 16:34:14'),
('inspiration', 'Source d\'Inspiration', 'Inspirer 100 autres utilisateurs', 'bulb-outline', 'RESILIENCE', 'legendary', 'inspired_users', 100, '2025-08-08 16:34:14'),
('early-adopter', 'Pionnier', 'Membre des 1000 premiers utilisateurs', 'flag-outline', 'SPECIAL', 'legendary', 'user_rank', 1000, '2025-08-08 16:34:14'),
('beta-tester', 'Testeur Bêta', 'Participer à la phase de test', 'construct-outline', 'SPECIAL', 'epic', 'beta_participation', 1, '2025-08-08 16:34:14'),
('birthday-badge', 'Anniversaire FailDaily', 'Être présent lors de l\'anniversaire de l\'app', 'gift-outline', 'SPECIAL', 'rare', 'anniversary_participation', 1, '2025-08-08 16:34:14'),
('new-year-resolution', 'Résolution du Nouvel An', 'Partager un fail le 1er janvier', 'calendar-outline', 'SPECIAL', 'rare', 'new_year_fail', 1, '2025-08-08 16:34:14'),
('midnight-warrior', 'Guerrier de Minuit', 'Partager un fail après minuit', 'moon-outline', 'SPECIAL', 'common', 'midnight_fail', 1, '2025-08-08 16:34:14'),
('weekend-warrior', 'Guerrier du Weekend', 'Partager 50 fails le weekend', 'bicycle-outline', 'SPECIAL', 'rare', 'weekend_fails', 50, '2025-08-08 16:34:14'),
('holiday-spirit', 'Esprit des Fêtes', 'Partager pendant les vacances', 'snow-outline', 'SPECIAL', 'rare', 'holiday_fails', 5, '2025-08-08 16:34:14'),
('globetrotter', 'Globe-Trotter', 'Partager des fails de 10 pays différents', 'airplane-outline', 'SPECIAL', 'legendary', 'countries_count', 10, '2025-08-08 16:34:14'),
('socializer', 'Sociable', 'Interagir avec 50 utilisateurs différents', 'people-circle-outline', 'ENTRAIDE', 'rare', 'unique_interactions', 50, '2025-08-08 16:34:14'),
('discussion-starter', 'Lanceur de Débats', 'Créer 25 discussions populaires', 'chatbubbles-outline', 'ENTRAIDE', 'epic', 'popular_discussions', 25, '2025-08-08 16:34:14'),
('trend-setter', 'Créateur de Tendances', 'Lancer 5 tendances dans la communauté', 'trending-up-outline', 'SPECIAL', 'legendary', 'trends_created', 5, '2025-08-08 16:34:14'),
('active-member', 'Membre Actif', 'Se connecter 100 jours non-consécutifs', 'person-outline', 'PERSEVERANCE', 'rare', 'login_days', 100, '2025-08-08 16:34:14'),
('power-user', 'Utilisateur Expert', 'Utiliser toutes les fonctionnalités de l\'app', 'settings-outline', 'SPECIAL', 'epic', 'features_used', 10, '2025-08-08 16:34:14'),
('first-reaction', 'Première Réaction', 'Recevoir votre première réaction', 'heart-outline', 'COURAGE', 'common', 'first_reaction', 1, '2025-08-08 16:43:44'),
('fails-5', 'Apprenti Courage', 'Poster 5 fails', 'ribbon-outline', 'COURAGE', 'common', 'fail_count', 5, '2025-08-10 13:58:59'),
('fails-10', 'Courageux', 'Poster 10 fails', 'trophy-outline', 'COURAGE', 'rare', 'fail_count', 10, '2025-08-10 13:58:59'),
('fails-25', 'Maître du Courage', 'Poster 25 fails', 'star-outline', 'COURAGE', 'epic', 'fail_count', 25, '2025-08-10 13:58:59'),
('fails-50', 'Vétéran du Courage', 'Poster 50 fails', 'shield-outline', 'COURAGE', 'epic', 'fail_count', 50, '2025-08-10 13:58:59'),
('fails-100', 'Légende du Courage', 'Poster 100 fails', 'diamond-outline', 'COURAGE', 'legendary', 'fail_count', 100, '2025-08-10 13:58:59'),
('reactions-10', 'Supporteur', 'Donner 10 réactions', 'people-outline', 'ENTRAIDE', 'common', 'reaction_given', 10, '2025-08-10 13:58:59'),
('reactions-25', 'Supporteur Actif', 'Donner 25 réactions', 'heart-half-outline', 'ENTRAIDE', 'common', 'reaction_given', 25, '2025-08-10 13:58:59'),
('reactions-50', 'Grand Supporteur', 'Donner 50 réactions', 'heart', 'ENTRAIDE', 'rare', 'reaction_given', 50, '2025-08-10 13:58:59'),
('reactions-100', 'Super Supporteur', 'Donner 100 réactions', 'heart-circle-outline', 'ENTRAIDE', 'epic', 'reaction_given', 100, '2025-08-10 13:58:59'),
('reactions-250', 'Maître du Support', 'Donner 250 réactions', 'heart-half-outline', 'ENTRAIDE', 'legendary', 'reaction_given', 250, '2025-08-10 13:58:59'),
('all-categories', 'Touche-à-tout', 'Poster un fail dans chaque catégorie', 'apps-outline', 'SPECIAL', 'epic', 'categories_used', 5, '2025-08-10 13:58:59');

-- ====================================================================
-- TABLE: fails
-- ====================================================================
DROP TABLE IF EXISTS `fails`;
CREATE TABLE `fails` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(100) NOT NULL,
  `image_url` text DEFAULT NULL,
  `is_public` boolean DEFAULT true,
  `reactions` longtext COMMENT 'JSON data',
  `comments_count` int DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fails_user_id` (`user_id`),
  KEY `idx_fails_created_at` (`created_at`),
  CONSTRAINT `fails_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: reactions
-- ====================================================================
DROP TABLE IF EXISTS `reactions`;
CREATE TABLE `reactions` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `fail_id` char(36) NOT NULL,
  `reaction_type` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_fail_reaction` (`user_id`, `fail_id`),
  KEY `idx_reactions_fail_id` (`fail_id`),
  KEY `idx_reactions_user_id` (`user_id`),
  CONSTRAINT `reactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reactions_fail_id_fkey` FOREIGN KEY (`fail_id`) REFERENCES `fails` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: comments
-- ====================================================================
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `id` char(36) NOT NULL,
  `fail_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `content` text NOT NULL,
  `is_encouragement` boolean DEFAULT true,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_comments_fail_id` (`fail_id`),
  CONSTRAINT `comments_fail_id_fkey` FOREIGN KEY (`fail_id`) REFERENCES `fails` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: user_badges
-- ====================================================================
DROP TABLE IF EXISTS `user_badges`;
CREATE TABLE `user_badges` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `badge_id` varchar(100) NOT NULL,
  `unlocked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_badge` (`user_id`, `badge_id`),
  CONSTRAINT `user_badges_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_badges_badge_id_fkey` FOREIGN KEY (`badge_id`) REFERENCES `badge_definitions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: badges (TABLE HÉRITÉE - PEUT ÊTRE SUPPRIMÉE SI PAS UTILISÉE)
-- ====================================================================
DROP TABLE IF EXISTS `badges`;
CREATE TABLE `badges` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `icon` varchar(100) NOT NULL,
  `category` varchar(50) NOT NULL,
  `rarity` varchar(50) NOT NULL,
  `badge_type` varchar(50) NOT NULL,
  `unlocked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `badges_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: activity_logs (LOGS COMPLETS)
-- ====================================================================
DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `id` char(36) NOT NULL,
  `event_type` varchar(100) NOT NULL,
  `event_category` varchar(50) DEFAULT NULL,
  `action` varchar(100) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `message` text NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `target_user_id` char(36) DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `user_display_name` varchar(255) DEFAULT NULL,
  `user_role` varchar(50) DEFAULT NULL,
  `resource_type` varchar(100) DEFAULT NULL,
  `resource_id` char(36) DEFAULT NULL,
  `payload` longtext COMMENT 'JSON data',
  `details` longtext COMMENT 'JSON data',
  `old_values` longtext COMMENT 'JSON data',
  `new_values` longtext COMMENT 'JSON data',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `correlation_id` char(36) DEFAULT NULL,
  `success` boolean DEFAULT true,
  `error_code` varchar(50) DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_user_id` (`user_id`),
  KEY `idx_activity_created_at` (`created_at`),
  CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: system_logs
-- ====================================================================
DROP TABLE IF EXISTS `system_logs`;
CREATE TABLE `system_logs` (
  `id` char(36) NOT NULL,
  `level` enum('info','warning','error','debug') NOT NULL,
  `message` text NOT NULL,
  `action` varchar(100) DEFAULT NULL,
  `details` longtext COMMENT 'JSON data',
  `user_id` char(36) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `system_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: reaction_logs
-- ====================================================================
DROP TABLE IF EXISTS `reaction_logs`;
CREATE TABLE `reaction_logs` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `fail_id` char(36) NOT NULL,
  `fail_title` varchar(255) DEFAULT NULL,
  `fail_author_name` varchar(255) DEFAULT NULL,
  `reaction_type` varchar(50) NOT NULL,
  `points_awarded` int DEFAULT 0,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: user_activities
-- ====================================================================
DROP TABLE IF EXISTS `user_activities`;
CREATE TABLE `user_activities` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `details` longtext COMMENT 'JSON data',
  `fail_id` char(36) DEFAULT NULL,
  `reaction_type` varchar(50) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_activities_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: user_management_logs
-- ====================================================================
DROP TABLE IF EXISTS `user_management_logs`;
CREATE TABLE `user_management_logs` (
  `id` char(36) NOT NULL,
  `admin_id` char(36) NOT NULL,
  `target_user_id` char(36) NOT NULL,
  `action_type` varchar(100) NOT NULL,
  `target_object_id` char(36) DEFAULT NULL,
  `old_values` longtext COMMENT 'JSON data',
  `new_values` longtext COMMENT 'JSON data',
  `reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `user_management_logs_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`),
  CONSTRAINT `user_management_logs_target_user_id_fkey` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: user_preferences
-- ====================================================================
DROP TABLE IF EXISTS `user_preferences`;
CREATE TABLE `user_preferences` (
  `id` char(36) NOT NULL,
  `notifications_enabled` boolean DEFAULT true,
  `email_notifications` boolean DEFAULT true,
  `push_notifications` boolean DEFAULT true,
  `privacy_mode` boolean DEFAULT false,
  `show_real_name` boolean DEFAULT true,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: app_config
-- ====================================================================
DROP TABLE IF EXISTS `app_config`;
CREATE TABLE `app_config` (
  `id` char(36) NOT NULL,
  `key` varchar(255) NOT NULL,
  `value` longtext NOT NULL COMMENT 'JSON data',
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_config_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- VIEW: user_profiles_complete (JOINTURE users + profiles)
-- ====================================================================
-- Cette vue combine users et profiles avec des informations calculées
CREATE VIEW `user_profiles_complete` AS
SELECT 
    u.id as user_id,
    u.email,
    u.email_confirmed,
    u.role,
    u.last_login,
    u.login_count,
    u.account_status,
    u.created_at as user_created_at,
    p.id as profile_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.registration_completed,
    p.legal_consent,
    p.age_verification,
    p.preferences,
    p.stats,
    p.created_at as profile_created_at,
    p.updated_at as profile_updated_at,
    -- Champs calculés simplifiés
    CASE 
        WHEN JSON_EXTRACT(p.age_verification, '$.isMinor') = true THEN true 
        ELSE false 
    END as is_currently_minor,
    CASE 
        WHEN JSON_EXTRACT(p.age_verification, '$.birthDate') IS NOT NULL 
        THEN TIMESTAMPDIFF(YEAR, STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(p.age_verification, '$.birthDate')), '%Y-%m-%d'), NOW())
        ELSE NULL 
    END as calculated_age,
    CASE 
        WHEN p.legal_consent IS NOT NULL AND p.age_verification IS NOT NULL AND p.registration_completed = true
        THEN 'compliant'
        ELSE 'pending'
    END as legal_compliance_status
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id;

-- ====================================================================
-- FONCTIONS UTILITAIRES (VERSION MySQL)
-- ====================================================================

-- Fonction pour générer des UUIDs (MySQL 8.0+)
DELIMITER ;;
CREATE FUNCTION IF NOT EXISTS generate_uuid() 
RETURNS CHAR(36) 
READS SQL DATA
DETERMINISTIC
BEGIN
    RETURN UUID();
END;;
DELIMITER ;

-- ====================================================================
-- TRIGGERS POUR VALEURS JSON PAR DÉFAUT (SOLUTION MySQL)
-- ====================================================================

-- Trigger pour créer automatiquement un profile quand un user est créé
DELIMITER ;;
CREATE TRIGGER users_after_insert 
AFTER INSERT ON users 
FOR EACH ROW
BEGIN
    INSERT INTO profiles (id, user_id, preferences, stats) 
    VALUES (UUID(), NEW.id, '{}', '{"badges": [], "totalFails": 0, "couragePoints": 0}');
END;;
DELIMITER ;

-- Trigger pour initialiser les valeurs JSON dans profiles
DELIMITER ;;
CREATE TRIGGER profiles_before_insert 
BEFORE INSERT ON profiles 
FOR EACH ROW
BEGIN
    IF NEW.preferences IS NULL THEN
        SET NEW.preferences = '{}';
    END IF;
    IF NEW.stats IS NULL THEN
        SET NEW.stats = '{"badges": [], "totalFails": 0, "couragePoints": 0}';
    END IF;
END;;
DELIMITER ;

-- Trigger pour initialiser les valeurs JSON dans fails
DELIMITER ;;
CREATE TRIGGER fails_before_insert 
BEFORE INSERT ON fails 
FOR EACH ROW
BEGIN
    IF NEW.reactions IS NULL THEN
        SET NEW.reactions = '{"laugh": 0, "courage": 0, "empathy": 0, "support": 0}';
    END IF;
END;;
DELIMITER ;

-- ====================================================================
-- INDEX SUPPLÉMENTAIRES POUR PERFORMANCE
-- ====================================================================
CREATE INDEX idx_badge_definitions_category ON badge_definitions(category);
CREATE INDEX idx_badge_definitions_rarity ON badge_definitions(rarity);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_activity_logs_event_type ON activity_logs(event_type);
CREATE INDEX idx_activity_logs_success ON activity_logs(success);

-- ====================================================================
-- FINALISATION
-- ====================================================================
SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- ====================================================================
-- NOTES D'UTILISATION
-- ====================================================================
-- 1. Ce script crée une base de données MySQL complète compatible avec FailDaily
-- 2. IMPORTANT: Les badges sont pré-chargés - NE PAS les supprimer !
-- 3. ARCHITECTURE SÉPARÉE: Table users (auth) + profiles (données métier)
-- 4. CORRECTIF: Suppression des DEFAULT sur LONGTEXT (erreur MySQL #1101)
-- 5. SOLUTION: Triggers automatiques pour initialiser les valeurs JSON par défaut
-- 6. AUTO-CRÉATION: Trigger automatique pour créer un profile à chaque nouvel user
-- 
-- ARCHITECTURE PROFESSIONNELLE:
-- ✅ Table `users`: Authentification, email, rôles, statut compte
-- ✅ Table `profiles`: Données utilisateur, préférences, stats, badges
-- ✅ Relation 1:1 users -> profiles avec CASCADE DELETE
-- ✅ Vue `user_profiles_complete` pour jointure automatique
-- 
-- POUR UTILISER:
-- 1. Ouvrir phpMyAdmin
-- 2. Créer une nouvelle base de données ou utiliser ce script
-- 3. Importer ce fichier .sql (MAINTENANT COMPATIBLE 100%)
-- 4. Adapter vos requêtes Angular/Node.js pour MySQL (remplacer $1, $2 par ?, ?)
-- 
-- MIGRATION DE DONNÉES:
-- - Si vous avez des données existantes dans `profiles`, vous devrez:
--   1. Extraire les données d'auth (email, role) vers `users`
--   2. Garder les données métier dans `profiles` avec user_id
--   3. Utiliser la vue `user_profiles_complete` pour les requêtes complexes
-- 
-- DIFFÉRENCES PRINCIPALES AVEC POSTGRESQL:
-- - JSON -> LONGTEXT avec triggers pour valeurs par défaut
-- - UUID -> CHAR(36)
-- - TIMESTAMPTZ -> TIMESTAMP
-- - BOOLEAN -> BOOLEAN (supporté MySQL 8.0+)
-- - Fonctions RPC -> À implémenter en PHP ou Node.js
-- 
-- CORRECTIFS APPLIQUÉS:
-- ✅ Architecture users/profiles séparée (meilleure pratique)
-- ✅ Trigger auto-création profile lors création user
-- ✅ Suppression des DEFAULT NULL sur LONGTEXT
-- ✅ Triggers pour initialiser preferences = '{}'
-- ✅ Triggers pour initialiser stats = '{"badges": [], "totalFails": 0, "couragePoints": 0}'
-- ✅ Triggers pour initialiser reactions = '{"laugh": 0, "courage": 0, "empathy": 0, "support": 0}'
-- ✅ Vue complète users+profiles pour compatibilité
-- 
-- STATUS: PRÊT POUR MIGRATION - ARCHITECTURE PROFESSIONNELLE 🚀
