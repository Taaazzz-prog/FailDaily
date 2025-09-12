-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : ven. 12 sep. 2025 à 09:59
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

--
-- Déchargement des données de la table `comment_moderation`
--

INSERT INTO `comment_moderation` (`comment_id`, `status`, `updated_at`, `created_at`) VALUES
('2de94425-b0cd-4466-b026-a72f0747af94', 'hidden', '2025-08-26 13:19:58', '2025-08-26 13:19:58'),
('null', 'approved', '2025-08-26 13:20:12', '2025-08-26 13:20:12');

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

--
-- Déchargement des données de la table `comment_reports`
--

INSERT INTO `comment_reports` (`id`, `comment_id`, `user_id`, `reason`, `created_at`) VALUES
('a9616206-a684-46de-b8c4-1a7a08ae05cc', '2de94425-b0cd-4466-b026-a72f0747af94', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', NULL, '2025-08-26 13:19:58');

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
('04386649-bf11-4f00-aff5-024ef59ed83a', '7eb2540d-985a-46d0-a33d-a69201b25285', '991940d9745df44e2a3b279ec184e0e0b4f56dfe8e8ad5612b966733831fbf8a', '2025-09-13 05:33:09', '2025-09-12 07:33:08', NULL),
('17b3ecaa-0204-4870-80d3-e10c1c4515eb', 'c3201bf6-e04d-43e9-9690-484ca03b17da', '89377c7c612a0a1fa7f41529a69570b491b3cf40df3769dcbc754e1628ac761f', '2025-09-13 05:52:51', '2025-09-12 07:52:50', NULL),
('233fdc0b-ed17-4eb7-ac8d-359899be702c', '9ee4d139-7838-4157-928b-add1f3e1ac47', '67a58990d87ca2e47f896404b7c5ed4a387fd7e0f097879bc2430abf0a417495', '2025-09-13 06:09:50', '2025-09-12 08:09:49', NULL),
('25af04ac-90a2-4157-8ae0-c04444f1ffcf', 'b1a55739-7077-407c-874d-72a4162cf912', 'e7411035aa85bbf83d9a6fd617402fdd20c77834db8d2578dd3c841117b34291', '2025-09-13 06:09:10', '2025-09-12 08:09:09', NULL),
('2941f588-6d23-45c1-8625-84528d596bad', '031805f3-f92f-4720-bdb2-8bcee46aa492', '85766cac93f29d85697f00414cc571c1ac10fab6dfdfe5a2950a926caa4fe4d7', '2025-09-13 06:15:47', '2025-09-12 08:15:46', NULL),
('2d7ffd0b-6a6d-4ef2-a97a-e2e95a03d20a', '6cc80e54-ba9c-4a59-9416-b27ab0c9151e', '4949da6a6f72a8c95e12b66185c2ab27f427164bfeaefdd38d0ce08cec5e2d9c', '2025-09-13 05:36:05', '2025-09-12 07:36:04', NULL),
('3c6c8023-d9a0-407d-8b05-2c919a416bd2', '2ad75882-c779-4322-b666-309cff555844', '4157f579b30dfa042db4a5ac927076af0a6cb1b89312291e4d66275111fc3c8c', '2025-09-13 05:33:10', '2025-09-12 07:33:09', NULL),
('45418ea8-ec60-4396-9ba9-0c8ae18cce63', 'd4fe663b-b6cd-4b1f-b37c-af00cf944e1a', '0e57315b95c77f1b9a0ceb63c05578664cb7235447c1c5bed44dc827e0072e0c', '2025-09-13 06:09:09', '2025-09-12 08:09:08', NULL),
('4d3d783b-383c-461a-bc61-c0068e2329a0', '7ae62407-e364-445d-917e-2447152e1f29', 'a393c21023cfc56c8c20e0764f2fe80646407ab504f3cc58390a3fb94c894c83', '2025-09-13 06:09:08', '2025-09-12 08:09:07', NULL),
('57da96cd-0d2e-43e2-bf59-b24a6cf2833c', 'e9495677-48bc-4f63-ba79-85036f7c9a4d', 'b97d89b77a1ba82848263a9d04a6cf18327183979f804aa460fa897e07228896', '2025-09-13 05:33:11', '2025-09-12 07:33:10', NULL),
('59b918e8-e3d6-42c2-bd80-c2b1f632cc23', '6ce74ccc-5fb5-42cc-be99-8382012dc2c2', '6913c3c7aedef942e409a9fe08c54c1d344203c811efcc47316bd267c4c69d86', '2025-09-13 05:36:07', '2025-09-12 07:36:06', NULL),
('60c411a5-a4bc-4169-b350-ff2fc4d74b99', 'b13afe11-50b4-41f9-81ef-91fa5822cdba', '1ad66d8602d99a6cbdda95188a0966649938e14e8cd9dd63356e9e4193a14ddd', '2025-09-13 05:36:06', '2025-09-12 07:36:05', NULL),
('7572be1a-261e-4765-94fd-23d120bceb58', '661f0189-2986-44f1-a8a9-77ee27abf04a', 'baf2fb0c3b95325cf24abc92abef595ae8ec86c5a9761160c86ca867f7afad0d', '2025-09-13 05:49:26', '2025-09-12 07:49:25', NULL),
('7c25e0a7-c83f-4372-9d4f-44f92d371bdf', '07a2e026-47d8-4f3d-9f78-07da12b26801', 'adf66d726df82bccdfc26b18be79741a44df7e6163ea5315bfb204d1daf47136', '2025-09-13 06:11:13', '2025-09-12 08:11:12', NULL),
('87e8792b-7e0b-45f3-adf9-5723d3609386', 'd5b502d6-5cae-45bb-8d9f-5714398f0783', '59d56585e9f555da883fa15d245ccb731c5f52d9aa2bf030b56766971c024686', '2025-09-13 06:11:15', '2025-09-12 08:11:14', NULL),
('9d3be246-0052-429a-a87d-e8fcc2a7fd87', '7d56052a-2b67-4458-8ab7-1facb6ba1f55', '565b4bc2cdac3c7c12171d97e002d666dbbd0a987ee7f1084b5a5951aa8b8828', '2025-09-13 05:44:24', '2025-09-12 07:44:23', NULL),
('a535ac9b-3daf-4d38-a6a5-b789762e6fff', 'c2b50739-2feb-4bcd-8506-70ea0e57fea9', 'b2d043e7ee654f1d4da0029f34ca42aed4b0c7e9026a2a8247a64db9368de5bf', '2025-09-13 05:49:26', '2025-09-12 07:49:26', NULL),
('b664f499-1496-455e-80f7-e0ed2388a700', '384caec2-b92b-4635-af0b-d2b35d721585', '6af7960178ceb065528bd2ab5c6917ea5fb8530ef53674e8ef588cde66db0098', '2025-09-13 06:07:36', '2025-09-12 08:07:35', NULL),
('beee6b32-f01b-4de4-8542-f6b1f2777c6f', '11f917f4-8234-4d8e-820c-96ba4e44fdf4', '68ee11898baabfd6ffd80e870ae03ddc7029be279160236e4269e1c69b01b628', '2025-09-13 06:15:47', '2025-09-12 08:15:47', NULL),
('c3164c53-0499-480b-b63b-b7c2f8e5d712', '62339be8-5df6-4bcb-b6bf-80a8f303ccad', '6166c3f61fa2c06dc7686620a3b769d651ca4babfdd42845caed808b17f003a6', '2025-09-13 05:49:28', '2025-09-12 07:49:27', NULL),
('d923f0ab-819d-4b5d-86c9-a6a1ea074d9c', '30289cf8-d0c7-47a7-8dbd-fc08d3c641ba', '683534093a1e90f43bd0d4e1b14494da8b93227b6e10be7924227f01b3c0abb8', '2025-09-13 06:07:37', '2025-09-12 08:07:36', NULL),
('de4f4ebc-d954-463e-9031-d22ca77c119a', '4cdf9bc2-7d04-4192-8ccc-9cf5178e23b9', 'db94e8e8b3db7a3aeecae75a8ab7ddbb4949d86671a5d0465912413dbc7457c8', '2025-09-13 05:52:52', '2025-09-12 07:52:51', NULL),
('e1452bf5-42c2-4d20-9dac-de97d4a4d520', 'bc35a9ac-d80e-4f79-ba5c-f39aea8106b2', '961a49e6ae78d870dca1a14b9789bf1430183bf5dab0e54e5cddaee413633136', '2025-09-13 06:11:14', '2025-09-12 08:11:13', NULL),
('eb126620-4fe5-49f4-a80c-c22a196533d8', 'e5010517-9677-498a-a769-2531435d7af7', '620ff328ba93e391541c51f6a1ba5c3eaeb976e530b2ee394884948cdccf2ece', '2025-09-13 05:38:50', '2025-09-12 07:38:50', NULL),
('ec840b75-cd55-418d-9504-452a57e92e5f', 'a198dcd1-084e-4c20-8c86-d2ba0253b546', 'c0f333a5e1a37e1615b4646777475704e0de7c13a8703801a471d96c56ee39e0', '2025-09-13 06:09:49', '2025-09-12 08:09:48', NULL),
('f019babe-61c0-4cd8-b856-f939821c8dd1', '8e4f60c2-681a-4f5b-a50b-277bee34cda3', '4e86d631b5d9de9c61b5887d64c59c7a71deebecade80d31907e7b8817146c9b', '2025-09-13 06:07:38', '2025-09-12 08:07:37', NULL),
('f1d8809c-aa70-4c19-a7fb-f1623d8c5992', '7e3407e0-45f9-4312-995b-5e8afc4fc6c9', '4caf1ce5162f88fa2378563c7f4a1ffe2c29252a48268b266973588beeb0231e', '2025-09-13 06:09:48', '2025-09-12 08:09:47', NULL),
('f3d7524b-5acb-48c1-9c49-f8af1d03250a', 'd9778caf-fcd5-45f1-b54c-35eb6722c9f9', '4ab9087f14d4277766fac8a5d4348dc6d87834bc5a0c63cf476da0cb6731566c', '2025-09-13 06:15:49', '2025-09-12 08:15:48', NULL),
('fcca80b9-f7fd-49e3-bf88-cc44cc497a04', '8b4ceb38-3101-4c84-b477-7c732267d9a4', 'd7e76266b88650c98e1546e21035234000400413b5e1a797c5a9b68ce97e7c3d', '2025-09-13 05:52:50', '2025-09-12 07:52:49', NULL);

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
  `image_url` text COLLATE utf8mb4_unicode_ci,
  `is_anonyme` tinyint(1) DEFAULT '1',
  `comments_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fails_user_id` (`user_id`),
  KEY `idx_fails_created_at` (`created_at`),
  KEY `idx_fails_user_created` (`user_id`,`created_at`),
  KEY `idx_fails_category_created` (`category`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

--
-- Déchargement des données de la table `fail_moderation`
--

INSERT INTO `fail_moderation` (`fail_id`, `status`, `updated_at`, `created_at`) VALUES
('35353546-b6f2-4956-838a-d0084780409c', 'under_review', '2025-09-11 09:14:07', '2025-09-11 09:14:07'),
('394d616a-75db-46a2-9c30-00e4179ecbf5', 'under_review', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('65824bca-7416-4d2b-8070-d3de03c3891c', 'under_review', '2025-09-10 09:18:27', '2025-09-10 09:18:27');

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

--
-- Déchargement des données de la table `fail_reactions_archive`
--

INSERT INTO `fail_reactions_archive` (`fail_id`, `reactions_json`, `archived_at`) VALUES
('0f29dcc0-0b48-47cd-b0c5-dd1adc225198', '{\"laugh\": 0, \"courage\": 0, \"empathy\": 0, \"support\": 0}', '2025-08-27 09:05:38'),
('85efade8-0857-40a9-a790-8253c270157f', '{\"laugh\": 0, \"courage\": 0, \"empathy\": 0, \"support\": 0}', '2025-08-27 09:05:38'),
('965883d5-c51b-4ccb-a7e4-e90aecc49016', '{\"laugh\": 0, \"courage\": 0, \"empathy\": 0, \"support\": 0}', '2025-08-27 09:05:38');

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

--
-- Déchargement des données de la table `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`id`, `user_id`, `token`, `expires_at`, `used_at`, `created_at`) VALUES
('632e1274-3f52-48a1-8b41-09721a16d731', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'b6dae886758e0e3db7c41b120d9097c5de7bc41a5a415eb7683680d6b2c206ec', '2025-09-10 08:14:16', NULL, '2025-09-10 09:14:16');

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
('031805f3-f92f-4720-bdb2-8bcee46aa492', 'push.1757664946112@test.local', 0, '$2b$12$TFssLnwFQctOrdXZupGZTu8jrgSlFJUCQVtIvfaPUZOwp1oDLODUu', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 08:15:46', '2025-09-12 08:15:46'),
('07a2e026-47d8-4f3d-9f78-07da12b26801', 'push.1757664672253@test.local', 0, '$2b$12$PZwYUn/bIhKFYRWKGlFL0eAF6yeBsn5IvdLL9036wceUSNptu4U.W', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 08:11:12', '2025-09-12 08:11:12'),
('0a6a5bae-3336-4683-bb5c-520e439f08ca', 'e2e.1757582330595@journey.local', 0, '$2b$12$d6n6t15uUd5KxXs09AxCruOgmMpSOltlK.LzyKtjm8XCniyurbkg6', 'user', NULL, 0, 1, 'active', 'basic', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('11c77ea4-4602-4cb9-a75e-c894b480c4e8', 'alexia@alexia.fr', 0, '$2b$12$718ZABjg1MQ97VOlFOObAeYPlTtjaPwYzl6ct9lhFeR/sTZNH79XS', 'user', NULL, 0, 1, 'active', 'basic', '2025-09-10 09:17:11', '2025-09-11 09:17:47'),
('11f917f4-8234-4d8e-820c-96ba4e44fdf4', 'e2e.1757664947057@journey.local', 0, '$2b$12$/yelnu91mcVy2r.MvYVcY.ezFLPTlVYmedWONY2LkzMDyHZcQDPTa', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 08:15:47', '2025-09-12 08:15:47'),
('12c637c8-450c-4159-9beb-817aca67e9a1', 'adm.1756717668294@test.local', 0, '$2b$12$Lzq/IWHx2HW11ozM9TwfuONljuXbeS8gjOWdhxCYcA8enSf0TeN1q', 'admin', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:48', '2025-09-01 09:07:48'),
('19261451-4bec-46df-947b-ed2a111c0801', 'adm.1756717663149@test.local', 0, '$2b$12$LCb95osSqdGPK3tEdKxctODhGJSpPh2gWh8FcMylPlhTseNsq6VHK', 'admin', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:43', '2025-09-01 09:07:43'),
('2030c326-c4fc-45dd-a8f3-f941e0aa8dea', 'u.1756717664095@test.local', 0, '$2b$12$HGr2deuDeBfBMiDjL5LKY.auRhjxyH7NC0m1SsIrP3nJtuh9teBJ.', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:44', '2025-09-01 09:07:44'),
('2212f5ba-bfe1-4241-b275-42771e59479c', 'e2e.1756718570811@journey.local', 0, '$2b$12$Ok8ctxodNAHXjJlETo8p5uZGYDgtG0qNKeVU8/Ifqy3C0qEXq4NY6', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:22:51', '2025-09-01 09:22:51'),
('293c74c1-371b-45e0-b548-77dff333b8e9', 'e2e.1756717654854@journey.local', 0, '$2b$12$9fyDptmYxE2BdAdWPx13d.wWwLqTzT5cH/bf//VMR8uoaudKNNZB2', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:35', '2025-09-01 09:07:35'),
('2ad75882-c779-4322-b666-309cff555844', 'e2e.1757662389214@journey.local', 0, '$2b$12$v7FOpBby53/PoHCv5IMKwOhIHKcmu5VoWfhzH9HXwPT9SGbw6/dbq', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 07:33:09', '2025-09-12 07:33:09'),
('2c735258-4f82-42cf-99ec-31b9939193b5', 'test-1756727472430@example.com', 0, '$2b$12$CUEmFPdlNK3o4t9DVu7tGOLEPm/jnB67ZNs1kTkWL/atpDYR/Qwqi', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:51:13', '2025-09-01 11:51:13'),
('30289cf8-d0c7-47a7-8dbd-fc08d3c641ba', 'e2e.1757664456375@journey.local', 0, '$2b$12$PmaOBCrKmnd4aw5.D6HCl.u9IQqFAtbZy2lUZcMTfqma8DVtZ3JzW', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 08:07:36', '2025-09-12 08:07:36'),
('3231fb01-5da2-4847-b009-4d034d7e8f7e', 'temp.test.1757582328683@test.local', 0, '$2b$12$74HjlgVHS8/wHbKm87M8buLS7h.GjQNKZJdiYVA07eyjwoBlZJVy2', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-11 09:18:49', '2025-09-11 09:18:49'),
('33e10cbd-a3cf-4259-8098-f3b33e3ec8bc', 'teen.1756717658787@test.local', 0, '$2b$12$nfMyBo38Ppa.Pz7fvQ1r.eMwSSnSHC4G4F2wugE18PLQFyTW1ID6.', 'user', NULL, 0, 0, '', 'basic', '2025-09-01 09:07:39', '2025-09-01 09:07:39'),
('384caec2-b92b-4635-af0b-d2b35d721585', 'push.1757664455435@test.local', 0, '$2b$12$Guh5G2qYNEMsTQ3X1Qu.3ekk.ngHgXARNYjptxsmKy1pNdZUuExr.', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 08:07:35', '2025-09-12 08:07:35'),
('3c08247a-be19-4c54-b703-96c8a8b7867f', 'test.1756725158285@faildaily.com', 0, '$2b$12$O7LTwIOHSnyO/ZhJGapDLOjH.Dxv0hDHOrz6TvCD9E6iqIr7FvNcK', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:12:39', '2025-09-01 11:12:39'),
('3eec9236-40db-46ca-ae18-9b089bef0e75', 'vfr@vfr.vfr', 0, '$2b$12$IxV.5xfvgXly8sOtV9RDSuLZ.kVVYjGBtDNv2hUKKrbJNvyrmH.um', 'user', NULL, 0, 0, 'active', 'basic', '2025-08-25 07:22:10', '2025-08-25 07:22:10'),
('4098e3a5-7b27-42ec-b8be-204776aa7ed7', 'e2e.1757658325178@journey.local', 0, '$2b$12$KutADGqndSxklwNnUOHCsO4qEXLgJnHj9bwH0Y/Moe3ca9XblgD22', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 06:25:25', '2025-09-12 06:25:25'),
('411dd9ff-9673-48c9-838a-50b49074fff0', 'test@test.com', 0, '$2b$12$nsm/fuVNm3RoVD.M2HYgae6zKa3zkJr.hEZpvGkwHa1A6Z0.b8N5a', 'user', NULL, 0, 0, 'active', 'basic', '2025-08-25 09:46:12', '2025-08-25 09:46:12'),
('4641d9fd-e136-4c65-b696-4ff4e5b9bf3f', 'temp.test.1757658322102@test.local', 0, '$2b$12$mUalr6ZEBZmx1O38.Iiee.lWz/Nog58RdqzF/iOqyXJ1SSJYFuCle', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 06:25:22', '2025-09-12 06:25:22'),
('4780ee5f-c43d-4bfb-9add-72a1e6650552', 'test-1756728023447@example.com', 0, '$2b$12$VmkOpwym8oWOQIdhjst5supeEWQ5S14tT.Iu3Hh5Xl2c29nmuFgYi', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 12:00:24', '2025-09-01 12:00:24'),
('48b99a1f-8da7-4940-a34a-fd28d062c34f', 'temp.test.1757582048609@test.local', 0, '$2b$12$Px/0PikB/sIJ33tBMI/4yOlAvNsCd7HOeIRfgR/Z2JOm1qB5fqJ4.', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-11 09:14:09', '2025-09-11 09:14:09'),
('4919f0d5-91e1-4956-9698-c440aeea22f5', 'teen.1756717669234@test.local', 0, '$2b$12$4UGU5ONMhYeJqqK9/5uVx.24Rc7DZWSWFvjxH9wiZeK1u4valm.1S', 'user', NULL, 0, 0, '', 'basic', '2025-09-01 09:07:49', '2025-09-01 09:07:49'),
('4cdf9bc2-7d04-4192-8ccc-9cf5178e23b9', 'temp.test.1757663571594@test.local', 0, '$2b$12$OSRQaaIPZB3TaO3WaWkpDuQOlMlRP4LotOwrvS8kAlia77xtmEfzW', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 07:52:51', '2025-09-12 07:52:51'),
('4ede043a-da02-4f5b-aa4c-c45bee9a714a', 'adm.1756717659772@test.local', 0, '$2b$12$2BfGr0X79v2zHjNA4Vf5Je1pQ./nst3CIiDschxDkKdd/281UiOe2', 'admin', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:40', '2025-09-01 09:07:40'),
('52c50814-0c3d-4b34-a02f-eea3e37d159d', 'test-1756727712652@example.com', 0, '$2b$12$D1Y/tgBPj67D3Ud6iYQUiO0vcaQMc7X2D8D7scbuTe.io1gTrrnd.', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:55:13', '2025-09-01 11:55:13'),
('57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', 0, '$2b$12$0UFb9XrOTymJDlnjUODK2.ntTCJx1517zcw823/ErXolBxxAJB5ju', 'user', NULL, 0, 2, 'active', 'basic', '2025-08-22 21:40:02', '2025-09-11 09:17:47'),
('58570b71-7bde-4266-b35c-03e59c0f82e7', 'adm.1756717657387@test.local', 0, '$2b$12$EAlTNwcnHPeilYysT0SgkOvfcVtyWG.oMPk3EjWpdT2WHDH2CB6K.', 'admin', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:38', '2025-09-01 09:07:38'),
('5d79191e-ec05-40a0-a85f-ecc8b6287f94', 'test.1756725160513@faildaily.com', 0, '$2b$12$g6l8T/oDgAbxASqVZI364eiQMpwJrKEQACa/ibYBc35V5x9NmGPni', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:12:40', '2025-09-01 11:12:40'),
('5efe0f4e-ea21-4418-9e15-5e361c43b3f8', 'test.public.1755862087925@example.com', 0, '$2b$12$PMaASh9w.EREyFxfy1NMnuLlg8917mJwUKT7vyqpOTIZM6uG3TJdO', 'user', NULL, 0, 0, 'active', 'basic', '2025-08-22 11:28:08', '2025-08-22 11:28:08'),
('5fea328a-4169-427f-b0b1-1c17e6511c5f', 'test.1756725169806@faildaily.com', 0, '$2b$12$ZOLMyhURBdwfatpnUvIFvevCu/6NE7jAn2zFGQf.Nh/zbyDleeu.i', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:12:50', '2025-09-01 11:12:50'),
('62339be8-5df6-4bcb-b6bf-80a8f303ccad', 'temp.test.1757663367310@test.local', 0, '$2b$12$FFGozl6P.1fbgwsSzT97l.bZmKW9IC1OKKc2fLcycr7lVFfC3AGyy', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 07:49:27', '2025-09-12 07:49:27'),
('661f0189-2986-44f1-a8a9-77ee27abf04a', 'push.1757663365099@test.local', 0, '$2b$12$7NCLWMDXExP1Obj/9KDN..O87lyRZUvFNj3OWIZdv/w4NBggVvvzW', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 07:49:25', '2025-09-12 07:49:25'),
('6ab7b2cd-1de5-4e2f-9307-4322d425e4b4', 'newtest12345@test.com', 0, '$2b$12$QoS5EOUZT5dAGITebNTHSuuEXP6qtVsXLoqN5W7h/sjQScw7iXoLy', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:26:14', '2025-09-01 11:26:14'),
('6b008c16-0b01-4b64-b3d0-f3c4e679a1e8', 'test.1756725165043@faildaily.com', 0, '$2b$12$0Uc/MXbkh4jPw6LhaL1FQOoHKEKviJU6XjtxnfrLFDXfrBl9HZbzu', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:12:45', '2025-09-01 11:12:45'),
('6b7baec3-c870-4f1d-a256-45d31ed5f893', 'adult.1756717665706@test.local', 0, '$2b$12$OKQSnuYvwbDm53LZ5Ur6WeRnaKDIQhTH09xbBEHnQGxcn2LEPsaqi', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:46', '2025-09-01 09:07:46'),
('6cc80e54-ba9c-4a59-9416-b27ab0c9151e', 'push.1757662564324@test.local', 0, '$2b$12$e3dkbUFrRfS7TWzlbp1f1OLygmGG3GW0hR13CTHs.s0UeSqIzjyT2', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 07:36:04', '2025-09-12 07:36:04'),
('6ce74ccc-5fb5-42cc-be99-8382012dc2c2', 'temp.test.1757662566395@test.local', 0, '$2b$12$5IIEBqoe8Ot0gpyjhYyRHuzkRgbSma9M86Lkdg711jVGEoTFbFRq6', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 07:36:06', '2025-09-12 07:36:06'),
('6db5b664-7c73-4fea-88c5-6d2e31c83bd5', 'e2e.1757582045895@journey.local', 0, '$2b$12$CKc6iArkR/47cOp56/v0NOSlM1HNNH555eg3kctVyMKexzfMZbmGe', 'user', NULL, 0, 1, 'active', 'basic', '2025-09-11 09:14:06', '2025-09-11 09:17:47'),
('75c74d79-8cda-4c6b-8c08-c0dfa06043ca', 'e2e.1756719280609@journey.local', 0, '$2b$12$0V0O2cnRN1SqRksLkzdr4.vdhT3eIa0U.J6c.TWSIwR.HD4dM.lvK', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:34:41', '2025-09-01 09:34:41'),
('7680bede-44ea-496a-9e31-5a2e060f25cf', 'test.1756725173230@faildaily.com', 0, '$2b$12$QyhBtztrcFhmCVk0E8clX.sDn.hs6ppuitr.LJg.6Js6u9Z05DvCK', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:12:53', '2025-09-01 11:12:53'),
('79440d6f-4010-42f8-9e24-3371ee140cf3', 'test-1756900995697@example.com', 0, '$2b$12$0AfW5ZLLLDQxwVykA.Xr0ejtoqnaRg/kjCJ8iiArzQFI4P.cv3QFK', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-03 12:03:16', '2025-09-03 12:03:16'),
('7ae62407-e364-445d-917e-2447152e1f29', 'push.1757664547391@test.local', 0, '$2b$12$sXMgT9.K./amEfZjkZUEauboqYGo.i6PnYHPSPXvmpj.xRgsQKlaa', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 08:09:07', '2025-09-12 08:09:07'),
('7d56052a-2b67-4458-8ab7-1facb6ba1f55', 'push.1757663063259@test.local', 0, '$2b$12$CniX5pII4PRptCqFhc.3HeKNXxnOgOC1SGgjD09RztO02WBGo2C2S', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 07:44:23', '2025-09-12 07:44:23'),
('7e087b9c-2f45-4e77-8471-a6cebbf2de13', 'test.1756725176592@faildaily.com', 0, '$2b$12$D1V/cZ9NmKH6PfvoUhzI4eGDWCMusnThzMptFD8Dw5LK2E/pKsLSu', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:12:57', '2025-09-01 11:12:57'),
('7e3407e0-45f9-4312-995b-5e8afc4fc6c9', 'push.1757664587228@test.local', 0, '$2b$12$g5.xs8QWW5.xPiFtVrQm5uKRYTir2zuge27RGJV8zZngHBergeY7u', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 08:09:47', '2025-09-12 08:09:47'),
('7eb2540d-985a-46d0-a33d-a69201b25285', 'push.1757662388272@test.local', 0, '$2b$12$eTvnVMctTq1MpZynWfQ1.ujGaZDRNn.afrbMaH1DciZX3aC0bDH/i', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 07:33:08', '2025-09-12 07:33:08'),
('814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 0, '$2b$12$wCf7D9J9f9HsAPQ20Gu3neqHcMqfEY05inLUWpQHqkbSRVGzCgyn.', 'user', NULL, 0, 1, 'active', 'basic', '2025-08-21 08:51:48', '2025-09-11 09:17:47'),
('8b4ceb38-3101-4c84-b477-7c732267d9a4', 'push.1757663569419@test.local', 0, '$2b$12$Rocim5xlH.Su7uJPoSjlaeVXc.Qn6X2tuYucIMS65jGKL7NsbAJBC', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 07:52:49', '2025-09-12 07:52:49'),
('8e4f60c2-681a-4f5b-a50b-277bee34cda3', 'temp.test.1757664457527@test.local', 0, '$2b$12$qxvUcW44HgaZtA4K6v05iuZfywTtiGZm2dDEPQjY.jovFxCpwxtk.', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 08:07:37', '2025-09-12 08:07:37'),
('957f8d77-8311-4377-b3fc-b9b53ab29beb', 'teen.1756717667504@test.local', 0, '$2b$12$F9Txouihriwf/pyWqKWLaeIu9g3TonH524FK8C21aQRwZKvnAwMUa', 'user', NULL, 0, 0, '', 'basic', '2025-09-01 09:07:47', '2025-09-01 09:07:47'),
('964e2edd-34d2-4a2d-a7a5-132b8bf5c4db', 'test.1756725835755@faildaily.com', 0, '$2b$12$ZJzkbR8m/NvFTYDpHEh8.unHrsIg9qxzulf3XcpFY/Amc6WQqQUOO', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:23:56', '2025-09-01 11:23:56'),
('9d774ace-1dff-4ac9-8091-66e84e57a516', 'adm.1756717666568@test.local', 0, '$2b$12$VGH.Sy9sUR/WFlr80Kl/Nejq3VGHutKDYP.DbX556Cv5jx/dkqIKG', 'admin', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:47', '2025-09-01 09:07:47'),
('9ee4d139-7838-4157-928b-add1f3e1ac47', 'temp.test.1757664589477@test.local', 0, '$2b$12$BV.r/4/vdwGI/0VJ0xBzV.nJYTmiZbDhbnbE1U0hfp5HeEdzCN7yq', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 08:09:49', '2025-09-12 08:09:49'),
('9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 0, '$2b$12$eVjsOVU7ju.gHpzwd8fJdelGbXMx9Agck89E3/0bEf3wyoQh3Bi1C', 'super_admin', NULL, 0, 5, 'active', 'basic', '2025-08-26 07:43:28', '2025-09-11 09:17:47'),
('a198dcd1-084e-4c20-8c86-d2ba0253b546', 'e2e.1757664588176@journey.local', 0, '$2b$12$3XEbC2vLBoybpu9YdQHy8ekm1MzzBz5Woz1FYY8r9EacxOYmx/Oua', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 08:09:48', '2025-09-12 08:09:48'),
('a66d8aa0-3ce4-49e7-ac31-2b2f3ca8693c', 'temp.test.1756717662014@test.local', 0, '$2b$12$bIBV/qhLgC8UtAHfXUzoYeiIDJGnYvnjQBOchkBZ8Ne4vKRQ9iEdm', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:42', '2025-09-01 09:07:42'),
('ae6d53e7-9ab0-4b49-ada8-86bd09d48e6f', 'teen.1756717661025@test.local', 0, '$2b$12$duyUUfoDwPDDWLPMW42HxezppG9bh0YiqI19mu30TgtSrjJVlNR7e', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:41', '2025-09-01 09:07:41'),
('afb563b2-ec82-491f-b8ff-39fd35f30833', 'u.1756717664526@test.local', 0, '$2b$12$ZZZuRrqP/tSbVWhN86ixju4Q6nTp4WLY3vFUFo.VZW0DmMIo78kli', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:44', '2025-09-01 09:07:44'),
('b13afe11-50b4-41f9-81ef-91fa5822cdba', 'e2e.1757662565248@journey.local', 0, '$2b$12$Zsp.gWuFVVx7eugEyZ9kMertaohn1ks.xD6vhO6MRMwvBu3Iq611u', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 07:36:05', '2025-09-12 07:36:05'),
('b1a55739-7077-407c-874d-72a4162cf912', 'temp.test.1757664549476@test.local', 0, '$2b$12$ELNrQ8Ycptp4hiu6/8omwuvofR1NwAvTyFvKyICsIMAEfe60N30Xa', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 08:09:09', '2025-09-12 08:09:09'),
('bc35a9ac-d80e-4f79-ba5c-f39aea8106b2', 'e2e.1757664673155@journey.local', 0, '$2b$12$0WZmQbR4ZMtw4daryGQv4OF7w6YYPNfIxf8/JYCiOrjwgboWOQqnu', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 08:11:13', '2025-09-12 08:11:13'),
('bea3f8c3-f962-48ac-891a-604f278cdb09', 'u15.1756717665266@test.local', 0, '$2b$12$1O/PurxKL6Wt4A6wFkeOcuzuWwKKVyUuZKqUSOVio/LfNC0bAS8fu', 'user', NULL, 0, 0, '', 'basic', '2025-09-01 09:07:45', '2025-09-01 09:07:45'),
('c2b50739-2feb-4bcd-8506-70ea0e57fea9', 'e2e.1757663366093@journey.local', 0, '$2b$12$eF6Sbk36133yh6SHv0GBQeuJQMtmf6641ghoMWSpdYVmkosiT5byu', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 07:49:26', '2025-09-12 07:49:26'),
('c3201bf6-e04d-43e9-9690-484ca03b17da', 'e2e.1757663570371@journey.local', 0, '$2b$12$f1n8fKZKYrT1RadpyZ4cLOUghfFtyARHXIwhfgAtaMrVZJXgE2Eue', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 07:52:50', '2025-09-12 07:52:50'),
('c4ee0088-3db2-46a7-901c-dc434c04b43c', 'push.1757658323592@test.local', 0, '$2b$12$m2mjqW0dIyemXm9JAOll3eOPniWPwyFMgSjs1n17M6p5aEv71lwiC', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 06:25:24', '2025-09-12 06:25:24'),
('cd3cb757-9d12-4438-911f-0f9f2ac2ca95', 'test.1756725174849@faildaily.com', 0, '$2b$12$geHU2dmtSzOoqLcx98gYk.FBiDL1dzFynlbj4HfhnXvIYzDUxzZci', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:12:55', '2025-09-01 11:12:55'),
('d096d562-988d-44be-bd9a-55272e9ed9ff', 'temp.test.1755862785778@test.local', 0, '$2b$12$vx8LJQLsYmwHshIO2VHeH.QxAJBAhMG98sK.JX/Q6tiV946zc3UW.', 'user', NULL, 0, 0, 'active', 'basic', '2025-08-22 11:39:46', '2025-08-22 11:39:46'),
('d4fe663b-b6cd-4b1f-b37c-af00cf944e1a', 'e2e.1757664548310@journey.local', 0, '$2b$12$/En7bSMgR.QGwD8F8GoM/enxH.BIJPMvCaxbH/yqEVl12dUuU77zW', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 08:09:08', '2025-09-12 08:09:08'),
('d5b502d6-5cae-45bb-8d9f-5714398f0783', 'temp.test.1757664674334@test.local', 0, '$2b$12$AdNR2czIy9NLQB/SPVDXzu2sGIE3xT6m7pKtIizPXilo3CdEqmHsy', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 08:11:14', '2025-09-12 08:11:14'),
('d9778caf-fcd5-45f1-b54c-35eb6722c9f9', 'temp.test.1757664948252@test.local', 0, '$2b$12$YlqDTuOhNfun32yZaCJivOzWIqLx7e5mdZMZY1cM6mCzkUgH0JRxu', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 08:15:48', '2025-09-12 08:15:48'),
('dde0e53b-b2f4-4c60-9141-6d0867d8a85f', 'test.1756725171521@faildaily.com', 0, '$2b$12$jnQ9Is7eMa4EGrmftiTR1e8JM9f3qDTMTYZLw0kmm4i800q.TmpzC', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:12:52', '2025-09-01 11:12:52'),
('e10fbd52-b906-4504-8e13-7c7b7c451afa', 'test-1756727373156@example.com', 0, '$2b$12$NDcQpGSI8gr4Xc33AC2gY.SyWR33Luzs7AQgPwo0lE9HDyJVjddhG', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:49:33', '2025-09-01 11:49:33'),
('e1da10bd-4b07-418d-9581-ea72e5b13a10', 'test.1756725181656@faildaily.com', 0, '$2b$12$9VQ3IGyWMN6tYvADy9dwb.u4GFiH.3Ry4RFhr04V/WehSuyqHU7NC', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:13:02', '2025-09-01 11:13:02'),
('e5010517-9677-498a-a769-2531435d7af7', 'push.1757662729744@test.local', 0, '$2b$12$iUFaY/VM7obiLMjN686T6.5AFanf5OHnCKrtwSwgNvFY0E5HJosvS', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 07:38:50', '2025-09-12 07:38:50'),
('e9495677-48bc-4f63-ba79-85036f7c9a4d', 'temp.test.1757662390419@test.local', 0, '$2b$12$giGxVF0S94hGzZT55/S01uYp7cFsiqTb5VhkrtbXiJ.eL47SFk5Fm', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 07:33:10', '2025-09-12 07:33:10'),
('f276cf04-dea1-4bb0-bd21-337d34749686', 'test.1756725178537@faildaily.com', 0, '$2b$12$9/NT5Q07dXgi/oinXCnJLO0hJVuVtT84iRMbEVRzPB8M.7GCzvt/m', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:12:59', '2025-09-01 11:12:59'),
('f78778ce-ed8f-4d6b-abad-2d8055bd923c', 'test-1756727916408@example.com', 0, '$2b$12$u7ahjKsFBE8G81fXkOC3oOufLIXArnmQrzo8J3yHjwGCzwOl8m1om', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:58:37', '2025-09-01 11:58:37'),
('fc91570c-8955-48ba-b4d6-9833ff4e5b4f', 'temp.test.1756718574108@test.local', 0, '$2b$12$GXj6Yh0zlrQqhZHaAkcvYejmGdUuVXLNUirYJsPt2EylBBPiihe.q', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:22:54', '2025-09-01 09:22:54'),
('fda4cf09-0d1e-468c-8096-1caa46b782cc', 'test.1756725180100@faildaily.com', 0, '$2b$12$cV3epc2iE0wn.F4xBBj41..o8IEBQ7LCZGgirVgLY00d.D5qw/.Xi', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:13:00', '2025-09-01 11:13:00'),
('fe8d5a37-d3db-49dc-850e-532aae96868c', 'temp.test.1756719282631@test.local', 0, '$2b$12$lH7Lzw89h7o1Tj9BXZr1sO8pwh6cX7eTSiJGdJSr/F3ynhD0DSaNG', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:34:43', '2025-09-01 09:34:43');

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
('0a6a5bae-3336-4683-bb5c-520e439f08ca', 10, '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('11c77ea4-4602-4cb9-a75e-c894b480c4e8', 10, '2025-09-10 09:18:27', '2025-09-10 09:18:27'),
('11f917f4-8234-4d8e-820c-96ba4e44fdf4', 10, '2025-09-12 08:15:47', '2025-09-12 08:15:48'),
('2ad75882-c779-4322-b666-309cff555844', 10, '2025-09-12 07:33:09', '2025-09-12 07:33:10'),
('30289cf8-d0c7-47a7-8dbd-fc08d3c641ba', 10, '2025-09-12 08:07:37', '2025-09-12 08:07:37'),
('4098e3a5-7b27-42ec-b8be-204776aa7ed7', 10, '2025-09-12 06:25:26', '2025-09-12 06:25:26'),
('57a2560d-b065-44f3-96c8-3b0d2e5b569b', 57, '2025-08-27 08:28:47', '2025-09-01 12:22:20'),
('6db5b664-7c73-4fea-88c5-6d2e31c83bd5', 10, '2025-09-11 09:14:07', '2025-09-11 09:14:07'),
('814b7d10-b3d4-4921-ab47-a388bec6c7fb', 2, '2025-09-02 08:44:42', '2025-09-02 08:44:42'),
('9f92d99e-5f70-427e-aebd-68ca8b727bd4', 70, '2025-09-03 11:13:08', '2025-09-03 12:05:08'),
('a198dcd1-084e-4c20-8c86-d2ba0253b546', 10, '2025-09-12 08:09:49', '2025-09-12 08:09:49'),
('b13afe11-50b4-41f9-81ef-91fa5822cdba', 10, '2025-09-12 07:36:05', '2025-09-12 07:36:06'),
('bc35a9ac-d80e-4f79-ba5c-f39aea8106b2', 10, '2025-09-12 08:11:13', '2025-09-12 08:11:14'),
('c2b50739-2feb-4bcd-8506-70ea0e57fea9', 10, '2025-09-12 07:49:26', '2025-09-12 07:49:27'),
('c3201bf6-e04d-43e9-9690-484ca03b17da', 10, '2025-09-12 07:52:51', '2025-09-12 07:52:51'),
('d4fe663b-b6cd-4b1f-b37c-af00cf944e1a', 10, '2025-09-12 08:09:09', '2025-09-12 08:09:09');

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
('01e51936-54be-4284-9558-d4c3d1fdf621', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 2, 'comment_create', '0f29dcc0-0b48-47cd-b0c5-dd1adc225198', NULL, NULL, '2025-09-02 08:44:42'),
('06310340-d702-4f0d-8523-9216428cc799', 'b13afe11-50b4-41f9-81ef-91fa5822cdba', -2, 'comment_delete_revoke', '8c67be37-04e8-465a-bc5f-b99bbc70d25f', NULL, NULL, '2025-09-12 07:36:06'),
('0c445df7-4130-4881-902a-9f83eea79066', 'c2b50739-2feb-4bcd-8506-70ea0e57fea9', 2, 'comment_create', 'cdccbfa2-0b1b-439a-ae88-481f36b18a08', NULL, NULL, '2025-09-12 07:49:27'),
('0c7eeef6-cfcf-4acc-9e74-998927ac0eee', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 10, 'fail_create', 'a490ccd7-ba67-47cb-ad30-aeb08f1be8c8', NULL, NULL, '2025-09-03 11:55:06'),
('0e0569bf-792e-497c-bf6c-778eb31ebfd2', '30289cf8-d0c7-47a7-8dbd-fc08d3c641ba', -2, 'comment_delete_revoke', 'b6baf33f-8fd8-4f64-aa74-7338fbcddf71', NULL, NULL, '2025-09-12 08:07:37'),
('116e51ae-80e0-4541-b339-9014fd54e76d', 'c2b50739-2feb-4bcd-8506-70ea0e57fea9', -2, 'comment_delete_revoke', 'cdccbfa2-0b1b-439a-ae88-481f36b18a08', NULL, NULL, '2025-09-12 07:49:27'),
('1bf7de58-f972-4e9e-a01e-bf5ea9701847', 'a198dcd1-084e-4c20-8c86-d2ba0253b546', 2, 'comment_create', '443b7cba-54a1-4f50-98c0-86d5cb9d4d84', NULL, NULL, '2025-09-12 08:09:49'),
('1cb743fa-f6a0-4479-bde8-9f9072edff51', 'c3201bf6-e04d-43e9-9690-484ca03b17da', 10, 'fail_create', '62c2968c-bda0-46f1-93fb-5b97c3c980c6', NULL, NULL, '2025-09-12 07:52:51'),
('1d2d8930-08be-45fb-80a8-3f757d67ba55', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', -2, 'comment_delete_revoke', '35353546-b6f2-4956-838a-d0084780409c', NULL, NULL, '2025-09-11 09:14:07'),
('1e6efce2-5997-46b3-a840-523319f4c061', 'd4fe663b-b6cd-4b1f-b37c-af00cf944e1a', 10, 'fail_create', '2cc36aee-cb5e-43e5-bf0f-5b67df53faad', NULL, NULL, '2025-09-12 08:09:09'),
('201289df-95c2-47dc-be2f-685b33739b24', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '965883d5-c51b-4ccb-a7e4-e90aecc49016', 'support', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 12:28:21'),
('21c8fe3e-32c0-4bee-8df2-0a9c36397e11', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:33:44'),
('24598cc9-89a3-4341-903d-8a14516801fd', 'c3201bf6-e04d-43e9-9690-484ca03b17da', -2, 'comment_delete_revoke', '62c2968c-bda0-46f1-93fb-5b97c3c980c6', NULL, NULL, '2025-09-12 07:52:51'),
('2dbd7cdd-13b4-4b59-8f40-467d41b9a7e3', 'bc35a9ac-d80e-4f79-ba5c-f39aea8106b2', 2, 'comment_create', 'e5b5b210-3519-48ec-9065-d51dd75406c8', NULL, NULL, '2025-09-12 08:11:14'),
('3bcab9a9-97b4-47b6-8ad2-abaf183e5f00', 'c3201bf6-e04d-43e9-9690-484ca03b17da', 2, 'comment_create', '62c2968c-bda0-46f1-93fb-5b97c3c980c6', NULL, NULL, '2025-09-12 07:52:51'),
('40edbc26-5dd5-4c6b-a16f-f8351610ad36', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', 2, 'comment_create', '35353546-b6f2-4956-838a-d0084780409c', NULL, NULL, '2025-09-11 09:14:07'),
('4aa46698-a5cb-40de-b3c4-084202bc6edb', '11c77ea4-4602-4cb9-a75e-c894b480c4e8', 10, 'fail_create', '65824bca-7416-4d2b-8070-d3de03c3891c', NULL, NULL, '2025-09-10 09:18:27'),
('4f7b40bb-c9fa-4fb5-9c89-c01329384a26', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:33:31'),
('5149df52-438e-46c0-b771-ba2b9efa30f2', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 10, 'fail_create', NULL, NULL, NULL, '2025-09-03 11:13:08'),
('53fbd03d-fb36-4f35-9cb7-92b9f59ffa51', '11f917f4-8234-4d8e-820c-96ba4e44fdf4', 2, 'comment_create', '817d7546-7dba-4f59-9c87-ebaaf80c4d4a', NULL, NULL, '2025-09-12 08:15:47'),
('59cf03e8-d64c-4d14-8b7c-a5d9175dd7d2', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 10, 'fail_create', NULL, NULL, NULL, '2025-09-03 11:21:23'),
('5cf3a23f-d251-4c78-9442-5e7f0b7714cd', '30289cf8-d0c7-47a7-8dbd-fc08d3c641ba', 10, 'fail_create', 'b6baf33f-8fd8-4f64-aa74-7338fbcddf71', NULL, NULL, '2025-09-12 08:07:37'),
('5e21f193-5381-4b47-9644-8b7e87ca55e1', '2ad75882-c779-4322-b666-309cff555844', 2, 'comment_create', 'ce82f2af-e8cf-480a-a301-2d560e48b4a9', NULL, NULL, '2025-09-12 07:33:10'),
('68aff8d4-9f71-409a-9201-efd4d0907a27', 'bc35a9ac-d80e-4f79-ba5c-f39aea8106b2', -2, 'comment_delete_revoke', 'e5b5b210-3519-48ec-9065-d51dd75406c8', NULL, NULL, '2025-09-12 08:11:14'),
('6d5cd2a4-6c83-442f-9fe9-0d297a05ef2b', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 10, 'fail_create', 'b7737594-7fe3-4894-966e-4a785d5d7832', NULL, NULL, '2025-09-03 11:26:41'),
('6f13d3c9-ed95-4640-ac39-4d3fae7a6c2e', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 10, 'fail_create', '2d55f82e-8ba2-4189-a897-a1a588eaff95', NULL, NULL, '2025-09-03 11:34:44'),
('6fca7534-84f4-41c5-96d0-7feefeeacbff', 'd4fe663b-b6cd-4b1f-b37c-af00cf944e1a', -2, 'comment_delete_revoke', '2cc36aee-cb5e-43e5-bf0f-5b67df53faad', NULL, NULL, '2025-09-12 08:09:09'),
('7402f5dd-adc1-4215-8aeb-6d2d5eb28d0d', '11f917f4-8234-4d8e-820c-96ba4e44fdf4', -2, 'comment_delete_revoke', '817d7546-7dba-4f59-9c87-ebaaf80c4d4a', NULL, NULL, '2025-09-12 08:15:48'),
('76b87cb1-2d98-4373-b731-ebd0120eb5b1', 'b13afe11-50b4-41f9-81ef-91fa5822cdba', 10, 'fail_create', '8c67be37-04e8-465a-bc5f-b99bbc70d25f', NULL, NULL, '2025-09-12 07:36:05'),
('7f2d3753-043c-4189-9e5c-35e13e88eb7c', 'a198dcd1-084e-4c20-8c86-d2ba0253b546', -2, 'comment_delete_revoke', '443b7cba-54a1-4f50-98c0-86d5cb9d4d84', NULL, NULL, '2025-09-12 08:09:49'),
('8b466c2f-58b0-4fac-9e70-15ef8c8471e9', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 10, 'fail_create', 'bb77e2b0-8576-4984-9ebc-29d8262d5741', NULL, NULL, '2025-09-03 12:05:08'),
('8c03d661-0e06-486c-ad6e-c428d8dfcf1c', '0a6a5bae-3336-4683-bb5c-520e439f08ca', 10, 'fail_create', '394d616a-75db-46a2-9c30-00e4179ecbf5', NULL, NULL, '2025-09-11 09:18:51'),
('8daad5d7-e509-494e-8b64-993f8aca1c71', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', 2, 'comment_create', '512897e6-71c7-4fcc-a28c-265710ceb4a6', NULL, NULL, '2025-09-12 06:25:26'),
('98f1dc4b-24ff-449d-ade4-4f8dc24b3045', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', 10, 'fail_create', '512897e6-71c7-4fcc-a28c-265710ceb4a6', NULL, NULL, '2025-09-12 06:25:26'),
('9a7c58a4-26cb-42b4-8ee6-41e68f95bc1e', 'd4fe663b-b6cd-4b1f-b37c-af00cf944e1a', 2, 'comment_create', '2cc36aee-cb5e-43e5-bf0f-5b67df53faad', NULL, NULL, '2025-09-12 08:09:09'),
('a0ad4f62-cb34-48ce-94e2-24303e47ce87', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'support', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:33:46'),
('a3a4d051-d5a1-45c1-90ca-ce6cf3dd2a87', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 10, 'fail_create', '3577b475-85a3-4d21-b6cf-51df98450772', NULL, NULL, '2025-09-03 11:54:19'),
('a7ac836e-36a3-4130-bd68-1000ae2645d9', '0a6a5bae-3336-4683-bb5c-520e439f08ca', -2, 'comment_delete_revoke', '394d616a-75db-46a2-9c30-00e4179ecbf5', NULL, NULL, '2025-09-11 09:18:51'),
('aadd2516-5fba-4fc6-a3ce-aab6280f14f8', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'support', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 11:46:48'),
('ae020df8-e26c-4915-bf73-986146b58c1d', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 5, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'courage', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 09:33:04'),
('af6396b6-567a-4102-ab47-de938b21e05a', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 2, 'reaction', '965883d5-c51b-4ccb-a7e4-e90aecc49016', 'empathy', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-09-01 12:22:20'),
('b61317d6-606c-4bf5-b3d9-b40a37d12401', '2ad75882-c779-4322-b666-309cff555844', -2, 'comment_delete_revoke', 'ce82f2af-e8cf-480a-a301-2d560e48b4a9', NULL, NULL, '2025-09-12 07:33:10'),
('b91922bf-f5b3-4858-bc9d-3c9fe791b6e5', '0a6a5bae-3336-4683-bb5c-520e439f08ca', 2, 'comment_create', '394d616a-75db-46a2-9c30-00e4179ecbf5', NULL, NULL, '2025-09-11 09:18:51'),
('bc0ecc37-b54e-41a9-8460-528d8993d71f', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 2, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'empathy', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 11:46:44'),
('c5e9a07d-7663-47a2-937d-3d6ec4e16fca', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', 10, 'fail_create', '35353546-b6f2-4956-838a-d0084780409c', NULL, NULL, '2025-09-11 09:14:07'),
('c7564e6b-4276-4b39-89ff-25f975b35814', 'a198dcd1-084e-4c20-8c86-d2ba0253b546', 10, 'fail_create', '443b7cba-54a1-4f50-98c0-86d5cb9d4d84', NULL, NULL, '2025-09-12 08:09:49'),
('ca8f557f-7777-4f8d-a58a-98ab3a25ea4b', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-09-01 12:22:14'),
('cfcd9dad-38a3-49c5-b102-3398bba356fa', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 2, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'empathy', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:33:45'),
('d172f5c0-f9e5-486b-93ce-d84db0519b20', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 5, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'courage', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:28:47'),
('d604a881-4a25-4ab9-8210-5ec744d61690', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'support', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-09-01 12:22:17'),
('da277dbe-4a48-4757-a90d-50d04ad450d3', '2ad75882-c779-4322-b666-309cff555844', 10, 'fail_create', 'ce82f2af-e8cf-480a-a301-2d560e48b4a9', NULL, NULL, '2025-09-12 07:33:09'),
('deed0f69-b6eb-41f8-91c1-e303a392b98a', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 09:33:14'),
('e0bff3a7-1928-4872-bad4-09cf5f43f733', 'b13afe11-50b4-41f9-81ef-91fa5822cdba', 2, 'comment_create', '8c67be37-04e8-465a-bc5f-b99bbc70d25f', NULL, NULL, '2025-09-12 07:36:06'),
('ebbc563a-10db-4b92-8e31-eec59c5be62c', 'c2b50739-2feb-4bcd-8506-70ea0e57fea9', 10, 'fail_create', 'cdccbfa2-0b1b-439a-ae88-481f36b18a08', NULL, NULL, '2025-09-12 07:49:26'),
('ef917fb3-087c-429e-8ffb-9eaa5322d2ff', 'bc35a9ac-d80e-4f79-ba5c-f39aea8106b2', 10, 'fail_create', 'e5b5b210-3519-48ec-9065-d51dd75406c8', NULL, NULL, '2025-09-12 08:11:13'),
('f23165fd-0a47-4382-bb8e-0c9457297153', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 5, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'courage', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 11:39:56'),
('f3ba781d-ba76-436c-a7ee-9f224a4984f1', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 5, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'courage', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:33:39'),
('f7574cfb-d085-4061-baac-d408bc7ac6e1', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 2, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'empathy', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 12:37:06'),
('f84f1390-f5f3-49a7-887f-0818645a2216', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 11:40:20'),
('f93db7fd-8c5f-4d7c-8f8d-cb1e3209ea2b', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', -2, 'comment_delete_revoke', '512897e6-71c7-4fcc-a28c-265710ceb4a6', NULL, NULL, '2025-09-12 06:25:26'),
('fbfdc771-eb2e-4399-b4f0-d3aa8e758a2b', '11f917f4-8234-4d8e-820c-96ba4e44fdf4', 10, 'fail_create', '817d7546-7dba-4f59-9c87-ebaaf80c4d4a', NULL, NULL, '2025-09-12 08:15:47'),
('ffb91f16-a17d-4f4b-8cc6-af8927b19a9f', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 2, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'empathy', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 11:39:58'),
('ffcbda74-0659-4c95-a32c-b7126e55f183', '30289cf8-d0c7-47a7-8dbd-fc08d3c641ba', 2, 'comment_create', 'b6baf33f-8fd8-4f64-aa74-7338fbcddf71', NULL, NULL, '2025-09-12 08:07:37');

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
('031805f3-f92f-4720-bdb2-8bcee46aa492', 'demo_push_token_1234567890', 'web', '2025-09-12 07:44:24', '2025-09-12 08:15:46');

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
