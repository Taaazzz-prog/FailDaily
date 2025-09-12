-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : ven. 12 sep. 2025 à 07:17
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

--
-- Déchargement des données de la table `comments`
--

INSERT INTO `comments` (`id`, `fail_id`, `user_id`, `content`, `is_encouragement`, `created_at`, `updated_at`) VALUES
('2de94425-b0cd-4466-b026-a72f0747af94', '965883d5-c51b-4ccb-a7e4-e90aecc49016', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'nouveau commenatire', 1, '2025-08-26 11:06:46', '2025-08-26 11:06:46'),
('49116b23-f484-4ed1-a782-f8f18d289847', '85efade8-0857-40a9-a790-8253c270157f', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'test', 1, '2025-08-26 10:53:49', '2025-08-26 10:53:49'),
('72aa00ee-8d9d-4367-9200-a69ea65ca502', '0f29dcc0-0b48-47cd-b0c5-dd1adc225198', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'zzzzz', 1, '2025-09-02 08:44:42', '2025-09-02 08:44:42'),
('9e3c449e-3ec1-44b8-9963-adbb57fa1e0b', '85efade8-0857-40a9-a790-8253c270157f', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'test', 1, '2025-08-26 10:57:58', '2025-08-26 10:57:58'),
('bc4fe6ed-0cab-44d2-a5e8-a6cee2a04889', '965883d5-c51b-4ccb-a7e4-e90aecc49016', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'tyui', 1, '2025-08-26 11:03:13', '2025-08-26 11:03:13');

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

--
-- Déchargement des données de la table `fails`
--

