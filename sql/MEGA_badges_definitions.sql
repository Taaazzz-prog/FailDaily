-- Création de la table badge_definitions avec TOUS les badges (100+)
-- Compatible avec la structure existante

CREATE TABLE IF NOT EXISTS public.badge_definitions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT 'trophy-outline',
    category VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    requirement_type VARCHAR(50) NOT NULL,
    requirement_value VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_badge_definitions_rarity ON public.badge_definitions(rarity);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_category ON public.badge_definitions(category);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_requirement ON public.badge_definitions(requirement_type);

-- MEGA INSERTION DE TOUS LES BADGES (100+)
INSERT INTO public.badge_definitions (id, name, description, icon, category, rarity, requirement_type, requirement_value) VALUES

-- ==================== BADGES DE BASE ====================
('first-fail', 'Premier Pas', 'Félicitations pour votre premier fail partagé !', 'footsteps-outline', 'COURAGE', 'common', 'fail_count', '1'),
('first-reaction', 'Première Réaction', 'Donner votre première réaction à un fail', 'happy-outline', 'ENTRAIDE', 'common', 'reaction_given', '1'),
('first-comment', 'Premier Commentaire', 'Écrire votre premier commentaire', 'chatbubble-outline', 'ENTRAIDE', 'common', 'comment_count', '1'),
('first-like', 'Premier Like', 'Donner votre premier like', 'thumbs-up-outline', 'ENTRAIDE', 'common', 'like_given', '1'),

-- ==================== BADGES DE COURAGE - FAILS ====================
('fail-master-5', 'Apprenti', 'Partager 5 fails', 'school-outline', 'COURAGE', 'common', 'fail_count', '5'),
('fail-master-10', 'Collectionneur', 'Partager 10 fails', 'library-outline', 'COURAGE', 'common', 'fail_count', '10'),
('fail-master-25', 'Narrateur', 'Partager 25 fails', 'book-outline', 'COURAGE', 'rare', 'fail_count', '25'),
('fail-master-50', 'Grand Collectionneur', 'Partager 50 fails', 'albums-outline', 'COURAGE', 'rare', 'fail_count', '50'),
('fail-master-100', 'Maître des Fails', 'Partager 100 fails', 'ribbon-outline', 'COURAGE', 'epic', 'fail_count', '100'),
('fail-master-200', 'Légende des Récits', 'Partager 200 fails', 'medal-outline', 'COURAGE', 'epic', 'fail_count', '200'),
('fail-master-365', 'Chroniqueur Légendaire', 'Partager 365 fails (un an !)', 'calendar-number-outline', 'COURAGE', 'legendary', 'fail_count', '365'),
('fail-master-500', 'Immortel du Récit', 'Partager 500 fails', 'infinite-outline', 'COURAGE', 'legendary', 'fail_count', '500'),
('fail-master-1000', 'Dieu des Fails', 'Partager 1000 fails', 'diamond-outline', 'COURAGE', 'legendary', 'fail_count', '1000'),

-- ==================== BADGES DE CŒURS DE COURAGE ====================
('courage-hearts-10', 'Cœur Brave', 'Recevoir 10 cœurs de courage', 'heart-outline', 'COURAGE', 'common', 'courage_reactions', '10'),
('courage-hearts-25', 'Cœur Vaillant', 'Recevoir 25 cœurs de courage', 'heart-half-outline', 'COURAGE', 'common', 'courage_reactions', '25'),
('courage-hearts-50', 'Cœur Courageux', 'Recevoir 50 cœurs de courage', 'heart', 'COURAGE', 'rare', 'courage_reactions', '50'),
('courage-hearts-100', 'Héros du Courage', 'Recevoir 100 cœurs de courage', 'medal-outline', 'COURAGE', 'rare', 'courage_reactions', '100'),
('courage-hearts-250', 'Champion du Courage', 'Recevoir 250 cœurs de courage', 'trophy-outline', 'COURAGE', 'epic', 'courage_reactions', '250'),
('courage-hearts-500', 'Légende du Courage', 'Recevoir 500 cœurs de courage', 'star-outline', 'COURAGE', 'epic', 'courage_reactions', '500'),
('courage-hearts-1000', 'Titan du Courage', 'Recevoir 1000 cœurs de courage', 'flame-outline', 'COURAGE', 'legendary', 'courage_reactions', '1000'),

