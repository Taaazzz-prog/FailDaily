-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : ven. 19 sep. 2025 à 11:35
-- Version du serveur : 9.1.0
-- Version de PHP : 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `faildaily`
--

DELIMITER $$
--
-- Fonctions
--
DROP FUNCTION IF EXISTS `generate_uuid`$$
CREATE DEFINER=`root`@`localhost` FUNCTION `generate_uuid` () RETURNS CHAR(36) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci DETERMINISTIC READS SQL DATA BEGIN
    RETURN UUID();
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_display_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resource_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resource_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `session_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correlation_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `success` tinyint(1) DEFAULT '1',
  `error_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_user_id` (`user_id`),
  KEY `idx_activity_created_at` (`created_at`),
  KEY `idx_activity_logs_event_type` (`event_type`),
  KEY `idx_activity_logs_success` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `app_config`
--

DROP TABLE IF EXISTS `app_config`;
CREATE TABLE IF NOT EXISTS `app_config` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'JSON data',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_config_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `app_config`
--

INSERT INTO `app_config` (`id`, `key`, `value`, `description`, `created_at`, `updated_at`) VALUES
('0869c46c-831e-11f0-b1c5-345a608f406b', 'reaction_points', '{\"courage\":5, \"laugh\":3, \"empathy\":2, \"support\":3}', 'Points attribués à l\'auteur lors d\'une réaction', '2025-08-27 08:15:46', '2025-08-27 08:15:46'),
('1671a16a-8322-11f0-b1c5-345a608f406b', 'points', '{\"failCreate\":10, \"commentCreate\":2, \"reactionRemovePenalty\":true}', 'Configuration générique des points (création fail, commentaire, etc.)', '2025-08-27 08:44:47', '2025-08-27 08:44:47'),
('168b0e1e-8322-11f0-b1c5-345a608f406b', 'moderation', '{\"failReportThreshold\":3, \"commentReportThreshold\":3, \"panelAutoRefreshSec\":20}', 'Configuration modération (seuils de signalements, etc.)', '2025-08-27 08:44:47', '2025-08-27 08:44:47');

-- --------------------------------------------------------

--
-- Structure de la table `badge_definitions`
--

DROP TABLE IF EXISTS `badge_definitions`;
CREATE TABLE IF NOT EXISTS `badge_definitions` (
  `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rarity` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requirement_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requirement_value` int NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_badge_definitions_category` (`category`),
  KEY `idx_badge_definitions_rarity` (`rarity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `badge_definitions`
--

INSERT INTO `badge_definitions` (`id`, `name`, `description`, `icon`, `category`, `rarity`, `requirement_type`, `requirement_value`, `created_at`) VALUES
('active-member', 'Membre Actif', 'Se connecter 100 jours non-consécutifs', 'person-outline', 'PERSEVERANCE', 'rare', 'login_days', 100, '2025-08-08 16:34:14'),
('all-categories', 'Touche-à-tout', 'Poster un fail dans chaque catégorie', 'apps-outline', 'SPECIAL', 'epic', 'categories_used', 5, '2025-08-10 13:58:59'),
('beta-tester', 'Testeur Bêta', 'Participer à la phase de test', 'construct-outline', 'SPECIAL', 'epic', 'beta_participation', 1, '2025-08-08 16:34:14'),
('birthday-badge', 'Anniversaire FailDaily', 'Être présent lors de l\'anniversaire de l\'app', 'gift-outline', 'SPECIAL', 'rare', 'anniversary_participation', 1, '2025-08-08 16:34:14'),
('bounce-back', 'Rebond', 'Se relever après un fail difficile', 'arrow-up-outline', 'RESILIENCE', 'common', 'bounce_back_count', 1, '2025-08-08 16:34:14'),
('class-clown', 'Rigolo de Service', 'Recevoir 100 réactions de rire au total', 'musical-note-outline', 'HUMOUR', 'rare', 'total_laughs', 100, '2025-08-08 16:34:14'),
('comeback-king', 'Roi du Comeback', 'Reprendre après une pause de 30 jours', 'refresh-outline', 'PERSEVERANCE', 'rare', 'comeback_count', 1, '2025-08-08 16:34:14'),
('comedian', 'Comédien', 'Un fail qui a fait rire 50 personnes', 'theater-outline', 'HUMOUR', 'rare', 'laugh_reactions', 50, '2025-08-08 16:34:14'),
('community-helper', 'Assistant Communautaire', 'Aider 10 membres de la communauté', 'people-outline', 'ENTRAIDE', 'rare', 'help_count', 10, '2025-08-08 16:34:14'),
('community-pillar', 'Pilier de la Communauté', 'Être actif pendant 6 mois consécutifs', 'home-outline', 'ENTRAIDE', 'legendary', 'active_months', 6, '2025-08-08 16:34:14'),
('courage-hearts-10', 'Cœur Brave', 'Recevoir 10 cœurs de courage', 'heart-outline', 'COURAGE', 'common', 'reactions_received', 10, '2025-08-08 16:34:14'),
('courage-hearts-100', 'Héros du Courage', 'Recevoir 100 cœurs de courage', 'medal-outline', 'COURAGE', 'epic', 'reactions_received', 100, '2025-08-08 16:34:14'),
('courage-hearts-50', 'Cœur Courageux', 'Recevoir 50 cœurs de courage', 'heart-outline', 'COURAGE', 'rare', 'reactions_received', 50, '2025-08-08 16:34:14'),
('courage-hearts-500', 'Légende du Courage', 'Recevoir 500 cœurs de courage', 'trophy-outline', 'COURAGE', 'legendary', 'reactions_received', 500, '2025-08-08 16:34:14'),
('daily-streak-100', 'Centurion', '100 jours de partage consécutifs', 'shield-outline', 'PERSEVERANCE', 'epic', 'streak_days', 100, '2025-08-08 16:34:14'),
('daily-streak-14', 'Déterminé', '14 jours de partage consécutifs', 'flame-outline', 'PERSEVERANCE', 'rare', 'streak_days', 14, '2025-08-08 16:34:14'),
('daily-streak-3', 'Régulier', '3 jours de partage consécutifs', 'checkmark-outline', 'PERSEVERANCE', 'common', 'streak_days', 3, '2025-08-08 16:34:14'),
('daily-streak-30', 'Marathonien', '30 jours de partage consécutifs', 'fitness-outline', 'PERSEVERANCE', 'rare', 'streak_days', 30, '2025-08-08 16:34:14'),
('daily-streak-365', 'Immortel', '365 jours de partage consécutifs', 'infinite-outline', 'PERSEVERANCE', 'legendary', 'streak_days', 365, '2025-08-08 16:34:14'),
('daily-streak-60', 'Titan de la Régularité', '60 jours de partage consécutifs', 'barbell-outline', 'PERSEVERANCE', 'epic', 'streak_days', 60, '2025-08-08 16:34:14'),
('daily-streak-7', 'Persévérant', '7 jours de partage consécutifs', 'calendar-outline', 'PERSEVERANCE', 'common', 'streak_days', 7, '2025-08-08 16:34:14'),
('discussion-starter', 'Lanceur de Débats', 'Créer 25 discussions populaires', 'chatbubbles-outline', 'ENTRAIDE', 'epic', 'popular_discussions', 25, '2025-08-08 16:34:14'),
('early-adopter', 'Pionnier', 'Membre des 1000 premiers utilisateurs', 'flag-outline', 'SPECIAL', 'legendary', 'user_rank', 1000, '2025-08-08 16:34:14'),
('empathy-expert', 'Expert en Empathie', 'Donner 25 réactions d\'empathie', 'sad-outline', 'ENTRAIDE', 'common', 'empathy_given', 25, '2025-08-08 16:34:14'),
('fail-master-365', 'Chroniqueur Légendaire', 'Partager 365 fails (un an !)', 'calendar-number-outline', 'COURAGE', 'legendary', 'fail_count', 365, '2025-08-08 16:34:14'),
('fails-10', 'Courageux', 'Poster 10 fails', 'trophy-outline', 'COURAGE', 'rare', 'fail_count', 10, '2025-08-10 13:58:59'),
('fails-100', 'Légende du Courage', 'Poster 100 fails', 'diamond-outline', 'COURAGE', 'legendary', 'fail_count', 100, '2025-08-10 13:58:59'),
('fails-25', 'Maître du Courage', 'Poster 25 fails', 'star-outline', 'COURAGE', 'epic', 'fail_count', 25, '2025-08-10 13:58:59'),
('fails-5', 'Apprenti Courage', 'Poster 5 fails', 'ribbon-outline', 'COURAGE', 'common', 'fail_count', 5, '2025-08-10 13:58:59'),
('fails-50', 'Vétéran du Courage', 'Poster 50 fails', 'shield-outline', 'COURAGE', 'epic', 'fail_count', 50, '2025-08-10 13:58:59'),
('first-fail', 'Premier Pas', 'Félicitations pour votre premier fail partagé !', 'footsteps-outline', 'COURAGE', 'common', 'fail_count', 1, '2025-08-08 16:22:31'),
('first-reaction', 'Première Réaction', 'Recevoir votre première réaction', 'heart-outline', 'COURAGE', 'common', 'first_reaction', 1, '2025-08-08 16:43:44'),
('funny-fail', 'Comédien Amateur', 'Un fail qui a fait rire 25 personnes', 'happy-outline', 'HUMOUR', 'common', 'laugh_reactions', 25, '2025-08-08 16:34:14'),
('globetrotter', 'Globe-Trotter', 'Partager des fails de 10 pays différents', 'airplane-outline', 'SPECIAL', 'legendary', 'countries_count', 10, '2025-08-08 16:34:14'),
('good-vibes', 'Bonnes Vibrations', 'Donner 1000 réactions positives au total', 'thumbs-up-outline', 'ENTRAIDE', 'epic', 'positive_reactions', 1000, '2025-08-08 16:34:14'),
('guardian-angel', 'Ange Gardien', 'Aider 25 membres de la communauté', 'medical-outline', 'ENTRAIDE', 'epic', 'help_count', 25, '2025-08-08 16:34:14'),
('holiday-spirit', 'Esprit des Fêtes', 'Partager pendant les vacances', 'snow-outline', 'SPECIAL', 'rare', 'holiday_fails', 5, '2025-08-08 16:34:14'),
('humor-king', 'Roi du Rire', 'Un fail qui a fait rire 100 personnes', 'sparkles-outline', 'HUMOUR', 'epic', 'laugh_reactions', 100, '2025-08-08 16:34:14'),
('inspiration', 'Source d\'Inspiration', 'Inspirer 100 autres utilisateurs', 'bulb-outline', 'RESILIENCE', 'legendary', 'inspired_users', 100, '2025-08-08 16:34:14'),
('iron-will', 'Volonté de Fer', 'Repartager après 10 échecs consécutifs', 'hammer-outline', 'PERSEVERANCE', 'legendary', 'resilience_count', 10, '2025-08-08 16:34:14'),
('laughter-legend', 'Légende du Rire', 'Recevoir 1000 réactions de rire au total', 'star-outline', 'HUMOUR', 'legendary', 'total_laughs', 1000, '2025-08-08 16:34:14'),
('life-coach', 'Coach de Vie', 'Aider 100 personnes avec des conseils', 'fitness-outline', 'ENTRAIDE', 'legendary', 'advice_given', 100, '2025-08-08 16:34:14'),
('mentor', 'Mentor', 'Commenter constructivement 100 fails', 'chatbox-outline', 'ENTRAIDE', 'rare', 'helpful_comments', 100, '2025-08-08 16:34:14'),
('midnight-warrior', 'Guerrier de Minuit', 'Partager un fail après minuit', 'moon-outline', 'SPECIAL', 'common', 'midnight_fail', 1, '2025-08-08 16:34:14'),
('mood-lifter', 'Remonteur de Moral', '50 fails marqués comme \"drôles\"', 'sunny-outline', 'HUMOUR', 'epic', 'funny_fails', 50, '2025-08-08 16:34:14'),
('never-give-up', 'Jamais Abandonner', 'Maintenir 5 streaks de plus de 7 jours', 'flag-outline', 'PERSEVERANCE', 'epic', 'long_streaks', 5, '2025-08-08 16:34:14'),
('new-year-resolution', 'Résolution du Nouvel An', 'Partager un fail le 1er janvier', 'calendar-outline', 'SPECIAL', 'rare', 'new_year_fail', 1, '2025-08-08 16:34:14'),
('phoenix', 'Phénix', 'Renaître de 10 échecs majeurs', 'flame-outline', 'RESILIENCE', 'epic', 'major_comebacks', 10, '2025-08-08 16:34:14'),
('power-user', 'Utilisateur Expert', 'Utiliser toutes les fonctionnalités de l\'app', 'settings-outline', 'SPECIAL', 'epic', 'features_used', 10, '2025-08-08 16:34:14'),
('reactions-10', 'Supporteur', 'Donner 10 réactions', 'people-outline', 'ENTRAIDE', 'common', 'reaction_given', 10, '2025-08-10 13:58:59'),
('reactions-100', 'Super Supporteur', 'Donner 100 réactions', 'heart-circle-outline', 'ENTRAIDE', 'epic', 'reaction_given', 100, '2025-08-10 13:58:59'),
('reactions-25', 'Supporteur Actif', 'Donner 25 réactions', 'heart-half-outline', 'ENTRAIDE', 'common', 'reaction_given', 25, '2025-08-10 13:58:59'),
('reactions-250', 'Maître du Support', 'Donner 250 réactions', 'heart-half-outline', 'ENTRAIDE', 'legendary', 'reaction_given', 250, '2025-08-10 13:58:59'),
('reactions-50', 'Grand Supporteur', 'Donner 50 réactions', 'heart', 'ENTRAIDE', 'rare', 'reaction_given', 50, '2025-08-10 13:58:59'),
('resilience-champion', 'Champion de Résilience', 'Partager 20 fails de résilience', 'refresh-outline', 'RESILIENCE', 'rare', 'resilience_fails', 20, '2025-08-08 16:34:14'),
('resilience-rookie', 'Apprenti Résilient', 'Partager 5 fails de résilience', 'leaf-outline', 'RESILIENCE', 'common', 'resilience_fails', 5, '2025-08-08 16:34:14'),
('socializer', 'Sociable', 'Interagir avec 50 utilisateurs différents', 'people-circle-outline', 'ENTRAIDE', 'rare', 'unique_interactions', 50, '2025-08-08 16:34:14'),
('stand-up-master', 'Maître du Stand-Up', 'Recevoir 500 réactions de rire au total', 'mic-outline', 'HUMOUR', 'epic', 'total_laughs', 500, '2025-08-08 16:34:14'),
('supportive-soul', 'Âme Bienveillante', 'Donner 50 réactions de soutien', 'heart-half-outline', 'ENTRAIDE', 'common', 'support_given', 50, '2025-08-08 16:34:14'),
('survivor', 'Survivant', 'Surmonter 50 défis personnels', 'shield-checkmark-outline', 'RESILIENCE', 'legendary', 'challenges_overcome', 50, '2025-08-08 16:34:14'),
('trend-setter', 'Créateur de Tendances', 'Lancer 5 tendances dans la communauté', 'trending-up-outline', 'SPECIAL', 'legendary', 'trends_created', 5, '2025-08-08 16:34:14'),
('unbreakable', 'Incassable', 'Maintenir un état d\'esprit positif 100 jours', 'diamond-outline', 'RESILIENCE', 'epic', 'positive_days', 100, '2025-08-08 16:34:14'),
('viral-laugh', 'Sensation Virale', 'Un fail qui a fait rire 500 personnes', 'trending-up-outline', 'HUMOUR', 'legendary', 'laugh_reactions', 500, '2025-08-08 16:34:14'),
('weekend-warrior', 'Guerrier du Weekend', 'Partager 50 fails le weekend', 'bicycle-outline', 'SPECIAL', 'rare', 'weekend_fails', 50, '2025-08-08 16:34:14'),
('wise-counselor', 'Conseiller Sage', 'Commenter constructivement 250 fails', 'library-outline', 'ENTRAIDE', 'epic', 'helpful_comments', 250, '2025-08-08 16:34:14');