INSERT INTO `fails` (`id`, `user_id`, `title`, `description`, `category`, `image_url`, `is_anonyme`, `comments_count`, `created_at`, `updated_at`) VALUES
('0f29dcc0-0b48-47cd-b0c5-dd1adc225198', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'fails test 1 : jeudi adulte test 1', 'poste du premie fails', 'humour', NULL, 0, 1, '2025-08-21 09:51:05', '2025-09-02 08:44:42'),
('2d55f82e-8ba2-4189-a897-a1a588eaff95', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'dddddddddddddd', 'ddddddddddddddddd', 'special', NULL, 0, 0, '2025-09-03 11:34:44', '2025-09-03 11:34:44'),
('35353546-b6f2-4956-838a-d0084780409c', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', 'Mon test de fail', 'Description e2e', 'Général', '/uploads/fails/fail-6db5b664-7c73-4fea-88c5-6d2e31c83bd5-1757582047101-730936314.png', 0, 0, '2025-09-11 09:14:07', '2025-09-11 09:14:07'),
('3577b475-85a3-4d21-b6cf-51df98450772', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'test voir si auto valider ou non', 'je verifie si mon fail peut etre signalé ou non', 'cuisine', NULL, 0, 0, '2025-09-03 11:54:19', '2025-09-03 11:54:19'),
('394d616a-75db-46a2-9c30-00e4179ecbf5', '0a6a5bae-3336-4683-bb5c-520e439f08ca', 'Mon test de fail', 'Description e2e', 'Général', '/uploads/fails/fail-0a6a5bae-3336-4683-bb5c-520e439f08ca-1757582331553-250828143.png', 0, 0, '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('512897e6-71c7-4fcc-a28c-265710ceb4a6', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', 'Mon test de fail', 'Description e2e', 'Général', '/uploads/fails/fail-4098e3a5-7b27-42ec-b8be-204776aa7ed7-1757658326314-427198151.png', 0, 0, '2025-09-12 06:25:26', '2025-09-12 06:25:26'),
('65824bca-7416-4d2b-8070-d3de03c3891c', '11c77ea4-4602-4cb9-a75e-c894b480c4e8', 'test premier fail alexia', 'onl jh o lk joihu joi hhlj kh llihkug iguhi uhiu', 'special', NULL, 0, 0, '2025-09-10 09:18:27', '2025-09-10 09:18:27'),
('85efade8-0857-40a9-a790-8253c270157f', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'samedi test fails anonyme 1', 'je cree cette fois ci un fails en anonyme dans la categorie sprot', 'sport', NULL, 1, 2, '2025-08-23 08:18:57', '2025-08-26 12:54:22'),
('965883d5-c51b-4ccb-a7e4-e90aecc49016', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'samedi test fails public 1', 'je vais rentrer un fails en public pour que pseudo et avatar soit afficher, cree categorie technologie', 'technologie', NULL, 0, 2, '2025-08-23 08:17:15', '2025-08-26 12:54:13'),
('a490ccd7-ba67-47cb-ad30-aeb08f1be8c8', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'zzzzzzzzzzzzzzz', 'aaaaaaaaaaaaaaaaa', 'special', NULL, 0, 0, '2025-09-03 11:55:06', '2025-09-03 11:55:06'),
('b7737594-7fe3-4894-966e-4a785d5d7832', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'test badges 2', 'deuxieme test', 'travail', NULL, 0, 0, '2025-09-03 11:26:41', '2025-09-03 11:26:41'),
('bb77e2b0-8576-4984-9ebc-29d8262d5741', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'new test badges et validation', 'je devrais recevoir le badges des 5 fails e tpas de validation automatique', 'transport', NULL, 0, 0, '2025-09-03 12:05:07', '2025-09-03 12:05:07');

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
-- Déchargement des données de la table `profiles`
--

INSERT INTO `profiles` (`id`, `user_id`, `username`, `display_name`, `avatar_url`, `bio`, `registration_completed`, `legal_consent`, `age_verification`, `preferences`, `stats`, `created_at`, `updated_at`) VALUES
('12811165-7e6c-11f0-b1c5-345a608f406b', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', NULL, 'jeudi test adulte 1', 'assets/profil/face.png', NULL, 1, '{\"birthDate\":\"1981-08-20\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-08-21T08:51:48.030Z\"}', '{\"birthDate\":\"1981-08-20\",\"age\":44,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-08-21 08:51:48', '2025-09-02 08:46:51'),
('1437f075-7f4b-11f0-b1c5-345a608f406b', '5efe0f4e-ea21-4418-9e15-5e361c43b3f8', NULL, 'Test Public User', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-08-22T11:28:08.642Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-08-22 11:28:08', '2025-08-22 11:28:08'),
('19e041cf-8713-11f0-b1c5-345a608f406b', '293c74c1-371b-45e0-b548-77dff333b8e9', NULL, 'User 1756717654854-edit', '/uploads/avatars/avatar-293c74c1-371b-45e0-b548-77dff333b8e9-1756717656984-927346697.png', 'Bio e2e', 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:07:35.631Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:07:35', '2025-09-01 09:07:36'),
('1b5eb3e3-8713-11f0-b1c5-345a608f406b', '58570b71-7bde-4266-b35c-03e59c0f82e7', NULL, 'AdminTmp', NULL, NULL, 1, '{\"birthDate\":\"1988-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:07:38.172Z\"}', '{\"birthDate\":\"1988-01-01\",\"age\":37,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:07:38', '2025-09-01 09:07:38'),
('1c0c4e2c-8713-11f0-b1c5-345a608f406b', '33e10cbd-a3cf-4259-8098-f3b33e3ec8bc', NULL, 'Teen', NULL, NULL, 0, '{\"birthDate\":\"2010-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:07:39.313Z\"}', '{\"birthDate\":\"2010-01-01\",\"age\":15,\"verified\":true,\"needsParentalConsent\":true,\"parentalConsentStatus\":\"rejected\",\"parentalApprovedAt\":\"2025-09-01T09:07:39.340Z\",\"parentalRevokedAt\":\"2025-09-01T09:07:39.380Z\",\"parentalRejectedAt\":\"2025-09-01T09:07:39.434Z\"}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:07:39', '2025-09-01 09:07:39'),
('1cb0c593-8713-11f0-b1c5-345a608f406b', '4ede043a-da02-4f5b-aa4c-c45bee9a714a', NULL, 'AdminC', NULL, NULL, 1, '{\"birthDate\":\"1986-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:07:40.381Z\"}', '{\"birthDate\":\"1986-01-01\",\"age\":39,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:07:40', '2025-09-01 09:07:40'),
('1d4c32ad-8713-11f0-b1c5-345a608f406b', 'ae6d53e7-9ab0-4b49-ada8-86bd09d48e6f', NULL, 'TeenC', NULL, NULL, 1, '{\"birthDate\":\"2010-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:07:41.412Z\"}', '{\"birthDate\":\"2010-01-01\",\"age\":15,\"verified\":true,\"needsParentalConsent\":false,\"parentalConsentStatus\":\"approved\",\"parentalApprovedAt\":\"2025-09-01T09:07:41.454Z\"}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:07:41', '2025-09-01 09:07:41'),
('1deb4199-8713-11f0-b1c5-345a608f406b', 'a66d8aa0-3ce4-49e7-ac31-2b2f3ca8693c', NULL, 'Test User 1756717662014', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:07:42.450Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:07:42', '2025-09-01 09:07:42'),
('1e9547d2-8713-11f0-b1c5-345a608f406b', '19261451-4bec-46df-947b-ed2a111c0801', NULL, 'AdminIS', NULL, NULL, 1, '{\"birthDate\":\"1985-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:07:43.566Z\"}', '{\"birthDate\":\"1985-01-01\",\"age\":40,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:07:43', '2025-09-01 09:07:43'),
('1f24382e-8713-11f0-b1c5-345a608f406b', '2030c326-c4fc-45dd-a8f3-f941e0aa8dea', NULL, 'U1', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:07:44.506Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:07:44', '2025-09-01 09:07:44'),
('1f5eeb98-8713-11f0-b1c5-345a608f406b', 'afb563b2-ec82-491f-b8ff-39fd35f30833', NULL, 'U2', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:07:44.890Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:07:44', '2025-09-01 09:07:44'),
('1fd585b6-8713-11f0-b1c5-345a608f406b', 'bea3f8c3-f962-48ac-891a-604f278cdb09', NULL, 'U15', NULL, NULL, 0, '{\"birthDate\":\"2010-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:07:45.666Z\"}', '{\"birthDate\":\"2010-01-01\",\"age\":15,\"verified\":true,\"needsParentalConsent\":true,\"parentalConsentStatus\":\"pending\"}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:07:45', '2025-09-01 09:07:45'),
('2031e8f3-8713-11f0-b1c5-345a608f406b', '6b7baec3-c870-4f1d-a256-45d31ed5f893', NULL, 'Adult', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:07:46.273Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:07:46', '2025-09-01 09:07:46'),
('20a305a7-8713-11f0-b1c5-345a608f406b', '9d774ace-1dff-4ac9-8091-66e84e57a516', NULL, 'AdminUser', NULL, NULL, 1, '{\"birthDate\":\"1988-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:07:47.013Z\"}', '{\"birthDate\":\"1988-01-01\",\"age\":37,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:07:47', '2025-09-01 09:07:47'),
('2135583d-8713-11f0-b1c5-345a608f406b', '957f8d77-8311-4377-b3fc-b9b53ab29beb', NULL, 'TeenUser', NULL, NULL, 0, '{\"birthDate\":\"2010-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:07:47.974Z\"}', '{\"birthDate\":\"2010-01-01\",\"age\":15,\"verified\":true,\"needsParentalConsent\":true,\"parentalConsentStatus\":\"pending\"}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:07:47', '2025-09-01 09:07:47'),
('21a44a27-8713-11f0-b1c5-345a608f406b', '12c637c8-450c-4159-9beb-817aca67e9a1', NULL, 'AdminF', NULL, NULL, 1, '{\"birthDate\":\"1987-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:07:48.699Z\"}', '{\"birthDate\":\"1987-01-01\",\"age\":38,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:07:48', '2025-09-01 09:07:48'),
('224cd6eb-8713-11f0-b1c5-345a608f406b', '4919f0d5-91e1-4956-9698-c440aeea22f5', NULL, 'TeenF', NULL, NULL, 0, '{\"birthDate\":\"2010-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:07:49.805Z\"}', '{\"birthDate\":\"2010-01-01\",\"age\":15,\"verified\":true,\"needsParentalConsent\":true,\"parentalConsentStatus\":\"pending\"}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:07:49', '2025-09-01 09:07:49'),
('25f1d946-8726-11f0-b1c5-345a608f406b', '964e2edd-34d2-4a2d-a7a5-132b8bf5c4db', NULL, 'TestUser1756725835755', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T11:23:56.357Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 11:23:56', '2025-09-01 11:23:56'),
('36b81632-8184-11f0-b1c5-345a608f406b', '3eec9236-40db-46ca-ae18-9b089bef0e75', NULL, 'Lundi 25 test 1', NULL, NULL, 1, '{\"birthDate\":\"1981-08-20\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-08-25T07:22:10.188Z\"}', '{\"birthDate\":\"1981-08-20\",\"age\":44,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-08-25 07:22:10', '2025-08-25 07:22:10'),
('3bc1e005-8715-11f0-b1c5-345a608f406b', '2212f5ba-bfe1-4241-b275-42771e59479c', NULL, 'User 1756718570811-edit', '/uploads/avatars/avatar-2212f5ba-bfe1-4241-b275-42771e59479c-1756718572572-645623208.png', 'Bio e2e', 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:22:51.502Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:22:51', '2025-09-01 09:22:52'),
('3d8f0774-8715-11f0-b1c5-345a608f406b', 'fc91570c-8955-48ba-b4d6-9833ff4e5b4f', NULL, 'Test User 1756718574108', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:22:54.530Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:22:54', '2025-09-01 09:22:54'),
('3e2279d9-872b-11f0-b1c5-345a608f406b', '4780ee5f-c43d-4bfb-9add-72a1e6650552', NULL, 'TestUser1756728023447', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T12:00:24.422Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 12:00:24', '2025-09-01 12:00:24'),
('432b3ae5-8fa1-11f0-af92-345a608f406b', '4641d9fd-e136-4c65-b696-4ff4e5b9bf3f', NULL, 'Test User 1757658322102', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-12T06:25:22.772Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-12 06:25:22', '2025-09-12 06:25:22'),
('4426f288-8fa1-11f0-af92-345a608f406b', 'c4ee0088-3db2-46a7-901c-dc434c04b43c', NULL, 'PushUser 1757658323592', NULL, NULL, 1, '{\"birthDate\":null,\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-12T06:25:24.426Z\"}', '{\"birthDate\":null,\"verified\":false}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-12 06:25:24', '2025-09-12 06:25:24'),
('44e34cc6-8fa1-11f0-af92-345a608f406b', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', NULL, 'User 1757658325178-edit', '/uploads/avatars/avatar-4098e3a5-7b27-42ec-b8be-204776aa7ed7-1757658327347-465467762.png', 'Bio e2e', 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-12T06:25:25.661Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-12 06:25:25', '2025-09-12 06:25:27'),
('537cb784-8ef0-11f0-af92-345a608f406b', '3231fb01-5da2-4847-b009-4d034d7e8f7e', NULL, 'Test User 1757582328683', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-11T09:18:49.223Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-11 09:18:49', '2025-09-11 09:18:49'),
('54944b2b-8ef0-11f0-af92-345a608f406b', '0a6a5bae-3336-4683-bb5c-520e439f08ca', NULL, 'User 1757582330595-edit', '/uploads/avatars/avatar-0a6a5bae-3336-4683-bb5c-520e439f08ca-1757582331865-159463848.png', 'Bio e2e', 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-11T09:18:51.074Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('56070d3d-8198-11f0-b1c5-345a608f406b', '411dd9ff-9673-48c9-838a-50b49074fff0', NULL, 'Test User', NULL, NULL, 1, '{\"birthDate\":null,\"agreeToTerms\":true,\"acceptedAt\":\"2025-08-25T09:46:12.674Z\"}', '{\"birthDate\":null,\"age\":null,\"verified\":false}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-08-25 09:46:12', '2025-08-25 09:46:12'),
('5b51d48d-8250-11f0-b1c5-345a608f406b', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', NULL, 'Taaazzz', 'assets/profil/face.png', NULL, 1, '{\"birthDate\":\"1981-08-20\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-08-26T07:43:28.943Z\"}', '{\"birthDate\":\"1981-08-20\",\"age\":44,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 8.0}', '2025-08-26 07:43:28', '2025-09-01 12:22:51'),
('786dbb58-8726-11f0-b1c5-345a608f406b', '6ab7b2cd-1de5-4e2f-9307-4322d425e4b4', NULL, 'NewTestUser', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T11:26:14.741Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 11:26:14', '2025-09-01 11:26:14'),
('84c2554b-872a-11f0-b1c5-345a608f406b', '52c50814-0c3d-4b34-a02f-eea3e37d159d', NULL, 'TestUser1756727712652', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T11:55:13.417Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 11:55:13', '2025-09-01 11:55:13'),
('8f36231f-7fa0-11f0-b1c5-345a608f406b', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', NULL, 'vendredi test 1', NULL, NULL, 1, '{\"birthDate\":\"1981-08-20\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-08-22T21:40:02.257Z\"}', '{\"birthDate\":\"1981-08-20\",\"age\":44,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-08-22 21:40:02', '2025-08-22 21:40:02'),
('925e7861-8724-11f0-b1c5-345a608f406b', '3c08247a-be19-4c54-b703-96c8a8b7867f', NULL, 'TestUser1756725158288', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T11:12:39.245Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 11:12:39', '2025-09-01 11:12:39'),
('935c4668-8724-11f0-b1c5-345a608f406b', '5d79191e-ec05-40a0-a85f-ecc8b6287f94', NULL, 'Test Login User 1756725160513', NULL, NULL, 1, '{\"birthDate\":\"2000-09-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T11:12:40.933Z\"}', '{\"birthDate\":\"2000-09-01\",\"age\":25,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 11:12:40', '2025-09-01 11:12:40'),
('96227d9d-8724-11f0-b1c5-345a608f406b', '6b008c16-0b01-4b64-b3d0-f3c4e679a1e8', NULL, 'Test JWT User 1756725165043', NULL, NULL, 1, '{\"birthDate\":\"2003-09-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T11:12:45.587Z\"}', '{\"birthDate\":\"2003-09-01\",\"age\":22,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 11:12:45', '2025-09-01 11:12:45'),
('990ad5f1-8724-11f0-b1c5-345a608f406b', '5fea328a-4169-427f-b0b1-1c17e6511c5f', NULL, 'Profile Updated 1756725170489', NULL, 'Bio de test mise à jour', 1, '{\"birthDate\":\"2000-09-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T11:12:50.465Z\"}', '{\"birthDate\":\"2000-09-01\",\"age\":25,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 11:12:50', '2025-09-01 11:12:50'),
('9a0e8f56-8724-11f0-b1c5-345a608f406b', 'dde0e53b-b2f4-4c60-9141-6d0867d8a85f', NULL, 'Avatar Test 1756725171521', '/uploads/avatars/avatar-dde0e53b-b2f4-4c60-9141-6d0867d8a85f-1756725172189-430348131.png', NULL, 1, '{\"birthDate\":\"1995-09-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T11:12:52.168Z\"}', '{\"birthDate\":\"1995-09-01\",\"age\":30,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 11:12:52', '2025-09-01 11:12:52'),
('9b093c19-8724-11f0-b1c5-345a608f406b', '7680bede-44ea-496a-9e31-5a2e060f25cf', NULL, 'Upload Image Test 1756725173230', NULL, NULL, 1, '{\"birthDate\":\"2003-09-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T11:12:53.810Z\"}', '{\"birthDate\":\"2003-09-01\",\"age\":22,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 11:12:53', '2025-09-01 11:12:53'),
('9c00fe5d-8724-11f0-b1c5-345a608f406b', 'cd3cb757-9d12-4438-911f-0f9f2ac2ca95', NULL, 'Test Fails User 1756725174849', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T11:12:55.434Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 11:12:55', '2025-09-01 11:12:55'),
('9d15bf18-8724-11f0-b1c5-345a608f406b', '7e087b9c-2f45-4e77-8471-a6cebbf2de13', NULL, 'Test Retrieval User 1756725176592', NULL, NULL, 1, '{\"birthDate\":null,\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T11:12:57.247Z\"}', '{\"birthDate\":null,\"verified\":false}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 11:12:57', '2025-09-01 11:12:57'),
('9e2bd86b-8724-11f0-b1c5-345a608f406b', 'f276cf04-dea1-4bb0-bd21-337d34749686', NULL, 'CommentUser 1756725178537', NULL, NULL, 1, '{\"birthDate\":\"2000-09-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T11:12:59.071Z\"}', '{\"birthDate\":\"2000-09-01\",\"age\":25,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 11:12:59', '2025-09-01 11:12:59'),
('9f1993b1-8724-11f0-b1c5-345a608f406b', 'fda4cf09-0d1e-468c-8096-1caa46b782cc', NULL, 'U Author 1756725180100', NULL, NULL, 1, '{\"birthDate\":\"2000-09-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T11:13:00.628Z\"}', '{\"birthDate\":\"2000-09-01\",\"age\":25,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 11:13:00', '2025-09-01 11:13:00'),
('a0223869-8724-11f0-b1c5-345a608f406b', 'e1da10bd-4b07-418d-9581-ea72e5b13a10', NULL, 'Utilisateur Intégration Test 1756725181656', NULL, NULL, 1, '{\"birthDate\":null,\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T11:13:02.362Z\"}', '{\"birthDate\":null,\"verified\":false}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 11:13:02', '2025-09-01 11:13:02'),
('aaf5b6ca-8eef-11f0-af92-345a608f406b', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', NULL, 'User 1757582045895-edit', '/uploads/avatars/avatar-6db5b664-7c73-4fea-88c5-6d2e31c83bd5-1757582047601-716387620.png', 'Bio e2e', 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-11T09:14:06.482Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-11 09:14:06', '2025-09-11 09:14:07'),
('ac78da8f-8eef-11f0-af92-345a608f406b', '48b99a1f-8da7-4940-a34a-fd28d062c34f', NULL, 'Test User 1757582048609', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-11T09:14:09.036Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-11 09:14:09', '2025-09-11 09:14:09'),
('b41be59c-7f4c-11f0-b1c5-345a608f406b', 'd096d562-988d-44be-bd9a-55272e9ed9ff', NULL, 'Test User 1755862785778', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-08-22T11:39:46.413Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-08-22 11:39:46', '2025-08-22 11:39:46'),
('ba5e93b3-8729-11f0-b1c5-345a608f406b', 'e10fbd52-b906-4504-8e13-7c7b7c451afa', NULL, 'TestUser1756727373156', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T11:49:33.862Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 11:49:33', '2025-09-01 11:49:33'),
('e2cf9d6d-8716-11f0-b1c5-345a608f406b', '75c74d79-8cda-4c6b-8c08-c0dfa06043ca', NULL, 'User 1756719280609-edit', '/uploads/avatars/avatar-75c74d79-8cda-4c6b-8c08-c0dfa06043ca-1756719282399-181412019.png', 'Bio e2e', 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:34:41.266Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:34:41', '2025-09-01 09:34:42'),
('e3fbb1df-8716-11f0-b1c5-345a608f406b', 'fe8d5a37-d3db-49dc-850e-532aae96868c', NULL, 'Test User 1756719282631', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T09:34:43.240Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 09:34:43', '2025-09-01 09:34:43'),
('eee69f7e-8e26-11f0-b1c5-345a608f406b', '11c77ea4-4602-4cb9-a75e-c894b480c4e8', NULL, 'Alexia', NULL, NULL, 1, '{\"birthDate\":\"2000-08-05\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-10T09:17:11.641Z\"}', '{\"birthDate\":\"2000-08-05\",\"age\":25,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-10 09:17:11', '2025-09-10 09:17:11'),
('f59299f7-8729-11f0-b1c5-345a608f406b', '2c735258-4f82-42cf-99ec-31b9939193b5', NULL, 'TestUser1756727472430', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T11:51:13.189Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 11:51:13', '2025-09-01 11:51:13'),
('f9671155-88bd-11f0-b1c5-345a608f406b', '79440d6f-4010-42f8-9e24-3371ee140cf3', NULL, 'TestUser1756900995697', NULL, NULL, 1, '{\"birthDate\":null,\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-03T12:03:16.291Z\"}', '{\"birthDate\":null,\"verified\":false}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-03 12:03:16', '2025-09-03 12:03:16'),
('fe438482-872a-11f0-b1c5-345a608f406b', 'f78778ce-ed8f-4d6b-abad-2d8055bd923c', NULL, 'TestUser1756727916408', NULL, NULL, 1, '{\"birthDate\":\"1990-01-01\",\"agreeToTerms\":true,\"acceptedAt\":\"2025-09-01T11:58:37.266Z\"}', '{\"birthDate\":\"1990-01-01\",\"age\":35,\"verified\":true}', '{}', '{\"badges\": [], \"totalFails\": 0, \"couragePoints\": 0}', '2025-09-01 11:58:37', '2025-09-01 11:58:37');

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

--
-- Déchargement des données de la table `reactions`
--

INSERT INTO `reactions` (`id`, `user_id`, `fail_id`, `reaction_type`, `created_at`) VALUES
('2040f91e-edf1-4cdf-99fa-c15d64cafc25', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '85efade8-0857-40a9-a790-8253c270157f', 'support', '2025-09-01 12:22:17'),
('5c18bb2d-cd68-4b54-8045-aaaca336791c', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', '0f29dcc0-0b48-47cd-b0c5-dd1adc225198', 'courage', '2025-08-21 11:49:45'),
('7ca813bf-c38a-43c9-9515-8746420de24c', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '965883d5-c51b-4ccb-a7e4-e90aecc49016', 'empathy', '2025-09-01 12:22:20'),
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
('25eea94f-7b6e-4516-b0cd-12eca98dd152', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', 'e2e.1757582045895@journey.local', NULL, '35353546-b6f2-4956-838a-d0084780409c', 'Mon test de fail', 'User 1757582045895', 'courage', 0, '2025-09-11 09:14:07', '::ffff:127.0.0.1', '', '2025-09-11 09:14:07'),
('7b83802d-52d0-4f63-adda-a517edd04972', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', 'e2e.1757658325178@journey.local', NULL, '512897e6-71c7-4fcc-a28c-265710ceb4a6', 'Mon test de fail', 'User 1757658325178', 'courage', 0, '2025-09-12 06:25:26', '::ffff:127.0.0.1', '', '2025-09-12 06:25:26'),
('933249c9-c9ce-4e5a-8936-3ce273632d5b', '0a6a5bae-3336-4683-bb5c-520e439f08ca', 'e2e.1757582330595@journey.local', NULL, '394d616a-75db-46a2-9c30-00e4179ecbf5', 'Mon test de fail', 'User 1757582330595', 'courage', 0, '2025-09-11 09:18:51', '::ffff:127.0.0.1', '', '2025-09-11 09:18:51'),
('d1bc97f4-95db-4dc4-b70c-b208356a9b16', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', 'e2e.1757658325178@journey.local', NULL, '512897e6-71c7-4fcc-a28c-265710ceb4a6', 'Mon test de fail', 'User 1757658325178', 'courage', 0, '2025-09-12 06:25:26', '::ffff:127.0.0.1', '', '2025-09-12 06:25:26'),
('d45ca9b7-9c3f-40ab-b3bf-dfa8b3456d14', '0a6a5bae-3336-4683-bb5c-520e439f08ca', 'e2e.1757582330595@journey.local', NULL, '394d616a-75db-46a2-9c30-00e4179ecbf5', 'Mon test de fail', 'User 1757582330595', 'courage', 0, '2025-09-11 09:18:51', '::ffff:127.0.0.1', '', '2025-09-11 09:18:51'),
('dc583541-a79a-4866-9ac6-1919ecdd7f40', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', 'e2e.1757582045895@journey.local', NULL, '35353546-b6f2-4956-838a-d0084780409c', 'Mon test de fail', 'User 1757582045895', 'courage', 0, '2025-09-11 09:14:07', '::ffff:127.0.0.1', '', '2025-09-11 09:14:07');

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
('06d3f4bd-8e27-11f0-b1c5-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '11c77ea4-4602-4cb9-a75e-c894b480c4e8', '2025-09-10 09:17:51', '2025-09-10 09:17:51'),
('06d87043-8e27-11f0-b1c5-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '11c77ea4-4602-4cb9-a75e-c894b480c4e8', '2025-09-10 09:17:51', '2025-09-10 09:17:51'),
('08ae772a-8efe-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 10:56:56', '2025-09-11 10:56:56'),
('1c3e0f5c-8e27-11f0-b1c5-345a608f406b', 'info', 'Fail created', 'fail_create', '{\"failId\":\"65824bca-7416-4d2b-8070-d3de03c3891c\",\"title\":\"test premier fail alexia\",\"category\":\"special\",\"is_anonyme\":false}', '11c77ea4-4602-4cb9-a75e-c894b480c4e8', '2025-09-10 09:18:27', '2025-09-10 09:18:27'),
('1c67b03e-8e27-11f0-b1c5-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '11c77ea4-4602-4cb9-a75e-c894b480c4e8', '2025-09-10 09:18:27', '2025-09-10 09:18:27'),
('1f21f605-8e27-11f0-b1c5-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '11c77ea4-4602-4cb9-a75e-c894b480c4e8', '2025-09-10 09:18:32', '2025-09-10 09:18:32'),
('232d5cd0-8efd-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 10:50:31', '2025-09-11 10:50:31'),
('3aea116e-8efc-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 10:44:01', '2025-09-11 10:44:01'),
('3e7f9f6b-8efc-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 10:44:07', '2025-09-11 10:44:07'),
('432ebad1-8fa1-11f0-af92-345a608f406b', 'info', 'User registered', 'user_register', '{\"email\":\"temp.test.1757658322102@test.local\",\"displayName\":\"Test User 1757658322102\"}', '4641d9fd-e136-4c65-b696-4ff4e5b9bf3f', '2025-09-12 06:25:22', '2025-09-12 06:25:22'),
('43845afe-8fa1-11f0-af92-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"temp.test.1757658322102@test.local\"}', '4641d9fd-e136-4c65-b696-4ff4e5b9bf3f', '2025-09-12 06:25:23', '2025-09-12 06:25:23'),
('442fcfae-8fa1-11f0-af92-345a608f406b', 'info', 'User registered', 'user_register', '{\"email\":\"push.1757658323592@test.local\",\"displayName\":\"PushUser 1757658323592\"}', 'c4ee0088-3db2-46a7-901c-dc434c04b43c', '2025-09-12 06:25:24', '2025-09-12 06:25:24'),
('446c8f94-8fa1-11f0-af92-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"push.1757658323592@test.local\"}', 'c4ee0088-3db2-46a7-901c-dc434c04b43c', '2025-09-12 06:25:24', '2025-09-12 06:25:24'),
('44eabf65-8fa1-11f0-af92-345a608f406b', 'info', 'User registered', 'user_register', '{\"email\":\"e2e.1757658325178@journey.local\",\"displayName\":\"User 1757658325178\"}', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', '2025-09-12 06:25:25', '2025-09-12 06:25:25'),
('452eb13b-8fa1-11f0-af92-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"e2e.1757658325178@journey.local\"}', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', '2025-09-12 06:25:26', '2025-09-12 06:25:26'),
('453ac890-8fa1-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '4098e3a5-7b27-42ec-b8be-204776aa7ed7', '2025-09-12 06:25:26', '2025-09-12 06:25:26'),
('45600530-8fa1-11f0-af92-345a608f406b', 'info', 'Fail created', 'fail_create', '{\"failId\":\"512897e6-71c7-4fcc-a28c-265710ceb4a6\",\"title\":\"Mon test de fail\",\"category\":\"Général\",\"is_anonyme\":false}', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', '2025-09-12 06:25:26', '2025-09-12 06:25:26'),
('45744ef3-8fa1-11f0-af92-345a608f406b', 'info', 'Reaction added', 'reaction_add', '{\"failId\":\"512897e6-71c7-4fcc-a28c-265710ceb4a6\",\"reactionType\":\"courage\"}', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', '2025-09-12 06:25:26', '2025-09-12 06:25:26'),
('4583fe56-8fa1-11f0-af92-345a608f406b', 'info', 'Reaction removed', 'reaction_remove', '{\"failId\":\"512897e6-71c7-4fcc-a28c-265710ceb4a6\",\"reactionType\":null}', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', '2025-09-12 06:25:26', '2025-09-12 06:25:26'),
('458db188-8fa1-11f0-af92-345a608f406b', 'info', 'Comment added', 'comment_add', '{\"commentId\":\"31a29f04-1bde-434f-9db7-8cda16285b85\",\"failId\":\"512897e6-71c7-4fcc-a28c-265710ceb4a6\"}', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', '2025-09-12 06:25:26', '2025-09-12 06:25:26'),
('45a0699f-8fa1-11f0-af92-345a608f406b', 'info', 'Comment updated', 'comment_update', '{\"commentId\":\"31a29f04-1bde-434f-9db7-8cda16285b85\",\"failId\":\"512897e6-71c7-4fcc-a28c-265710ceb4a6\"}', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', '2025-09-12 06:25:26', '2025-09-12 06:25:26'),
('45ad9a4e-8fa1-11f0-af92-345a608f406b', 'warning', 'Comment deleted', 'comment_delete', '{\"commentId\":\"31a29f04-1bde-434f-9db7-8cda16285b85\",\"failId\":\"512897e6-71c7-4fcc-a28c-265710ceb4a6\"}', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', '2025-09-12 06:25:26', '2025-09-12 06:25:26'),
('45ddb2a7-8fa1-11f0-af92-345a608f406b', 'info', 'Profile updated', 'profile_update', '{\"displayName\":\"User 1757658325178-edit\",\"hasBio\":true,\"hasAvatar\":false}', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', '2025-09-12 06:25:27', '2025-09-12 06:25:27'),
('53837870-8ef0-11f0-af92-345a608f406b', 'info', 'User registered', 'user_register', '{\"email\":\"temp.test.1757582328683@test.local\",\"displayName\":\"Test User 1757582328683\"}', '3231fb01-5da2-4847-b009-4d034d7e8f7e', '2025-09-11 09:18:49', '2025-09-11 09:18:49'),
('53be95f6-8ef0-11f0-af92-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"temp.test.1757582328683@test.local\"}', '3231fb01-5da2-4847-b009-4d034d7e8f7e', '2025-09-11 09:18:49', '2025-09-11 09:18:49'),
('5495f4af-8ef0-11f0-af92-345a608f406b', 'info', 'User registered', 'user_register', '{\"email\":\"e2e.1757582330595@journey.local\",\"displayName\":\"User 1757582330595\"}', '0a6a5bae-3336-4683-bb5c-520e439f08ca', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('54cef430-8ef0-11f0-af92-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"e2e.1757582330595@journey.local\"}', '0a6a5bae-3336-4683-bb5c-520e439f08ca', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('54d50ce4-8ef0-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '0a6a5bae-3336-4683-bb5c-520e439f08ca', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('54e93d08-8ef0-11f0-af92-345a608f406b', 'info', 'Fail created', 'fail_create', '{\"failId\":\"394d616a-75db-46a2-9c30-00e4179ecbf5\",\"title\":\"Mon test de fail\",\"category\":\"Général\",\"is_anonyme\":false}', '0a6a5bae-3336-4683-bb5c-520e439f08ca', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('54f164f7-8ef0-11f0-af92-345a608f406b', 'info', 'Reaction added', 'reaction_add', '{\"failId\":\"394d616a-75db-46a2-9c30-00e4179ecbf5\",\"reactionType\":\"courage\"}', '0a6a5bae-3336-4683-bb5c-520e439f08ca', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('54f694ee-8ef0-11f0-af92-345a608f406b', 'info', 'Reaction removed', 'reaction_remove', '{\"failId\":\"394d616a-75db-46a2-9c30-00e4179ecbf5\",\"reactionType\":null}', '0a6a5bae-3336-4683-bb5c-520e439f08ca', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('54fa1888-8ef0-11f0-af92-345a608f406b', 'info', 'Comment added', 'comment_add', '{\"commentId\":\"ebd032c7-3231-40b6-bfac-ff0052eb9d0b\",\"failId\":\"394d616a-75db-46a2-9c30-00e4179ecbf5\"}', '0a6a5bae-3336-4683-bb5c-520e439f08ca', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('54fdfd8e-8ef0-11f0-af92-345a608f406b', 'info', 'Comment updated', 'comment_update', '{\"commentId\":\"ebd032c7-3231-40b6-bfac-ff0052eb9d0b\",\"failId\":\"394d616a-75db-46a2-9c30-00e4179ecbf5\"}', '0a6a5bae-3336-4683-bb5c-520e439f08ca', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('55012e62-8ef0-11f0-af92-345a608f406b', 'warning', 'Comment deleted', 'comment_delete', '{\"commentId\":\"ebd032c7-3231-40b6-bfac-ff0052eb9d0b\",\"failId\":\"394d616a-75db-46a2-9c30-00e4179ecbf5\"}', '0a6a5bae-3336-4683-bb5c-520e439f08ca', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('550ad77f-8ef0-11f0-af92-345a608f406b', 'info', 'Profile updated', 'profile_update', '{\"displayName\":\"User 1757582330595-edit\",\"hasBio\":true,\"hasAvatar\":false}', '0a6a5bae-3336-4683-bb5c-520e439f08ca', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('56589282-6d4a-4707-a1e4-fb8ce05a4f42', 'warning', 'Table badges vidée par admin', 'table_truncate', '{\"tableName\":\"badges\",\"isAuthTable\":false}', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-03 13:03:29', '2025-09-03 13:03:29'),
('59dac563-8ee9-11f0-af92-345a608f406b', 'info', 'User logout', 'user_logout', NULL, '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 08:28:53', '2025-09-11 08:28:53'),
('5aae61c1-8ef8-11f0-af92-345a608f406b', 'info', 'User logout', 'user_logout', NULL, '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 10:16:17', '2025-09-11 10:16:17'),
('5d647912-69f5-4a6e-95c2-4fad78e92662', 'warning', 'Table user_badges vidée par admin', 'table_truncate', '{\"tableName\":\"user_badges\",\"isAuthTable\":false}', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-03 13:05:46', '2025-09-03 13:05:46'),
('5e6c48b0-88c6-11f0-b1c5-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"bruno@taaazzz.be\"}', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-03 13:03:21', '2025-09-03 13:03:21'),
('6412a1af-8c86-11f0-b1c5-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"bruno@taaazzz.be\"}', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-08 07:35:28', '2025-09-08 07:35:28'),
('642aed75-8c86-11f0-b1c5-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-08 07:35:28', '2025-09-08 07:35:28'),
('6e9d5193-8eff-11f0-af92-345a608f406b', 'info', 'User logout', 'user_logout', NULL, '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 11:06:57', '2025-09-11 11:06:57'),
('719d3cf9-c20d-4007-ac01-babd8c7970a8', 'warning', 'Vidage en masse de 2/2 tables', 'bulk_truncate', '{\"tables\":[\"user_preferences\",\"parental_consents\"],\"results\":[{\"table\":\"user_preferences\",\"success\":true},{\"table\":\"parental_consents\",\"success\":true}],\"isAuthTables\":true}', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-03 13:03:13', '2025-09-03 13:03:13'),
('867c82e1-8e26-11f0-b1c5-345a608f406b', 'info', 'Password reset requested', 'password_reset_request', '{\"email\":\"bruno@taaazzz.be\"}', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-10 09:14:16', '2025-09-10 09:14:16'),
('881ae12b-8efc-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 10:46:11', '2025-09-11 10:46:11'),
('8dfa16b2-88c6-11f0-b1c5-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"bruno@taaazzz.be\"}', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-03 13:04:41', '2025-09-03 13:04:41'),
('9eefa6b9-8ef5-11f0-af92-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"bruno@taaazzz.be\"}', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 09:56:43', '2025-09-11 09:56:43'),
('9f139e3e-8ef5-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 09:56:43', '2025-09-11 09:56:43'),
('aafe56bd-8eef-11f0-af92-345a608f406b', 'info', 'User registered', 'user_register', '{\"email\":\"e2e.1757582045895@journey.local\",\"displayName\":\"User 1757582045895\"}', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', '2025-09-11 09:14:06', '2025-09-11 09:14:06'),
('ab401c09-8eef-11f0-af92-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"e2e.1757582045895@journey.local\"}', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', '2025-09-11 09:14:06', '2025-09-11 09:14:06'),
('ab4b2777-8eef-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', '2025-09-11 09:14:07', '2025-09-11 09:14:07'),
('ab6c9f90-8eef-11f0-af92-345a608f406b', 'info', 'Fail created', 'fail_create', '{\"failId\":\"35353546-b6f2-4956-838a-d0084780409c\",\"title\":\"Mon test de fail\",\"category\":\"Général\",\"is_anonyme\":false}', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', '2025-09-11 09:14:07', '2025-09-11 09:14:07'),
('ab7b8760-8eef-11f0-af92-345a608f406b', 'info', 'Reaction added', 'reaction_add', '{\"failId\":\"35353546-b6f2-4956-838a-d0084780409c\",\"reactionType\":\"courage\"}', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', '2025-09-11 09:14:07', '2025-09-11 09:14:07'),
('ab833a8c-8eef-11f0-af92-345a608f406b', 'info', 'Reaction removed', 'reaction_remove', '{\"failId\":\"35353546-b6f2-4956-838a-d0084780409c\",\"reactionType\":null}', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', '2025-09-11 09:14:07', '2025-09-11 09:14:07'),
('ab889d81-8eef-11f0-af92-345a608f406b', 'info', 'Comment added', 'comment_add', '{\"commentId\":\"fa9d3ddd-7e7b-4fc5-b8bf-70eba13024be\",\"failId\":\"35353546-b6f2-4956-838a-d0084780409c\"}', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', '2025-09-11 09:14:07', '2025-09-11 09:14:07'),
('ab8dddb2-8eef-11f0-af92-345a608f406b', 'info', 'Comment updated', 'comment_update', '{\"commentId\":\"fa9d3ddd-7e7b-4fc5-b8bf-70eba13024be\",\"failId\":\"35353546-b6f2-4956-838a-d0084780409c\"}', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', '2025-09-11 09:14:07', '2025-09-11 09:14:07'),
('ab923769-8eef-11f0-af92-345a608f406b', 'warning', 'Comment deleted', 'comment_delete', '{\"commentId\":\"fa9d3ddd-7e7b-4fc5-b8bf-70eba13024be\",\"failId\":\"35353546-b6f2-4956-838a-d0084780409c\"}', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', '2025-09-11 09:14:07', '2025-09-11 09:14:07'),
('ab9b407b-8eef-11f0-af92-345a608f406b', 'info', 'Profile updated', 'profile_update', '{\"displayName\":\"User 1757582045895-edit\",\"hasBio\":true,\"hasAvatar\":false}', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', '2025-09-11 09:14:07', '2025-09-11 09:14:07'),
('ac7b502c-8eef-11f0-af92-345a608f406b', 'info', 'User registered', 'user_register', '{\"email\":\"temp.test.1757582048609@test.local\",\"displayName\":\"Test User 1757582048609\"}', '48b99a1f-8da7-4940-a34a-fd28d062c34f', '2025-09-11 09:14:09', '2025-09-11 09:14:09'),
('acc4fb92-8eef-11f0-af92-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"temp.test.1757582048609@test.local\"}', '48b99a1f-8da7-4940-a34a-fd28d062c34f', '2025-09-11 09:14:09', '2025-09-11 09:14:09'),
('b4803f12-88c6-11f0-b1c5-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"bruno@taaazzz.be\"}', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-03 13:05:46', '2025-09-03 13:05:46'),
('cf3b8830-8efc-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 10:48:10', '2025-09-11 10:48:10'),
('e4900c8a-8ee7-11f0-af92-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"bruno@taaazzz.be\"}', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 08:18:27', '2025-09-11 08:18:27'),
('e4a781fc-8ee7-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 08:18:27', '2025-09-11 08:18:27'),
('e53c4476-8efb-11f0-af92-345a608f406b', 'info', 'User login', 'user_login', '{\"email\":\"bruno@taaazzz.be\"}', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 10:41:38', '2025-09-11 10:41:38'),
('e5412ff1-8efb-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 10:41:38', '2025-09-11 10:41:38'),
('e56bc11d-8efb-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 10:41:38', '2025-09-11 10:41:38'),
('ecca3704-8ef6-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 10:06:03', '2025-09-11 10:06:03'),
('eee8dd5b-8e26-11f0-b1c5-345a608f406b', 'info', 'User registered', 'user_register', '{\"email\":\"alexia@alexia.fr\",\"displayName\":\"Alexia\"}', '11c77ea4-4602-4cb9-a75e-c894b480c4e8', '2025-09-10 09:17:11', '2025-09-10 09:17:11'),
('f48fb226-8ef6-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 10:06:16', '2025-09-11 10:06:16'),
('ff021928-8efd-11f0-af92-345a608f406b', 'info', 'Profile fetched', 'profile_get', NULL, '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '2025-09-11 10:56:40', '2025-09-11 10:56:40');

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
('0a6a5bae-3336-4683-bb5c-520e439f08ca', 'e2e.1757582330595@journey.local', 0, '$2b$12$d6n6t15uUd5KxXs09AxCruOgmMpSOltlK.LzyKtjm8XCniyurbkg6', 'user', NULL, 0, 1, 'active', 'basic', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('11c77ea4-4602-4cb9-a75e-c894b480c4e8', 'alexia@alexia.fr', 0, '$2b$12$718ZABjg1MQ97VOlFOObAeYPlTtjaPwYzl6ct9lhFeR/sTZNH79XS', 'user', NULL, 0, 1, 'active', 'basic', '2025-09-10 09:17:11', '2025-09-11 09:17:47'),
('12c637c8-450c-4159-9beb-817aca67e9a1', 'adm.1756717668294@test.local', 0, '$2b$12$Lzq/IWHx2HW11ozM9TwfuONljuXbeS8gjOWdhxCYcA8enSf0TeN1q', 'admin', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:48', '2025-09-01 09:07:48'),
('19261451-4bec-46df-947b-ed2a111c0801', 'adm.1756717663149@test.local', 0, '$2b$12$LCb95osSqdGPK3tEdKxctODhGJSpPh2gWh8FcMylPlhTseNsq6VHK', 'admin', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:43', '2025-09-01 09:07:43'),
('2030c326-c4fc-45dd-a8f3-f941e0aa8dea', 'u.1756717664095@test.local', 0, '$2b$12$HGr2deuDeBfBMiDjL5LKY.auRhjxyH7NC0m1SsIrP3nJtuh9teBJ.', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:44', '2025-09-01 09:07:44'),
('2212f5ba-bfe1-4241-b275-42771e59479c', 'e2e.1756718570811@journey.local', 0, '$2b$12$Ok8ctxodNAHXjJlETo8p5uZGYDgtG0qNKeVU8/Ifqy3C0qEXq4NY6', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:22:51', '2025-09-01 09:22:51'),
('293c74c1-371b-45e0-b548-77dff333b8e9', 'e2e.1756717654854@journey.local', 0, '$2b$12$9fyDptmYxE2BdAdWPx13d.wWwLqTzT5cH/bf//VMR8uoaudKNNZB2', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:35', '2025-09-01 09:07:35'),
('2c735258-4f82-42cf-99ec-31b9939193b5', 'test-1756727472430@example.com', 0, '$2b$12$CUEmFPdlNK3o4t9DVu7tGOLEPm/jnB67ZNs1kTkWL/atpDYR/Qwqi', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:51:13', '2025-09-01 11:51:13'),
('3231fb01-5da2-4847-b009-4d034d7e8f7e', 'temp.test.1757582328683@test.local', 0, '$2b$12$74HjlgVHS8/wHbKm87M8buLS7h.GjQNKZJdiYVA07eyjwoBlZJVy2', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-11 09:18:49', '2025-09-11 09:18:49'),
('33e10cbd-a3cf-4259-8098-f3b33e3ec8bc', 'teen.1756717658787@test.local', 0, '$2b$12$nfMyBo38Ppa.Pz7fvQ1r.eMwSSnSHC4G4F2wugE18PLQFyTW1ID6.', 'user', NULL, 0, 0, '', 'basic', '2025-09-01 09:07:39', '2025-09-01 09:07:39'),
('3c08247a-be19-4c54-b703-96c8a8b7867f', 'test.1756725158285@faildaily.com', 0, '$2b$12$O7LTwIOHSnyO/ZhJGapDLOjH.Dxv0hDHOrz6TvCD9E6iqIr7FvNcK', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:12:39', '2025-09-01 11:12:39'),
('3eec9236-40db-46ca-ae18-9b089bef0e75', 'vfr@vfr.vfr', 0, '$2b$12$IxV.5xfvgXly8sOtV9RDSuLZ.kVVYjGBtDNv2hUKKrbJNvyrmH.um', 'user', NULL, 0, 0, 'active', 'basic', '2025-08-25 07:22:10', '2025-08-25 07:22:10'),
('4098e3a5-7b27-42ec-b8be-204776aa7ed7', 'e2e.1757658325178@journey.local', 0, '$2b$12$KutADGqndSxklwNnUOHCsO4qEXLgJnHj9bwH0Y/Moe3ca9XblgD22', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 06:25:25', '2025-09-12 06:25:25'),
('411dd9ff-9673-48c9-838a-50b49074fff0', 'test@test.com', 0, '$2b$12$nsm/fuVNm3RoVD.M2HYgae6zKa3zkJr.hEZpvGkwHa1A6Z0.b8N5a', 'user', NULL, 0, 0, 'active', 'basic', '2025-08-25 09:46:12', '2025-08-25 09:46:12'),
('4641d9fd-e136-4c65-b696-4ff4e5b9bf3f', 'temp.test.1757658322102@test.local', 0, '$2b$12$mUalr6ZEBZmx1O38.Iiee.lWz/Nog58RdqzF/iOqyXJ1SSJYFuCle', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 06:25:22', '2025-09-12 06:25:22'),
('4780ee5f-c43d-4bfb-9add-72a1e6650552', 'test-1756728023447@example.com', 0, '$2b$12$VmkOpwym8oWOQIdhjst5supeEWQ5S14tT.Iu3Hh5Xl2c29nmuFgYi', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 12:00:24', '2025-09-01 12:00:24'),
('48b99a1f-8da7-4940-a34a-fd28d062c34f', 'temp.test.1757582048609@test.local', 0, '$2b$12$Px/0PikB/sIJ33tBMI/4yOlAvNsCd7HOeIRfgR/Z2JOm1qB5fqJ4.', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-11 09:14:09', '2025-09-11 09:14:09'),
('4919f0d5-91e1-4956-9698-c440aeea22f5', 'teen.1756717669234@test.local', 0, '$2b$12$4UGU5ONMhYeJqqK9/5uVx.24Rc7DZWSWFvjxH9wiZeK1u4valm.1S', 'user', NULL, 0, 0, '', 'basic', '2025-09-01 09:07:49', '2025-09-01 09:07:49'),
('4ede043a-da02-4f5b-aa4c-c45bee9a714a', 'adm.1756717659772@test.local', 0, '$2b$12$2BfGr0X79v2zHjNA4Vf5Je1pQ./nst3CIiDschxDkKdd/281UiOe2', 'admin', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:40', '2025-09-01 09:07:40'),
('52c50814-0c3d-4b34-a02f-eea3e37d159d', 'test-1756727712652@example.com', 0, '$2b$12$D1Y/tgBPj67D3Ud6iYQUiO0vcaQMc7X2D8D7scbuTe.io1gTrrnd.', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:55:13', '2025-09-01 11:55:13'),
('57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', 0, '$2b$12$0UFb9XrOTymJDlnjUODK2.ntTCJx1517zcw823/ErXolBxxAJB5ju', 'user', NULL, 0, 2, 'active', 'basic', '2025-08-22 21:40:02', '2025-09-11 09:17:47'),
('58570b71-7bde-4266-b35c-03e59c0f82e7', 'adm.1756717657387@test.local', 0, '$2b$12$EAlTNwcnHPeilYysT0SgkOvfcVtyWG.oMPk3EjWpdT2WHDH2CB6K.', 'admin', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:38', '2025-09-01 09:07:38'),
('5d79191e-ec05-40a0-a85f-ecc8b6287f94', 'test.1756725160513@faildaily.com', 0, '$2b$12$g6l8T/oDgAbxASqVZI364eiQMpwJrKEQACa/ibYBc35V5x9NmGPni', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:12:40', '2025-09-01 11:12:40'),
('5efe0f4e-ea21-4418-9e15-5e361c43b3f8', 'test.public.1755862087925@example.com', 0, '$2b$12$PMaASh9w.EREyFxfy1NMnuLlg8917mJwUKT7vyqpOTIZM6uG3TJdO', 'user', NULL, 0, 0, 'active', 'basic', '2025-08-22 11:28:08', '2025-08-22 11:28:08'),
('5fea328a-4169-427f-b0b1-1c17e6511c5f', 'test.1756725169806@faildaily.com', 0, '$2b$12$ZOLMyhURBdwfatpnUvIFvevCu/6NE7jAn2zFGQf.Nh/zbyDleeu.i', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:12:50', '2025-09-01 11:12:50'),
('6ab7b2cd-1de5-4e2f-9307-4322d425e4b4', 'newtest12345@test.com', 0, '$2b$12$QoS5EOUZT5dAGITebNTHSuuEXP6qtVsXLoqN5W7h/sjQScw7iXoLy', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:26:14', '2025-09-01 11:26:14'),
('6b008c16-0b01-4b64-b3d0-f3c4e679a1e8', 'test.1756725165043@faildaily.com', 0, '$2b$12$0Uc/MXbkh4jPw6LhaL1FQOoHKEKviJU6XjtxnfrLFDXfrBl9HZbzu', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:12:45', '2025-09-01 11:12:45'),
('6b7baec3-c870-4f1d-a256-45d31ed5f893', 'adult.1756717665706@test.local', 0, '$2b$12$OKQSnuYvwbDm53LZ5Ur6WeRnaKDIQhTH09xbBEHnQGxcn2LEPsaqi', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:46', '2025-09-01 09:07:46'),
('6db5b664-7c73-4fea-88c5-6d2e31c83bd5', 'e2e.1757582045895@journey.local', 0, '$2b$12$CKc6iArkR/47cOp56/v0NOSlM1HNNH555eg3kctVyMKexzfMZbmGe', 'user', NULL, 0, 1, 'active', 'basic', '2025-09-11 09:14:06', '2025-09-11 09:17:47'),
('75c74d79-8cda-4c6b-8c08-c0dfa06043ca', 'e2e.1756719280609@journey.local', 0, '$2b$12$0V0O2cnRN1SqRksLkzdr4.vdhT3eIa0U.J6c.TWSIwR.HD4dM.lvK', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:34:41', '2025-09-01 09:34:41'),
('7680bede-44ea-496a-9e31-5a2e060f25cf', 'test.1756725173230@faildaily.com', 0, '$2b$12$QyhBtztrcFhmCVk0E8clX.sDn.hs6ppuitr.LJg.6Js6u9Z05DvCK', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:12:53', '2025-09-01 11:12:53'),
('79440d6f-4010-42f8-9e24-3371ee140cf3', 'test-1756900995697@example.com', 0, '$2b$12$0AfW5ZLLLDQxwVykA.Xr0ejtoqnaRg/kjCJ8iiArzQFI4P.cv3QFK', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-03 12:03:16', '2025-09-03 12:03:16'),
('7e087b9c-2f45-4e77-8471-a6cebbf2de13', 'test.1756725176592@faildaily.com', 0, '$2b$12$D1V/cZ9NmKH6PfvoUhzI4eGDWCMusnThzMptFD8Dw5LK2E/pKsLSu', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:12:57', '2025-09-01 11:12:57'),
('814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 0, '$2b$12$wCf7D9J9f9HsAPQ20Gu3neqHcMqfEY05inLUWpQHqkbSRVGzCgyn.', 'user', NULL, 0, 1, 'active', 'basic', '2025-08-21 08:51:48', '2025-09-11 09:17:47'),
('957f8d77-8311-4377-b3fc-b9b53ab29beb', 'teen.1756717667504@test.local', 0, '$2b$12$F9Txouihriwf/pyWqKWLaeIu9g3TonH524FK8C21aQRwZKvnAwMUa', 'user', NULL, 0, 0, '', 'basic', '2025-09-01 09:07:47', '2025-09-01 09:07:47'),
('964e2edd-34d2-4a2d-a7a5-132b8bf5c4db', 'test.1756725835755@faildaily.com', 0, '$2b$12$ZJzkbR8m/NvFTYDpHEh8.unHrsIg9qxzulf3XcpFY/Amc6WQqQUOO', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:23:56', '2025-09-01 11:23:56'),
('9d774ace-1dff-4ac9-8091-66e84e57a516', 'adm.1756717666568@test.local', 0, '$2b$12$VGH.Sy9sUR/WFlr80Kl/Nejq3VGHutKDYP.DbX556Cv5jx/dkqIKG', 'admin', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:47', '2025-09-01 09:07:47'),
('9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 0, '$2b$12$eVjsOVU7ju.gHpzwd8fJdelGbXMx9Agck89E3/0bEf3wyoQh3Bi1C', 'super_admin', NULL, 0, 5, 'active', 'basic', '2025-08-26 07:43:28', '2025-09-11 09:17:47'),
('a66d8aa0-3ce4-49e7-ac31-2b2f3ca8693c', 'temp.test.1756717662014@test.local', 0, '$2b$12$bIBV/qhLgC8UtAHfXUzoYeiIDJGnYvnjQBOchkBZ8Ne4vKRQ9iEdm', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:42', '2025-09-01 09:07:42'),
('ae6d53e7-9ab0-4b49-ada8-86bd09d48e6f', 'teen.1756717661025@test.local', 0, '$2b$12$duyUUfoDwPDDWLPMW42HxezppG9bh0YiqI19mu30TgtSrjJVlNR7e', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:41', '2025-09-01 09:07:41'),
('afb563b2-ec82-491f-b8ff-39fd35f30833', 'u.1756717664526@test.local', 0, '$2b$12$ZZZuRrqP/tSbVWhN86ixju4Q6nTp4WLY3vFUFo.VZW0DmMIo78kli', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 09:07:44', '2025-09-01 09:07:44'),
('bea3f8c3-f962-48ac-891a-604f278cdb09', 'u15.1756717665266@test.local', 0, '$2b$12$1O/PurxKL6Wt4A6wFkeOcuzuWwKKVyUuZKqUSOVio/LfNC0bAS8fu', 'user', NULL, 0, 0, '', 'basic', '2025-09-01 09:07:45', '2025-09-01 09:07:45'),
('c4ee0088-3db2-46a7-901c-dc434c04b43c', 'push.1757658323592@test.local', 0, '$2b$12$m2mjqW0dIyemXm9JAOll3eOPniWPwyFMgSjs1n17M6p5aEv71lwiC', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-12 06:25:24', '2025-09-12 06:25:24'),
('cd3cb757-9d12-4438-911f-0f9f2ac2ca95', 'test.1756725174849@faildaily.com', 0, '$2b$12$geHU2dmtSzOoqLcx98gYk.FBiDL1dzFynlbj4HfhnXvIYzDUxzZci', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:12:55', '2025-09-01 11:12:55'),
('d096d562-988d-44be-bd9a-55272e9ed9ff', 'temp.test.1755862785778@test.local', 0, '$2b$12$vx8LJQLsYmwHshIO2VHeH.QxAJBAhMG98sK.JX/Q6tiV946zc3UW.', 'user', NULL, 0, 0, 'active', 'basic', '2025-08-22 11:39:46', '2025-08-22 11:39:46'),
('dde0e53b-b2f4-4c60-9141-6d0867d8a85f', 'test.1756725171521@faildaily.com', 0, '$2b$12$jnQ9Is7eMa4EGrmftiTR1e8JM9f3qDTMTYZLw0kmm4i800q.TmpzC', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:12:52', '2025-09-01 11:12:52'),
('e10fbd52-b906-4504-8e13-7c7b7c451afa', 'test-1756727373156@example.com', 0, '$2b$12$NDcQpGSI8gr4Xc33AC2gY.SyWR33Luzs7AQgPwo0lE9HDyJVjddhG', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:49:33', '2025-09-01 11:49:33'),
('e1da10bd-4b07-418d-9581-ea72e5b13a10', 'test.1756725181656@faildaily.com', 0, '$2b$12$9VQ3IGyWMN6tYvADy9dwb.u4GFiH.3Ry4RFhr04V/WehSuyqHU7NC', 'user', NULL, 0, 0, 'active', 'basic', '2025-09-01 11:13:02', '2025-09-01 11:13:02'),
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

--
-- Déchargement des données de la table `user_activities`
--

INSERT INTO `user_activities` (`id`, `user_id`, `user_email`, `user_name`, `action`, `details`, `fail_id`, `reaction_type`, `ip_address`, `user_agent`, `timestamp`, `created_at`) VALUES
('00686d54-602c-4e80-88bc-286c5f6c18cc', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:50:10', '2025-08-21 09:50:10'),
('013f4eb1-7fab-4de3-a4a7-844c75461bf0', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', '', '2025-09-03 12:38:53', '2025-09-03 12:38:53'),
('01432207-12ce-459e-909a-2e54f8e7ffb0', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 08:14:56', '2025-08-26 08:14:56'),
('0281f4a1-13e3-4e46-a641-ba4a534ec108', '4919f0d5-91e1-4956-9698-c440aeea22f5', 'teen.1756717669234@test.local', 'TeenF', 'register', '{\"email\":\"teen.1756717669234@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:49', '2025-09-01 09:07:49'),
('02af98ed-dd95-4dfb-be7a-2fb61217e9e0', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:06:00', '2025-08-21 09:06:00'),
('02b6ca6d-c284-43e0-9ca0-d084ba6f2926', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 11:07:01', '2025-08-21 11:07:01'),
('02e21c6c-9a1d-4fe2-a87d-b1ddeac6c36e', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:37:16', '2025-08-21 09:37:16'),
('03ea48f4-f152-44b5-ac32-e8d0eaa7c8a9', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-02 08:44:32', '2025-09-02 08:44:32'),
('055508f2-f76c-45e8-8922-e6230bd950b7', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-02 09:06:16', '2025-09-02 09:06:16'),
('089af046-2858-4b9a-96ee-dea4b8b428b0', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36', '2025-09-11 10:16:17', '2025-09-11 10:16:17'),
('10bd1386-cfa0-4c05-88a9-af857c097837', '58570b71-7bde-4266-b35c-03e59c0f82e7', 'adm.1756717657387@test.local', 'AdminTmp', 'login', '{\"email\":\"adm.1756717657387@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:38', '2025-09-01 09:07:38'),
('1201397e-0fa4-4e50-9034-46cd4ee731fe', 'f78778ce-ed8f-4d6b-abad-2d8055bd923c', 'test-1756727916408@example.com', 'TestUser1756727916408', 'register', '{\"email\":\"test-1756727916408@example.com\"}', NULL, NULL, '::1', 'node-fetch', '2025-09-01 11:58:37', '2025-09-01 11:58:37'),
('12d44d21-6252-41b5-a931-e2dc7ff914ce', '2c735258-4f82-42cf-99ec-31b9939193b5', 'test-1756727472430@example.com', 'TestUser1756727472430', 'register', '{\"email\":\"test-1756727472430@example.com\"}', NULL, NULL, '::1', 'node-fetch', '2025-09-01 11:51:13', '2025-09-01 11:51:13'),
('13b80e09-57d4-4a6f-8fd6-8db0a4e63cfe', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-23 09:10:38', '2025-08-23 09:10:38'),
('13ba0ae1-5396-4253-90bc-d1530a1660e7', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-03 12:37:42', '2025-09-03 12:37:42'),
('13dd5e81-f437-4742-96d8-638437c2fbe1', 'd096d562-988d-44be-bd9a-55272e9ed9ff', 'temp.test.1755862785778@test.local', 'Test User 1755862785778', 'register', '{\"email\":\"temp.test.1755862785778@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-08-22 11:39:46', '2025-08-22 11:39:46'),
('1481a2e6-1475-4cd3-a63e-02885c1461d3', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', '', '2025-09-03 13:00:22', '2025-09-03 13:00:22'),
('15cca170-06f8-44eb-8122-b7a74d1b64b3', '2212f5ba-bfe1-4241-b275-42771e59479c', 'e2e.1756718570811@journey.local', 'User 1756718570811', 'register', '{\"email\":\"e2e.1756718570811@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:22:51', '2025-09-01 09:22:51'),
('15ec1792-aa4a-48fb-b283-85c8596d1cf0', '52c50814-0c3d-4b34-a02f-eea3e37d159d', 'test-1756727712652@example.com', 'TestUser1756727712652', 'register', '{\"email\":\"test-1756727712652@example.com\"}', NULL, NULL, '::1', 'node-fetch', '2025-09-01 11:55:13', '2025-09-01 11:55:13'),
('18b4a727-9969-4466-916a-3e38c1353e74', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 07:54:09', '2025-08-27 07:54:09'),
('193f0312-3112-4edc-85ad-a3cf7b673d92', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 07:38:13', '2025-08-27 07:38:13'),
('199fe062-8395-4039-b102-3f1cd73e61b0', 'd096d562-988d-44be-bd9a-55272e9ed9ff', 'temp.test.1755862785778@test.local', 'Test User 1755862785778', 'login', '{\"email\":\"temp.test.1755862785778@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-08-22 11:39:47', '2025-08-22 11:39:47'),
('1b01a4cb-eef8-4a13-aa5e-0aa5d6b5b27e', '12c637c8-450c-4159-9beb-817aca67e9a1', 'adm.1756717668294@test.local', 'AdminF', 'login', '{\"email\":\"adm.1756717668294@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:49', '2025-09-01 09:07:49'),
('1b22adb0-517b-4a13-afae-385579707b9e', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', '', '2025-09-03 12:34:02', '2025-09-03 12:34:02'),
('1d1b2b83-e256-4c8b-85d4-eff7044df11b', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', '', '2025-09-03 12:49:36', '2025-09-03 12:49:36'),
('20c945fa-4a7b-4e97-a64e-b7ae2be69c24', '5efe0f4e-ea21-4418-9e15-5e361c43b3f8', 'test.public.1755862087925@example.com', 'Test Public User', 'register', '{\"email\":\"test.public.1755862087925@example.com\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-08-22 11:28:08', '2025-08-22 11:28:08'),
('21311184-29b7-44af-b9c4-0279bba69956', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-01 12:33:46', '2025-09-01 12:33:46'),
('234860b0-1fc0-422c-af04-34a22432a412', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36', '2025-09-11 10:41:38', '2025-09-11 10:41:38'),
('28ae6dd8-ad02-4e4a-9ffd-bf56b6599cd6', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 10:00:34', '2025-08-21 10:00:34'),
('290dcacf-92fa-42be-86e2-e426686ae922', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 10:53:01', '2025-08-21 10:53:01'),
('2ddd8fd2-e561-4770-800c-16a943b64cf1', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:50:30', '2025-08-21 09:50:30'),
('2f976084-f76b-4958-af31-59730c78e265', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', NULL, 'create_fail', '{\"title\":\"samedi test fails public 1\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-23 08:17:15', '2025-08-23 08:17:15'),
('2fa2f2cb-e424-453d-9523-9138380f173e', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 08:22:05', '2025-08-26 08:22:05'),
('3087c7c2-3ad0-426b-b5e1-afcf39aa1828', '4780ee5f-c43d-4bfb-9add-72a1e6650552', 'test-1756728023447@example.com', 'TestUser1756728023447', 'register', '{\"email\":\"test-1756728023447@example.com\"}', NULL, NULL, '::1', 'node-fetch', '2025-09-01 12:00:24', '2025-09-01 12:00:24'),
('30ca79fe-d51f-46c2-ae88-39bfa3dc976e', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 11:53:52', '2025-08-26 11:53:52'),
('33d33aea-9e1b-4dcf-9fbd-df3a863d35c9', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'register', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 07:43:28', '2025-08-26 07:43:28'),
('34a01487-8ee6-479b-9730-c08ef080c0c9', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 12:48:24', '2025-08-27 12:48:24'),
('34c21d16-673e-4692-931a-868f3f081267', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', '', '2025-09-03 12:44:09', '2025-09-03 12:44:09'),
('3693e545-73ba-4709-8a29-dfbcd9445deb', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:28:55', '2025-08-21 09:28:55'),
('36b466f4-1dcb-460d-b503-ef6b3003b43b', 'fc91570c-8955-48ba-b4d6-9833ff4e5b4f', 'temp.test.1756718574108@test.local', 'Test User 1756718574108', 'register', '{\"email\":\"temp.test.1756718574108@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:22:54', '2025-09-01 09:22:54'),
('386401c5-8139-4f4d-82d7-8a1726a6f414', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', 'e2e.1757582045895@journey.local', NULL, 'reaction', '{\"reactionType\":\"courage\"}', '35353546-b6f2-4956-838a-d0084780409c', 'courage', '::ffff:127.0.0.1', '', '2025-09-11 09:14:07', '2025-09-11 09:14:07'),
('3b8dbc4d-5399-4409-8e63-5bf60c8f813a', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', 'e2e.1757582045895@journey.local', 'User 1757582045895', 'login', '{\"email\":\"e2e.1757582045895@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-11 09:14:06', '2025-09-11 09:14:06'),
('3ce575a3-85b8-4ab3-83c7-dacd4e739157', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 06:59:20', '2025-08-27 06:59:20'),
('3d2bb915-ebe5-4b45-ac42-2e5e47e8a7f8', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', '', '2025-09-03 12:37:17', '2025-09-03 12:37:17'),
('3dd1f517-dd5b-41a7-890b-ae8d2cf0093a', 'e1da10bd-4b07-418d-9581-ea72e5b13a10', 'test.1756725181656@faildaily.com', 'Utilisateur Intégration Test 1756725181656', 'login', '{\"email\":\"test.1756725181656@faildaily.com\"}', NULL, NULL, '::1', 'node', '2025-09-01 11:13:02', '2025-09-01 11:13:02'),
('3eff97a1-bdf1-42e2-b0eb-2efe8a39cfe4', '0a6a5bae-3336-4683-bb5c-520e439f08ca', 'e2e.1757582330595@journey.local', 'User 1757582330595', 'register', '{\"email\":\"e2e.1757582330595@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('40f0037d-648c-4725-b184-f9d8626c5a8e', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 13:30:13', '2025-08-26 13:30:13'),
('41de1f31-2fe9-410d-9509-f544b56d0f23', '3231fb01-5da2-4847-b009-4d034d7e8f7e', 'temp.test.1757582328683@test.local', 'Test User 1757582328683', 'register', '{\"email\":\"temp.test.1757582328683@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-11 09:18:49', '2025-09-11 09:18:49'),
('4399e570-014d-481d-8a5e-46712cfd22db', '3eec9236-40db-46ca-ae18-9b089bef0e75', 'vfr@vfr.vfr', 'Lundi 25 test 1', 'register', '{\"email\":\"vfr@vfr.vfr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 07:22:10', '2025-08-25 07:22:10'),
('44231b66-fae4-4fee-ab18-d85b60bdc4c5', 'a66d8aa0-3ce4-49e7-ac31-2b2f3ca8693c', 'temp.test.1756717662014@test.local', 'Test User 1756717662014', 'login', '{\"email\":\"temp.test.1756717662014@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:42', '2025-09-01 09:07:42'),
('445605ab-055a-4b69-a5e9-ee11282e4bd5', '6b008c16-0b01-4b64-b3d0-f3c4e679a1e8', 'test.1756725165043@faildaily.com', 'Test JWT User 1756725165043', 'login', '{\"email\":\"test.1756725165043@faildaily.com\"}', NULL, NULL, '::1', 'node', '2025-09-01 11:12:46', '2025-09-01 11:12:46'),
('44c8bf4b-3762-47a8-8898-009e8199dd27', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 11:49:42', '2025-08-26 11:49:42'),
('493f126f-3871-42c4-aa3b-17e3438a238b', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"laugh\"}', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-01 12:22:14', '2025-09-01 12:22:14'),
('494cedcb-11cd-474b-84d6-38a00701cd3d', 'c4ee0088-3db2-46a7-901c-dc434c04b43c', 'push.1757658323592@test.local', 'PushUser 1757658323592', 'register', '{\"email\":\"push.1757658323592@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 06:25:24', '2025-09-12 06:25:24'),
('4a1a7d64-1fa7-4581-9046-f509ee3e3146', '0a6a5bae-3336-4683-bb5c-520e439f08ca', 'e2e.1757582330595@journey.local', 'User 1757582330595', 'login', '{\"email\":\"e2e.1757582330595@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('4ad519c0-ea12-4ae8-88ac-f5f307f0051b', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 07:10:08', '2025-08-27 07:10:08'),
('4bfe15b9-fad6-4b38-8629-b26097fd4963', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'curl/8.14.1', '2025-09-03 12:38:37', '2025-09-03 12:38:37'),
('53e9a010-1971-4681-a0ff-864d1c5bd47a', 'afb563b2-ec82-491f-b8ff-39fd35f30833', 'u.1756717664526@test.local', 'U2', 'register', '{\"email\":\"u.1756717664526@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:44', '2025-09-01 09:07:44'),
('540b775c-8016-4513-b397-f46e384332fb', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:43:49', '2025-08-27 08:43:49'),
('54f3d2a9-2425-4fc7-8f75-b8ad028dc596', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 10:41:35', '2025-08-21 10:41:35'),
('555dc245-49ac-4464-ab9d-555e11d3013c', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 13:31:28', '2025-08-25 13:31:28'),
('57b1800b-3f16-4675-a946-9576d527fbbd', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 09:51:43', '2025-08-27 09:51:43'),
('592ab2fb-8670-47c8-b979-74fcd0c18cc7', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 12:01:56', '2025-08-21 12:01:56'),
('5dfcc9fb-869c-4d9e-b123-30f4fedf8619', 'fc91570c-8955-48ba-b4d6-9833ff4e5b4f', 'temp.test.1756718574108@test.local', 'Test User 1756718574108', 'login', '{\"email\":\"temp.test.1756718574108@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:22:54', '2025-09-01 09:22:54'),
('5fbc6d36-7354-4af3-b32a-62578aa9405f', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', '', '2025-09-03 13:03:13', '2025-09-03 13:03:13'),
('6022ad7f-a4b6-4cc9-8a8d-7f06c98bcfbe', '79440d6f-4010-42f8-9e24-3371ee140cf3', 'test-1756900995697@example.com', 'TestUser1756900995697', 'register', '{\"email\":\"test-1756900995697@example.com\"}', NULL, NULL, '::1', '', '2025-09-03 12:03:16', '2025-09-03 12:03:16'),
('6051acf3-3654-40d4-a8fa-18c0807757a1', '2030c326-c4fc-45dd-a8f3-f941e0aa8dea', 'u.1756717664095@test.local', 'U1', 'register', '{\"email\":\"u.1756717664095@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:44', '2025-09-01 09:07:44'),
('6051f0e7-8942-4e84-beaa-4f4c899ad9de', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36', '2025-09-11 08:28:53', '2025-09-11 08:28:53'),
('65654b58-2dd8-462b-b50d-150c3939969a', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"courage\"}', '85efade8-0857-40a9-a790-8253c270157f', 'courage', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 09:33:04', '2025-08-27 09:33:04'),
('67bc5cf7-e613-49f0-903f-a784c296e730', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', 'e2e.1757658325178@journey.local', NULL, 'reaction', '{\"reactionType\":\"courage\"}', '512897e6-71c7-4fcc-a28c-265710ceb4a6', 'courage', '::ffff:127.0.0.1', '', '2025-09-12 06:25:26', '2025-09-12 06:25:26'),
('7052dbe0-0d78-41d9-ab2c-96f1a0db6083', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 10:59:55', '2025-08-21 10:59:55'),
('717918fa-c190-4da9-af4f-8cd8d01b9504', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:15:06', '2025-08-21 09:15:06'),
('73c581ef-7d8a-449e-8402-49842ec8f920', 'a66d8aa0-3ce4-49e7-ac31-2b2f3ca8693c', 'temp.test.1756717662014@test.local', 'Test User 1756717662014', 'register', '{\"email\":\"temp.test.1756717662014@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:42', '2025-09-01 09:07:42'),
('74be9599-6e82-43aa-a3c6-68a4874fca45', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 11:34:10', '2025-08-26 11:34:10'),
('782175cb-2458-4982-8e3f-a278d36cbf5d', '6ab7b2cd-1de5-4e2f-9307-4322d425e4b4', 'newtest12345@test.com', 'NewTestUser', 'login', '{\"email\":\"newtest12345@test.com\"}', NULL, NULL, '::1', 'curl/8.14.1', '2025-09-01 11:26:29', '2025-09-01 11:26:29'),
('791bf6cd-56c3-46f9-ab98-489f97d4b410', '48b99a1f-8da7-4940-a34a-fd28d062c34f', 'temp.test.1757582048609@test.local', 'Test User 1757582048609', 'register', '{\"email\":\"temp.test.1757582048609@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-11 09:14:09', '2025-09-11 09:14:09'),
('798d8ee7-75a0-4c04-92ba-9cb6d534b4a8', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', 'e2e.1757582045895@journey.local', NULL, 'reaction', '{\"reactionType\":\"courage\"}', '35353546-b6f2-4956-838a-d0084780409c', 'courage', '::ffff:127.0.0.1', '', '2025-09-11 09:14:07', '2025-09-11 09:14:07'),
('7a5e33eb-3490-4f6d-9572-1835b7d45944', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-22 22:10:32', '2025-08-22 22:10:32'),
('8053e109-961e-4d35-ab31-10570ed3efba', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 12:28:12', '2025-08-27 12:28:12'),
('80852f00-768c-499c-8c33-e18f25a9075c', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:28:43', '2025-08-27 08:28:43'),
('815f716c-a209-4ba4-8a6a-5cc115b8ec49', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', 'vendredi test 1', 'register', '{\"email\":\"tre@rte.ee\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-22 21:40:02', '2025-08-22 21:40:02'),
('81f85dbc-494b-424f-81a3-01ea5e14aeb2', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 08:35:13', '2025-08-26 08:35:13'),
('83994a5f-6f19-4c7a-9f37-80c6f27b4ed7', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 11:15:02', '2025-08-21 11:15:02'),
('83bed0bc-dee5-44ce-b834-0a22011eb910', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-03 10:55:07', '2025-09-03 10:55:07'),
('85c0ccc2-4319-4d8d-a5ef-50fe1660c28d', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 11:41:42', '2025-08-21 11:41:42'),
('86fe16d9-86c3-4bcb-9ad1-2a1cf90ac354', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 08:47:47', '2025-08-25 08:47:47'),
('87b60d00-8523-4429-a596-e4eb62adf556', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 11:35:57', '2025-08-26 11:35:57'),
('8a49fae5-afaa-4021-a39a-276e4a6a9e04', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', 'e2e.1757582045895@journey.local', 'User 1757582045895', 'register', '{\"email\":\"e2e.1757582045895@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-11 09:14:06', '2025-09-11 09:14:06'),
('8be4bdcb-5c25-47eb-9214-ce8113a19027', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"empathy\"}', '85efade8-0857-40a9-a790-8253c270157f', 'empathy', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 11:39:58', '2025-08-27 11:39:58'),
('8e72dede-d532-4812-880c-a85a5eac842d', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', 'vendredi test 1', 'login', '{\"email\":\"tre@rte.ee\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-22 22:28:20', '2025-08-22 22:28:20'),
('8f32ce86-e7d9-49f6-90a3-030d811b82a1', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"courage\"}', '85efade8-0857-40a9-a790-8253c270157f', 'courage', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 11:39:56', '2025-08-27 11:39:56'),
('91eaa83f-2648-4567-990f-b2b31e0ff080', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 13:11:41', '2025-08-26 13:11:41'),
('91f5ec49-87b1-4c53-b788-a6f143814925', '4ede043a-da02-4f5b-aa4c-c45bee9a714a', 'adm.1756717659772@test.local', 'AdminC', 'login', '{\"email\":\"adm.1756717659772@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:41', '2025-09-01 09:07:41'),
('93d0c42c-1c35-4ee4-b47f-6a93e909b391', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 08:34:50', '2025-08-26 08:34:50'),
('93d5d2f5-a4bd-46e1-b5ec-2256ddbd3dbf', '7e087b9c-2f45-4e77-8471-a6cebbf2de13', 'test.1756725176592@faildaily.com', 'Test Retrieval User 1756725176592', 'register', '{\"email\":\"test.1756725176592@faildaily.com\"}', NULL, NULL, '::1', 'node', '2025-09-01 11:12:57', '2025-09-01 11:12:57'),
('94809be8-9ede-4fc3-acaf-2b931b6c4ac9', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"empathy\"}', '85efade8-0857-40a9-a790-8253c270157f', 'empathy', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:33:45', '2025-08-27 08:33:45'),
('94b3b98f-3dab-4276-bf22-f3d3e7aff7c8', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-03 13:01:34', '2025-09-03 13:01:34'),
('967da4ad-7fd0-4ae6-b103-8bf47f312aa7', '411dd9ff-9673-48c9-838a-50b49074fff0', 'test@test.com', 'Test User', 'register', '{\"email\":\"test@test.com\"}', NULL, NULL, '::1', 'curl/8.14.1', '2025-08-25 09:46:12', '2025-08-25 09:46:12'),
('97598398-b76f-477f-94ca-4c1707727cc5', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-08 07:35:28', '2025-09-08 07:35:28'),
('9825b291-d5db-43b5-ae64-410b76ff1854', '0a6a5bae-3336-4683-bb5c-520e439f08ca', 'e2e.1757582330595@journey.local', NULL, 'reaction', '{\"reactionType\":\"courage\"}', '394d616a-75db-46a2-9c30-00e4179ecbf5', 'courage', '::ffff:127.0.0.1', '', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('99866652-5c8c-4032-8c67-7e5dd85f41d9', '48b99a1f-8da7-4940-a34a-fd28d062c34f', 'temp.test.1757582048609@test.local', 'Test User 1757582048609', 'login', '{\"email\":\"temp.test.1757582048609@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-11 09:14:09', '2025-09-11 09:14:09'),
('9a1b99ca-ff9b-4e6d-a4f7-e264a5906c8a', '2212f5ba-bfe1-4241-b275-42771e59479c', 'e2e.1756718570811@journey.local', 'User 1756718570811', 'login', '{\"email\":\"e2e.1756718570811@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:22:52', '2025-09-01 09:22:52'),
('9b706e19-6112-4ff2-a3d9-e195b8a78a53', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-22 22:03:02', '2025-08-22 22:03:02'),
('9ba103f1-bd6b-4164-867c-37cd28c18b8a', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', 'e2e.1757658325178@journey.local', NULL, 'reaction', '{\"reactionType\":\"courage\"}', '512897e6-71c7-4fcc-a28c-265710ceb4a6', 'courage', '::ffff:127.0.0.1', '', '2025-09-12 06:25:26', '2025-09-12 06:25:26'),
('9dc39c98-c8db-4040-8828-6741b1d4c1c3', 'e1da10bd-4b07-418d-9581-ea72e5b13a10', 'test.1756725181656@faildaily.com', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'node', '2025-09-01 11:13:03', '2025-09-01 11:13:03'),
('9eadc9d5-5226-4754-bcfe-966dc168e1ab', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"support\"}', '85efade8-0857-40a9-a790-8253c270157f', 'support', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 11:46:48', '2025-08-27 11:46:48'),
('a02d1b39-88d8-41d8-962f-31a9bc8e4921', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 12:09:33', '2025-08-27 12:09:33'),
('a1049469-9c5e-46ed-9737-08f1fb032198', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-11 08:18:27', '2025-09-11 08:18:27'),
('a4fa6736-2f70-46dc-82bd-3b4c32923248', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"support\"}', '965883d5-c51b-4ccb-a7e4-e90aecc49016', 'support', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 12:28:21', '2025-08-27 12:28:21'),
('a521f3a7-e9f6-4111-97b2-c5935d30d779', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 13:11:54', '2025-08-26 13:11:54'),
('a68c8082-66da-43fe-b46f-03705108020a', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 12:25:38', '2025-08-26 12:25:38'),
('a76a4c60-79b2-4d85-878e-ba9d1545cd68', 'fe8d5a37-d3db-49dc-850e-532aae96868c', 'temp.test.1756719282631@test.local', 'Test User 1756719282631', 'register', '{\"email\":\"temp.test.1756719282631@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:34:43', '2025-09-01 09:34:43'),
('a78c2dd1-95e8-4bb9-901e-1bce8a793580', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"empathy\"}', '85efade8-0857-40a9-a790-8253c270157f', 'empathy', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 11:46:44', '2025-08-27 11:46:44'),
('ab3dca6b-50e0-4ddc-b90e-579e79c4c86d', '9d774ace-1dff-4ac9-8091-66e84e57a516', 'adm.1756717666568@test.local', 'AdminUser', 'register', '{\"email\":\"adm.1756717666568@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:47', '2025-09-01 09:07:47'),
('ad4cff51-6325-446c-bb60-034b9234288f', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 08:47:35', '2025-08-26 08:47:35'),
('ae4b02d0-f68c-4973-91d6-820445a02621', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 12:15:51', '2025-08-26 12:15:51'),
('b0606fdd-e6a0-4302-b469-b86f55514d2c', '293c74c1-371b-45e0-b548-77dff333b8e9', 'e2e.1756717654854@journey.local', 'User 1756717654854', 'register', '{\"email\":\"e2e.1756717654854@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:35', '2025-09-01 09:07:35'),
('b15006af-fe49-451a-a7a0-2f4db6f604b6', '58570b71-7bde-4266-b35c-03e59c0f82e7', 'adm.1756717657387@test.local', 'AdminTmp', 'register', '{\"email\":\"adm.1756717657387@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:38', '2025-09-01 09:07:38'),
('b4250761-b1f2-4f10-8e85-07168f6c48c8', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:10:17', '2025-08-21 09:10:17'),
('b5ca5ff1-3908-41e9-8a2a-33c663208d2a', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'curl/8.14.1', '2025-09-03 12:37:30', '2025-09-03 12:37:30'),
('b6b0c6e8-2494-472f-a66b-dcb40c6dc0cb', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"support\"}', '85efade8-0857-40a9-a790-8253c270157f', 'support', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-01 12:22:17', '2025-09-01 12:22:17'),
('b7094f63-ccb9-4e53-a15d-47cb30a38b07', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', '', '2025-09-03 12:44:38', '2025-09-03 12:44:38'),
('b7563fc6-df12-4305-a19e-c91f40643c9a', '19261451-4bec-46df-947b-ed2a111c0801', 'adm.1756717663149@test.local', 'AdminIS', 'login', '{\"email\":\"adm.1756717663149@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:44', '2025-09-01 09:07:44'),
('b7fd08c1-ff3d-4e48-b1bc-ed8f9de0ea21', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"courage\"}', '85efade8-0857-40a9-a790-8253c270157f', 'courage', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:33:39', '2025-08-27 08:33:39'),
('b8009b51-c3cd-4e41-8cf6-eef02337d500', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', 'e2e.1757658325178@journey.local', 'User 1757658325178', 'login', '{\"email\":\"e2e.1757658325178@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 06:25:26', '2025-09-12 06:25:26'),
('ba160b8d-509e-4147-91a7-6f47d9a9721b', '6b7baec3-c870-4f1d-a256-45d31ed5f893', 'adult.1756717665706@test.local', 'Adult', 'register', '{\"email\":\"adult.1756717665706@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:46', '2025-09-01 09:07:46'),
('ba695871-4845-4490-adf6-3e1d22126504', '5d79191e-ec05-40a0-a85f-ecc8b6287f94', 'test.1756725160513@faildaily.com', 'Test Login User 1756725160513', 'login', '{\"email\":\"test.1756725160513@faildaily.com\"}', NULL, NULL, '::1', 'node', '2025-09-01 11:12:41', '2025-09-01 11:12:41'),
('bb4cedf7-5a89-4342-9855-61209ac355a8', 'ae6d53e7-9ab0-4b49-ada8-86bd09d48e6f', 'teen.1756717661025@test.local', 'TeenC', 'register', '{\"email\":\"teen.1756717661025@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:41', '2025-09-01 09:07:41'),
('bcad8ea2-a112-4a94-b054-5ceb95e6acfb', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', NULL, 'create_fail', '{\"title\":\"fails test 1 : jeudi adulte test 1\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:51:05', '2025-08-21 09:51:05'),
('bcc22f9a-070f-48f7-8006-2b97d841fd68', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 11:39:27', '2025-08-21 11:39:27'),
('bd54fea2-cf7a-44a4-a990-3bf58169419f', '12c637c8-450c-4159-9beb-817aca67e9a1', 'adm.1756717668294@test.local', 'AdminF', 'register', '{\"email\":\"adm.1756717668294@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:48', '2025-09-01 09:07:48'),
('bde9945d-6916-4093-94db-7d5e03bcc53f', 'e10fbd52-b906-4504-8e13-7c7b7c451afa', 'test-1756727373156@example.com', 'TestUser1756727373156', 'register', '{\"email\":\"test-1756727373156@example.com\"}', NULL, NULL, '::1', 'node-fetch', '2025-09-01 11:49:33', '2025-09-01 11:49:33'),
('bdf834cd-74f4-4d8d-80be-1b935485abe5', 'c4ee0088-3db2-46a7-901c-dc434c04b43c', 'push.1757658323592@test.local', 'PushUser 1757658323592', 'login', '{\"email\":\"push.1757658323592@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 06:25:24', '2025-09-12 06:25:24'),
('c12572a0-4af7-40f1-8418-6616d5baceb1', '293c74c1-371b-45e0-b548-77dff333b8e9', 'e2e.1756717654854@journey.local', 'User 1756717654854', 'login', '{\"email\":\"e2e.1756717654854@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:36', '2025-09-01 09:07:36'),
('c13a64ce-bccd-4f34-a256-901f5c94c57f', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-03 12:50:51', '2025-09-03 12:50:51'),
('c1a3d888-5d19-4077-9222-702f4f376956', '33e10cbd-a3cf-4259-8098-f3b33e3ec8bc', 'teen.1756717658787@test.local', 'Teen', 'register', '{\"email\":\"teen.1756717658787@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:39', '2025-09-01 09:07:39'),
('c1db7702-207e-477b-9144-cf55314bec9a', '5efe0f4e-ea21-4418-9e15-5e361c43b3f8', 'test.public.1755862087925@example.com', 'Test Public User', 'login', '{\"email\":\"test.public.1755862087925@example.com\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-08-22 11:28:09', '2025-08-22 11:28:09'),
('c2076b84-0343-48cd-b3a0-759c21a4a09b', '4641d9fd-e136-4c65-b696-4ff4e5b9bf3f', 'temp.test.1757658322102@test.local', 'Test User 1757658322102', 'login', '{\"email\":\"temp.test.1757658322102@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 06:25:23', '2025-09-12 06:25:23'),
('c3a575ea-1eaa-40d2-bf36-895aa89b31b5', '9d774ace-1dff-4ac9-8091-66e84e57a516', 'adm.1756717666568@test.local', 'AdminUser', 'login', '{\"email\":\"adm.1756717666568@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:47', '2025-09-01 09:07:47'),
('c4d2eb3e-e436-4c89-b9b4-e0435ad98268', '3231fb01-5da2-4847-b009-4d034d7e8f7e', 'temp.test.1757582328683@test.local', 'Test User 1757582328683', 'login', '{\"email\":\"temp.test.1757582328683@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-11 09:18:49', '2025-09-11 09:18:49'),
('c5b831c2-8c98-489d-81e7-dc7e4c1d7d56', 'bea3f8c3-f962-48ac-891a-604f278cdb09', 'u15.1756717665266@test.local', 'U15', 'register', '{\"email\":\"u15.1756717665266@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:45', '2025-09-01 09:07:45'),
('c5dd357a-90dd-49e7-b194-bb886a50e7f9', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'password_reset_request', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-10 09:14:16', '2025-09-10 09:14:16'),
('c7ca0f56-b7a7-4eed-a2c8-e79c7079d032', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"support\"}', '85efade8-0857-40a9-a790-8253c270157f', 'support', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:33:46', '2025-08-27 08:33:46'),
('cc825aa0-84be-4086-bff4-02fead106563', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 07:43:52', '2025-08-26 07:43:52'),
('cd53de5f-2b34-4b38-a47d-a1287a6c0c97', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 09:08:07', '2025-08-25 09:08:07'),
('cd6001ad-1101-45fc-b7c2-4cf096e3d857', '19261451-4bec-46df-947b-ed2a111c0801', 'adm.1756717663149@test.local', 'AdminIS', 'register', '{\"email\":\"adm.1756717663149@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:43', '2025-09-01 09:07:43'),
('cf6850b9-5130-4d4a-8690-ec3a6776089c', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-22 22:27:53', '2025-08-22 22:27:53'),
('d0a8c43d-7bcc-4066-8c0b-cbda916f0c87', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-01 12:22:09', '2025-09-01 12:22:09'),
('d0e7d154-fb35-4b5c-af2e-1c03b31022d9', '4641d9fd-e136-4c65-b696-4ff4e5b9bf3f', 'temp.test.1757658322102@test.local', 'Test User 1757658322102', 'register', '{\"email\":\"temp.test.1757658322102@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 06:25:22', '2025-09-12 06:25:22'),
('d13ee542-698a-40b5-916a-d97f57f1d3ec', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 10:53:38', '2025-08-26 10:53:38'),
('d1887c63-9525-4fcb-9092-25a4d402aecc', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:40:32', '2025-08-21 09:40:32'),
('d309b77e-f044-44f6-bc4e-8aa70082e300', '957f8d77-8311-4377-b3fc-b9b53ab29beb', 'teen.1756717667504@test.local', 'TeenUser', 'register', '{\"email\":\"teen.1756717667504@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:47', '2025-09-01 09:07:47'),
('d72241b5-893e-47b3-b0a6-82e80e94a599', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', 'vendredi test 1', 'login', '{\"email\":\"tre@rte.ee\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-22 22:10:45', '2025-08-22 22:10:45'),
('d76f6771-5d9a-49a3-88fe-ab0f1e90d01f', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36', '2025-09-11 11:06:57', '2025-09-11 11:06:57'),
('d9f1da8f-5e44-46db-ba92-eca1ca15a400', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'curl/8.14.1', '2025-09-03 13:04:41', '2025-09-03 13:04:41'),
('da40483c-8f9f-4f88-ac21-fd74c9bdaa49', '75c74d79-8cda-4c6b-8c08-c0dfa06043ca', 'e2e.1756719280609@journey.local', 'User 1756719280609', 'register', '{\"email\":\"e2e.1756719280609@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:34:41', '2025-09-01 09:34:41'),
('dd98307c-ad97-42de-ae93-b9e004f45095', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', '', '2025-09-03 13:05:46', '2025-09-03 13:05:46'),
('ddfceb4f-d012-4a93-89b4-ce49596f5e2e', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 09:31:26', '2025-08-27 09:31:26'),
('df3ae67b-78a1-4513-8e06-5010c44e4899', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"laugh\"}', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:33:44', '2025-08-27 08:33:44'),
('e026296f-0ee4-4ce7-a8ba-e44454796684', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'curl/8.14.1', '2025-09-03 13:03:21', '2025-09-03 13:03:21'),
('e0b2b267-6df2-496d-952f-37594f2312df', '11c77ea4-4602-4cb9-a75e-c894b480c4e8', 'alexia@alexia.fr', 'Alexia', 'register', '{\"email\":\"alexia@alexia.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-10 09:17:11', '2025-09-10 09:17:11');
INSERT INTO `user_activities` (`id`, `user_id`, `user_email`, `user_name`, `action`, `details`, `fail_id`, `reaction_type`, `ip_address`, `user_agent`, `timestamp`, `created_at`) VALUES
('e0dfbfd5-6324-40af-b1a4-c6b976d1e20d', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-26 07:23:36', '2025-08-26 07:23:36'),
('e288cf8b-34ea-4a62-88c6-680f04468e35', '3eec9236-40db-46ca-ae18-9b089bef0e75', 'vfr@vfr.vfr', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-25 07:54:17', '2025-08-25 07:54:17'),
('e5caeab9-2a4c-4b17-a751-560e37ab3811', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36', '2025-09-11 09:56:43', '2025-09-11 09:56:43'),
('e6694d2a-a58d-45ef-9e50-4925f0bfe250', 'fe8d5a37-d3db-49dc-850e-532aae96868c', 'temp.test.1756719282631@test.local', 'Test User 1756719282631', 'login', '{\"email\":\"temp.test.1756719282631@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:34:43', '2025-09-01 09:34:43'),
('e96ae342-70df-49ab-bbfa-c1f14a80d908', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', 'Taaazzz', 'login', '{\"email\":\"bruno@taaazzz.be\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 11:33:47', '2025-08-27 11:33:47'),
('ea358efb-1e5e-4519-aa72-41809153a25c', '0a6a5bae-3336-4683-bb5c-520e439f08ca', 'e2e.1757582330595@journey.local', NULL, 'reaction', '{\"reactionType\":\"courage\"}', '394d616a-75db-46a2-9c30-00e4179ecbf5', 'courage', '::ffff:127.0.0.1', '', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('ea7e4897-d392-49d7-a60a-5a6751b96314', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', NULL, 'create_fail', '{\"title\":\"samedi test fails anonyme 1\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-23 08:18:57', '2025-08-23 08:18:57'),
('eaba0c06-19b6-4ebd-9d2e-152139645746', '4ede043a-da02-4f5b-aa4c-c45bee9a714a', 'adm.1756717659772@test.local', 'AdminC', 'register', '{\"email\":\"adm.1756717659772@test.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:07:40', '2025-09-01 09:07:40'),
('f18ee623-3c02-4620-9e9e-ef1bde1c05e0', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 11:33:46', '2025-08-21 11:33:46'),
('f1fdce03-fa5b-4de5-aff9-5d12d964d751', '411dd9ff-9673-48c9-838a-50b49074fff0', 'test@test.com', 'Test User', 'login', '{\"email\":\"test@test.com\"}', NULL, NULL, '::1', 'curl/8.14.1', '2025-08-25 09:47:02', '2025-08-25 09:47:02'),
('f3f5a71e-2898-49c4-a336-49aedfb21cee', 'e1da10bd-4b07-418d-9581-ea72e5b13a10', 'test.1756725181656@faildaily.com', 'Utilisateur Intégration Test 1756725181656', 'register', '{\"email\":\"test.1756725181656@faildaily.com\"}', NULL, NULL, '::1', 'node', '2025-09-01 11:13:02', '2025-09-01 11:13:02'),
('f4be9bd7-1fc7-4af2-b8c6-bf41bbb6feca', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"laugh\"}', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:33:31', '2025-08-27 08:33:31'),
('f532ffd0-2fb6-4fe3-9896-02da97f20f34', '75c74d79-8cda-4c6b-8c08-c0dfa06043ca', 'e2e.1756719280609@journey.local', 'User 1756719280609', 'login', '{\"email\":\"e2e.1756719280609@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-01 09:34:41', '2025-09-01 09:34:41'),
('f5644a49-9d7f-429f-a40b-12aa923c1c0b', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"empathy\"}', '85efade8-0857-40a9-a790-8253c270157f', 'empathy', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 12:37:06', '2025-08-27 12:37:06'),
('f5c0ea30-1954-4c19-809e-bff561c91984', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', NULL, NULL, 'register', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, NULL, NULL, '2025-08-21 08:51:48', '2025-08-21 08:51:48'),
('f70e140a-5ab1-4821-8387-a9a02b0e16dd', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:12:47', '2025-08-21 09:12:47'),
('f798a5a8-bd40-4657-937b-998ece59cc8b', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'tre@rte.ee', NULL, 'logout', '{\"reason\":\"user_logout\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-23 09:01:42', '2025-08-23 09:01:42'),
('f8dd1ac2-fdc9-44c7-8502-0c5ac7542ba6', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"laugh\"}', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 09:33:14', '2025-08-27 09:33:14'),
('f9f981c5-2476-44ee-837a-bc951a8157db', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-22 22:10:21', '2025-08-22 22:10:21'),
('fa3e985a-37ac-4dfd-a0c3-efb854bcbce2', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"courage\"}', '85efade8-0857-40a9-a790-8253c270157f', 'courage', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 08:28:47', '2025-08-27 08:28:47'),
('fb5438d5-fe37-4367-80cf-9ea7c35f27a2', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"empathy\"}', '965883d5-c51b-4ccb-a7e4-e90aecc49016', 'empathy', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-09-01 12:22:20', '2025-09-01 12:22:20'),
('fc00d3da-46c4-48a5-8a02-397bccec1a8d', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', 'e2e.1757658325178@journey.local', 'User 1757658325178', 'register', '{\"email\":\"e2e.1757658325178@journey.local\"}', NULL, NULL, '::ffff:127.0.0.1', '', '2025-09-12 06:25:25', '2025-09-12 06:25:25'),
('fc11a360-1b76-43dc-bbe3-9e2a4495bfdf', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'adulte1@adulte.fr', 'jeudi test adulte 1', 'login', '{\"email\":\"adulte1@adulte.fr\"}', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-21 09:25:03', '2025-08-21 09:25:03'),
('ff6e9b42-1e5e-4947-bcb0-e1bc06dc5076', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'bruno@taaazzz.be', NULL, 'reaction', '{\"reactionType\":\"laugh\"}', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '2025-08-27 11:40:20', '2025-08-27 11:40:20');

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
('0b483a38-6b09-45ee-b170-1472c0dda23b', '11c77ea4-4602-4cb9-a75e-c894b480c4e8', 'first-fail', '2025-09-10 09:18:27', '2025-09-10 09:18:27'),
('59647bb8-f515-4b89-9fd4-5109293b3a31', '0a6a5bae-3336-4683-bb5c-520e439f08ca', 'first-fail', '2025-09-11 09:18:51', '2025-09-11 09:18:51'),
('e0052d64-5909-4b15-b3d5-116f94b0f56e', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', 'first-fail', '2025-09-11 09:14:07', '2025-09-11 09:14:07'),
('f7a3ca83-1c2f-41b7-aab4-edc7a375964d', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', 'first-fail', '2025-09-12 06:25:26', '2025-09-12 06:25:26');

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
('4098e3a5-7b27-42ec-b8be-204776aa7ed7', 10, '2025-09-12 06:25:26', '2025-09-12 06:25:26'),
('57a2560d-b065-44f3-96c8-3b0d2e5b569b', 57, '2025-08-27 08:28:47', '2025-09-01 12:22:20'),
('6db5b664-7c73-4fea-88c5-6d2e31c83bd5', 10, '2025-09-11 09:14:07', '2025-09-11 09:14:07'),
('814b7d10-b3d4-4921-ab47-a388bec6c7fb', 2, '2025-09-02 08:44:42', '2025-09-02 08:44:42'),
('9f92d99e-5f70-427e-aebd-68ca8b727bd4', 70, '2025-09-03 11:13:08', '2025-09-03 12:05:08');

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
('0c7eeef6-cfcf-4acc-9e74-998927ac0eee', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 10, 'fail_create', 'a490ccd7-ba67-47cb-ad30-aeb08f1be8c8', NULL, NULL, '2025-09-03 11:55:06'),
('1d2d8930-08be-45fb-80a8-3f757d67ba55', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', -2, 'comment_delete_revoke', '35353546-b6f2-4956-838a-d0084780409c', NULL, NULL, '2025-09-11 09:14:07'),
('201289df-95c2-47dc-be2f-685b33739b24', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '965883d5-c51b-4ccb-a7e4-e90aecc49016', 'support', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 12:28:21'),
('21c8fe3e-32c0-4bee-8df2-0a9c36397e11', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:33:44'),
('40edbc26-5dd5-4c6b-a16f-f8351610ad36', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', 2, 'comment_create', '35353546-b6f2-4956-838a-d0084780409c', NULL, NULL, '2025-09-11 09:14:07'),
('4aa46698-a5cb-40de-b3c4-084202bc6edb', '11c77ea4-4602-4cb9-a75e-c894b480c4e8', 10, 'fail_create', '65824bca-7416-4d2b-8070-d3de03c3891c', NULL, NULL, '2025-09-10 09:18:27'),
('4f7b40bb-c9fa-4fb5-9c89-c01329384a26', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:33:31'),
('5149df52-438e-46c0-b771-ba2b9efa30f2', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 10, 'fail_create', NULL, NULL, NULL, '2025-09-03 11:13:08'),
('59cf03e8-d64c-4d14-8b7c-a5d9175dd7d2', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 10, 'fail_create', NULL, NULL, NULL, '2025-09-03 11:21:23'),
('6d5cd2a4-6c83-442f-9fe9-0d297a05ef2b', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 10, 'fail_create', 'b7737594-7fe3-4894-966e-4a785d5d7832', NULL, NULL, '2025-09-03 11:26:41'),
('6f13d3c9-ed95-4640-ac39-4d3fae7a6c2e', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 10, 'fail_create', '2d55f82e-8ba2-4189-a897-a1a588eaff95', NULL, NULL, '2025-09-03 11:34:44'),
('8b466c2f-58b0-4fac-9e70-15ef8c8471e9', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 10, 'fail_create', 'bb77e2b0-8576-4984-9ebc-29d8262d5741', NULL, NULL, '2025-09-03 12:05:08'),
('8c03d661-0e06-486c-ad6e-c428d8dfcf1c', '0a6a5bae-3336-4683-bb5c-520e439f08ca', 10, 'fail_create', '394d616a-75db-46a2-9c30-00e4179ecbf5', NULL, NULL, '2025-09-11 09:18:51'),
('8daad5d7-e509-494e-8b64-993f8aca1c71', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', 2, 'comment_create', '512897e6-71c7-4fcc-a28c-265710ceb4a6', NULL, NULL, '2025-09-12 06:25:26'),
('98f1dc4b-24ff-449d-ade4-4f8dc24b3045', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', 10, 'fail_create', '512897e6-71c7-4fcc-a28c-265710ceb4a6', NULL, NULL, '2025-09-12 06:25:26'),
('a0ad4f62-cb34-48ce-94e2-24303e47ce87', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'support', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:33:46'),
('a3a4d051-d5a1-45c1-90ca-ce6cf3dd2a87', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 10, 'fail_create', '3577b475-85a3-4d21-b6cf-51df98450772', NULL, NULL, '2025-09-03 11:54:19'),
('a7ac836e-36a3-4130-bd68-1000ae2645d9', '0a6a5bae-3336-4683-bb5c-520e439f08ca', -2, 'comment_delete_revoke', '394d616a-75db-46a2-9c30-00e4179ecbf5', NULL, NULL, '2025-09-11 09:18:51'),
('aadd2516-5fba-4fc6-a3ce-aab6280f14f8', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'support', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 11:46:48'),
('ae020df8-e26c-4915-bf73-986146b58c1d', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 5, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'courage', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 09:33:04'),
('af6396b6-567a-4102-ab47-de938b21e05a', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 2, 'reaction', '965883d5-c51b-4ccb-a7e4-e90aecc49016', 'empathy', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-09-01 12:22:20'),
('b91922bf-f5b3-4858-bc9d-3c9fe791b6e5', '0a6a5bae-3336-4683-bb5c-520e439f08ca', 2, 'comment_create', '394d616a-75db-46a2-9c30-00e4179ecbf5', NULL, NULL, '2025-09-11 09:18:51'),
('bc0ecc37-b54e-41a9-8460-528d8993d71f', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 2, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'empathy', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 11:46:44'),
('c5e9a07d-7663-47a2-937d-3d6ec4e16fca', '6db5b664-7c73-4fea-88c5-6d2e31c83bd5', 10, 'fail_create', '35353546-b6f2-4956-838a-d0084780409c', NULL, NULL, '2025-09-11 09:14:07'),
('ca8f557f-7777-4f8d-a58a-98ab3a25ea4b', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-09-01 12:22:14'),
('cfcd9dad-38a3-49c5-b102-3398bba356fa', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 2, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'empathy', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:33:45'),
('d172f5c0-f9e5-486b-93ce-d84db0519b20', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 5, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'courage', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:28:47'),
('d604a881-4a25-4ab9-8210-5ec744d61690', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'support', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-09-01 12:22:17'),
('deed0f69-b6eb-41f8-91c1-e303a392b98a', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 09:33:14'),
('f23165fd-0a47-4382-bb8e-0c9457297153', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 5, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'courage', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 11:39:56'),
('f3ba781d-ba76-436c-a7ee-9f224a4984f1', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 5, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'courage', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 08:33:39'),
('f7574cfb-d085-4061-baac-d408bc7ac6e1', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 2, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'empathy', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 12:37:06'),
('f84f1390-f5f3-49a7-887f-0818645a2216', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 3, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'laugh', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 11:40:20'),
('f93db7fd-8c5f-4d7c-8f8d-cb1e3209ea2b', '4098e3a5-7b27-42ec-b8be-204776aa7ed7', -2, 'comment_delete_revoke', '512897e6-71c7-4fcc-a28c-265710ceb4a6', NULL, NULL, '2025-09-12 06:25:26'),
('ffb91f16-a17d-4f4b-8cc6-af8927b19a9f', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 2, 'reaction', '85efade8-0857-40a9-a790-8253c270157f', 'empathy', '{\"fromUser\":\"9f92d99e-5f70-427e-aebd-68ca8b727bd4\"}', '2025-08-27 11:39:58');

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
