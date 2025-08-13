-- =====================================================
-- ANALYSE DE COHERENCE DES BADGES FAILDAILY
-- Suppression des badges incohérents + Ajout de nouveaux badges cohérents
-- Pour atteindre 100 badges minimum
-- =====================================================

-- ❌ BADGES À SUPPRIMER (fonctionnalités non implémentées)
-- Ces requirement_type ne sont PAS implémentés dans le système :

-- Badges temporels avancés (non implémentés)
DELETE FROM badge_definitions WHERE id IN (
    'daily-streak-3', 'daily-streak-7', 'daily-streak-14', 'daily-streak-30', 
    'daily-streak-60', 'daily-streak-100', 'daily-streak-365',
    'comeback-king', 'never-give-up', 'iron-will'
);

-- Badges de commentaires (système de commentaires non implémenté)
DELETE FROM badge_definitions WHERE id IN (
    'mentor', 'wise-counselor', 'discussion-starter'
);

-- Badges spécialisés par type de réaction (tracking détaillé non implémenté)
DELETE FROM badge_definitions WHERE id IN (
    'courage-hearts-10', 'courage-hearts-50', 'courage-hearts-100', 'courage-hearts-500',
    'funny-fail', 'comedian', 'humor-king', 'viral-laugh', 'class-clown', 'stand-up-master',
    'laughter-legend', 'mood-lifter', 'supportive-soul', 'empathy-expert'
);

-- Badges de métadonnées non trackées
DELETE FROM badge_definitions WHERE id IN (
    'community-helper', 'guardian-angel', 'community-pillar', 'good-vibes', 'life-coach',
    'bounce-back', 'resilience-rookie', 'resilience-champion', 'phoenix', 'unbreakable',
    'survivor', 'inspiration', 'socializer', 'trend-setter', 'active-member'
);

-- Badges événementiels/temporels spéciaux (non implémentés)
DELETE FROM badge_definitions WHERE id IN (
    'early-adopter', 'beta-tester', 'birthday-badge', 'new-year-resolution',
    'midnight-warrior', 'weekend-warrior', 'holiday-spirit', 'globetrotter', 'power-user'
);

-- ✅ NOUVEAUX BADGES COHÉRENTS (basés sur les fonctionnalités réelles)

-- Badges de volume (fails postés) - progression naturelle
INSERT INTO badge_definitions (id, name, description, icon, category, rarity, requirement_type, requirement_value, created_at) VALUES
-- Progression fails : 1, 5, 10, 25, 50, 75, 100, 150, 200, 365, 500, 1000
('fails-75', 'Persévérant', 'Poster 75 fails', 'medal-outline', 'COURAGE', 'epic', 'fail_count', 75, NOW()),
('fails-150', 'Champion du Courage', 'Poster 150 fails', 'trophy-outline', 'COURAGE', 'epic', 'fail_count', 150, NOW()),
('fails-200', 'Maître Absolu', 'Poster 200 fails', 'crown-outline', 'COURAGE', 'legendary', 'fail_count', 200, NOW()),
('fails-365', 'Chroniqueur Annuel', 'Poster 365 fails (un par jour)', 'calendar-number-outline', 'COURAGE', 'legendary', 'fail_count', 365, NOW()),
('fails-500', 'Légende Vivante', 'Poster 500 fails', 'infinite-outline', 'COURAGE', 'legendary', 'fail_count', 500, NOW()),
('fails-1000', 'Immortel du Courage', 'Poster 1000 fails', 'diamond-outline', 'COURAGE', 'legendary', 'fail_count', 1000, NOW()),

-- Badges de réactions données - progression naturelle
-- Progression réactions : 1, 10, 25, 50, 100, 250, 500, 750, 1000, 1500, 2000, 5000
('reactions-500', 'Maître du Soutien', 'Donner 500 réactions', 'heart-circle-outline', 'ENTRAIDE', 'legendary', 'reaction_given', 500, NOW()),
('reactions-750', 'Ange du Soutien', 'Donner 750 réactions', 'heart-circle', 'ENTRAIDE', 'legendary', 'reaction_given', 750, NOW()),
('reactions-1000', 'Saint Patron', 'Donner 1000 réactions', 'sparkles-outline', 'ENTRAIDE', 'legendary', 'reaction_given', 1000, NOW()),
('reactions-1500', 'Bienfaiteur Suprême', 'Donner 1500 réactions', 'star-outline', 'ENTRAIDE', 'legendary', 'reaction_given', 1500, NOW()),
('reactions-2000', 'Divinité de l''Entraide', 'Donner 2000 réactions', 'planet-outline', 'ENTRAIDE', 'legendary', 'reaction_given', 2000, NOW()),
('reactions-5000', 'Transcendance', 'Donner 5000 réactions', 'infinite-outline', 'ENTRAIDE', 'legendary', 'reaction_given', 5000, NOW()),

