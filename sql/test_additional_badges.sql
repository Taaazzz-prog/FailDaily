-- Script d'ajout de badges supplémentaires pour tester le nouveau système
-- Compatible avec ta table badge_definitions existante

-- Ajouter quelques badges supplémentaires pour tester
INSERT INTO public.badge_definitions (id, name, description, icon, category, rarity, requirement_type, requirement_value) VALUES

-- Badges de volume de fails (compatible avec tes données existantes)
('fail-master-75', 'Grand Narrateur', 'Partager 75 fails', 'book-outline', 'COURAGE', 'rare', 'fail_count', '75'),
('fail-master-150', 'Maître Conteur', 'Partager 150 fails', 'library-outline', 'COURAGE', 'epic', 'fail_count', '150'),
('fail-master-300', 'Légende Vivante', 'Partager 300 fails', 'star-outline', 'COURAGE', 'epic', 'fail_count', '300'),

-- Badges de réactions (nouveau système)
('total-reactions-100', 'Réacteur Actif', 'Donner 100 réactions au total', 'heart-outline', 'ENTRAIDE', 'rare', 'reaction_given', '100'),
('total-reactions-250', 'Super Réacteur', 'Donner 250 réactions au total', 'heart', 'ENTRAIDE', 'epic', 'reaction_given', '250'),
('total-reactions-500', 'Maître Réacteur', 'Donner 500 réactions au total', 'hearts-outline', 'ENTRAIDE', 'epic', 'reaction_given', '500'),

-- Badges de courage hearts
('courage-lover-20', 'Amateur de Courage', 'Recevoir 20 cœurs de courage', 'heart-half-outline', 'COURAGE', 'common', 'courage_reactions', '20'),
('courage-lover-75', 'Fan de Courage', 'Recevoir 75 cœurs de courage', 'heart', 'COURAGE', 'rare', 'courage_reactions', '75'),
('courage-lover-150', 'Inspiration Courageuse', 'Recevoir 150 cœurs de courage', 'star-half-outline', 'COURAGE', 'epic', 'courage_reactions', '150'),

-- Badges de popularité
('popular-post-25', 'Post Populaire', 'Un fail qui reçoit 25 réactions', 'trending-up-outline', 'SPECIAL', 'rare', 'max_reactions_single', '25'),
('viral-post-50', 'Sensation Locale', 'Un fail qui reçoit 50 réactions', 'flash-outline', 'SPECIAL', 'epic', 'max_reactions_single', '50'),
('mega-viral-100', 'Phénomène Viral', 'Un fail qui reçoit 100 réactions', 'planet-outline', 'SPECIAL', 'legendary', 'max_reactions_single', '100'),

-- Badges de diversité
('multi-category-3', 'Explorateur', 'Poster dans 3 catégories différentes', 'compass-outline', 'SPECIAL', 'common', 'categories_used', '3'),
('multi-category-7', 'Polyvalent', 'Poster dans 7 catégories différentes', 'map-outline', 'SPECIAL', 'rare', 'categories_used', '7'),

-- Badges collectionneurs
('badge-seeker-5', 'Chercheur de Badges', 'Débloquer 5 badges', 'search-outline', 'SPECIAL', 'common', 'badges_unlocked', '5'),
('badge-seeker-15', 'Chasseur de Badges', 'Débloquer 15 badges', 'medal-outline', 'SPECIAL', 'rare', 'badges_unlocked', '15'),
('badge-seeker-30', 'Collectionneur Expert', 'Débloquer 30 badges', 'trophy-outline', 'SPECIAL', 'epic', 'badges_unlocked', '30')

ON CONFLICT (id) DO NOTHING;

-- Vérifier le nombre total de badges
-- SELECT category, rarity, COUNT(*) as count FROM public.badge_definitions GROUP BY category, rarity ORDER BY category;