-- ==================== BADGES DE PERSÉVÉRANCE - STREAKS ====================
('daily-streak-3', 'Régulier', '3 jours de partage consécutifs', 'checkmark-outline', 'PERSEVERANCE', 'common', 'streak_days', '3'),
('daily-streak-7', 'Persévérant', '7 jours de partage consécutifs', 'calendar-outline', 'PERSEVERANCE', 'common', 'streak_days', '7'),
('daily-streak-14', 'Déterminé', '14 jours de partage consécutifs', 'flame-outline', 'PERSEVERANCE', 'rare', 'streak_days', '14'),
('daily-streak-21', 'Habitué', '21 jours de partage consécutifs', 'layers-outline', 'PERSEVERANCE', 'rare', 'streak_days', '21'),
('daily-streak-30', 'Marathonien', '30 jours de partage consécutifs', 'fitness-outline', 'PERSEVERANCE', 'rare', 'streak_days', '30'),
('daily-streak-60', 'Titan de la Régularité', '60 jours de partage consécutifs', 'barbell-outline', 'PERSEVERANCE', 'epic', 'streak_days', '60'),
('daily-streak-100', 'Centurion', '100 jours de partage consécutifs', 'shield-outline', 'PERSEVERANCE', 'epic', 'streak_days', '100'),
('daily-streak-180', 'Demi-Année', '180 jours de partage consécutifs', 'hourglass-outline', 'PERSEVERANCE', 'epic', 'streak_days', '180'),
('daily-streak-365', 'Immortel', '365 jours de partage consécutifs', 'infinite-outline', 'PERSEVERANCE', 'legendary', 'streak_days', '365'),
('daily-streak-500', 'Transcendant', '500 jours de partage consécutifs', 'diamond-outline', 'PERSEVERANCE', 'legendary', 'streak_days', '500'),

-- ==================== BADGES D''ENTRAIDE ====================
('supportive-soul', 'Âme Bienveillante', 'Donner 50 réactions de soutien', 'heart-half-outline', 'ENTRAIDE', 'common', 'support_reactions', '50'),
('empathy-expert', 'Expert en Empathie', 'Donner 25 réactions d''empathie', 'sad-outline', 'ENTRAIDE', 'common', 'empathy_reactions', '25'),
('community-helper', 'Assistant Communautaire', 'Aider 10 membres de la communauté', 'people-outline', 'ENTRAIDE', 'rare', 'help_count', '10'),
('mentor', 'Mentor', 'Commenter constructivement 100 fails', 'chatbox-outline', 'ENTRAIDE', 'rare', 'helpful_comments', '100'),
('guardian-angel', 'Ange Gardien', 'Aider 25 membres de la communauté', 'medical-outline', 'ENTRAIDE', 'epic', 'help_count', '25'),
('wise-counselor', 'Conseiller Sage', 'Commenter constructivement 250 fails', 'library-outline', 'ENTRAIDE', 'epic', 'helpful_comments', '250'),
('life-coach', 'Coach de Vie', 'Aider 100 personnes avec des conseils', 'fitness-outline', 'ENTRAIDE', 'legendary', 'advice_given', '100'),
('community-pillar', 'Pilier de la Communauté', 'Être actif pendant 6 mois consécutifs', 'home-outline', 'ENTRAIDE', 'legendary', 'active_months', '6'),
('socializer', 'Sociable', 'Interagir avec 50 utilisateurs différents', 'people-circle-outline', 'ENTRAIDE', 'rare', 'unique_interactions', '50'),
('good-vibes', 'Bonnes Vibrations', 'Donner 1000 réactions positives au total', 'thumbs-up-outline', 'ENTRAIDE', 'epic', 'positive_reactions', '1000'),

-- ==================== BADGES D''HUMOUR ====================
('funny-fail', 'Comédien Amateur', 'Un fail qui a fait rire 25 personnes', 'happy-outline', 'HUMOUR', 'common', 'laugh_reactions', '25'),
('comedian', 'Comédien', 'Un fail qui a fait rire 50 personnes', 'theater-outline', 'HUMOUR', 'rare', 'laugh_reactions', '50'),
('humor-king', 'Roi du Rire', 'Un fail qui a fait rire 100 personnes', 'sparkles-outline', 'HUMOUR', 'epic', 'laugh_reactions', '100'),
('viral-laugh', 'Sensation Virale', 'Un fail qui a fait rire 500 personnes', 'trending-up-outline', 'HUMOUR', 'legendary', 'laugh_reactions', '500'),
('class-clown', 'Rigolo de Service', 'Recevoir 100 réactions de rire au total', 'musical-note-outline', 'HUMOUR', 'rare', 'total_laugh_reactions', '100'),
('stand-up-master', 'Maître du Stand-Up', 'Recevoir 500 réactions de rire au total', 'mic-outline', 'HUMOUR', 'epic', 'total_laugh_reactions', '500'),
('laughter-legend', 'Légende du Rire', 'Recevoir 1000 réactions de rire au total', 'star-outline', 'HUMOUR', 'legendary', 'total_laugh_reactions', '1000'),
('mood-lifter', 'Remonteur de Moral', '50 fails marqués comme "drôles"', 'sunny-outline', 'HUMOUR', 'epic', 'funny_fails', '50'),
('jester', 'Bouffon Royal', 'Faire rire dans 10 catégories différentes', 'extension-puzzle-outline', 'HUMOUR', 'legendary', 'humor_diversity', '10'),

