-- Script de création des tables essentielles pour FailDaily
USE faildaily;

-- Table users
CREATE TABLE IF NOT EXISTS `users` (
  `id` char(36) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table fails
CREATE TABLE IF NOT EXISTS `fails` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table reactions
CREATE TABLE IF NOT EXISTS `reactions` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `fail_id` char(36) NOT NULL,
  `reaction_type` varchar(50) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_fail_reaction` (`user_id`,`fail_id`),
  KEY `idx_reactions_fail_id` (`fail_id`),
  KEY `idx_reactions_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données de test pour les réactions
INSERT INTO `reactions` (`id`, `user_id`, `fail_id`, `reaction_type`, `created_at`) VALUES
('2040f91e-edf1-4cdf-99fa-c15d64cafc25', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '85efade8-0857-40a9-a790-8253c270157f', 'empathy', '2025-08-27 12:37:06'),
('5c18bb2d-cd68-4b54-8045-aaaca336791c', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', '0f29dcc0-0b48-47cd-b0c5-dd1adc225198', 'courage', '2025-08-21 11:49:45'),
('7ca813bf-c38a-43c9-9515-8746420de24c', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '965883d5-c51b-4ccb-a7e4-e90aecc49016', 'laugh', '2025-08-27 12:28:21'),
('e6b1454e-2d89-4187-818c-9b6175709838', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', '0f29dcc0-0b48-47cd-b0c5-dd1adc225198', 'empathy', '2025-08-27 07:43:59'),
('f80fb208-79a7-4a21-a7c3-e0bc9d27f6c0', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', '965883d5-c51b-4ccb-a7e4-e90aecc49016', 'courage', '2025-08-23 08:45:07');

-- Données de test pour les fails
INSERT INTO `fails` (`id`, `user_id`, `title`, `description`, `created_at`) VALUES
('85efade8-0857-40a9-a790-8253c270157f', '9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'Test Fail 1', 'Description du premier fail', '2025-08-20 10:00:00'),
('965883d5-c51b-4ccb-a7e4-e90aecc49016', '814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'Test Fail 2', 'Description du second fail', '2025-08-21 10:00:00'),
('0f29dcc0-0b48-47cd-b0c5-dd1adc225198', '57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'Test Fail 3', 'Description du troisième fail', '2025-08-22 10:00:00');

-- Données de test pour les utilisateurs
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `created_at`) VALUES
('9f92d99e-5f70-427e-aebd-68ca8b727bd4', 'testuser1', 'test1@faildaily.com', '$2b$10$sample1', '2025-08-15 10:00:00'),
('814b7d10-b3d4-4921-ab47-a388bec6c7fb', 'testuser2', 'test2@faildaily.com', '$2b$10$sample2', '2025-08-16 10:00:00'),
('57a2560d-b065-44f3-96c8-3b0d2e5b569b', 'testuser3', 'test3@faildaily.com', '$2b$10$sample3', '2025-08-17 10:00:00');
