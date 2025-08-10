-- Migration des badges hardcodés vers la base de données Supabase
-- À exécuter directement dans l'éditeur SQL de Supabase

-- 1. D'abord, créer la table si elle n'existe pas (à adapter selon votre schéma)
-- CREATE TABLE IF NOT EXISTS badge_definitions (
--     id VARCHAR PRIMARY KEY,
--     name VARCHAR NOT NULL,
--     description TEXT,
--     icon VARCHAR,
--     category VARCHAR,
--     rarity VARCHAR,
--     requirement_type VARCHAR,
--     requirement_value VARCHAR,
--     created_at TIMESTAMP DEFAULT NOW()
-- );

-- 2. Insérer tous les badges manquants (utilise ON CONFLICT DO NOTHING pour éviter les doublons)
INSERT INTO badge_definitions (id, name, description, icon, category, rarity, requirement_type, requirement_value, created_at)
VALUES 
-- Badges de début
('first-fail', 'Premier Courage', 'Poster votre premier fail', 'heart-outline', 'COURAGE', 'common', 'fail_count', '1', NOW()),
('first-reaction', 'Première Réaction', 'Donner votre première réaction à un fail', 'happy-outline', 'ENTRAIDE', 'common', 'reaction_given', '1', NOW()),

-- Badges de volume - Fails
('fails-5', 'Apprenti Courage', 'Poster 5 fails', 'ribbon-outline', 'COURAGE', 'common', 'fail_count', '5', NOW()),
('fails-10', 'Courageux', 'Poster 10 fails', 'trophy-outline', 'COURAGE', 'rare', 'fail_count', '10', NOW()),
('fails-25', 'Maître du Courage', 'Poster 25 fails', 'star-outline', 'COURAGE', 'epic', 'fail_count', '25', NOW()),
('fails-50', 'Vétéran du Courage', 'Poster 50 fails', 'shield-outline', 'COURAGE', 'epic', 'fail_count', '50', NOW()),
('fails-100', 'Légende du Courage', 'Poster 100 fails', 'diamond-outline', 'COURAGE', 'legendary', 'fail_count', '100', NOW()),

-- Badges de réactions - Y COMPRIS LE reactions-25 MANQUANT !
('reactions-10', 'Supporteur', 'Donner 10 réactions', 'people-outline', 'ENTRAIDE', 'common', 'reaction_given', '10', NOW()),
('reactions-25', 'Supporteur Actif', 'Donner 25 réactions', 'heart-half-outline', 'ENTRAIDE', 'common', 'reaction_given', '25', NOW()),
('reactions-50', 'Grand Supporteur', 'Donner 50 réactions', 'heart', 'ENTRAIDE', 'rare', 'reaction_given', '50', NOW()),
('reactions-100', 'Super Supporteur', 'Donner 100 réactions', 'heart-circle-outline', 'ENTRAIDE', 'epic', 'reaction_given', '100', NOW()),
('reactions-250', 'Maître du Support', 'Donner 250 réactions', 'heart-half-outline', 'ENTRAIDE', 'legendary', 'reaction_given', '250', NOW()),

-- Badges de diversité
('all-categories', 'Touche-à-tout', 'Poster un fail dans chaque catégorie', 'apps-outline', 'SPECIAL', 'epic', 'categories_used', '5', NOW()),
('master-explorer', 'Maître Explorateur', 'Utiliser 10 catégories différentes', 'compass-outline', 'SPECIAL', 'legendary', 'categories_used', '10', NOW()),
('category-master', 'Maître des Catégories', 'Poster 5 fails dans chaque catégorie', 'library-outline', 'SPECIAL', 'legendary', 'category_mastery', '5', NOW()),

-- Badges de temps et persévérance
('week-streak', 'Semaine de Courage', 'Poster au moins un fail par jour pendant 7 jours', 'calendar-outline', 'PERSEVERANCE', 'rare', 'streak_days', '7', NOW()),
('month-streak', 'Mois de Courage', 'Poster au moins un fail par jour pendant 30 jours', 'calendar', 'PERSEVERANCE', 'legendary', 'streak_days', '30', NOW()),
('year-warrior', 'Guerrier de l''Année', 'Actif toute une année', 'shield', 'PERSEVERANCE', 'legendary', 'active_days', '365', NOW()),

-- Badges de popularité
('popular-fail', 'Populaire', 'Recevoir 10 réactions sur un seul fail', 'flame-outline', 'SPECIAL', 'rare', 'max_reactions_on_fail', '10', NOW()),
('viral-fail', 'Viral', 'Votre fail a reçu plus de 50 réactions', 'flame-outline', 'SPECIAL', 'rare', 'max_reactions_on_fail', '50', NOW()),
('legendary-fail', 'Fail Légendaire', 'Un fail avec plus de 100 réactions', 'trophy', 'SPECIAL', 'legendary', 'max_reactions_on_fail', '100', NOW()),

-- Badges sociaux et d'aide
('helpful', 'Secouriste', 'Donner 100 réactions d''aide', 'medical-outline', 'ENTRAIDE', 'epic', 'support_reactions', '100', NOW()),
('helper', 'Assistant', 'Aider régulièrement les autres', 'hand-left-outline', 'ENTRAIDE', 'rare', 'support_reactions', '50', NOW()),
('mentor', 'Mentor', 'Aider 25 personnes différentes avec vos réactions', 'school-outline', 'ENTRAIDE', 'epic', 'unique_users_helped', '25', NOW()),
('empathy-master', 'Maître de l''Empathie', 'Expert en réactions d''empathie', 'heart-circle', 'ENTRAIDE', 'epic', 'empathy_reactions', '100', NOW()),

-- Badges spéciaux et amusants
('trendsetter', 'Pionnier', 'Premier à poster dans une nouvelle catégorie', 'rocket-outline', 'SPECIAL', 'legendary', 'category_pioneer', '1', NOW()),
('comedian', 'Comédien', 'Faire rire avec vos fails', 'happy', 'SPECIAL', 'rare', 'laugh_reactions', '50', NOW()),
('jester', 'Bouffon', 'Maître du rire', 'happy', 'SPECIAL', 'epic', 'laugh_reactions', '100', NOW()),
('night-owl', 'Oiseau de Nuit', 'Actif la nuit', 'moon-outline', 'SPECIAL', 'rare', 'night_posts', '20', NOW()),
('early-bird', 'Lève-tôt', 'Actif tôt le matin', 'sunny-outline', 'SPECIAL', 'rare', 'morning_posts', '20', NOW()),
('weekend-warrior', 'Guerrier du Weekend', 'Très actif le weekend', 'calendar', 'PERSEVERANCE', 'rare', 'weekend_posts', '30', NOW()),

-- Badges de résilience
('comeback-king', 'Phoenix', 'Revenir après une longue absence', 'refresh-outline', 'PERSEVERANCE', 'epic', 'comeback_days', '30', NOW()),

-- Badges de qualité
('quality-poster', 'Conteur de Qualité', 'Vos fails reçoivent en moyenne plus de 10 réactions', 'star', 'SPECIAL', 'rare', 'average_reactions_per_fail', '10', NOW())

ON CONFLICT (id) DO NOTHING;

-- 3. Vérifier que les badges ont été ajoutés
SELECT COUNT(*) as total_badges FROM badge_definitions;

-- 4. Vérifier spécifiquement le badge reactions-25
SELECT * FROM badge_definitions WHERE id = 'reactions-25';

-- 5. Afficher tous les badges ajoutés
SELECT id, name, category, requirement_type, requirement_value 
FROM badge_definitions 
ORDER BY category, requirement_type, CAST(requirement_value AS INTEGER);
