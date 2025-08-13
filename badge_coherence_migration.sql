-- =====================================================
-- MIGRATION BADGES FAILDAILY - COHERENCE ET EXPANSION
-- Suppression badges incohérents + Ajout badges réalistes
-- Objectif : Atteindre 100+ badges cohérents
-- =====================================================

-- ❌ ÉTAPE 1 : SUPPRESSION DES BADGES INCOHÉRENTS
-- Ces badges utilisent des requirement_type NON implémentés

-- Suppression badges avec requirement_type non implémentés
DELETE FROM badge_definitions WHERE requirement_type NOT IN (
    'fail_count', 'reaction_given', 'like_given', 'comment_count',
    'courage_reactions', 'support_reactions', 'empathy_reactions', 'laugh_reactions',
    'streak_days', 'login_days', 'active_days', 'categories_used',
    'help_count', 'helpful_comments', 'unique_interactions', 'positive_reactions',
    'total_laugh_reactions', 'funny_fails', 'resilience_fails', 
    'bounce_back_count', 'major_comebacks', 'max_reactions_on_fail'
);

-- ✅ ÉTAPE 2 : NOUVEAUX BADGES COHÉRENTS BASÉS SUR LES FONCTIONNALITÉS RÉELLES

-- 🏆 BADGES DE VOLUME (fail_count) - Progression naturelle
INSERT INTO badge_definitions (id, name, description, icon, category, rarity, requirement_type, requirement_value, created_at) VALUES
('fails-15', 'Persévérant', 'Poster 15 fails', 'medal-outline', 'COURAGE', 'common', 'fail_count', 15, NOW()),
('fails-30', 'Déterminé', 'Poster 30 fails', 'star-outline', 'COURAGE', 'rare', 'fail_count', 30, NOW()),
('fails-75', 'Champion', 'Poster 75 fails', 'trophy-outline', 'COURAGE', 'epic', 'fail_count', 75, NOW()),
('fails-150', 'Maître Absolu', 'Poster 150 fails', 'crown-outline', 'COURAGE', 'epic', 'fail_count', 150, NOW()),
('fails-250', 'Légende Vivante', 'Poster 250 fails', 'diamond-outline', 'COURAGE', 'legendary', 'fail_count', 250, NOW()),
('fails-365', 'Chroniqueur Annuel', 'Poster 365 fails', 'calendar-number-outline', 'COURAGE', 'legendary', 'fail_count', 365, NOW()),
('fails-500', 'Immortel', 'Poster 500 fails', 'infinite-outline', 'COURAGE', 'legendary', 'fail_count', 500, NOW()),
('fails-1000', 'Transcendance', 'Poster 1000 fails', 'planet-outline', 'COURAGE', 'legendary', 'fail_count', 1000, NOW()),

-- ❤️ BADGES DE SOUTIEN (reaction_given) - Entraide communautaire
('reactions-15', 'Bienveillant', 'Donner 15 réactions', 'heart-outline', 'ENTRAIDE', 'common', 'reaction_given', 15, NOW()),
('reactions-30', 'Ami Fidèle', 'Donner 30 réactions', 'people-outline', 'ENTRAIDE', 'common', 'reaction_given', 30, NOW()),
('reactions-75', 'Ange Gardien', 'Donner 75 réactions', 'heart-circle-outline', 'ENTRAIDE', 'rare', 'reaction_given', 75, NOW()),
('reactions-150', 'Saint Patron', 'Donner 150 réactions', 'sparkles-outline', 'ENTRAIDE', 'epic', 'reaction_given', 150, NOW()),
('reactions-300', 'Bienfaiteur', 'Donner 300 réactions', 'star-outline', 'ENTRAIDE', 'epic', 'reaction_given', 300, NOW()),
('reactions-500', 'Divinité de l''Entraide', 'Donner 500 réactions', 'ribbon-outline', 'ENTRAIDE', 'legendary', 'reaction_given', 500, NOW()),
('reactions-1000', 'Messie du Soutien', 'Donner 1000 réactions', 'infinite-outline', 'ENTRAIDE', 'legendary', 'reaction_given', 1000, NOW()),
('reactions-2500', 'Force Cosmique', 'Donner 2500 réactions', 'planet-outline', 'ENTRAIDE', 'legendary', 'reaction_given', 2500, NOW()),

-- 🌟 BADGES DE POPULARITÉ (max_reactions_on_fail) - Réactions reçues
('viral-5', 'Apprécié', 'Recevoir 5 réactions sur un fail', 'thumbs-up-outline', 'SPECIAL', 'common', 'max_reactions_on_fail', 5, NOW()),
('viral-10', 'Populaire', 'Recevoir 10 réactions sur un fail', 'flame-outline', 'SPECIAL', 'common', 'max_reactions_on_fail', 10, NOW()),
('viral-20', 'Vedette', 'Recevoir 20 réactions sur un fail', 'star-outline', 'SPECIAL', 'rare', 'max_reactions_on_fail', 20, NOW()),
('viral-35', 'Célébrité', 'Recevoir 35 réactions sur un fail', 'sparkles-outline', 'SPECIAL', 'epic', 'max_reactions_on_fail', 35, NOW()),
('viral-50', 'Phénomène', 'Recevoir 50 réactions sur un fail', 'trophy-outline', 'SPECIAL', 'epic', 'max_reactions_on_fail', 50, NOW()),
('viral-100', 'Légende Virale', 'Recevoir 100 réactions sur un fail', 'diamond-outline', 'SPECIAL', 'legendary', 'max_reactions_on_fail', 100, NOW()),

