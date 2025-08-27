-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : mer. 27 août 2025 à 09:08
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
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_display_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resource_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resource_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `details` longtext COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `old_values` longtext COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `new_values` longtext COLLATE utf8mb4_unicode_ci COMMENT 'JSON data',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `session_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correlation_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `success` tinyint(1) DEFAULT '1',
  `error_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
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
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` longtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'JSON data',
  `description` text COLLATE utf8mb4_unicode_ci,
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
-- Structure de la table `badges`
--

DROP TABLE IF EXISTS `badges`;
CREATE TABLE IF NOT EXISTS `badges` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rarity` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `badge_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unlocked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `badges_user_id_fkey` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
('fail-master-10', 'Collectionneur', 'Partager 10 fails', 'library-outline', 'COURAGE', 'common', 'fail_count', 10, '2025-08-08 16:22:31'),
('fail-master-100', 'Maître des Fails', 'Partager 100 fails', 'ribbon-outline', 'COURAGE', 'epic', 'fail_count', 100, '2025-08-08 16:34:14'),
('fail-master-25', 'Narrateur', 'Partager 25 fails', 'book-outline', 'COURAGE', 'rare', 'fail_count', 25, '2025-08-08 16:34:14'),
('fail-master-365', 'Chroniqueur Légendaire', 'Partager 365 fails (un an !)', 'calendar-number-outline', 'COURAGE', 'legendary', 'fail_count', 365, '2025-08-08 16:34:14'),
('fail-master-5', 'Apprenti', 'Partager 5 fails', 'school-outline', 'COURAGE', 'common', 'fail_count', 5, '2025-08-08 16:22:31'),
('fail-master-50', 'Grand Collectionneur', 'Partager 50 fails', 'albums-outline', 'COURAGE', 'rare', 'fail_count', 50, '2025-08-08 16:34:14'),
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
  KEY `comments_user_id_fkey` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `comments`
--

INSERT INTO `comments` (`id`, `fail_id`, `user_id`, `content`, `is_encouragement`, `created_at`, `updated_at`) VALUES
('2de94425-b0cd-4466-b026-a72f0747af94', '965883d5-c51b-4ccb-a7e4-e90aecc49016', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'nouveau commenatire', 1, '2025-08-26 11:06:46', '2025-08-26 11:06:46'),
('49116b23-f484-4ed1-a782-f8f18d289847', '85efade8-0857-40a9-a790-8253c270157f', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'test', 1, '2025-08-26 10:53:49', '2025-08-26 10:53:49'),
('9e3c449e-3ec1-44b8-9963-adbb57fa1e0b', '85efade8-0857-40a9-a790-8253c270157f', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'test', 1, '2025-08-26 10:57:58', '2025-08-26 10:57:58'),
('bc4fe6ed-0cab-44d2-a5e8-a6cee2a04889', '965883d5-c51b-4ccb-a7e4-e90aecc49016', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'tyui', 1, '2025-08-26 11:03:13', '2025-08-26 11:03:13');

-- --------------------------------------------------------

--
-- Structure de la table `comment_moderation`
--

DROP TABLE IF EXISTS `comment_moderation`;
CREATE TABLE IF NOT EXISTS `comment_moderation` (
  `comment_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('under_review','hidden','approved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'under_review',
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
  KEY `idx_fails_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `fails`
--

INSERT INTO `fails` (`id`, `user_id`, `title`, `description`, `category`, `image_url`, `is_anonyme`, `comments_count`, `created_at`, `updated_at`) VALUES
('0f29dcc0-0b48-47cd-b0c5-dd1adc225198', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'fails test 1 : jeudi adulte test 1', 'poste du premie fails', 'humour', NULL, 0, 0, '2025-08-21 09:51:05', '2025-08-26 12:54:29'),
('85efade8-0857-40a9-a790-8253c270157f', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'samedi test fails anonyme 1', 'je cree cette fois ci un fails en anonyme dans la categorie sprot', 'sport', NULL, 1, 2, '2025-08-23 08:18:57', '2025-08-26 12:54:22'),
('965883d5-c51b-4ccb-a7e4-e90aecc49016', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'samedi test fails public 1', 'je vais rentrer un fails en public pour que pseudo et avatar soit afficher, cree categorie technologie', 'technologie', NULL, 0, 2, '2025-08-23 08:17:15', '2025-08-26 12:54:13');

-- --------------------------------------------------------

--
-- Structure de la table `fail_moderation`
--

DROP TABLE IF EXISTS `fail_moderation`;
CREATE TABLE IF NOT EXISTS `fail_moderation` (
  `fail_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('under_review','hidden','approved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'under_review',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`fail_id`)
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
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `profiles`
--

INSERT INTO `profiles` (`id`, `user_id`, `username`, `display_name`, `avatar_url`, `bio`, `registration_completed`, `legal_consent`, `age_verification`, `preferences`, `stats`, `created_at`, `updated_at`) VALUES
('12811165-7e6c-11f0-b1c5-345a608f406b', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', NULL, 'jeudi test adulte 1', NULL, NULL, 1, '{\"birthDate\":\"1981-08-20\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-08-21T08:51:48.030Z\"}', '{\"birthDate\":\"1981-08-20\",\"age\":44,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-08-21 08:51:48', '2025-08-21 08:51:48'),
('1437f075-7f4b-11f0-b1c5-345a608f406b', '5efe0f4e-ea21-4418-9e15-5e361c43b3f8', NULL, 'Test Public User', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-08-22T11:28:08.642Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-08-22 11:28:08', '2025-08-22 11:28:08'),
('36b81632-8184-11f0-b1c5-345a608f406b', '3eec9236-40db-46ca-ae18-9b089bef0e75', NULL, 'Lundi 25 test 1', NULL, NULL, 1, '{\"birthDate\":\"1981-08-20\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-08-25T07:22:10.188Z\"}', '{\"birthDate\":\"1981-08-20\",\"age\":44,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-08-25 07:22:10', '2025-08-25 07:22:10'),
('56070d3d-8198-11f0-b1c5-345a608f406b', '411dd9ff-9673-48c9-838a-50b49074fff0', NULL, 'Test User', NULL, NULL, 1, '{\"birthDate\":null,\"agreeToTerms\":true,\"acceptedAt\":\"2025-08-25T09:46:12.674Z\"}', '{\"birthDate\":null,\"age\":null,\"verified\":false}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-08-25 09:46:12', '2025-08-25 09:46:12'),
('5b51d48d-8250-11f0-b1c5-345a608f406b', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', NULL, 'Taaazzz', NULL, NULL, 1, '{\"birthDate\":\"1981-08-20\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-08-26T07:43:28.943Z\"}', '{\"birthDate\":\"1981-08-20\",\"age\":44,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 8.0}', '2025-08-26 07:43:28', '2025-08-26 11:06:46'),
('8f36231f-7fa0-11f0-b1c5-345a608f406b', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', NULL, 'vendredi test 1', NULL, NULL, 1, '{\"birthDate\":\"1981-08-20\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-08-22T21:40:02.257Z\"}', '{\"birthDate\":\"1981-08-20\",\"age\":44,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-08-22 21:40:02', '2025-08-22 21:40:02'),
('b41be59c-7f4c-11f0-b1c5-345a608f406b', 'd096d562-988d-44be-bd9a-55272e9ed9ff', NULL, 'Test User 1755862785778', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-08-22T11:39:46.413Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-08-22 11:39:46', '2025-08-22 11:39:46');

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
  KEY `idx_reactions_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `reactions`
--

INSERT INTO `reactions` (`id`, `user_id`, `fail_id`, `reaction_type`, `created_at`) VALUES
('2040f91e-edf1-4cdf-99fa-c15d64cafc25', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '85efade8-0857-40a9-a790-8253c270157f', 'support', '2025-08-27 08:33:46'),
('5c18bb2d-cd68-4b54-8045-aaaca336791c', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', '0f29dcc0-0b48-47cd-b0c5-dd1adc225198', 'courage', '2025-08-21 11:49:45'),
('e6b1454e-2d89-4187-818c-9b6175709838', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '0f29dcc0-0b48-47cd-b0c5-dd1adc225198', 'empathy', '2025-08-27 07:43:59'),
('f80fb208-79a7-4a21-a7c3-e0bc9d27f6c0', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', '965883d5-c51b-4ccb-a7e4-e90aecc49016', 'courage', '2025-08-23 08:45:07');

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
('905a655a-1c19-4b80-8730-3fff25190d9b', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, '85efade8-0857-40a9-a790-8253c270157f', 'samedi test fails anonyme 1', 'vendredi test 1', 'courage', 5, '2025-08-27 08:28:47', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:28:47'),
('b93c9195-75e0-4026-ae46-df20f249209d', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, '85efade8-0857-40a9-a790-8253c270157f', 'samedi test fails anonyme 1', 'vendredi test 1', 'laugh', 3, '2025-08-27 08:33:31', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:33:31'),
('ce2f9bb2-c6d8-4437-b945-d30ebcc87f96', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, '85efade8-0857-40a9-a790-8253c270157f', 'samedi test fails anonyme 1', 'vendredi test 1', 'courage', 5, '2025-08-27 08:33:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:33:39'),
('d63b7517-acb0-435e-ad86-fc29ae6439cb', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, '85efade8-0857-40a9-a790-8253c270157f', 'samedi test fails anonyme 1', 'vendredi test 1', 'laugh', 3, '2025-08-27 08:33:44', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:33:44'),
('d9eaf66d-37e4-4623-83b1-dc2e66442870', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, '85efade8-0857-40a9-a790-8253c270157f', 'samedi test fails anonyme 1', 'vendredi test 1', 'empathy', 2, '2025-08-27 08:33:45', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:33:45'),
('f13304a7-7159-43e2-a5e5-ae7283e2c338', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, '85efade8-0857-40a9-a790-8253c270157f', 'samedi test fails anonyme 1', 'vendredi test 1', 'support', 3, '2025-08-27 08:33:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:33:46');

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
('', 'warning', 'Fail reported', 'fail_report', '{\"failId\":\"85efade8-0857-40a9-a790-8253c270157f\",\"reason\":null,\"extra\":null}', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-08-26 11:23:51', '2025-08-26 11:23:51');

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

INSERT INTO `users` (`id`, `email`, `email_confirmed`, `password_hash`, `role`, `last_login`, `login_count`, `account_status`, `registration_step`, `created_at`, `updated_at`) VALUES
('3eec9236-40db-46ca-ae18-9b089bef0e75', 'vfr@vfr.vfr', 0, '$2b$12$IxV.5xfvgXly8sOtV9RDSuLZ.kVVYjGBtDNv2hUKKrbJNvyrmH.um', 'user', NULL, 0, 'active', 'basic', '2025-08-25 07:22:10', '2025-08-25 07:22:10'),
('411dd9ff-9673-48c9-838a-50b49074fff0', 'test@test.com', 0, '$2b$12$nsm/fuVNm3RoVD.M2HYgae6zKa3zkJr.hEZpvGkwHa1A6Z0.b8N5a', 'user', NULL, 0, 'active', 'basic', '2025-08-25 09:46:12', '2025-08-25 09:46:12'),
('57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', 0, '$2b$12$0UFb9XrOTymJDlnjUODK2.ntTCJx1517zcw823/ErXolBxxAJB5ju', 'user', NULL, 0, 'active', 'basic', '2025-08-22 21:40:02', '2025-08-22 21:40:02'),
('5efe0f4e-ea21-4418-9e15-5e361c43b3f8', 'test.public.1755862087925@example.com', 0, '$2b$12$PMaASh9w.EREyFxfy1NMnuLlg8917mJwUKT7vyqpOTIZM6uG3TJdO', 'user', NULL, 0, 'active', 'basic', '2025-08-22 11:28:08', '2025-08-22 11:28:08'),
('814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 0, '$2b$12$wCf7D9J9f9HsAPQ20Gu3neqHcMqfEY05inLUWpQHqkbSRVGzCgyn.', 'user', NULL, 0, 'active', 'basic', '2025-08-21 08:51:48', '2025-08-21 08:51:48'),
('9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 0, '$2b$12$eVjsOVU7ju.gHpzwd8fJdelGbXMx9Agck89E3/0bEf3wyoQh3Bi1C', 'super_admin', NULL, 0, 'active', 'basic', '2025-08-26 07:43:28', '2025-08-26 07:57:43'),
('d096d562-988d-44be-bd9a-55272e9ed9ff', 'temp.test.1755862785778@test.local', 0, '$2b$12$vx8LJQLsYmwHshIO2VHeH.QxAJBAhMG98sK.JX/Q6tiV946zc3UW.', 'user', NULL, 0, 'active', 'basic', '2025-08-22 11:39:46', '2025-08-22 11:39:46');

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
('00686d54-602c-4e80-88bc-286c5f6c18cc', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:50:10', '2025-08-21 09:50:10'),
('01432207-12ce-459e-909a-2e54f8e7ffb0', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 08:14:56', '2025-08-26 08:14:56'),
('02af98ed-dd95-4dfb-be7a-2fb61217e9e0', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:06:00', '2025-08-21 09:06:00'),
('02b6ca6d-c284-43e0-9ca0-d084ba6f2926', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 11:07:01', '2025-08-21 11:07:01'),
('02e21c6c-9a1d-4fe2-a87d-b1ddeac6c36e', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:37:16', '2025-08-21 09:37:16'),
('13b80e09-57d4-4a6f-8fd6-8db0a4e63cfe', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-23 09:10:38', '2025-08-23 09:10:38'),
('13dd5e81-f437-4742-96d8-638437c2fbe1', 'd096d562-988d-44be-bd9a-55272e9ed9ff', 'temp.test.1755862785778@test.local', 'Test User 1755862785778', 'register', '{\"email\":\"temp.test.1755862785778@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-08-22 11:39:46', '2025-08-22 11:39:46'),
('18b4a727-9969-4466-916a-3e38c1353e74', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 07:54:09', '2025-08-27 07:54:09'),
('193f0312-3112-4edc-85ad-a3cf7b673d92', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 07:38:13', '2025-08-27 07:38:13'),
('199fe062-8395-4039-b102-3f1cd73e61b0', 'd096d562-988d-44be-bd9a-55272e9ed9ff', 'temp.test.1755862785778@test.local', 'Test User 1755862785778', 'login', '{\"email\":\"temp.test.1755862785778@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-08-22 11:39:47', '2025-08-22 11:39:47'),
('20c945fa-4a7b-4e97-a64e-b7ae2be69c24', '5efe0f4e-ea21-4418-9e15-5e361c43b3f8', 'test.public.1755862087925@example.com', 'Test Public User', 'register', '{\"email\":\"test.public.1755862087925@example.com\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-08-22 11:28:08', '2025-08-22 11:28:08'),
('28ae6dd8-ad02-4e4a-9ffd-bf56b6599cd6', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 10:00:34', '2025-08-21 10:00:34'),
('290dcacf-92fa-42be-86e2-e426686ae922', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 10:53:01', '2025-08-21 10:53:01'),
('2ddd8fd2-e561-4770-800c-16a943b64cf1', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:50:30', '2025-08-21 09:50:30'),
('2f976084-f76b-4958-af31-59730c78e265', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', NULL, 'create_fail', '{\"title\":\"samedi test fails public 1\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-23 08:17:15', '2025-08-23 08:17:15'),
('2fa2f2cb-e424-453d-9523-9138380f173e', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 08:22:05', '2025-08-26 08:22:05'),
('30ca79fe-d51f-46c2-ae88-39bfa3dc976e', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 11:53:52', '2025-08-26 11:53:52'),
('33d33aea-9e1b-4dcf-9fbd-df3a863d35c9', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'register', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 07:43:28', '2025-08-26 07:43:28'),
('3693e545-73ba-4709-8a29-dfbcd9445deb', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:28:55', '2025-08-21 09:28:55'),
('3ce575a3-85b8-4ab3-83c7-dacd4e739157', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 06:59:20', '2025-08-27 06:59:20'),
('40f0037d-648c-4725-b184-f9d8626c5a8e', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 13:30:13', '2025-08-26 13:30:13'),
('4399e570-014d-481d-8a5e-46712cfd22db', '3eec9236-40db-46ca-ae18-9b089bef0e75', 'vfr@vfr.vfr', 'Lundi 25 test 1', 'register', '{\"email\":\"vfr@vfr.vfr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 07:22:10', '2025-08-25 07:22:10'),
('44c8bf4b-3762-47a8-8898-009e8199dd27', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 11:49:42', '2025-08-26 11:49:42'),
('4ad519c0-ea12-4ae8-88ac-f5f307f0051b', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 07:10:08', '2025-08-27 07:10:08'),
('540b775c-8016-4513-b397-f46e384332fb', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:43:49', '2025-08-27 08:43:49'),
('54f3d2a9-2425-4fc7-8f75-b8ad028dc596', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 10:41:35', '2025-08-21 10:41:35'),
('555dc245-49ac-4464-ab9d-555e11d3013c', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 13:31:28', '2025-08-25 13:31:28'),
('592ab2fb-8670-47c8-b979-74fcd0c18cc7', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 12:01:56', '2025-08-21 12:01:56'),
('7052dbe0-0d78-41d9-ab2c-96f1a0db6083', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 10:59:55', '2025-08-21 10:59:55'),
('717918fa-c190-4da9-af4f-8cd8d01b9504', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:15:06', '2025-08-21 09:15:06'),
('74be9599-6e82-43aa-a3c6-68a4874fca45', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 11:34:10', '2025-08-26 11:34:10'),
('7a5e33eb-3490-4f6d-9572-1835b7d45944', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-22 22:10:32', '2025-08-22 22:10:32'),
('80852f00-768c-499c-8c33-e18f25a9075c', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:28:43', '2025-08-27 08:28:43'),
('815f716c-a209-4ba4-8a6a-5cc115b8ec49', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', 'vendredi test 1', 'register', '{\"email\":\"tre@rte.ee\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-22 21:40:02', '2025-08-22 21:40:02'),
('81f85dbc-494b-424f-81a3-01ea5e14aeb2', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 08:35:13', '2025-08-26 08:35:13'),
('83994a5f-6f19-4c7a-9f37-80c6f27b4ed7', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 11:15:02', '2025-08-21 11:15:02'),
('85c0ccc2-4319-4d8d-a5ef-50fe1660c28d', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 11:41:42', '2025-08-21 11:41:42'),
('86fe16d9-86c3-4bcb-9ad1-2a1cf90ac354', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:47:47', '2025-08-25 08:47:47'),
('87b60d00-8523-4429-a596-e4eb62adf556', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 11:35:57', '2025-08-26 11:35:57'),
('8e72dede-d532-4812-880c-a85a5eac842d', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', 'vendredi test 1', 'login', '{\"email\":\"tre@rte.ee\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-22 22:28:20', '2025-08-22 22:28:20'),
('91eaa83f-2648-4567-990f-b2b31e0ff080', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 13:11:41', '2025-08-26 13:11:41'),
('93d0c42c-1c35-4ee4-b47f-6a93e909b391', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 08:34:50', '2025-08-26 08:34:50'),
('94809be8-9ede-4fc3-acaf-2b931b6c4ac9', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"empathy\"}', '85efade8-0857-40a9-a790-8253c270157f', 'empathy', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:33:45', '2025-08-27 08:33:45'),
('967da4ad-7fd0-4ae6-b103-8bf47f312aa7', '411dd9ff-9673-48c9-838a-50b49074fff0', 'test@test.com', 'Test User', 'register', '{\"email\":\"test@test.com\"}', NULL, NULL, '::1', 'curl/8.14.1', '2025-08-25 09:46:12', '2025-08-25 09:46:12'),
('9b706e19-6112-4ff2-a3d9-e195b8a78a53', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-22 22:03:02', '2025-08-22 22:03:02'),
('a521f3a7-e9f6-4111-97b2-c5935d30d779', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 13:11:54', '2025-08-26 13:11:54'),
('a68c8082-66da-43fe-b46f-03705108020a', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 12:25:38', '2025-08-26 12:25:38'),
('ad4cff51-6325-446c-bb60-034b9234288f', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 08:47:35', '2025-08-26 08:47:35'),
('ae4b02d0-f68c-4973-91d6-820445a02621', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 12:15:51', '2025-08-26 12:15:51'),
('b4250761-b1f2-4f10-8e85-07168f6c48c8', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:10:17', '2025-08-21 09:10:17'),
('b7fd08c1-ff3d-4e48-b1bc-ed8f9de0ea21', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"courage\"}', '85efade8-0857-40a9-a790-8253c270157f', 'courage', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:33:39', '2025-08-27 08:33:39'),
('bcad8ea2-a112-4a94-b054-5ceb95e6acfb', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', NULL, 'create_fail', '{\"title\":\"fails test 1 : jeudi adulte test 1\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:51:05', '2025-08-21 09:51:05'),
('bcc22f9a-070f-48f7-8006-2b97d841fd68', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 11:39:27', '2025-08-21 11:39:27'),
('c1db7702-207e-477b-9144-cf55314bec9a', '5efe0f4e-ea21-4418-9e15-5e361c43b3f8', 'test.public.1755862087925@example.com', 'Test Public User', 'login', '{\"email\":\"test.public.1755862087925@example.com\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-08-22 11:28:09', '2025-08-22 11:28:09'),
('c7ca0f56-b7a7-4eed-a2c8-e79c7079d032', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"support\"}', '85efade8-0857-40a9-a790-8253c270157f', 'support', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:33:46', '2025-08-27 08:33:46'),
('cc825aa0-84be-4086-bff4-02fead106563', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 07:43:52', '2025-08-26 07:43:52'),
('cd53de5f-2b34-4b38-a47d-a1287a6c0c97', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:08:07', '2025-08-25 09:08:07'),
('cf6850b9-5130-4d4a-8690-ec3a6776089c', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-22 22:27:53', '2025-08-22 22:27:53'),
('d13ee542-698a-40b5-916a-d97f57f1d3ec', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 10:53:38', '2025-08-26 10:53:38'),
('d1887c63-9525-4fcb-9092-25a4d402aecc', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:40:32', '2025-08-21 09:40:32'),
('d72241b5-893e-47b3-b0a6-82e80e94a599', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', 'vendredi test 1', 'login', '{\"email\":\"tre@rte.ee\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-22 22:10:45', '2025-08-22 22:10:45'),
('df3ae67b-78a1-4513-8e06-5010c44e4899', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"laugh\"}', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:33:44', '2025-08-27 08:33:44'),
('e0dfbfd5-6324-40af-b1a4-c6b976d1e20d', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 07:23:36', '2025-08-26 07:23:36'),
('e288cf8b-34ea-4a62-88c6-680f04468e35', '3eec9236-40db-46ca-ae18-9b089bef0e75', 'vfr@vfr.vfr', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 07:54:17', '2025-08-25 07:54:17'),
('ea7e4897-d392-49d7-a60a-5a6751b96314', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', NULL, 'create_fail', '{\"title\":\"samedi test fails anonyme 1\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-23 08:18:57', '2025-08-23 08:18:57'),
('f18ee623-3c02-4620-9e9e-ef1bde1c05e0', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 11:33:46', '2025-08-21 11:33:46'),
('f1fdce03-fa5b-4de5-aff9-5d12d964d751', '411dd9ff-9673-48c9-838a-50b49074fff0', 'test@test.com', 'Test User', 'login', '{\"email\":\"test@test.com\"}', NULL, NULL, '::1', 'curl/8.14.1', '2025-08-25 09:47:02', '2025-08-25 09:47:02'),
('f4be9bd7-1fc7-4af2-b8c6-bf41bbb6feca', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"laugh\"}', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:33:31', '2025-08-27 08:33:31'),
('f5c0ea30-1954-4c19-809e-bff561c91984', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', NULL, NULL, 'register', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, NULL, NULL, '2025-08-21 08:51:48', '2025-08-21 08:51:48'),
('f70e140a-5ab1-4821-8387-a9a02b0e16dd', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:12:47', '2025-08-21 09:12:47'),
('f798a5a8-bd40-4657-937b-998ece59cc8b', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-23 09:01:42', '2025-08-23 09:01:42'),
('f9f981c5-2476-44ee-837a-bc951a8157db', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-22 22:10:21', '2025-08-22 22:10:21'),
('fa3e985a-37ac-4dfd-a0c3-efb854bcbce2', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"courage\"}', '85efade8-0857-40a9-a790-8253c270157f', 'courage', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:28:47', '2025-08-27 08:28:47'),
('fc11a360-1b76-43dc-bbe3-9e2a4495bfdf', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:25:03', '2025-08-21 09:25:03');

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
  KEY `idx_user_badges_badge_id` (`badge_id`)
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
('57a2560d-b065-44f3-96c8-3b0d2e5b569b', 21, '2025-08-27 08:28:47', '2025-08-27 08:33:46');

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
('21c8fe3e-32c0-4bee-8df2-0a9c36397e11', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:33:44'),
('4f7b40bb-c9fa-4fb5-9c89-c01329384a26', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:33:31'),
('a0ad4f62-cb34-48ce-94e2-24303e47ce87', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'support', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:33:46'),
('cfcd9dad-38a3-49c5-b102-3398bba356fa', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 2, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'empathy', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:33:45'),
('d172f5c0-f9e5-486b-93ce-d84db0519b20', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 5, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'courage', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:28:47'),
('f3ba781d-ba76-436c-a7ee-9f224a4984f1', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 5, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'courage', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:33:39');

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
`account_status` enum('active','suspended','deleted')
,`age_verification` longtext
,`avatar_url` text
,`bio` text
,`calculated_age` bigint
,`display_name` varchar(255)
,`email` varchar(255)
,`email_confirmed` tinyint(1)
,`is_currently_minor` int
,`last_login` timestamp
,`legal_compliance_status` varchar(9)
,`legal_consent` longtext
,`login_count` int
,`preferences` longtext
,`profile_created_at` timestamp
,`profile_id` char(36)
,`profile_updated_at` timestamp
,`registration_completed` tinyint(1)
,`role` varchar(50)
,`stats` longtext
,`user_created_at` timestamp
,`user_id` char(36)
,`username` varchar(255)
);

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
-- Contraintes pour la table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `badges`
--
ALTER TABLE `badges`
  ADD CONSTRAINT `badges_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