-- Badges de popularité (réactions reçues sur un fail) - progression réaliste
('popular-5', 'Apprécié', 'Recevoir 5 réactions sur un fail', 'thumbs-up-outline', 'SPECIAL', 'common', 'max_reactions_on_fail', 5, NOW()),
('popular-15', 'Bien-aimé', 'Recevoir 15 réactions sur un fail', 'heart-outline', 'SPECIAL', 'common', 'max_reactions_on_fail', 15, NOW()),
('popular-25', 'Populaire', 'Recevoir 25 réactions sur un fail', 'flame-outline', 'SPECIAL', 'rare', 'max_reactions_on_fail', 25, NOW()),
('popular-50', 'Vedette', 'Recevoir 50 réactions sur un fail', 'star-outline', 'SPECIAL', 'epic', 'max_reactions_on_fail', 50, NOW()),
('popular-75', 'Célébrité', 'Recevoir 75 réactions sur un fail', 'sparkles-outline', 'SPECIAL', 'epic', 'max_reactions_on_fail', 75, NOW()),
('popular-100', 'Phénomène', 'Recevoir 100 réactions sur un fail', 'trophy-outline', 'SPECIAL', 'legendary', 'max_reactions_on_fail', 100, NOW()),

-- Badges de diversité (catégories) - basé sur les 17 catégories réelles
('categories-3', 'Curieux', 'Utiliser 3 catégories différentes', 'compass-outline', 'SPECIAL', 'common', 'categories_used', 3, NOW()),
('categories-5', 'Explorateur', 'Utiliser 5 catégories différentes', 'map-outline', 'SPECIAL', 'common', 'categories_used', 5, NOW()),
('categories-7', 'Aventurier', 'Utiliser 7 catégories différentes', 'trail-sign-outline', 'SPECIAL', 'rare', 'categories_used', 7, NOW()),
('categories-10', 'Globe-trotter', 'Utiliser 10 catégories différentes', 'earth-outline', 'SPECIAL', 'rare', 'categories_used', 10, NOW()),
('categories-12', 'Maître Explorateur', 'Utiliser 12 catégories différentes', 'telescope-outline', 'SPECIAL', 'epic', 'categories_used', 12, NOW()),
('categories-15', 'Conquérant Universel', 'Utiliser 15 catégories différentes', 'rocket-outline', 'SPECIAL', 'epic', 'categories_used', 15, NOW()),
('categories-17', 'Maître Absolu', 'Utiliser toutes les 17 catégories', 'library-outline', 'SPECIAL', 'legendary', 'categories_used', 17, NOW()),

-- Badges par catégorie spécifique (encourager la spécialisation)
-- Travail
('travail-specialist-5', 'Pro du Boulot', 'Poster 5 fails dans la catégorie Travail', 'briefcase-outline', 'TRAVAIL', 'common', 'category_fails_travail', 5, NOW()),
('travail-specialist-10', 'Expert Professionnel', 'Poster 10 fails dans la catégorie Travail', 'business-outline', 'TRAVAIL', 'rare', 'category_fails_travail', 10, NOW()),
('travail-specialist-25', 'Maître du Travail', 'Poster 25 fails dans la catégorie Travail', 'medal-outline', 'TRAVAIL', 'epic', 'category_fails_travail', 25, NOW()),

-- Sport
('sport-specialist-5', 'Athlète du Fail', 'Poster 5 fails dans la catégorie Sport', 'football-outline', 'SPORT', 'common', 'category_fails_sport', 5, NOW()),
('sport-specialist-10', 'Champion Sportif', 'Poster 10 fails dans la catégorie Sport', 'trophy-outline', 'SPORT', 'rare', 'category_fails_sport', 10, NOW()),
('sport-specialist-25', 'Légende du Sport', 'Poster 25 fails dans la catégorie Sport', 'ribbon-outline', 'SPORT', 'epic', 'category_fails_sport', 25, NOW()),

-- Cuisine
('cuisine-specialist-5', 'Apprenti Chef', 'Poster 5 fails dans la catégorie Cuisine', 'restaurant-outline', 'CUISINE', 'common', 'category_fails_cuisine', 5, NOW()),
('cuisine-specialist-10', 'Chef Cuisinier', 'Poster 10 fails dans la catégorie Cuisine', 'pizza-outline', 'CUISINE', 'rare', 'category_fails_cuisine', 10, NOW()),
('cuisine-specialist-25', 'Maître Cuisinier', 'Poster 25 fails dans la catégorie Cuisine', 'wine-outline', 'CUISINE', 'epic', 'category_fails_cuisine', 25, NOW()),