-- 🌍 BADGES DE DIVERSITÉ (categories_used) - Basé sur les 17 catégories
('explorer-3', 'Curieux', 'Utiliser 3 catégories différentes', 'compass-outline', 'SPECIAL', 'common', 'categories_used', 3, NOW()),
('explorer-5', 'Explorateur', 'Utiliser 5 catégories différentes', 'map-outline', 'SPECIAL', 'common', 'categories_used', 5, NOW()),
('explorer-7', 'Aventurier', 'Utiliser 7 catégories différentes', 'trail-sign-outline', 'SPECIAL', 'rare', 'categories_used', 7, NOW()),
('explorer-10', 'Globe-trotter', 'Utiliser 10 catégories différentes', 'earth-outline', 'SPECIAL', 'rare', 'categories_used', 10, NOW()),
('explorer-12', 'Conquérant', 'Utiliser 12 catégories différentes', 'telescope-outline', 'SPECIAL', 'epic', 'categories_used', 12, NOW()),
('explorer-15', 'Maître Universel', 'Utiliser 15 catégories différentes', 'rocket-outline', 'SPECIAL', 'epic', 'categories_used', 15, NOW()),
('explorer-17', 'Omniscient', 'Utiliser toutes les 17 catégories', 'library-outline', 'SPECIAL', 'legendary', 'categories_used', 17, NOW()),

-- 💪 BADGES COURAGE SPÉCIALISÉS (courage_reactions)
('courage-giver-5', 'Motivateur', 'Donner 5 réactions courage', 'fitness-outline', 'COURAGE', 'common', 'courage_reactions', 5, NOW()),
('courage-giver-15', 'Coach', 'Donner 15 réactions courage', 'medal-outline', 'COURAGE', 'common', 'courage_reactions', 15, NOW()),
('courage-giver-30', 'Mentor', 'Donner 30 réactions courage', 'trophy-outline', 'COURAGE', 'rare', 'courage_reactions', 30, NOW()),
('courage-giver-50', 'Maître du Courage', 'Donner 50 réactions courage', 'shield-outline', 'COURAGE', 'epic', 'courage_reactions', 50, NOW()),
('courage-giver-100', 'Légende du Courage', 'Donner 100 réactions courage', 'diamond-outline', 'COURAGE', 'legendary', 'courage_reactions', 100, NOW()),

-- 🤗 BADGES SOUTIEN SPÉCIALISÉS (support_reactions)
('support-giver-5', 'Attentionné', 'Donner 5 réactions soutien', 'heart-half-outline', 'ENTRAIDE', 'common', 'support_reactions', 5, NOW()),
('support-giver-15', 'Protecteur', 'Donner 15 réactions soutien', 'shield-checkmark-outline', 'ENTRAIDE', 'common', 'support_reactions', 15, NOW()),
('support-giver-30', 'Gardien', 'Donner 30 réactions soutien', 'umbrella-outline', 'ENTRAIDE', 'rare', 'support_reactions', 30, NOW()),
('support-giver-50', 'Ange du Soutien', 'Donner 50 réactions soutien', 'heart-circle-outline', 'ENTRAIDE', 'epic', 'support_reactions', 50, NOW()),
('support-giver-100', 'Sauveur Suprême', 'Donner 100 réactions soutien', 'planet-outline', 'ENTRAIDE', 'legendary', 'support_reactions', 100, NOW()),

-- 🤝 BADGES EMPATHIE SPÉCIALISÉS (empathy_reactions)
('empathy-giver-5', 'Sensible', 'Donner 5 réactions empathie', 'hand-left-outline', 'ENTRAIDE', 'common', 'empathy_reactions', 5, NOW()),
('empathy-giver-15', 'Compassionné', 'Donner 15 réactions empathie', 'people-circle-outline', 'ENTRAIDE', 'common', 'empathy_reactions', 15, NOW()),
('empathy-giver-30', 'Empathique', 'Donner 30 réactions empathie', 'heart-dislike-outline', 'ENTRAIDE', 'rare', 'empathy_reactions', 30, NOW()),
('empathy-giver-50', 'Maître de l''Empathie', 'Donner 50 réactions empathie', 'infinite-outline', 'ENTRAIDE', 'epic', 'empathy_reactions', 50, NOW()),
('empathy-giver-100', 'Bouddha de l''Empathie', 'Donner 100 réactions empathie', 'flower-outline', 'ENTRAIDE', 'legendary', 'empathy_reactions', 100, NOW()),