-- ==================== BADGES DE RÉSILIENCE ====================
('resilience-rookie', 'Apprenti Résilient', 'Partager 5 fails de résilience', 'leaf-outline', 'RESILIENCE', 'common', 'resilience_fails', '5'),
('bounce-back', 'Rebond', 'Se relever après un fail difficile', 'arrow-up-outline', 'RESILIENCE', 'common', 'bounce_back_count', '1'),
('resilience-champion', 'Champion de Résilience', 'Partager 20 fails de résilience', 'refresh-outline', 'RESILIENCE', 'rare', 'resilience_fails', '20'),
('phoenix', 'Phénix', 'Renaître de 10 échecs majeurs', 'flame-outline', 'RESILIENCE', 'epic', 'major_comebacks', '10'),
('unbreakable', 'Incassable', 'Maintenir un état d'esprit positif 100 jours', 'diamond-outline', 'RESILIENCE', 'epic', 'positive_days', '100'),
('iron-will', 'Volonté de Fer', 'Repartager après 10 échecs consécutifs', 'hammer-outline', 'RESILIENCE', 'legendary', 'resilience_count', '10'),
('survivor', 'Survivant', 'Surmonter 50 défis personnels', 'shield-checkmark-outline', 'RESILIENCE', 'legendary', 'challenges_overcome', '50'),
('inspiration', 'Source d'Inspiration', 'Inspirer 100 autres utilisateurs', 'bulb-outline', 'RESILIENCE', 'legendary', 'inspired_users', '100'),
('comeback-king', 'Roi du Comeback', 'Reprendre après une pause de 30 jours', 'refresh-outline', 'RESILIENCE', 'rare', 'comeback_count', '1'),

-- ==================== BADGES SPÉCIAUX ====================
('midnight-warrior', 'Guerrier de Minuit', 'Partager un fail après minuit', 'moon-outline', 'SPECIAL', 'common', 'midnight_fails', '1'),
('early-bird', 'Lève-tôt', 'Partager un fail avant 6h du matin', 'sunny-outline', 'SPECIAL', 'common', 'early_morning_fails', '1'),
('weekend-warrior', 'Guerrier du Weekend', 'Partager 50 fails le weekend', 'bicycle-outline', 'SPECIAL', 'rare', 'weekend_fails', '50'),
('holiday-spirit', 'Esprit des Fêtes', 'Partager pendant les vacances', 'snow-outline', 'SPECIAL', 'rare', 'holiday_fails', '5'),
('new-year-resolution', 'Résolution du Nouvel An', 'Partager un fail le 1er janvier', 'calendar-outline', 'SPECIAL', 'rare', 'new_year_fails', '1'),
('birthday-badge', 'Anniversaire FailDaily', 'Être présent lors de l''anniversaire de l''app', 'gift-outline', 'SPECIAL', 'rare', 'anniversary_participation', '1'),
('beta-tester', 'Testeur Bêta', 'Participer à la phase de test', 'construct-outline', 'SPECIAL', 'epic', 'beta_participation', '1'),
('early-adopter', 'Pionnier', 'Membre des 1000 premiers utilisateurs', 'flag-outline', 'SPECIAL', 'legendary', 'user_rank', '1000'),
('power-user', 'Utilisateur Expert', 'Utiliser toutes les fonctionnalités de l''app', 'settings-outline', 'SPECIAL', 'epic', 'features_used', '10'),
('trend-setter', 'Créateur de Tendances', 'Lancer 5 tendances dans la communauté', 'trending-up-outline', 'SPECIAL', 'legendary', 'trends_created', '5'),
('globetrotter', 'Globe-Trotter', 'Partager des fails de 10 pays différents', 'airplane-outline', 'SPECIAL', 'legendary', 'countries_count', '10'),

-- ==================== BADGES D''ACTIVITÉ ====================
('active-member', 'Membre Actif', 'Se connecter 100 jours non-consécutifs', 'person-outline', 'PERSEVERANCE', 'rare', 'login_days', '100'),
('super-active', 'Super Actif', 'Se connecter 250 jours non-consécutifs', 'person-circle-outline', 'PERSEVERANCE', 'epic', 'login_days', '250'),
('never-give-up', 'Jamais Abandonner', 'Maintenir 5 streaks de plus de 7 jours', 'flag-outline', 'PERSEVERANCE', 'epic', 'long_streaks', '5'),
('discussion-starter', 'Lanceur de Débats', 'Créer 25 discussions populaires', 'chatbubbles-outline', 'ENTRAIDE', 'epic', 'popular_discussions', '25'),

-- ==================== BADGES DE DIVERSITÉ ====================
('category-explorer', 'Explorateur de Catégories', 'Poster dans 5 catégories différentes', 'compass-outline', 'SPECIAL', 'common', 'categories_used', '5'),
('master-explorer', 'Maître Explorateur', 'Poster dans toutes les catégories', 'map-outline', 'SPECIAL', 'rare', 'categories_used', '10'),
('versatile', 'Polyvalent', 'Exceller dans 3 catégories', 'apps-outline', 'SPECIAL', 'epic', 'category_mastery', '3'),

-- ==================== BADGES DE TEMPS ET SAISONS ====================
('spring-awakening', 'Réveil Printanier', 'Poster 20 fails au printemps', 'flower-outline', 'SPECIAL', 'common', 'spring_fails', '20'),
('summer-vibes', 'Vibes d''Été', 'Poster 30 fails en été', 'sunny-outline', 'SPECIAL', 'common', 'summer_fails', '30'),
('autumn-leaves', 'Feuilles d''Automne', 'Poster 25 fails en automne', 'leaf-outline', 'SPECIAL', 'common', 'autumn_fails', '25'),
('winter-warrior', 'Guerrier d''Hiver', 'Poster 35 fails en hiver', 'snow-outline', 'SPECIAL', 'rare', 'winter_fails', '35'),

-- ==================== BADGES DE MILESTONES ====================
('one-month', 'Un Mois', 'Actif pendant un mois', 'calendar-number-outline', 'PERSEVERANCE', 'common', 'active_days', '30'),
('three-months', 'Trois Mois', 'Actif pendant trois mois', 'calendar-outline', 'PERSEVERANCE', 'rare', 'active_days', '90'),
('six-months', 'Six Mois', 'Actif pendant six mois', 'hourglass-outline', 'PERSEVERANCE', 'epic', 'active_days', '180'),
('one-year', 'Une Année', 'Actif pendant une année complète', 'trophy-outline', 'PERSEVERANCE', 'legendary', 'active_days', '365'),

-- ==================== BADGES DE RECORDS ====================
('speed-demon', 'Démon de Vitesse', 'Poster 10 fails en une journée', 'flash-outline', 'SPECIAL', 'rare', 'daily_fail_record', '10'),
('marathon-poster', 'Posteur Marathon', 'Poster 50 fails en une semaine', 'time-outline', 'SPECIAL', 'epic', 'weekly_fail_record', '50'),
('reaction-magnet', 'Aimant à Réactions', 'Un fail qui reçoit 100+ réactions', 'magnet-outline', 'SPECIAL', 'epic', 'max_reactions_single', '100'),
('viral-sensation', 'Sensation Virale', 'Un fail qui reçoit 1000+ réactions', 'planet-outline', 'SPECIAL', 'legendary', 'max_reactions_single', '1000'),

-- ==================== BADGES DE COLLECTION ULTIME ====================
('badge-hunter', 'Chasseur de Badges', 'Débloquer 25 badges', 'search-outline', 'SPECIAL', 'rare', 'badges_unlocked', '25'),
('badge-collector', 'Collectionneur de Badges', 'Débloquer 50 badges', 'albums-outline', 'SPECIAL', 'epic', 'badges_unlocked', '50'),
('completionist', 'Perfectionniste', 'Débloquer 75 badges', 'checkmark-circle-outline', 'SPECIAL', 'epic', 'badges_unlocked', '75'),
('ultimate-master', 'Maître Ultime', 'Débloquer 90% de tous les badges', 'diamond-outline', 'SPECIAL', 'legendary', 'badges_percentage', '90'),
('legend-of-fails', 'Légende des Fails', 'Débloquer TOUS les badges', 'crown-outline', 'SPECIAL', 'legendary', 'badges_percentage', '100')

ON CONFLICT (id) DO NOTHING; -- Ne pas réinsérer si déjà présent

-- Commentaires pour la documentation
COMMENT ON TABLE public.badge_definitions IS 'Table de définition complète de TOUS les badges disponibles (100+)';
COMMENT ON COLUMN public.badge_definitions.requirement_type IS 'Type de critère pour débloquer le badge';
COMMENT ON COLUMN public.badge_definitions.requirement_value IS 'Valeur numérique du critère';
COMMENT ON COLUMN public.badge_definitions.rarity IS 'Rareté du badge : common, rare, epic, legendary';

-- Statistiques finales
-- SELECT category, rarity, COUNT(*) as count FROM public.badge_definitions GROUP BY category, rarity ORDER BY category, 
--   CASE rarity WHEN 'common' THEN 1 WHEN 'rare' THEN 2 WHEN 'epic' THEN 3 WHEN 'legendary' THEN 4 END;
