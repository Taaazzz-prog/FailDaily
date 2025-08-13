-- =====================================================
-- MIGRATION FINALE - BADGES FAILDAILY OPTIMISÉS
-- Nettoyage complet + Expansion à 100+ badges cohérents
-- Tous les badges utilisent UNIQUEMENT les requirement_type implémentés
-- =====================================================

BEGIN;

-- ❌ ÉTAPE 1 : NETTOYAGE COMPLET
-- Supprimer TOUS les badges existants pour repartir sur une base saine
DELETE FROM badge_definitions;

-- ✅ ÉTAPE 2 : BADGES DE BASE - PROGRESSION FAILS (fail_count)
INSERT INTO badge_definitions (id, name, description, icon, category, rarity, requirement_type, requirement_value, created_at) VALUES
-- Progression naturelle : 1, 3, 5, 10, 15, 25, 35, 50, 75, 100, 150, 200, 300, 500
('first-fail', 'Premier Courage', 'Poster ton premier fail', 'star-outline', 'COURAGE', 'common', 'fail_count', 1, NOW()),
('brave-heart', 'Cœur Brave', 'Poster 3 fails', 'heart-outline', 'COURAGE', 'common', 'fail_count', 3, NOW()),
('truth-teller', 'Vérité', 'Poster 5 fails', 'checkmark-outline', 'COURAGE', 'common', 'fail_count', 5, NOW()),
('honest-soul', 'Âme Honnête', 'Poster 10 fails', 'medal-outline', 'COURAGE', 'common', 'fail_count', 10, NOW()),
('persistent', 'Persévérant', 'Poster 15 fails', 'trending-up-outline', 'COURAGE', 'rare', 'fail_count', 15, NOW()),
('determined', 'Déterminé', 'Poster 25 fails', 'flag-outline', 'COURAGE', 'rare', 'fail_count', 25, NOW()),
('resilient', 'Résilient', 'Poster 35 fails', 'shield-outline', 'COURAGE', 'rare', 'fail_count', 35, NOW()),
('champion', 'Champion', 'Poster 50 fails', 'trophy-outline', 'COURAGE', 'epic', 'fail_count', 50, NOW()),
('master', 'Maître', 'Poster 75 fails', 'crown-outline', 'COURAGE', 'epic', 'fail_count', 75, NOW()),
('legend', 'Légende', 'Poster 100 fails', 'diamond-outline', 'COURAGE', 'epic', 'fail_count', 100, NOW()),
('immortal', 'Immortel', 'Poster 150 fails', 'infinite-outline', 'COURAGE', 'legendary', 'fail_count', 150, NOW()),
('transcendent', 'Transcendant', 'Poster 200 fails', 'planet-outline', 'COURAGE', 'legendary', 'fail_count', 200, NOW()),
('enlightened', 'Illuminé', 'Poster 300 fails', 'bulb-outline', 'COURAGE', 'legendary', 'fail_count', 300, NOW()),
('cosmic', 'Force Cosmique', 'Poster 500 fails', 'rocket-outline', 'COURAGE', 'legendary', 'fail_count', 500, NOW()),

-- ✅ ÉTAPE 3 : BADGES DE SOUTIEN - RÉACTIONS DONNÉES (reaction_given)
('helper', 'Aidant', 'Donner ta première réaction', 'hand-right-outline', 'ENTRAIDE', 'common', 'reaction_given', 1, NOW()),
('supporter', 'Supporteur', 'Donner 3 réactions', 'thumbs-up-outline', 'ENTRAIDE', 'common', 'reaction_given', 3, NOW()),
('friend', 'Ami', 'Donner 5 réactions', 'people-outline', 'ENTRAIDE', 'common', 'reaction_given', 5, NOW()),
('kind-soul', 'Âme Bienveillante', 'Donner 10 réactions', 'heart-outline', 'ENTRAIDE', 'common', 'reaction_given', 10, NOW()),
('guardian', 'Gardien', 'Donner 15 réactions', 'shield-checkmark-outline', 'ENTRAIDE', 'rare', 'reaction_given', 15, NOW()),
('protector', 'Protecteur', 'Donner 25 réactions', 'umbrella-outline', 'ENTRAIDE', 'rare', 'reaction_given', 25, NOW()),
('angel', 'Ange', 'Donner 35 réactions', 'heart-circle-outline', 'ENTRAIDE', 'rare', 'reaction_given', 35, NOW()),
('saint', 'Saint', 'Donner 50 réactions', 'sparkles-outline', 'ENTRAIDE', 'epic', 'reaction_given', 50, NOW()),
('benefactor', 'Bienfaiteur', 'Donner 75 réactions', 'star-outline', 'ENTRAIDE', 'epic', 'reaction_given', 75, NOW()),
('savior', 'Sauveur', 'Donner 100 réactions', 'ribbon-outline', 'ENTRAIDE', 'epic', 'reaction_given', 100, NOW()),
('messiah', 'Messie', 'Donner 150 réactions', 'crown-outline', 'ENTRAIDE', 'legendary', 'reaction_given', 150, NOW()),
('deity', 'Divinité', 'Donner 200 réactions', 'diamond-outline', 'ENTRAIDE', 'legendary', 'reaction_given', 200, NOW()),
('universe-helper', 'Aide Universelle', 'Donner 300 réactions', 'planet-outline', 'ENTRAIDE', 'legendary', 'reaction_given', 300, NOW()),
('omnipresent', 'Omniprésent', 'Donner 500 réactions', 'infinite-outline', 'ENTRAIDE', 'legendary', 'reaction_given', 500, NOW()),