-- 😂 BADGES HUMOUR SPÉCIALISÉS (laugh_reactions)
('humor-giver-5', 'Rigolo', 'Donner 5 réactions rire', 'happy-outline', 'HUMOUR', 'common', 'laugh_reactions', 5, NOW()),
('humor-giver-15', 'Comique', 'Donner 15 réactions rire', 'cafe-outline', 'HUMOUR', 'common', 'laugh_reactions', 15, NOW()),
('humor-giver-30', 'Humoriste', 'Donner 30 réactions rire', 'wine-outline', 'HUMOUR', 'rare', 'laugh_reactions', 30, NOW()),
('humor-giver-50', 'Roi de la Rigolade', 'Donner 50 réactions rire', 'star-outline', 'HUMOUR', 'epic', 'laugh_reactions', 50, NOW()),
('humor-giver-100', 'Légende du Rire', 'Donner 100 réactions rire', 'sparkles-outline', 'HUMOUR', 'legendary', 'laugh_reactions', 100, NOW()),

-- 🔥 BADGES DE RÉGULARITÉ (active_days) - Connexions actives
('regular-3', 'Visiteur', 'Être actif 3 jours', 'walk-outline', 'PERSEVERANCE', 'common', 'active_days', 3, NOW()),
('regular-7', 'Habitué', 'Être actif 7 jours', 'bicycle-outline', 'PERSEVERANCE', 'common', 'active_days', 7, NOW()),
('regular-14', 'Régulier', 'Être actif 14 jours', 'car-sport-outline', 'PERSEVERANCE', 'rare', 'active_days', 14, NOW()),
('regular-30', 'Fidèle', 'Être actif 30 jours', 'airplane-outline', 'PERSEVERANCE', 'rare', 'active_days', 30, NOW()),
('regular-60', 'Dévoué', 'Être actif 60 jours', 'rocket-outline', 'PERSEVERANCE', 'epic', 'active_days', 60, NOW()),
('regular-100', 'Pilier de la Communauté', 'Être actif 100 jours', 'trophy-outline', 'PERSEVERANCE', 'epic', 'active_days', 100, NOW()),
('regular-365', 'Légende Éternelle', 'Être actif 365 jours', 'infinite-outline', 'PERSEVERANCE', 'legendary', 'active_days', 365, NOW()),

-- 🎯 BADGES SPÉCIAUX COMBO 
('balanced-10', 'Équilibré', 'Avoir au moins 10 fails ET 10 réactions', 'scales-outline', 'SPECIAL', 'rare', 'fail_count', 10, NOW()),
('balanced-25', 'Harmonie', 'Avoir au moins 25 fails ET 25 réactions', 'musical-notes-outline', 'SPECIAL', 'epic', 'fail_count', 25, NOW()),
('balanced-50', 'Zen Master', 'Avoir au moins 50 fails ET 50 réactions', 'flower-outline', 'SPECIAL', 'legendary', 'fail_count', 50, NOW()),

-- 🚀 BADGES DE MILESTONE  
('century-club', 'Club des Cent', 'Atteindre 100 fails', 'ribbon-outline', 'SPECIAL', 'epic', 'fail_count', 100, NOW()),
('supporter-king', 'Roi du Support', 'Donner plus de 200 réactions', 'crown-outline', 'ENTRAIDE', 'epic', 'reaction_given', 200, NOW()),
('diversity-king', 'Roi de la Diversité', 'Utiliser 8+ catégories avec 5+ fails chacune', 'library-outline', 'SPECIAL', 'legendary', 'categories_used', 8, NOW()),

-- 🎈 BADGES DRÔLES ET CRÉATIFS
('unlucky-1', 'Malchanceux Débutant', 'Poster son premier fail', 'sad-outline', 'HUMOUR', 'common', 'fail_count', 1, NOW()),
('unlucky-13', 'Vendredi 13', 'Poster exactement 13 fails', 'calendar-outline', 'HUMOUR', 'rare', 'fail_count', 13, NOW()),
('social-butterfly', 'Papillon Social', 'Donner des réactions dans toutes les catégories', 'butterfly-outline', 'SOCIAL', 'epic', 'categories_used', 10, NOW()),
('night-owl', 'Oiseau de Nuit', 'Poster 20 fails (badge humoristique)', 'moon-outline', 'HUMOUR', 'rare', 'fail_count', 20, NOW()),
('coffee-addict', 'Accro au Café', 'Poster 33 fails (comme le nombre de cafés)', 'cafe-outline', 'HUMOUR', 'rare', 'fail_count', 33, NOW()),
('perfectionist', 'Perfectionniste', 'Recevoir exactement 10 réactions sur un fail', 'checkmark-circle-outline', 'HUMOUR', 'rare', 'max_reactions_on_fail', 10, NOW());

-- =====================================================
-- ÉTAPE 3 : VÉRIFICATION FINALE
-- =====================================================
SELECT 'Total badges après migration:' as message, COUNT(*) as count FROM badge_definitions;
SELECT category, COUNT(*) as count FROM badge_definitions GROUP BY category ORDER BY count DESC;
SELECT requirement_type, COUNT(*) as count FROM badge_definitions GROUP BY requirement_type ORDER BY count DESC;