-- Technologie
('tech-specialist-5', 'Geek Débutant', 'Poster 5 fails dans la catégorie Technologie', 'phone-portrait-outline', 'TECHNOLOGIE', 'common', 'category_fails_technologie', 5, NOW()),
('tech-specialist-10', 'Expert Tech', 'Poster 10 fails dans la catégorie Technologie', 'laptop-outline', 'TECHNOLOGIE', 'rare', 'category_fails_technologie', 10, NOW()),
('tech-specialist-25', 'Guru Technologique', 'Poster 25 fails dans la catégorie Technologie', 'hardware-chip-outline', 'TECHNOLOGIE', 'epic', 'category_fails_technologie', 25, NOW()),

-- Relations
('relations-specialist-5', 'Cœur Sensible', 'Poster 5 fails dans la catégorie Relations', 'heart-half-outline', 'RELATIONS', 'common', 'category_fails_relations', 5, NOW()),
('relations-specialist-10', 'Expert en Relations', 'Poster 10 fails dans la catégorie Relations', 'people-outline', 'RELATIONS', 'rare', 'category_fails_relations', 10, NOW()),
('relations-specialist-25', 'Maître des Cœurs', 'Poster 25 fails dans la catégorie Relations', 'heart-circle-outline', 'RELATIONS', 'epic', 'category_fails_relations', 25, NOW()),

-- Voyage
('voyage-specialist-5', 'Voyageur Novice', 'Poster 5 fails dans la catégorie Voyage', 'airplane-outline', 'VOYAGE', 'common', 'category_fails_voyage', 5, NOW()),
('voyage-specialist-10', 'Globe-trotter', 'Poster 10 fails dans la catégorie Voyage', 'earth-outline', 'VOYAGE', 'rare', 'category_fails_voyage', 10, NOW()),
('voyage-specialist-25', 'Marco Polo', 'Poster 25 fails dans la catégorie Voyage', 'map-outline', 'VOYAGE', 'epic', 'category_fails_voyage', 25, NOW()),

-- Badges combo (encourager l'équilibre)
('balanced-poster', 'Équilibré', 'Avoir au moins 5 fails dans 5 catégories différentes', 'scales-outline', 'SPECIAL', 'rare', 'balanced_categories', 5, NOW()),
('renaissance-person', 'Renaissance', 'Avoir au moins 10 fails dans 7 catégories différentes', 'school-outline', 'SPECIAL', 'epic', 'balanced_categories', 10, NOW()),
('universal-master', 'Maître Universel', 'Avoir au moins 15 fails dans 10 catégories différentes', 'library-outline', 'SPECIAL', 'legendary', 'balanced_categories', 15, NOW()),

-- Badges de milestone spéciaux
('century-club', 'Club des Cent', 'Avoir 100 fails ET 100 réactions données', 'ribbon-outline', 'SPECIAL', 'epic', 'milestone_100_100', 1, NOW()),
('golden-ratio', 'Ratio d''Or', 'Avoir autant de fails postés que de réactions données (min 50)', 'infinite-outline', 'SPECIAL', 'rare', 'golden_ratio', 50, NOW()),
('supporter-king', 'Roi du Support', 'Donner plus de réactions que poster de fails (ratio 2:1, min 100 réactions)', 'crown-outline', 'ENTRAIDE', 'epic', 'support_ratio', 2, NOW()),

-- Badges de réaction équilibrée (encourager tous types de réactions)
('reaction-balance', 'Équilibriste', 'Donner au moins 10 réactions de chaque type', 'library-outline', 'ENTRAIDE', 'rare', 'reaction_balance', 10, NOW()),
('reaction-harmony', 'Harmonie', 'Donner au moins 25 réactions de chaque type', 'musical-notes-outline', 'ENTRAIDE', 'epic', 'reaction_balance', 25, NOW()),
('reaction-master', 'Maître des Réactions', 'Donner au moins 50 réactions de chaque type', 'diamond-outline', 'ENTRAIDE', 'legendary', 'reaction_balance', 50, NOW()),

-- Badges de progression rapide
('fast-starter', 'Démarrage Rapide', 'Poster 10 fails en moins de 7 jours', 'flash-outline', 'PERSEVERANCE', 'rare', 'fast_start', 10, NOW()),
('speed-demon', 'Demon de Vitesse', 'Poster 25 fails en moins de 14 jours', 'rocket-outline', 'PERSEVERANCE', 'epic', 'speed_demon', 25, NOW()),
('lightning-poster', 'Éclair Posteur', 'Poster 50 fails en moins de 30 jours', 'thunderstorm-outline', 'PERSEVERANCE', 'legendary', 'lightning_poster', 50, NOW());

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================
SELECT 'Total badges après optimisation:' as message, COUNT(*) as count FROM badge_definitions;
SELECT category, COUNT(*) as count FROM badge_definitions GROUP BY category ORDER BY count DESC;