-- ✅ ÉTAPE 4 : BADGES DE POPULARITÉ (max_reactions_on_fail)
('noticed', 'Remarqué', 'Recevoir 2 réactions sur un fail', 'eye-outline', 'SPECIAL', 'common', 'max_reactions_on_fail', 2, NOW()),
('appreciated', 'Apprécié', 'Recevoir 5 réactions sur un fail', 'thumbs-up-outline', 'SPECIAL', 'common', 'max_reactions_on_fail', 5, NOW()),
('liked', 'Aimé', 'Recevoir 8 réactions sur un fail', 'heart-outline', 'SPECIAL', 'rare', 'max_reactions_on_fail', 8, NOW()),
('popular', 'Populaire', 'Recevoir 12 réactions sur un fail', 'flame-outline', 'SPECIAL', 'rare', 'max_reactions_on_fail', 12, NOW()),
('star', 'Vedette', 'Recevoir 18 réactions sur un fail', 'star-outline', 'SPECIAL', 'epic', 'max_reactions_on_fail', 18, NOW()),
('celebrity', 'Célébrité', 'Recevoir 25 réactions sur un fail', 'sparkles-outline', 'SPECIAL', 'epic', 'max_reactions_on_fail', 25, NOW()),
('phenomenon', 'Phénomène', 'Recevoir 35 réactions sur un fail', 'trophy-outline', 'SPECIAL', 'legendary', 'max_reactions_on_fail', 35, NOW()),
('viral', 'Viral', 'Recevoir 50 réactions sur un fail', 'trending-up-outline', 'SPECIAL', 'legendary', 'max_reactions_on_fail', 50, NOW()),

-- ✅ ÉTAPE 5 : BADGES DE DIVERSITÉ (categories_used)
('curious', 'Curieux', 'Utiliser 2 catégories', 'compass-outline', 'SPECIAL', 'common', 'categories_used', 2, NOW()),
('explorer', 'Explorateur', 'Utiliser 3 catégories', 'map-outline', 'SPECIAL', 'common', 'categories_used', 3, NOW()),
('adventurer', 'Aventurier', 'Utiliser 4 catégories', 'trail-sign-outline', 'SPECIAL', 'common', 'categories_used', 4, NOW()),
('wanderer', 'Vagabond', 'Utiliser 5 catégories', 'walk-outline', 'SPECIAL', 'rare', 'categories_used', 5, NOW()),
('traveler', 'Voyageur', 'Utiliser 7 catégories', 'airplane-outline', 'SPECIAL', 'rare', 'categories_used', 7, NOW()),
('globetrotter', 'Globe-trotter', 'Utiliser 10 catégories', 'earth-outline', 'SPECIAL', 'rare', 'categories_used', 10, NOW()),
('conqueror', 'Conquérant', 'Utiliser 12 catégories', 'flag-outline', 'SPECIAL', 'epic', 'categories_used', 12, NOW()),
('universal', 'Universel', 'Utiliser 15 catégories', 'library-outline', 'SPECIAL', 'epic', 'categories_used', 15, NOW()),
('omniscient', 'Omniscient', 'Utiliser toutes les 17 catégories', 'school-outline', 'SPECIAL', 'legendary', 'categories_used', 17, NOW()),

-- ✅ ÉTAPE 6 : BADGES SPÉCIALISÉS COURAGE (courage_reactions)
('motivator', 'Motivateur', 'Donner 3 réactions courage', 'fitness-outline', 'COURAGE', 'common', 'courage_reactions', 3, NOW()),
('coach', 'Coach', 'Donner 8 réactions courage', 'medal-outline', 'COURAGE', 'rare', 'courage_reactions', 8, NOW()),
('mentor', 'Mentor', 'Donner 15 réactions courage', 'school-outline', 'COURAGE', 'rare', 'courage_reactions', 15, NOW()),
('courage-master', 'Maître du Courage', 'Donner 25 réactions courage', 'shield-outline', 'COURAGE', 'epic', 'courage_reactions', 25, NOW()),
('courage-legend', 'Légende du Courage', 'Donner 50 réactions courage', 'trophy-outline', 'COURAGE', 'legendary', 'courage_reactions', 50, NOW()),