-- --------------------------------------------------------

--
-- Structure de la table `comments`
--

DROP TABLE IF EXISTS `comments`;
CREATE TABLE IF NOT EXISTS `comments` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fail_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_encouragement` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_comments_fail_id` (`fail_id`),
  KEY `comments_user_id_fkey` (`user_id`),
  KEY `idx_comments_fail_created` (`fail_id`,`created_at`),
  KEY `idx_comments_user_created` (`user_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `comment_moderation`
--

DROP TABLE IF EXISTS `comment_moderation`;
CREATE TABLE IF NOT EXISTS `comment_moderation` (
  `comment_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('under_review','hidden','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'under_review',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `comment_reactions`
--

DROP TABLE IF EXISTS `comment_reactions`;
CREATE TABLE IF NOT EXISTS `comment_reactions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'like',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_comment_user` (`comment_id`,`user_id`),
  KEY `idx_comment` (`comment_id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `comment_reports`
--

DROP TABLE IF EXISTS `comment_reports`;
CREATE TABLE IF NOT EXISTS `comment_reports` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_report_comment_user` (`comment_id`,`user_id`),
  KEY `idx_comment` (`comment_id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `email_verification_tokens`
--

DROP TABLE IF EXISTS `email_verification_tokens`;
CREATE TABLE IF NOT EXISTS `email_verification_tokens` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `verified_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_email_token` (`token`),
  KEY `idx_evt_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `email_verification_tokens`
--

INSERT INTO `email_verification_tokens` (`id`, `user_id`, `token`, `expires_at`, `created_at`, `verified_at`) VALUES
('0a508900-7f43-435c-9c49-0d33915e7513', '4e35dbce-b10b-4a26-a087-392e88dae48d', '519a193858e5aae771bab5cc6c7332f2a2749a84bc4ea3da3920ed40516b9454', '2025-09-13 12:13:26', '2025-09-12 14:13:25', NULL),
('0e1af484-fa50-46d4-b6da-4fc5138eff9c', '88be98c2-2d3b-4c79-b9b8-6eb1d33e14a8', 'c4dcfa73a090d4ca01d41e2e07441e42777b4f31763de7bdf89626d9f5d722ed', '2025-09-13 12:13:28', '2025-09-12 14:13:27', NULL),
('6d3b09e6-b04b-421c-8e41-3ee50ca74ec4', '9150bb3f-d636-4771-a8b0-67255a14171c', 'adfc580635807bd8fed95542267e103115b3a54b4b7f3ec397a5dc6f5a1a805c', '2025-09-13 10:04:36', '2025-09-12 12:04:36', NULL),
('817785dd-e23d-4c59-a437-733583d85089', '15ca3771-acbe-45fd-87ef-05978769c5bc', '133fa5c3e5c0df19ece12c8e2e772bb343acf02228cc9b04ee6e82ddc48919ce', '2025-09-13 12:08:13', '2025-09-12 14:08:12', NULL),
('98db71a1-48fa-43a3-95f0-6ac3f0949d01', '9595a598-f798-477f-916b-f98daa584255', 'b5e6e2777c4406bcc5360a61bf1c44df6315def2a994b9ccd66d1c21f3ad1b33', '2025-09-13 10:04:37', '2025-09-12 12:04:37', NULL),
('a78604c9-1f52-4ae6-8e95-00b6c7395e10', 'b97020d2-2dba-46ca-a7b4-c5d18d6bcf36', 'abf476ff980205d9266eda710f97bb952bc34d2d60eb1a44d2f5e38864a34610', '2025-09-13 12:13:29', '2025-09-12 14:13:29', NULL),
('c31a4e01-1b79-4a67-957c-a08a13f4734c', 'eb1f90f3-2991-4dad-8887-e79ae69ea1d0', '988e72d8938a9893386f506f975a68e2790eb4b589e3486187d6add84971c56c', '2025-09-13 10:04:38', '2025-09-12 12:04:38', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `error_logs`
--

DROP TABLE IF EXISTS `error_logs`;
CREATE TABLE IF NOT EXISTS `error_logs` (
  `id` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `stack` text COLLATE utf8mb4_unicode_ci,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_type` (`type`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `fails`
--

DROP TABLE IF EXISTS `fails`;
CREATE TABLE IF NOT EXISTS `fails` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_code` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` text COLLATE utf8mb4_unicode_ci,
  `is_anonyme` tinyint(1) DEFAULT '1',
  `comments_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fails_user_id` (`user_id`),
  KEY `idx_fails_created_at` (`created_at`),
  KEY `idx_fails_user_created` (`user_id`,`created_at`),
  KEY `idx_fails_category_created` (`category`,`created_at`),
  KEY `idx_fail_country` (`country_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `fails`
--

INSERT INTO `fails` (`id`, `user_id`, `title`, `description`, `category`, `country_code`, `image_url`, `is_anonyme`, `comments_count`, `created_at`, `updated_at`) VALUES
('133e4595-bddd-44f7-bf94-271330bf4bbf', '4e35dbce-b10b-4a26-a087-392e88dae48d', 'Mon test de fail', 'Description e2e', 'Général', NULL, '/uploads/fails/fail-4e35dbce-b10b-4a26-a087-392e88dae48d-1757686405947-910893937.png', 0, 0, '2025-09-12 14:13:25', '2025-09-12 14:13:26'),
('7843760d-0f9e-40ba-8d32-3c2f5ec07a39', '15ca3771-acbe-45fd-87ef-05978769c5bc', 'Mon test de fail', 'Description e2e', 'Général', NULL, '/uploads/fails/fail-15ca3771-acbe-45fd-87ef-05978769c5bc-1757686093084-422731673.png', 0, 0, '2025-09-12 14:08:13', '2025-09-12 14:08:13'),
('e5e4201a-3ac5-4727-ab65-f46706ec0c04', '9595a598-f798-477f-916b-f98daa584255', 'Mon test de fail', 'Description e2e', 'Général', NULL, '/uploads/fails/fail-9595a598-f798-477f-916b-f98daa584255-1757678677437-226730870.png', 0, 0, '2025-09-12 12:04:37', '2025-09-12 12:04:37');

-- --------------------------------------------------------

--
-- Structure de la table `fail_moderation`
--

DROP TABLE IF EXISTS `fail_moderation`;
CREATE TABLE IF NOT EXISTS `fail_moderation` (
  `fail_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('under_review','hidden','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'under_review',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`fail_id`),
  KEY `idx_fail_moderation_status` (`status`),
  KEY `idx_fail_moderation_updated` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `fail_reactions_archive`
--

DROP TABLE IF EXISTS `fail_reactions_archive`;
CREATE TABLE IF NOT EXISTS `fail_reactions_archive` (
  `fail_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reactions_json` longtext COLLATE utf8mb4_unicode_ci,
  `archived_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`fail_id`),
  KEY `idx_archived_at` (`archived_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `fail_reports`
--

DROP TABLE IF EXISTS `fail_reports`;
CREATE TABLE IF NOT EXISTS `fail_reports` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fail_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_fail_report` (`fail_id`,`user_id`),
  KEY `idx_fail_reports_fail` (`fail_id`),
  KEY `idx_fail_reports_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `legal_documents`
--

DROP TABLE IF EXISTS `legal_documents`;
CREATE TABLE IF NOT EXISTS `legal_documents` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_type` enum('terms','privacy','community_rules','data_policy') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_required` tinyint(1) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `legal_documents`
--

INSERT INTO `legal_documents` (`id`, `title`, `content`, `version`, `document_type`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES
('1467b3d1-7a0d-11f0-b0ea-345a608f406b', 'Conditions d\'utilisation', 'Conditions générales d\'utilisation de FailDaily...', '1.0', 'terms', 1, 1, '2025-08-15 19:21:44', '2025-08-15 19:21:44'),
('14687bb6-7a0d-11f0-b0ea-345a608f406b', 'Politique de confidentialité', 'Politique de protection des données personnelles...', '1.0', 'privacy', 1, 1, '2025-08-15 19:21:44', '2025-08-15 19:21:44'),
('14688815-7a0d-11f0-b0ea-345a608f406b', 'Règles de la communauté', 'Règles de conduite et modération de la communauté...', '1.0', 'community_rules', 1, 1, '2025-08-15 19:21:44', '2025-08-15 19:21:44'),
('1468b92e-7a0d-11f0-b0ea-345a608f406b', 'Politique des données', 'Comment nous collectons et utilisons vos données...', '1.0', 'data_policy', 1, 1, '2025-08-15 19:21:44', '2025-08-15 19:21:44');

-- --------------------------------------------------------

--
-- Structure de la table `parental_consents`
--

DROP TABLE IF EXISTS `parental_consents`;
CREATE TABLE IF NOT EXISTS `parental_consents` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `child_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consent_date` timestamp NOT NULL,
  `consent_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consent_method` enum('email','form','phone') COLLATE utf8mb4_unicode_ci DEFAULT 'email',
  `verification_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `verified_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_child_user` (`child_user_id`),
  KEY `idx_parent_email` (`parent_email`(250)),
  KEY `idx_verification_code` (`verification_code`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_token` (`token`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `profiles`
--

DROP TABLE IF EXISTS `profiles`;
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` text COLLATE utf8mb4_unicode_ci,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `registration_completed` tinyint(1) DEFAULT '0',
  `legal_consent` longtext COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `age_verification` longtext COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `preferences` longtext COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `stats` longtext COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_profiles_display_name` (`display_name`),
  KEY `idx_profiles_registration` (`registration_completed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `profiles`
--

INSERT INTO `profiles` (`id`, `user_id`, `username`, `display_name`, `avatar_url`, `bio`, `registration_completed`, `legal_consent`, `age_verification`, `preferences`, `stats`, `created_at`, `updated_at`) VALUES
('a5ce6715-8fe2-11f0-af92-345a608f406b', '4e35dbce-b10b-4a26-a087-392e88dae48d', NULL, 'User 1757686405155-edit', '/uploads/avatars/avatar-4e35dbce-b10b-4a26-a087-392e88dae48d-1757686406322-126468487.png', 'Bio e2e', 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-12T14:13:25.556Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-12 14:13:25', '2025-09-12 14:13:26'),
('a6b94696-8fd0-11f0-af92-345a608f406b', '9150bb3f-d636-4771-a8b0-67255a14171c', NULL, 'PushUser 1757678675678', NULL, NULL, 1, '{\"birthDate\":null,\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-12T12:04:36.152Z\"}', '{\"birthDate\":null,\"verified\":false}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-12 12:04:36', '2025-09-12 12:04:36'),
('a6fed421-8fe2-11f0-af92-345a608f406b', '88be98c2-2d3b-4c79-b9b8-6eb1d33e14a8', NULL, 'PushUser 1757686407121', NULL, NULL, 1, '{\"birthDate\":null,\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-12T14:13:27.555Z\"}', '{\"birthDate\":null,\"verified\":false}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-12 14:13:27', '2025-09-12 14:13:27'),
('a74384dd-8fd0-11f0-af92-345a608f406b', '9595a598-f798-477f-916b-f98daa584255', NULL, 'User 1757678676712-edit', '/uploads/avatars/avatar-9595a598-f798-477f-916b-f98daa584255-1757678677726-950459735.png', 'Bio e2e', 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-12T12:04:37.064Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-12 12:04:37', '2025-09-12 12:04:37'),
('a7e6b91b-8fe2-11f0-af92-345a608f406b', 'b97020d2-2dba-46ca-a7b4-c5d18d6bcf36', NULL, 'Test User 1757686408684', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-12T14:13:29.075Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-12 14:13:29', '2025-09-12 14:13:29'),
('a7f41927-8fd0-11f0-af92-345a608f406b', 'eb1f90f3-2991-4dad-8887-e79ae69ea1d0', NULL, 'Test User 1757678677879', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-12T12:04:38.221Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-12 12:04:38', '2025-09-12 12:04:38'),
('eb4f4a83-8fe1-11f0-af92-345a608f406b', '15ca3771-acbe-45fd-87ef-05978769c5bc', NULL, 'User 1757686092156-edit', '/uploads/avatars/avatar-15ca3771-acbe-45fd-87ef-05978769c5bc-1757686093449-871815792.png', 'Bio e2e', 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-12T14:08:12.667Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-12 14:08:12', '2025-09-12 14:08:13');

--
-- Déclencheurs `profiles`
--
DROP TRIGGER IF EXISTS `profiles_before_insert`;
DELIMITER $$
CREATE TRIGGER `profiles_before_insert` BEFORE INSERT ON `profiles` FOR EACH ROW BEGIN
    IF NEW.preferences IS NULL THEN
        SET NEW.preferences = '{}';
    END IF;
    IF NEW.stats IS NULL THEN
        SET NEW.stats = '{"badges": [], "totalFails": 0, "couragePoints": 0}';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `push_errors`
--

DROP TABLE IF EXISTS `push_errors`;
CREATE TABLE IF NOT EXISTS `push_errors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `error_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_code` int DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `tokens_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `reactions`
--

DROP TABLE IF EXISTS `reactions`;
CREATE TABLE IF NOT EXISTS `reactions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fail_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reaction_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_fail_reaction` (`user_id`,`fail_id`),
  KEY `idx_reactions_fail_id` (`fail_id`),
  KEY `idx_reactions_user_id` (`user_id`),
  KEY `idx_reactions_fail_type` (`fail_id`,`reaction_type`),
  KEY `idx_reactions_user_created` (`user_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `reaction_logs`
--

DROP TABLE IF EXISTS `reaction_logs`;
CREATE TABLE IF NOT EXISTS `reaction_logs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fail_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fail_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fail_author_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reaction_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `points_awarded` int DEFAULT '0',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `reaction_logs`
--

INSERT INTO `reaction_logs` (`id`, `user_id`, `user_email`, `user_name`, `fail_id`, `fail_title`, `fail_author_name`, `reaction_type`, `points_awarded`, `timestamp`, `ip_address`, `user_agent`, `created_at`) VALUES
('04fc86e2-50fb-4709-9408-a0adfb59dcae', '15ca3771-acbe-45fd-87ef-05978769c5bc', 'e2e.1757686092156@journey.local', NULL, '7843760d-0f9e-40ba-8d32-3c2f5ec07a39', 'Mon test de fail', 'User 1757686092156', 'courage', 0, '2025-09-12 14:08:13', '::ffff:127.0.0.1', '', '2025-09-12 14:08:13'),
('2261cc42-dec5-4676-b936-c96b6c8042ab', '9595a598-f798-477f-916b-f98daa584255', 'e2e.1757678676712@journey.local', NULL, 'e5e4201a-3ac5-4727-ab65-f46706ec0c04', 'Mon test de fail', 'User 1757678676712', 'courage', 0, '2025-09-12 12:04:37', '::ffff:127.0.0.1', '', '2025-09-12 12:04:37'),
('53f885ed-3c16-4dac-8427-e665d9b68875', '15ca3771-acbe-45fd-87ef-05978769c5bc', 'e2e.1757686092156@journey.local', NULL, '7843760d-0f9e-40ba-8d32-3c2f5ec07a39', 'Mon test de fail', 'User 1757686092156', 'courage', 0, '2025-09-12 14:08:13', '::ffff:127.0.0.1', '', '2025-09-12 14:08:13'),
('76a4ad2d-e929-463c-a4cc-4c3568109787', '4e35dbce-b10b-4a26-a087-392e88dae48d', 'e2e.1757686405155@journey.local', NULL, '133e4595-bddd-44f7-bf94-271330bf4bbf', 'Mon test de fail', 'User 1757686405155', 'courage', 0, '2025-09-12 14:13:26', '::ffff:127.0.0.1', '', '2025-09-12 14:13:26'),
('9de5ecb1-fe10-4e78-9bc1-ba30df5c16e5', '9595a598-f798-477f-916b-f98daa584255', 'e2e.1757678676712@journey.local', NULL, 'e5e4201a-3ac5-4727-ab65-f46706ec0c04', 'Mon test de fail', 'User 1757678676712', 'courage', 0, '2025-09-12 12:04:37', '::ffff:127.0.0.1', '', '2025-09-12 12:04:37'),
('a8057340-330b-49bc-9cd2-ee92e1e4a7ea', '4e35dbce-b10b-4a26-a087-392e88dae48d', 'e2e.1757686405155@journey.local', NULL, '133e4595-bddd-44f7-bf94-271330bf4bbf', 'Mon test de fail', 'User 1757686405155', 'courage', 0, '2025-09-12 14:13:26', '::ffff:127.0.0.1', '', '2025-09-12 14:13:26');

-- --------------------------------------------------------

--
-- Structure de la table `request_logs`
--

DROP TABLE IF EXISTS `request_logs`;
CREATE TABLE IF NOT EXISTS `request_logs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(1024) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_code` int DEFAULT NULL,
  `response_ms` int DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country_code` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `params` json DEFAULT NULL,
  `body` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status_code`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `request_logs`
--

INSERT INTO `request_logs` (`id`, `user_id`, `method`, `url`, `status_code`, `response_ms`, `ip_address`, `country_code`, `user_agent`, `params`, `body`, `created_at`) VALUES
('00786572-2654-4c0e-b879-5d13bb9e70a5', NULL, 'PUT', '/api/fails/e5e4201a-3ac5-4727-ab65-f46706ec0c04/comments/56b51893-aeae-4950-b2f6-880bfed37111', 200, 5, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"e5e4201a-3ac5-4727-ab65-f46706ec0c04\", \"commentId\": \"56b51893-aeae-4950-b2f6-880bfed37111\"}', '{\"content\": \"Commentaire édité\"}', '2025-09-12 12:04:37'),
('011701ab-837e-406c-89d5-1e367821f1f8', NULL, 'POST', '/api/fails', 201, 26, '::ffff:127.0.0.1', NULL, '', '{}', '{\"title\": \"Mon test de fail\", \"category\": \"Général\", \"imageUrl\": \"/uploads/fails/fail-4e35dbce-b10b-4a26-a087-392e88dae48d-1757686405947-910893937.png\", \"is_anonyme\": false, \"description\": \"Description e2e\"}', '2025-09-12 14:13:25'),
('03a0eb02-4f4a-4a62-a4a7-8f2f8028a682', NULL, 'GET', '/api/fails/133e4595-bddd-44f7-bf94-271330bf4bbf/comments', 200, 5, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"133e4595-bddd-44f7-bf94-271330bf4bbf\"}', '{}', '2025-09-12 14:13:26'),
('0a5af98f-05c5-41a8-9fce-1a57f63da7fe', NULL, 'DELETE', '/api/fails/e5e4201a-3ac5-4727-ab65-f46706ec0c04/comments/56b51893-aeae-4950-b2f6-880bfed37111', 200, 10, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"e5e4201a-3ac5-4727-ab65-f46706ec0c04\", \"commentId\": \"56b51893-aeae-4950-b2f6-880bfed37111\"}', '{}', '2025-09-12 12:04:37'),
('0c3a54c5-6764-485b-9a03-1f02e866849c', NULL, 'POST', '/api/badges/check-unlock/15ca3771-acbe-45fd-87ef-05978769c5bc', 200, 37, '::ffff:127.0.0.1', NULL, '', '{\"userId\": \"15ca3771-acbe-45fd-87ef-05978769c5bc\"}', '{}', '2025-09-12 14:08:13'),
('0e4c00eb-e4b3-47a5-a8e3-0c3f99d20f3e', NULL, 'GET', '/api/badges/available', 200, 4, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 12:04:37'),
('0ef4f4bc-ddf8-4749-8f05-d150bbac76e1', NULL, 'POST', '/api/auth/login', 200, 317, '::ffff:127.0.0.1', NULL, '', '{}', '{\"email\": \"e2e.1757678676712@journey.local\", \"password\": \"***\"}', '2025-09-12 12:04:37'),
('185444f0-75d6-4743-8dbe-26f9c77cd3f4', NULL, 'DELETE', '/api/fails/7843760d-0f9e-40ba-8d32-3c2f5ec07a39/reactions', 200, 11, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"7843760d-0f9e-40ba-8d32-3c2f5ec07a39\"}', '{\"reactionType\": \"courage\"}', '2025-09-12 14:08:13'),
('1884c30b-d82e-4c84-a6ef-b5bb3f47047c', NULL, 'POST', '/api/auth/login', 200, 322, '::ffff:127.0.0.1', NULL, '', '{}', '{\"email\": \"e2e.1757686405155@journey.local\", \"password\": \"***\"}', '2025-09-12 14:13:25'),
('309f8760-fba7-48d4-8ecb-34077a470169', NULL, 'GET', '/api/fails/e5e4201a-3ac5-4727-ab65-f46706ec0c04/comments', 200, 4, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"e5e4201a-3ac5-4727-ab65-f46706ec0c04\"}', '{}', '2025-09-12 12:04:37'),
('31ba2713-3889-4aac-b005-2389bdb3b91f', NULL, 'POST', '/api/fails/7843760d-0f9e-40ba-8d32-3c2f5ec07a39/reactions', 200, 88, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"7843760d-0f9e-40ba-8d32-3c2f5ec07a39\"}', '{\"reactionType\": \"courage\"}', '2025-09-12 14:08:13'),
('3736f7b4-149c-4c67-811f-2d22c1d702ac', NULL, 'PUT', '/api/auth/profile', 200, 7, '::ffff:127.0.0.1', NULL, '', '{}', '{\"bio\": \"Bio e2e\", \"displayName\": \"User 1757686092156-edit\"}', '2025-09-12 14:08:13'),
('3dff6ba8-1ebb-4ee0-98c9-9b51f3f159e7', NULL, 'GET', '/api/fails/133e4595-bddd-44f7-bf94-271330bf4bbf/reactions', 200, 8, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"133e4595-bddd-44f7-bf94-271330bf4bbf\"}', '{}', '2025-09-12 14:13:26'),
('3f0b0db1-16a4-47c2-8168-9d107db4563e', NULL, 'POST', '/api/auth/register', 201, 486, '::ffff:127.0.0.1', NULL, '', '{}', '{\"email\": \"e2e.1757686092156@journey.local\", \"password\": \"***\", \"birthDate\": \"1990-01-01\", \"displayName\": \"User 1757686092156\", \"agreeToTerms\": true}', '2025-09-12 14:08:12'),
('42fecb27-5798-492c-b079-a792c28597f9', NULL, 'POST', '/api/auth/login', 200, 320, '::ffff:127.0.0.1', NULL, '', '{}', '{\"email\": \"temp.test.1757678677879@test.local\", \"password\": \"***\"}', '2025-09-12 12:04:38'),
('44fb4cc8-7da2-484c-8a05-30a065a3d7c4', NULL, 'POST', '/api/push/test', 200, 4, '::ffff:127.0.0.1', NULL, '', '{}', '{\"body\": \"Hello\", \"title\": \"Test\"}', '2025-09-12 14:13:27'),
('48bc7679-fd95-4bdd-bce2-de4a0166cefd', NULL, 'POST', '/api/auth/register', 201, 420, '::ffff:127.0.0.1', NULL, '', '{}', '{\"email\": \"push.1757678675678@test.local\", \"password\": \"***\", \"displayName\": \"PushUser 1757678675678\"}', '2025-09-12 12:04:36'),
('4b50f73a-781e-46d6-bffa-8cea90e9eac4', NULL, 'POST', '/api/auth/register', 201, 348, '::ffff:127.0.0.1', NULL, '', '{}', '{\"email\": \"temp.test.1757678677879@test.local\", \"password\": \"***\", \"birthDate\": \"1990-01-01\", \"displayName\": \"Test User 1757678677879\", \"agreeToTerms\": true}', '2025-09-12 12:04:38'),
('5a4265c2-e9bb-4189-84b4-1a2fba80339c', NULL, 'GET', '/api/auth/profile', 200, 4, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 12:04:37'),
('65691f51-9267-44b0-98ca-5808d26a8c4a', NULL, 'POST', '/api/fails/133e4595-bddd-44f7-bf94-271330bf4bbf/comments', 201, 51, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"133e4595-bddd-44f7-bf94-271330bf4bbf\"}', '{\"content\": \"Mon commentaire e2e\"}', '2025-09-12 14:13:26'),
('71fe14e5-414a-43ec-9dc6-7364fe04e9ac', NULL, 'POST', '/api/push/test', 200, 3, '::ffff:127.0.0.1', NULL, '', '{}', '{\"body\": \"Hello\", \"title\": \"Test\"}', '2025-09-12 12:04:36'),
('74e25f03-c2ee-4ebc-be6d-8c4a2ed34b88', NULL, 'POST', '/api/push/register', 200, 46, '::ffff:127.0.0.1', NULL, '', '{}', '{\"token\": \"***\", \"platform\": \"web\"}', '2025-09-12 14:13:27'),
('7a2be746-51b0-484c-a5dc-3e92d4f743d5', NULL, 'GET', '/api/auth/profile', 200, 4, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 14:08:13'),
('7b68cd18-1cf5-4252-975c-7b74aa42b512', NULL, 'GET', '/api/fails/7843760d-0f9e-40ba-8d32-3c2f5ec07a39/reactions', 200, 6, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"7843760d-0f9e-40ba-8d32-3c2f5ec07a39\"}', '{}', '2025-09-12 14:08:13'),
('7bee0e39-d92d-4501-bbab-804f1f6ac7b0', NULL, 'POST', '/api/auth/register', 201, 385, '::ffff:127.0.0.1', NULL, '', '{}', '{\"email\": \"temp.test.1757686408684@test.local\", \"password\": \"***\", \"birthDate\": \"1990-01-01\", \"displayName\": \"Test User 1757686408684\", \"agreeToTerms\": true}', '2025-09-12 14:13:29'),
('825e691c-1cfa-4454-a580-85c9437ad78a', NULL, 'PUT', '/api/auth/profile', 200, 6, '::ffff:127.0.0.1', NULL, '', '{}', '{\"bio\": \"Bio e2e\", \"displayName\": \"User 1757678676712-edit\"}', '2025-09-12 12:04:37'),
('8934bbc5-b7fb-4cc3-90f0-e0914c6ad432', NULL, 'GET', '/api/fails/anonymes', 200, 5, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 12:04:38'),
('8a87ae29-988a-41c0-bfb7-1fc91aa1cba7', NULL, 'GET', '/api/fails/e5e4201a-3ac5-4727-ab65-f46706ec0c04/reactions', 200, 5, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"e5e4201a-3ac5-4727-ab65-f46706ec0c04\"}', '{}', '2025-09-12 12:04:37'),
('8be49204-953a-47c1-a977-5b82b5282050', NULL, 'POST', '/api/upload/image', 200, 6, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 12:04:37'),
('93166954-93dd-4f64-aa4b-5d454daae191', NULL, 'PUT', '/api/fails/133e4595-bddd-44f7-bf94-271330bf4bbf/comments/f713f526-f2b8-4db7-9261-d4f88a724ea7', 200, 7, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"133e4595-bddd-44f7-bf94-271330bf4bbf\", \"commentId\": \"f713f526-f2b8-4db7-9261-d4f88a724ea7\"}', '{\"content\": \"Commentaire édité\"}', '2025-09-12 14:13:26'),
('942a4602-0d4c-477e-b866-a967858aeed8', NULL, 'POST', '/api/upload/avatar', 200, 5, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 14:13:26'),
('94b087dd-0bc9-4496-8379-588eec98fd7a', NULL, 'DELETE', '/api/fails/133e4595-bddd-44f7-bf94-271330bf4bbf/reactions', 200, 12, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"133e4595-bddd-44f7-bf94-271330bf4bbf\"}', '{\"reactionType\": \"courage\"}', '2025-09-12 14:13:26'),
('95f98074-abad-4e95-a58b-34b694cf4a2c', NULL, 'POST', '/api/auth/register', 201, 425, '::ffff:127.0.0.1', NULL, '', '{}', '{\"email\": \"push.1757686407121@test.local\", \"password\": \"***\", \"displayName\": \"PushUser 1757686407121\"}', '2025-09-12 14:13:27'),
('96837d4e-8e3f-4d46-a0d6-c78003ae9e55', NULL, 'POST', '/api/auth/login', 200, 319, '::ffff:127.0.0.1', NULL, '', '{}', '{\"email\": \"push.1757678675678@test.local\", \"password\": \"***\"}', '2025-09-12 12:04:36'),
('99d22883-1cfc-42b5-bb8e-b9f3e8318dec', NULL, 'POST', '/api/auth/register', 201, 353, '::ffff:127.0.0.1', NULL, '', '{}', '{\"email\": \"e2e.1757678676712@journey.local\", \"password\": \"***\", \"birthDate\": \"1990-01-01\", \"displayName\": \"User 1757678676712\", \"agreeToTerms\": true}', '2025-09-12 12:04:37'),
('99f0ead4-0693-4658-927b-6a1279e6a316', NULL, 'POST', '/api/auth/login', 200, 321, '::ffff:127.0.0.1', NULL, '', '{}', '{\"email\": \"e2e.1757686092156@journey.local\", \"password\": \"***\"}', '2025-09-12 14:08:13'),
('9a52865e-031d-4dda-a093-a19b724176f5', NULL, 'POST', '/api/fails', 201, 32, '::ffff:127.0.0.1', NULL, '', '{}', '{\"title\": \"Mon test de fail\", \"category\": \"Général\", \"imageUrl\": \"/uploads/fails/fail-9595a598-f798-477f-916b-f98daa584255-1757678677437-226730870.png\", \"is_anonyme\": false, \"description\": \"Description e2e\"}', '2025-09-12 12:04:37'),
('9b97c1be-1e82-426e-a5cb-bc024aa53178', NULL, 'GET', '/api/auth/verify', 200, 5, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 14:13:25'),
('a3256d81-b9b4-497d-8eef-fb4f1123ecff', NULL, 'GET', '/api/auth/verify', 200, 3, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 12:04:37'),
('a574bc51-c09c-4257-8563-dc4021ac4750', NULL, 'PUT', '/api/fails/7843760d-0f9e-40ba-8d32-3c2f5ec07a39/comments/fe2a2177-a96e-4452-8dcd-d28ea305bdf8', 200, 9, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"7843760d-0f9e-40ba-8d32-3c2f5ec07a39\", \"commentId\": \"fe2a2177-a96e-4452-8dcd-d28ea305bdf8\"}', '{\"content\": \"Commentaire édité\"}', '2025-09-12 14:08:13'),
('a8acd0ae-ebb1-45ef-98f1-e80121f418fb', NULL, 'GET', '/api/fails/public', 200, 4, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 14:13:25'),
('aa069db4-b685-4e7c-bed1-0b0d30ab16ba', NULL, 'POST', '/api/push/register', 200, 51, '::ffff:127.0.0.1', NULL, '', '{}', '{\"token\": \"***\", \"platform\": \"web\"}', '2025-09-12 12:04:36'),
('aa0db292-e5a0-401f-854d-cab31bd2b64b', NULL, 'GET', '/api/fails/7843760d-0f9e-40ba-8d32-3c2f5ec07a39/comments', 200, 6, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"7843760d-0f9e-40ba-8d32-3c2f5ec07a39\"}', '{}', '2025-09-12 14:08:13'),
('abf74709-518b-41b5-8701-f8aa74d196e4', NULL, 'GET', '/api/fails/public', 200, 5, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 12:04:37'),
('ae0fb775-098f-4481-ad67-5d6c1ad0f97d', NULL, 'POST', '/api/fails/7843760d-0f9e-40ba-8d32-3c2f5ec07a39/comments', 201, 53, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"7843760d-0f9e-40ba-8d32-3c2f5ec07a39\"}', '{\"content\": \"Mon commentaire e2e\"}', '2025-09-12 14:08:13'),
('b06c675c-aecd-482e-9ff0-7bae8c4b04c5', NULL, 'PUT', '/api/auth/profile', 200, 7, '::ffff:127.0.0.1', NULL, '', '{}', '{\"bio\": \"Bio e2e\", \"displayName\": \"User 1757686405155-edit\"}', '2025-09-12 14:13:26'),
('b202756d-1131-48c8-ac53-795fe986919c', NULL, 'GET', '/api/fails/e5e4201a-3ac5-4727-ab65-f46706ec0c04', 200, 10, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"e5e4201a-3ac5-4727-ab65-f46706ec0c04\"}', '{}', '2025-09-12 12:04:37'),
('b6d12445-2417-4e23-9c67-e90180e4b7c7', NULL, 'POST', '/api/upload/image', 200, 6, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 14:08:13'),
('b7ef6d78-d435-4d64-9df3-737beb2d28b0', NULL, 'GET', '/api/auth/verify', 200, 5, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 14:08:13'),
('bd76dd80-b859-4b99-b232-d466f0735405', NULL, 'GET', '/api/badges/available', 200, 6, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 14:08:13'),
('bf413c36-f5e2-46d2-91b9-79eda0f4f7c2', NULL, 'GET', '/api/fails/133e4595-bddd-44f7-bf94-271330bf4bbf', 200, 5, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"133e4595-bddd-44f7-bf94-271330bf4bbf\"}', '{}', '2025-09-12 14:13:26'),
('bf77308c-9977-412e-abd5-ef68504afa83', NULL, 'POST', '/api/upload/avatar', 200, 4, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 14:08:13'),
('c0cafeb2-5f96-49c2-a669-96535aaa1d70', NULL, 'POST', '/api/upload/avatar', 200, 5, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 12:04:37'),
('c3985be1-8592-40b5-84cb-62ebb295ea74', NULL, 'POST', '/api/auth/login', 200, 341, '::ffff:127.0.0.1', NULL, '', '{}', '{\"email\": \"push.1757686407121@test.local\", \"password\": \"***\"}', '2025-09-12 14:13:27'),
('c3ffd3c2-6add-40e8-b213-696f091a789b', NULL, 'GET', '/api/fails/7843760d-0f9e-40ba-8d32-3c2f5ec07a39', 200, 5, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"7843760d-0f9e-40ba-8d32-3c2f5ec07a39\"}', '{}', '2025-09-12 14:08:13'),
('c46a26a7-b061-4c7a-b290-76a75c3dd10d', NULL, 'GET', '/api/badges/available', 200, 4, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 14:13:26'),
('c65a18bc-1cd7-4c45-b511-f7bb321d5b6c', NULL, 'POST', '/api/badges/check-unlock/4e35dbce-b10b-4a26-a087-392e88dae48d', 200, 39, '::ffff:127.0.0.1', NULL, '', '{\"userId\": \"4e35dbce-b10b-4a26-a087-392e88dae48d\"}', '{}', '2025-09-12 14:13:26'),
('cb0ff1d9-72b9-4470-ba19-cffff0405dea', NULL, 'DELETE', '/api/fails/133e4595-bddd-44f7-bf94-271330bf4bbf/comments/f713f526-f2b8-4db7-9261-d4f88a724ea7', 200, 18, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"133e4595-bddd-44f7-bf94-271330bf4bbf\", \"commentId\": \"f713f526-f2b8-4db7-9261-d4f88a724ea7\"}', '{}', '2025-09-12 14:13:26'),
('cf69d8b0-8715-4886-8bfd-3c6de4d6a4cc', NULL, 'GET', '/api/auth/profile', 200, 6, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 14:13:25'),
('d161675d-6a23-42fc-81fd-7d5604fcbd3a', NULL, 'POST', '/api/fails/e5e4201a-3ac5-4727-ab65-f46706ec0c04/comments', 201, 38, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"e5e4201a-3ac5-4727-ab65-f46706ec0c04\"}', '{\"content\": \"Mon commentaire e2e\"}', '2025-09-12 12:04:37'),
('d40d6ec8-6081-40a0-8917-ed27114c33f1', NULL, 'POST', '/api/fails', 201, 25, '::ffff:127.0.0.1', NULL, '', '{}', '{\"title\": \"Mon test de fail\", \"category\": \"Général\", \"imageUrl\": \"/uploads/fails/fail-15ca3771-acbe-45fd-87ef-05978769c5bc-1757686093084-422731673.png\", \"is_anonyme\": false, \"description\": \"Description e2e\"}', '2025-09-12 14:08:13'),
('d4109ecb-24ad-4bd2-8c30-1bf081b1924d', NULL, 'GET', '/api/fails/public', 200, 5, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 14:08:13'),
('d4c08350-cb6d-4d17-bd3b-d26aae88eaa7', NULL, 'DELETE', '/api/fails/e5e4201a-3ac5-4727-ab65-f46706ec0c04/reactions', 200, 10, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"e5e4201a-3ac5-4727-ab65-f46706ec0c04\"}', '{\"reactionType\": \"courage\"}', '2025-09-12 12:04:37'),
('e206e96c-6a21-48da-9cb1-cb11344c1c12', NULL, 'DELETE', '/api/fails/7843760d-0f9e-40ba-8d32-3c2f5ec07a39/comments/fe2a2177-a96e-4452-8dcd-d28ea305bdf8', 200, 14, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"7843760d-0f9e-40ba-8d32-3c2f5ec07a39\", \"commentId\": \"fe2a2177-a96e-4452-8dcd-d28ea305bdf8\"}', '{}', '2025-09-12 14:08:13'),
('ee681522-698a-4366-92e8-be6459247688', NULL, 'POST', '/api/fails/133e4595-bddd-44f7-bf94-271330bf4bbf/reactions', 200, 92, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"133e4595-bddd-44f7-bf94-271330bf4bbf\"}', '{\"reactionType\": \"courage\"}', '2025-09-12 14:13:26'),
('ee884d2e-6e8d-4e2a-bcb6-d2fe9adc4078', NULL, 'POST', '/api/auth/register', 201, 405, '::ffff:127.0.0.1', NULL, '', '{}', '{\"email\": \"e2e.1757686405155@journey.local\", \"password\": \"***\", \"birthDate\": \"1990-01-01\", \"displayName\": \"User 1757686405155\", \"agreeToTerms\": true}', '2025-09-12 14:13:25'),
('f7b47228-b81d-47f2-8ba5-5195e0fbdd3f', NULL, 'POST', '/api/fails/e5e4201a-3ac5-4727-ab65-f46706ec0c04/reactions', 200, 58, '::ffff:127.0.0.1', NULL, '', '{\"id\": \"e5e4201a-3ac5-4727-ab65-f46706ec0c04\"}', '{\"reactionType\": \"courage\"}', '2025-09-12 12:04:37'),
('f7d5cd06-2c89-40a2-9eac-fa1afbd9787c', NULL, 'POST', '/api/auth/login', 200, 323, '::ffff:127.0.0.1', NULL, '', '{}', '{\"email\": \"temp.test.1757686408684@test.local\", \"password\": \"***\"}', '2025-09-12 14:13:29'),
('fc859139-142c-42e1-90af-6c9f69524f5c', NULL, 'POST', '/api/upload/image', 200, 6, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 14:13:25'),
('fd9f4150-e5b8-4787-97e8-aa64d8c63fb7', NULL, 'POST', '/api/badges/check-unlock/9595a598-f798-477f-916b-f98daa584255', 200, 23, '::ffff:127.0.0.1', NULL, '', '{\"userId\": \"9595a598-f798-477f-916b-f98daa584255\"}', '{}', '2025-09-12 12:04:37'),
('ff2e451e-afb6-474d-92a6-495c13a235b4', NULL, 'GET', '/api/fails/anonymes', 200, 4, '::ffff:127.0.0.1', NULL, '', '{}', '{}', '2025-09-12 14:13:29');

-- --------------------------------------------------------

--
-- Structure de la table `system_logs`
--

DROP TABLE IF EXISTS `system_logs`;
CREATE TABLE IF NOT EXISTS `system_logs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `level` enum('info','warning','error','debug') COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` longtext COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `system_logs_user_id_fkey` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `system_logs`
--

INSERT INTO `system_logs` (`id`, `level`, `message`, `action`, `details`, `user_id`, `timestamp`, `created_at`) VALUES
('a5d028b9-8fe2-11f0-af92-345a608f406b', 'info', 'User registered', 'user_register', '{\"email\":\"e2e.1757686405155@journey.local\",\"displayName\":\"User 1757686405155\"}', '4e35dbce-b10b-4a26-a087-392e88dae48d', '2025-09-12 14:13:25', '2025-09-12 14:13:25'),
('a603aa92-8fe2-11f0-af92-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"e2e.1757686405155@journey.local\"}', '4e35dbce-b10b-4a26-a087-392e88dae48d', '2025-09-12 14:13:25', '2025-09-12 14:13:25'),
('a606fcc7-8fe2-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '4e35dbce-b10b-4a26-a087-392e88dae48d', '2025-09-12 14:13:25', '2025-09-12 14:13:25'),
('a60e0cd3-8fe2-11f0-af92-345a608f406b', 'info', 'Fail created', 'fail_create', '{\"failId\":\"133e4595-bddd-44f7-bf94-271330bf4bbf\",\"title\":\"Mon test de fail\",\"category\":\"Général\",\"is_anonyme\":false}', '4e35dbce-b10b-4a26-a087-392e88dae48d', '2025-09-12 14:13:25', '2025-09-12 14:13:25'),
('a614f15d-8fe2-11f0-af92-345a608f406b', 'info', 'Reaction added', 'reaction_add', '{\"failId\":\"133e4595-bddd-44f7-bf94-271330bf4bbf\",\"reactionType\":\"courage\"}', '4e35dbce-b10b-4a26-a087-392e88dae48d', '2025-09-12 14:13:26', '2025-09-12 14:13:26'),
('a6262466-8fe2-11f0-af92-345a608f406b', 'info', 'Reaction removed', 'reaction_remove', '{\"failId\":\"133e4595-bddd-44f7-bf94-271330bf4bbf\",\"reactionType\":null}', '4e35dbce-b10b-4a26-a087-392e88dae48d', '2025-09-12 14:13:26', '2025-09-12 14:13:26'),
('a6294f52-8fe2-11f0-af92-345a608f406b', 'info', 'Comment added', 'comment_add', '{\"commentId\":\"f713f526-f2b8-4db7-9261-d4f88a724ea7\",\"failId\":\"133e4595-bddd-44f7-bf94-271330bf4bbf\"}', '4e35dbce-b10b-4a26-a087-392e88dae48d', '2025-09-12 14:13:26', '2025-09-12 14:13:26'),
('a632955d-8fe2-11f0-af92-345a608f406b', 'info', 'Comment updated', 'comment_update', '{\"commentId\":\"f713f526-f2b8-4db7-9261-d4f88a724ea7\",\"failId\":\"133e4595-bddd-44f7-bf94-271330bf4bbf\"}', '4e35dbce-b10b-4a26-a087-392e88dae48d', '2025-09-12 14:13:26', '2025-09-12 14:13:26'),
('a635ff11-8fe2-11f0-af92-345a608f406b', 'warning', 'Comment deleted', 'comment_delete', '{\"commentId\":\"f713f526-f2b8-4db7-9261-d4f88a724ea7\",\"failId\":\"133e4595-bddd-44f7-bf94-271330bf4bbf\"}', '4e35dbce-b10b-4a26-a087-392e88dae48d', '2025-09-12 14:13:26', '2025-09-12 14:13:26'),
('a6409e30-8fe2-11f0-af92-345a608f406b', 'info', 'Profile updated', 'profile_update', '{\"displayName\":\"User 1757686405155-edit\",\"hasBio\":true,\"hasAvatar\":false}', '4e35dbce-b10b-4a26-a087-392e88dae48d', '2025-09-12 14:13:26', '2025-09-12 14:13:26'),
('a6bb65ee-8fd0-11f0-af92-345a608f406b', 'info', 'User registered', 'user_register', '{\"email\":\"push.1757678675678@test.local\",\"displayName\":\"PushUser 1757678675678\"}', '9150bb3f-d636-4771-a8b0-67255a14171c', '2025-09-12 12:04:36', '2025-09-12 12:04:36'),
('a6ee9d09-8fd0-11f0-af92-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"push.1757678675678@test.local\"}', '9150bb3f-d636-4771-a8b0-67255a14171c', '2025-09-12 12:04:36', '2025-09-12 12:04:36'),
('a70085ae-8fe2-11f0-af92-345a608f406b', 'info', 'User registered', 'user_register', '{\"email\":\"push.1757686407121@test.local\",\"displayName\":\"PushUser 1757686407121\"}', '88be98c2-2d3b-4c79-b9b8-6eb1d33e14a8', '2025-09-12 14:13:27', '2025-09-12 14:13:27'),
('a736394f-8fe2-11f0-af92-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"push.1757686407121@test.local\"}', '88be98c2-2d3b-4c79-b9b8-6eb1d33e14a8', '2025-09-12 14:13:27', '2025-09-12 14:13:27'),
('a74520e8-8fd0-11f0-af92-345a608f406b', 'info', 'User registered', 'user_register', '{\"email\":\"e2e.1757678676712@journey.local\",\"displayName\":\"User 1757678676712\"}', '9595a598-f798-477f-916b-f98daa584255', '2025-09-12 12:04:37', '2025-09-12 12:04:37'),
('a7772b83-8fd0-11f0-af92-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"e2e.1757678676712@journey.local\"}', '9595a598-f798-477f-916b-f98daa584255', '2025-09-12 12:04:37', '2025-09-12 12:04:37'),
('a77a004b-8fd0-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '9595a598-f798-477f-916b-f98daa584255', '2025-09-12 12:04:37', '2025-09-12 12:04:37'),
('a781f55f-8fd0-11f0-af92-345a608f406b', 'info', 'Fail created', 'fail_create', '{\"failId\":\"e5e4201a-3ac5-4727-ab65-f46706ec0c04\",\"title\":\"Mon test de fail\",\"category\":\"Général\",\"is_anonyme\":false}', '9595a598-f798-477f-916b-f98daa584255', '2025-09-12 12:04:37', '2025-09-12 12:04:37'),
('a788a354-8fd0-11f0-af92-345a608f406b', 'info', 'Reaction added', 'reaction_add', '{\"failId\":\"e5e4201a-3ac5-4727-ab65-f46706ec0c04\",\"reactionType\":\"courage\"}', '9595a598-f798-477f-916b-f98daa584255', '2025-09-12 12:04:37', '2025-09-12 12:04:37'),
('a7938ff9-8fd0-11f0-af92-345a608f406b', 'info', 'Reaction removed', 'reaction_remove', '{\"failId\":\"e5e4201a-3ac5-4727-ab65-f46706ec0c04\",\"reactionType\":null}', '9595a598-f798-477f-916b-f98daa584255', '2025-09-12 12:04:37', '2025-09-12 12:04:37'),
('a7961374-8fd0-11f0-af92-345a608f406b', 'info', 'Comment added', 'comment_add', '{\"commentId\":\"56b51893-aeae-4950-b2f6-880bfed37111\",\"failId\":\"e5e4201a-3ac5-4727-ab65-f46706ec0c04\"}', '9595a598-f798-477f-916b-f98daa584255', '2025-09-12 12:04:37', '2025-09-12 12:04:37'),
('a79d0f29-8fd0-11f0-af92-345a608f406b', 'info', 'Comment updated', 'comment_update', '{\"commentId\":\"56b51893-aeae-4950-b2f6-880bfed37111\",\"failId\":\"e5e4201a-3ac5-4727-ab65-f46706ec0c04\"}', '9595a598-f798-477f-916b-f98daa584255', '2025-09-12 12:04:37', '2025-09-12 12:04:37'),
('a79f54a3-8fd0-11f0-af92-345a608f406b', 'warning', 'Comment deleted', 'comment_delete', '{\"commentId\":\"56b51893-aeae-4950-b2f6-880bfed37111\",\"failId\":\"e5e4201a-3ac5-4727-ab65-f46706ec0c04\"}', '9595a598-f798-477f-916b-f98daa584255', '2025-09-12 12:04:37', '2025-09-12 12:04:37'),
('a7a6c849-8fd0-11f0-af92-345a608f406b', 'info', 'Profile updated', 'profile_update', '{\"displayName\":\"User 1757678676712-edit\",\"hasBio\":true,\"hasAvatar\":false}', '9595a598-f798-477f-916b-f98daa584255', '2025-09-12 12:04:37', '2025-09-12 12:04:37'),
('a7e817db-8fe2-11f0-af92-345a608f406b', 'info', 'User registered', 'user_register', '{\"email\":\"temp.test.1757686408684@test.local\",\"displayName\":\"Test User 1757686408684\"}', 'b97020d2-2dba-46ca-a7b4-c5d18d6bcf36', '2025-09-12 14:13:29', '2025-09-12 14:13:29'),
('a7f55241-8fd0-11f0-af92-345a608f406b', 'info', 'User registered', 'user_register', '{\"email\":\"temp.test.1757678677879@test.local\",\"displayName\":\"Test User 1757678677879\"}', 'eb1f90f3-2991-4dad-8887-e79ae69ea1d0', '2025-09-12 12:04:38', '2025-09-12 12:04:38'),
('a81ab0d9-8fe2-11f0-af92-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"temp.test.1757686408684@test.local\"}', 'b97020d2-2dba-46ca-a7b4-c5d18d6bcf36', '2025-09-12 14:13:29', '2025-09-12 14:13:29'),
('a8276909-8fd0-11f0-af92-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"temp.test.1757678677879@test.local\"}', 'eb1f90f3-2991-4dad-8887-e79ae69ea1d0', '2025-09-12 12:04:38', '2025-09-12 12:04:38'),
('eb50d768-8fe1-11f0-af92-345a608f406b', 'info', 'User registered', 'user_register', '{\"email\":\"e2e.1757686092156@journey.local\",\"displayName\":\"User 1757686092156\"}', '15ca3771-acbe-45fd-87ef-05978769c5bc', '2025-09-12 14:08:12', '2025-09-12 14:08:12'),
('eb88e697-8fe1-11f0-af92-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"e2e.1757686092156@journey.local\"}', '15ca3771-acbe-45fd-87ef-05978769c5bc', '2025-09-12 14:08:13', '2025-09-12 14:08:13'),
('eb8bf79c-8fe1-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '15ca3771-acbe-45fd-87ef-05978769c5bc', '2025-09-12 14:08:13', '2025-09-12 14:08:13'),
('eb9307c2-8fe1-11f0-af92-345a608f406b', 'info', 'Fail created', 'fail_create', '{\"failId\":\"7843760d-0f9e-40ba-8d32-3c2f5ec07a39\",\"title\":\"Mon test de fail\",\"category\":\"Général\",\"is_anonyme\":false}', '15ca3771-acbe-45fd-87ef-05978769c5bc', '2025-09-12 14:08:13', '2025-09-12 14:08:13'),
('eb9a97b1-8fe1-11f0-af92-345a608f406b', 'info', 'Reaction added', 'reaction_add', '{\"failId\":\"7843760d-0f9e-40ba-8d32-3c2f5ec07a39\",\"reactionType\":\"courage\"}', '15ca3771-acbe-45fd-87ef-05978769c5bc', '2025-09-12 14:08:13', '2025-09-12 14:08:13'),
('ebaa3b4f-8fe1-11f0-af92-345a608f406b', 'info', 'Reaction removed', 'reaction_remove', '{\"failId\":\"7843760d-0f9e-40ba-8d32-3c2f5ec07a39\",\"reactionType\":null}', '15ca3771-acbe-45fd-87ef-05978769c5bc', '2025-09-12 14:08:13', '2025-09-12 14:08:13'),
('ebad9b67-8fe1-11f0-af92-345a608f406b', 'info', 'Comment added', 'comment_add', '{\"commentId\":\"fe2a2177-a96e-4452-8dcd-d28ea305bdf8\",\"failId\":\"7843760d-0f9e-40ba-8d32-3c2f5ec07a39\"}', '15ca3771-acbe-45fd-87ef-05978769c5bc', '2025-09-12 14:08:13', '2025-09-12 14:08:13'),
('ebb77ee8-8fe1-11f0-af92-345a608f406b', 'info', 'Comment updated', 'comment_update', '{\"commentId\":\"fe2a2177-a96e-4452-8dcd-d28ea305bdf8\",\"failId\":\"7843760d-0f9e-40ba-8d32-3c2f5ec07a39\"}', '15ca3771-acbe-45fd-87ef-05978769c5bc', '2025-09-12 14:08:13', '2025-09-12 14:08:13'),
('ebba7951-8fe1-11f0-af92-345a608f406b', 'warning', 'Comment deleted', 'comment_delete', '{\"commentId\":\"fe2a2177-a96e-4452-8dcd-d28ea305bdf8\",\"failId\":\"7843760d-0f9e-40ba-8d32-3c2f5ec07a39\"}', '15ca3771-acbe-45fd-87ef-05978769c5bc', '2025-09-12 14:08:13', '2025-09-12 14:08:13'),
('ebc46612-8fe1-11f0-af92-345a608f406b', 'info', 'Profile updated', 'profile_update', '{\"displayName\":\"User 1757686092156-edit\",\"hasBio\":true,\"hasAvatar\":false}', '15ca3771-acbe-45fd-87ef-05978769c5bc', '2025-09-12 14:08:13', '2025-09-12 14:08:13');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_confirmed` tinyint(1) DEFAULT '0',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Sera géré par votre système auth',
  `role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `last_login` timestamp NULL DEFAULT NULL,
  `login_count` int DEFAULT '0',
  `fails_count` int DEFAULT '0',
  `account_status` enum('active','suspended','deleted') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `registration_step` enum('basic','age_verified','legal_accepted','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'basic',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_status` (`account_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `email`, `email_confirmed`, `password_hash`, `role`, `last_login`, `login_count`, `fails_count`, `account_status`, `registration_step`, `created_at`, `updated_at`) VALUES
('15ca3771-acbe-45fd-87ef-05978769c5bc', 'e2e.1757686092156@journey.local', 0, '$2b$12$DwvorXP7rBbegXeOdviDcejGRiMh2XVo4SzDBSS/5SDF6H0d6rccS', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 14:08:12', '2025-09-12 14:08:12'),
('4e35dbce-b10b-4a26-a087-392e88dae48d', 'e2e.1757686405155@journey.local', 0, '$2b$12$Xf2xjzEy5cRO9DmKE12Eeevd.ZyOZ0RghcToFtSKIZKkotbXNkyFS', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 14:13:25', '2025-09-12 14:13:25'),
('88be98c2-2d3b-4c79-b9b8-6eb1d33e14a8', 'push.1757686407121@test.local', 0, '$2b$12$8jtIVBTwFR0Z4aNx/J25K.KgvSepQectur5Y0Tukj5pqL5p/lh.ba', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 14:13:27', '2025-09-12 14:13:27'),
('9150bb3f-d636-4771-a8b0-67255a14171c', 'push.1757678675678@test.local', 0, '$2b$12$prPuNCWgZLmlMJFbQJAyb.dulrro0E5pF3TuftEd2d1ZVeFtGIxo.', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 12:04:36', '2025-09-12 12:04:36'),
('9595a598-f798-477f-916b-f98daa584255', 'e2e.1757678676712@journey.local', 0, '$2b$12$y9iUa5YfqeDlWVqbc9bsgO4icRPCed846gpaYHKuUyEuveSUlWl2m', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 12:04:37', '2025-09-12 12:04:37'),
('9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 0, '$2b$12$eVjsOVU7ju.gHpzwd8fJdelGbXMx9Agck89E3/0bEf3wyoQh3Bi1C', 'super_admin', NULL, 0, 5, 'active', 'basic', '2025-08-26 07:43:28', '2025-09-11 09:17:47'),
('b97020d2-2dba-46ca-a7b4-c5d18d6bcf36', 'temp.test.1757686408684@test.local', 0, '$2b$12$QIsZ0wL9JLFkmQ0u6T2Bu.GVpSFhapkWEgrXGkyRyWpTVaVh3Saai', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 14:13:29', '2025-09-12 14:13:29'),
('eb1f90f3-2991-4dad-8887-e79ae69ea1d0', 'temp.test.1757678677879@test.local', 0, '$2b$12$IrOcJQTcfmvLnCDZdex7iOWCgagEyKcrcCy8C5ZGmIUxtk4qJqtQG', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 12:04:38', '2025-09-12 12:04:38');

--
-- Déclencheurs `users`
--
DROP TRIGGER IF EXISTS `users_after_insert`;
DELIMITER $$
CREATE TRIGGER `users_after_insert` AFTER INSERT ON `users` FOR EACH ROW BEGIN
    INSERT INTO profiles (id, user_id, preferences, stats) 
    VALUES (UUID(), NEW.id, '{}', '{"badges": [], "totalFails": 0, "couragePoints": 0}');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `user_activities`
--

DROP TABLE IF EXISTS `user_activities`;
CREATE TABLE IF NOT EXISTS `user_activities` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` longtext COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `fail_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reaction_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_activities_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `user_activities`
--

INSERT INTO `user_activities` (`id`, `user_id`, `user_email`, `user_name`, `action`, `details`, `fail_id`, `reaction_type`, `ip_address`, `user_agent`, `timestamp`, `created_at`) VALUES
('086fe21f-d10d-45f8-9a65-0faa74f97b8c', '9595a598-f798-477f-916b-f98daa584255', 'e2e.1757678676712@journey.local', NULL, 'reaction', '{\"reactionType\":\"courage\"}', 'e5e4201a-3ac5-4727-ab65-f46706ec0c04', 'courage', '::ffff:127.0.0.1', '', '2025-09-12 12:04:37', '2025-09-12 12:04:37'),
('0cb367f5-97ec-49fc-b35c-59c9616ff22c', '15ca3771-acbe-45fd-87ef-05978769c5bc', 'e2e.1757686092156@journey.local', NULL, 'reaction', '{\"reactionType\":\"courage\"}', '7843760d-0f9e-40ba-8d32-3c2f5ec07a39', 'courage', '::ffff:127.0.0.1', '', '2025-09-12 14:08:13', '2025-09-12 14:08:13'),
('2b988b8a-1921-471c-8cb7-e4f3d94b8908', 'b97020d2-2dba-46ca-a7b4-c5d18d6bcf36', 'temp.test.1757686408684@test.local', 'Test User 1757686408684', 'register', '{\"email\":\"temp.test.1757686408684@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 14:13:29', '2025-09-12 14:13:29'),
('2e0294b9-9001-4c4b-a10c-978ff42f41e9', '88be98c2-2d3b-4c79-b9b8-6eb1d33e14a8', 'push.1757686407121@test.local', 'PushUser 1757686407121', 'register', '{\"email\":\"push.1757686407121@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 14:13:27', '2025-09-12 14:13:27'),
('3139cf5c-09b7-4e80-88b9-e89e90eb9a6d', '4e35dbce-b10b-4a26-a087-392e88dae48d', 'e2e.1757686405155@journey.local', NULL, 'reaction', '{\"reactionType\":\"courage\"}', '133e4595-bddd-44f7-bf94-271330bf4bbf', 'courage', '::ffff:127.0.0.1', '', '2025-09-12 14:13:26', '2025-09-12 14:13:26'),
('4ab494a6-d920-411f-a215-85eafe5148fb', '88be98c2-2d3b-4c79-b9b8-6eb1d33e14a8', 'push.1757686407121@test.local', 'PushUser 1757686407121', 'login', '{\"email\":\"push.1757686407121@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 14:13:27', '2025-09-12 14:13:27'),
('52c913e5-4ff2-4ff6-bbe9-d44c736efadb', '15ca3771-acbe-45fd-87ef-05978769c5bc', 'e2e.1757686092156@journey.local', NULL, 'reaction', '{\"reactionType\":\"courage\"}', '7843760d-0f9e-40ba-8d32-3c2f5ec07a39', 'courage', '::ffff:127.0.0.1', '', '2025-09-12 14:08:13', '2025-09-12 14:08:13'),
('58d0d6fe-25ad-49da-ac7e-d1f7ca59007a', '15ca3771-acbe-45fd-87ef-05978769c5bc', 'e2e.1757686092156@journey.local', 'User 1757686092156', 'register', '{\"email\":\"e2e.1757686092156@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 14:08:12', '2025-09-12 14:08:12'),
('69f1e221-03c6-4f3b-a669-43679760fbc3', '9595a598-f798-477f-916b-f98daa584255', 'e2e.1757678676712@journey.local', NULL, 'reaction', '{\"reactionType\":\"courage\"}', 'e5e4201a-3ac5-4727-ab65-f46706ec0c04', 'courage', '::ffff:127.0.0.1', '', '2025-09-12 12:04:37', '2025-09-12 12:04:37'),
('759d8a3c-3311-47d1-9b66-16b6953b0ffe', 'eb1f90f3-2991-4dad-8887-e79ae69ea1d0', 'temp.test.1757678677879@test.local', 'Test User 1757678677879', 'register', '{\"email\":\"temp.test.1757678677879@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 12:04:38', '2025-09-12 12:04:38'),
('7c4fcd63-b899-48be-85ad-68e3a079c897', 'b97020d2-2dba-46ca-a7b4-c5d18d6bcf36', 'temp.test.1757686408684@test.local', 'Test User 1757686408684', 'login', '{\"email\":\"temp.test.1757686408684@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 14:13:29', '2025-09-12 14:13:29'),
('7d4c5882-2a3e-4a15-8dc8-ee2b06c55263', '4e35dbce-b10b-4a26-a087-392e88dae48d', 'e2e.1757686405155@journey.local', 'User 1757686405155', 'register', '{\"email\":\"e2e.1757686405155@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 14:13:25', '2025-09-12 14:13:25'),
('8ba36e43-1273-444b-83fa-1fc47a4759b4', '4e35dbce-b10b-4a26-a087-392e88dae48d', 'e2e.1757686405155@journey.local', NULL, 'reaction', '{\"reactionType\":\"courage\"}', '133e4595-bddd-44f7-bf94-271330bf4bbf', 'courage', '::ffff:127.0.0.1', '', '2025-09-12 14:13:26', '2025-09-12 14:13:26'),
('a5b44637-7f8e-48bd-aad7-3fa6f26d3067', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-12 11:26:47', '2025-09-12 11:26:47'),
('b2427000-7add-4bd9-84ff-49848ca9d758', '9150bb3f-d636-4771-a8b0-67255a14171c', 'push.1757678675678@test.local', 'PushUser 1757678675678', 'login', '{\"email\":\"push.1757678675678@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 12:04:36', '2025-09-12 12:04:36'),
('b368a18f-df6d-4a8b-bcda-90616209e5b9', '9150bb3f-d636-4771-a8b0-67255a14171c', 'push.1757678675678@test.local', 'PushUser 1757678675678', 'register', '{\"email\":\"push.1757678675678@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 12:04:36', '2025-09-12 12:04:36'),
('b37a4f21-7fbd-4975-9f7c-c085287feac8', '15ca3771-acbe-45fd-87ef-05978769c5bc', 'e2e.1757686092156@journey.local', 'User 1757686092156', 'login', '{\"email\":\"e2e.1757686092156@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 14:08:13', '2025-09-12 14:08:13'),
('cb320f1f-b780-4422-9b1e-d88a12239b97', '9595a598-f798-477f-916b-f98daa584255', 'e2e.1757678676712@journey.local', 'User 1757678676712', 'register', '{\"email\":\"e2e.1757678676712@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 12:04:37', '2025-09-12 12:04:37'),
('d82668ff-e462-4d93-b753-5bf6563b2364', 'eb1f90f3-2991-4dad-8887-e79ae69ea1d0', 'temp.test.1757678677879@test.local', 'Test User 1757678677879', 'login', '{\"email\":\"temp.test.1757678677879@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 12:04:38', '2025-09-12 12:04:38'),
('dfdea920-4d8b-484e-adae-7c9237d03b42', '4e35dbce-b10b-4a26-a087-392e88dae48d', 'e2e.1757686405155@journey.local', 'User 1757686405155', 'login', '{\"email\":\"e2e.1757686405155@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 14:13:25', '2025-09-12 14:13:25'),
('e8997f32-bf54-4720-a34c-d0b8abebe55a', '9595a598-f798-477f-916b-f98daa584255', 'e2e.1757678676712@journey.local', 'User 1757678676712', 'login', '{\"email\":\"e2e.1757678676712@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 12:04:37', '2025-09-12 12:04:37');

-- --------------------------------------------------------

--
-- Structure de la table `user_badges`
--

DROP TABLE IF EXISTS `user_badges`;
CREATE TABLE IF NOT EXISTS `user_badges` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `badge_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unlocked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_badge` (`user_id`,`badge_id`),
  KEY `idx_user_badges_badge_id` (`badge_id`),
  KEY `idx_user_badges_unlocked` (`unlocked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `user_badges`
--

INSERT INTO `user_badges` (`id`, `user_id`, `badge_id`, `unlocked_at`, `created_at`) VALUES
('2eb9d4ab-4bb7-4612-b6ed-21c2d2a4d33d', '9595a598-f798-477f-916b-f98daa584255', 'first-fail', '2025-09-12 12:04:37', '2025-09-12 12:04:37'),
('54172e00-fe9f-45cd-aa15-a2d7f2379189', '15ca3771-acbe-45fd-87ef-05978769c5bc', 'first-fail', '2025-09-12 14:08:13', '2025-09-12 14:08:13'),
('5a99d940-122e-419a-9b95-f61494f25b10', '4e35dbce-b10b-4a26-a087-392e88dae48d', 'first-fail', '2025-09-12 14:13:25', '2025-09-12 14:13:25'),
('a239ac05-6a3a-4154-a2e0-c30367133000', '4e35dbce-b10b-4a26-a087-392e88dae48d', 'early-adopter', '2025-09-12 14:13:26', '2025-09-12 14:13:26'),
('a6e8880b-432c-4f7b-b902-0f91da40e3a0', '15ca3771-acbe-45fd-87ef-05978769c5bc', 'early-adopter', '2025-09-12 14:08:13', '2025-09-12 14:08:13'),
('f909cbda-1d09-4039-b31d-a846d4acd0af', '9595a598-f798-477f-916b-f98daa584255', 'early-adopter', '2025-09-12 12:04:37', '2025-09-12 12:04:37');

-- --------------------------------------------------------

--
-- Structure de la table `user_ip_history`
--

DROP TABLE IF EXISTS `user_ip_history`;
CREATE TABLE IF NOT EXISTS `user_ip_history` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `country_code` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_seen` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `seen_count` int DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_ip` (`user_id`,`ip_address`),
  KEY `idx_user` (`user_id`),
  KEY `idx_country` (`country_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `user_legal_acceptances`
--

DROP TABLE IF EXISTS `user_legal_acceptances`;
CREATE TABLE IF NOT EXISTS `user_legal_acceptances` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_version` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accepted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `accepted_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_document` (`user_id`,`document_id`),
  KEY `idx_user_acceptances` (`user_id`),
  KEY `idx_document_acceptances` (`document_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `user_management_logs`
--

DROP TABLE IF EXISTS `user_management_logs`;
CREATE TABLE IF NOT EXISTS `user_management_logs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `admin_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_object_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_values` longtext COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `new_values` longtext COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_management_logs_admin_id_fkey` (`admin_id`),
  KEY `user_management_logs_target_user_id_fkey` (`target_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `user_points`
--

DROP TABLE IF EXISTS `user_points`;
CREATE TABLE IF NOT EXISTS `user_points` (
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `points_total` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `user_points`
--

INSERT INTO `user_points` (`user_id`, `points_total`, `created_at`, `updated_at`) VALUES
('15ca3771-acbe-45fd-87ef-05978769c5bc', 10, '2025-09-12 14:08:13', '2025-09-12 14:08:13'),
('4e35dbce-b10b-4a26-a087-392e88dae48d', 10, '2025-09-12 14:13:25', '2025-09-12 14:13:26'),
('9595a598-f798-477f-916b-f98daa584255', 10, '2025-09-12 12:04:37', '2025-09-12 12:04:37');

-- --------------------------------------------------------

--
-- Structure de la table `user_point_events`
--

DROP TABLE IF EXISTS `user_point_events`;
CREATE TABLE IF NOT EXISTS `user_point_events` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` int NOT NULL,
  `source` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fail_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reaction_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta` longtext COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_point_events_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `user_point_events`
--

INSERT INTO `user_point_events` (`id`, `user_id`, `amount`, `source`, `fail_id`, `reaction_type`, `meta`, `created_at`) VALUES
('31d014ec-01a7-4d5d-8986-2b9c5ed8d53a', '9595a598-f798-477f-916b-f98daa584255', 2, 'comment_create', 'e5e4201a-3ac5-4727-ab65-f46706ec0c04', NULL, NULL, '2025-09-12 12:04:37'),
('36fa760d-45c2-41c0-b153-b8344fde1c95', '4e35dbce-b10b-4a26-a087-392e88dae48d', -2, 'comment_delete_revoke', '133e4595-bddd-44f7-bf94-271330bf4bbf', NULL, NULL, '2025-09-12 14:13:26'),
('5be119b3-9d50-4f67-9b7c-3332dea69caa', '15ca3771-acbe-45fd-87ef-05978769c5bc', -2, 'comment_delete_revoke', '7843760d-0f9e-40ba-8d32-3c2f5ec07a39', NULL, NULL, '2025-09-12 14:08:13'),
('8b1ee541-8c29-41d8-929b-d7038e6fd181', '15ca3771-acbe-45fd-87ef-05978769c5bc', 2, 'comment_create', '7843760d-0f9e-40ba-8d32-3c2f5ec07a39', NULL, NULL, '2025-09-12 14:08:13'),
('a3059740-238e-471c-971d-036782a7c6d0', '4e35dbce-b10b-4a26-a087-392e88dae48d', 10, 'fail_create', '133e4595-bddd-44f7-bf94-271330bf4bbf', NULL, NULL, '2025-09-12 14:13:25'),
('b406cd6b-b00c-42dc-8025-4ef0811a6fb7', '4e35dbce-b10b-4a26-a087-392e88dae48d', 2, 'comment_create', '133e4595-bddd-44f7-bf94-271330bf4bbf', NULL, NULL, '2025-09-12 14:13:26'),
('bce2342c-d033-41fe-8da7-8752bae509f9', '9595a598-f798-477f-916b-f98daa584255', -2, 'comment_delete_revoke', 'e5e4201a-3ac5-4727-ab65-f46706ec0c04', NULL, NULL, '2025-09-12 12:04:37'),
('cc56e1c5-23b6-4456-8002-e2d8b0d4c7b5', '9595a598-f798-477f-916b-f98daa584255', 10, 'fail_create', 'e5e4201a-3ac5-4727-ab65-f46706ec0c04', NULL, NULL, '2025-09-12 12:04:37'),
('ff24eec6-58e4-4366-b398-be863c5ce154', '15ca3771-acbe-45fd-87ef-05978769c5bc', 10, 'fail_create', '7843760d-0f9e-40ba-8d32-3c2f5ec07a39', NULL, NULL, '2025-09-12 14:08:13');

-- --------------------------------------------------------

--
-- Structure de la table `user_preferences`
--

DROP TABLE IF EXISTS `user_preferences`;
CREATE TABLE IF NOT EXISTS `user_preferences` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifications_enabled` tinyint(1) DEFAULT '1',
  `email_notifications` tinyint(1) DEFAULT '1',
  `push_notifications` tinyint(1) DEFAULT '1',
  `privacy_mode` tinyint(1) DEFAULT '0',
  `show_real_name` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `user_profiles_complete`
-- (Voir ci-dessous la vue réelle)
--
DROP VIEW IF EXISTS `user_profiles_complete`;
CREATE TABLE IF NOT EXISTS `user_profiles_complete` (
`user_id` char(36)
,`email` varchar(255)
,`email_confirmed` tinyint(1)
,`role` varchar(50)
,`last_login` timestamp
,`login_count` int
,`account_status` enum('active','suspended','deleted')
,`user_created_at` timestamp
,`profile_id` char(36)
,`username` varchar(255)
,`display_name` varchar(255)
,`avatar_url` text
,`bio` text
,`registration_completed` tinyint(1)
,`legal_consent` longtext
,`age_verification` longtext
,`preferences` longtext
,`stats` longtext
,`profile_created_at` timestamp
,`profile_updated_at` timestamp
,`is_currently_minor` int
,`calculated_age` bigint
,`legal_compliance_status` varchar(9)
);

-- --------------------------------------------------------

--
-- Structure de la table `user_push_tokens`
--

DROP TABLE IF EXISTS `user_push_tokens`;
CREATE TABLE IF NOT EXISTS `user_push_tokens` (
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `platform` enum('web','android','ios') COLLATE utf8mb4_unicode_ci DEFAULT 'web',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`token`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `user_push_tokens`
--

INSERT INTO `user_push_tokens` (`user_id`, `token`, `platform`, `created_at`, `last_seen_at`) VALUES
('88be98c2-2d3b-4c79-b9b8-6eb1d33e14a8', 'demo_push_token_1234567890', 'web', '2025-09-12 12:04:36', '2025-09-12 14:13:27');

-- --------------------------------------------------------

--
-- Structure de la vue `user_profiles_complete`
--
DROP TABLE IF EXISTS `user_profiles_complete`;

DROP VIEW IF EXISTS `user_profiles_complete`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `user_profiles_complete`  AS SELECT `u`.`id` AS `user_id`, `u`.`email` AS `email`, `u`.`email_confirmed` AS `email_confirmed`, `u`.`role` AS `role`, `u`.`last_login` AS `last_login`, `u`.`login_count` AS `login_count`, `u`.`account_status` AS `account_status`, `u`.`created_at` AS `user_created_at`, `p`.`id` AS `profile_id`, `p`.`username` AS `username`, `p`.`display_name` AS `display_name`, `p`.`avatar_url` AS `avatar_url`, `p`.`bio` AS `bio`, `p`.`registration_completed` AS `registration_completed`, `p`.`legal_consent` AS `legal_consent`, `p`.`age_verification` AS `age_verification`, `p`.`preferences` AS `preferences`, `p`.`stats` AS `stats`, `p`.`created_at` AS `profile_created_at`, `p`.`updated_at` AS `profile_updated_at`, (case when (json_extract(`p`.`age_verification`,'$.isMinor') = true) then true else false end) AS `is_currently_minor`, (case when (json_extract(`p`.`age_verification`,'$.birthDate') is not null) then timestampdiff(YEAR,str_to_date(json_unquote(json_extract(`p`.`age_verification`,'$.birthDate')),'%Y-%m-%d'),now()) else NULL end) AS `calculated_age`, (case when ((`p`.`legal_consent` is not null) and (`p`.`age_verification` is not null) and (`p`.`registration_completed` = true)) then 'compliant' else 'pending' end) AS `legal_compliance_status` FROM (`users` `u` left join `profiles` `p` on((`u`.`id` = `p`.`user_id`))) ;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_fail_id_fkey` FOREIGN KEY (`fail_id`) REFERENCES `fails` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `fails`
--
ALTER TABLE `fails`
  ADD CONSTRAINT `fails_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `fail_moderation`
--
ALTER TABLE `fail_moderation`
  ADD CONSTRAINT `fk_fail_moderation_fail` FOREIGN KEY (`fail_id`) REFERENCES `fails` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `fail_reports`
--
ALTER TABLE `fail_reports`
  ADD CONSTRAINT `fk_fail_reports_fail` FOREIGN KEY (`fail_id`) REFERENCES `fails` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_fail_reports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `profiles`
--
ALTER TABLE `profiles`
  ADD CONSTRAINT `profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `reactions`
--
ALTER TABLE `reactions`
  ADD CONSTRAINT `reactions_fail_id_fkey` FOREIGN KEY (`fail_id`) REFERENCES `fails` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `system_logs`
--
ALTER TABLE `system_logs`
  ADD CONSTRAINT `system_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `user_badges`
--
ALTER TABLE `user_badges`
  ADD CONSTRAINT `user_badges_badge_id_fkey` FOREIGN KEY (`badge_id`) REFERENCES `badge_definitions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_badges_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `user_management_logs`
--
ALTER TABLE `user_management_logs`
  ADD CONSTRAINT `user_management_logs_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `user_management_logs_target_user_id_fkey` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