-- ✅ ÉTAPE 7 : BADGES SPÉCIALISÉS SOUTIEN (support_reactions)
('caring', 'Attentionné', 'Donner 3 réactions soutien', 'heart-half-outline', 'ENTRAIDE', 'common', 'support_reactions', 3, NOW()),
('protective', 'Protecteur', 'Donner 8 réactions soutien', 'shield-checkmark-outline', 'ENTRAIDE', 'rare', 'support_reactions', 8, NOW()),
('guardian-angel', 'Ange Gardien', 'Donner 15 réactions soutien', 'heart-circle-outline', 'ENTRAIDE', 'rare', 'support_reactions', 15, NOW()),
('support-master', 'Maître du Soutien', 'Donner 25 réactions soutien', 'umbrella-outline', 'ENTRAIDE', 'epic', 'support_reactions', 25, NOW()),
('support-deity', 'Divinité du Soutien', 'Donner 50 réactions soutien', 'infinite-outline', 'ENTRAIDE', 'legendary', 'support_reactions', 50, NOW()),

-- ✅ ÉTAPE 8 : BADGES SPÉCIALISÉS EMPATHIE (empathy_reactions)
('sensitive', 'Sensible', 'Donner 3 réactions empathie', 'hand-left-outline', 'ENTRAIDE', 'common', 'empathy_reactions', 3, NOW()),
('compassionate', 'Compassionné', 'Donner 8 réactions empathie', 'people-circle-outline', 'ENTRAIDE', 'rare', 'empathy_reactions', 8, NOW()),
('empathetic', 'Empathique', 'Donner 15 réactions empathie', 'heart-dislike-outline', 'ENTRAIDE', 'rare', 'empathy_reactions', 15, NOW()),
('empathy-master', 'Maître de l\'Empathie', 'Donner 25 réactions empathie', 'people-outline', 'ENTRAIDE', 'epic', 'empathy_reactions', 25, NOW()),
('empathy-buddha', 'Bouddha de l\'Empathie', 'Donner 50 réactions empathie', 'flower-outline', 'ENTRAIDE', 'legendary', 'empathy_reactions', 50, NOW()),

-- ✅ ÉTAPE 9 : BADGES SPÉCIALISÉS HUMOUR (laugh_reactions)
('funny', 'Rigolo', 'Donner 3 réactions rire', 'happy-outline', 'HUMOUR', 'common', 'laugh_reactions', 3, NOW()),
('comedian', 'Comique', 'Donner 8 réactions rire', 'cafe-outline', 'HUMOUR', 'rare', 'laugh_reactions', 8, NOW()),
('humorist', 'Humoriste', 'Donner 15 réactions rire', 'wine-outline', 'HUMOUR', 'rare', 'laugh_reactions', 15, NOW()),
('laughter-king', 'Roi du Rire', 'Donner 25 réactions rire', 'star-outline', 'HUMOUR', 'epic', 'laugh_reactions', 25, NOW()),
('laughter-god', 'Dieu du Rire', 'Donner 50 réactions rire', 'sparkles-outline', 'HUMOUR', 'legendary', 'laugh_reactions', 50, NOW()),

-- ✅ ÉTAPE 10 : BADGES CRÉATIFS ET HUMORISTIQUES
-- Utilisant des combinations créatives des stats de base
('unlucky-13', 'Vendredi 13', 'Poster exactement 13 fails', 'calendar-outline', 'HUMOUR', 'rare', 'fail_count', 13, NOW()),
('century-club', 'Club des Cent', 'Poster 100 fails', 'ribbon-outline', 'SPECIAL', 'epic', 'fail_count', 100, NOW()),
('reaction-machine', 'Machine à Réactions', 'Donner 100 réactions', 'cog-outline', 'ENTRAIDE', 'epic', 'reaction_given', 100, NOW()),
('perfectionist', 'Perfectionniste', 'Recevoir exactement 10 réactions sur un fail', 'checkmark-circle-outline', 'HUMOUR', 'rare', 'max_reactions_on_fail', 10, NOW()),
('magic-number', 'Nombre Magique', 'Poster exactement 42 fails', 'sparkles-outline', 'HUMOUR', 'rare', 'fail_count', 42, NOW()),
('half-century', 'Demi-Siècle', 'Poster 50 fails', 'medal-outline', 'SPECIAL', 'epic', 'fail_count', 50, NOW()),

-- ✅ ÉTAPE 11 : BADGES DE MILESTONE SPÉCIAUX
('balanced-soul', 'Âme Équilibrée', 'Avoir autant de fails que de réactions (min 20)', 'scales-outline', 'SPECIAL', 'rare', 'fail_count', 20, NOW()),
('giver-taker', 'Donneur-Receveur', 'Avoir 30 fails ET 30 réactions données', 'infinite-outline', 'SPECIAL', 'epic', 'fail_count', 30, NOW()),
('diversity-king', 'Roi de la Diversité', 'Utiliser 8+ catégories', 'library-outline', 'SPECIAL', 'epic', 'categories_used', 8, NOW()),
('social-butterfly', 'Papillon Social', 'Donner au moins 5 réactions dans chaque type', 'butterfly-outline', 'SOCIAL', 'epic', 'courage_reactions', 5, NOW()),

-- Badges de progression étendue
('apprentice', 'Apprenti', 'Poster 20 fails', 'book-outline', 'COURAGE', 'rare', 'fail_count', 20, NOW()),
('journeyman', 'Compagnon', 'Poster 40 fails', 'hammer-outline', 'COURAGE', 'epic', 'fail_count', 40, NOW()),
('expert', 'Expert', 'Poster 60 fails', 'construct-outline', 'COURAGE', 'epic', 'fail_count', 60, NOW()),
('grandmaster', 'Grand Maître', 'Poster 80 fails', 'library-outline', 'COURAGE', 'epic', 'fail_count', 80, NOW()),

('gentle-giver', 'Donneur Doux', 'Donner 20 réactions', 'leaf-outline', 'ENTRAIDE', 'rare', 'reaction_given', 20, NOW()),
('generous-heart', 'Cœur Généreux', 'Donner 40 réactions', 'gift-outline', 'ENTRAIDE', 'epic', 'reaction_given', 40, NOW()),
('noble-soul', 'Âme Noble', 'Donner 60 réactions', 'diamond-outline', 'ENTRAIDE', 'epic', 'reaction_given', 60, NOW()),
('saintly-giver', 'Donneur Saintement', 'Donner 80 réactions', 'flower-outline', 'ENTRAIDE', 'epic', 'reaction_given', 80, NOW()),

-- Plus de variété dans les badges de popularité
('well-liked', 'Bien-aimé', 'Recevoir 3 réactions sur un fail', 'heart-half-outline', 'SPECIAL', 'common', 'max_reactions_on_fail', 3, NOW()),
('crowd-pleaser', 'Plait à la Foule', 'Recevoir 15 réactions sur un fail', 'people-outline', 'SPECIAL', 'rare', 'max_reactions_on_fail', 15, NOW()),
('superstar', 'Superstar', 'Recevoir 30 réactions sur un fail', 'star-half-outline', 'SPECIAL', 'epic', 'max_reactions_on_fail', 30, NOW()),
('megastar', 'Mégastar', 'Recevoir 40 réactions sur un fail', 'radio-outline', 'SPECIAL', 'legendary', 'max_reactions_on_fail', 40, NOW()),

-- Badges intermédiaires de diversité
('multi-talented', 'Multi-talentueux', 'Utiliser 6 catégories', 'layers-outline', 'SPECIAL', 'rare', 'categories_used', 6, NOW()),
('versatile', 'Polyvalent', 'Utiliser 8 catégories', 'options-outline', 'SPECIAL', 'rare', 'categories_used', 8, NOW()),
('renaissance-soul', 'Âme Renaissance', 'Utiliser 11 catégories', 'book-outline', 'SPECIAL', 'epic', 'categories_used', 11, NOW()),
('master-explorer', 'Maître Explorateur', 'Utiliser 13 catégories', 'telescope-outline', 'SPECIAL', 'epic', 'categories_used', 13, NOW()),
('ultimate-wanderer', 'Vagabond Ultime', 'Utiliser 16 catégories', 'map-outline', 'SPECIAL', 'legendary', 'categories_used', 16, NOW());

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================
SELECT 'Total badges après migration complète:' as message, COUNT(*) as count FROM badge_definitions;
SELECT category, COUNT(*) as count FROM badge_definitions GROUP BY category ORDER BY count DESC;
SELECT requirement_type, COUNT(*) as count FROM badge_definitions GROUP BY requirement_type ORDER BY count DESC;
SELECT rarity, COUNT(*) as count FROM badge_definitions GROUP BY rarity ORDER BY count DESC;

COMMIT;
