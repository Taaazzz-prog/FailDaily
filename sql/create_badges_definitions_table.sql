-- Création de la table badges_definitions pour stocker tous les badges disponibles
CREATE TABLE IF NOT EXISTS public.badges_definitions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT 'trophy-outline',
    category VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    requirements JSONB, -- Stockage des critères en JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_badges_definitions_rarity ON public.badges_definitions(rarity);
CREATE INDEX IF NOT EXISTS idx_badges_definitions_category ON public.badges_definitions(category);

-- Insérer tous les badges de base
INSERT INTO public.badges_definitions (id, name, description, icon, category, rarity, requirements) VALUES
-- Badges de début
('first-fail', 'Premier Courage', 'Poster votre premier fail', 'heart-outline', 'courage', 'common', '{"totalFails": 1}'),
('first-reaction', 'Première Réaction', 'Donner votre première réaction à un fail', 'happy-outline', 'entraide', 'common', '{"totalReactions": 1}'),

-- Badges de volume - Fails
('fails-5', 'Apprenti Courage', 'Poster 5 fails', 'ribbon-outline', 'courage', 'common', '{"totalFails": 5}'),
('fails-10', 'Courageux', 'Poster 10 fails', 'trophy-outline', 'courage', 'rare', '{"totalFails": 10}'),
('fails-25', 'Maître du Courage', 'Poster 25 fails', 'star-outline', 'courage', 'epic', '{"totalFails": 25}'),
('fails-50', 'Légende Vivante', 'Poster 50 fails', 'crown-outline', 'courage', 'epic', '{"totalFails": 50}'),
('fails-100', 'Immortel du Courage', 'Poster 100 fails', 'diamond-outline', 'courage', 'legendary', '{"totalFails": 100}'),

-- Badges de réactions
('reactions-10', 'Supporteur', 'Donner 10 réactions', 'people-outline', 'entraide', 'common', '{"totalReactions": 10}'),
('reactions-25', 'Grand Supporteur', 'Donner 25 réactions', 'heart', 'entraide', 'rare', '{"totalReactions": 25}'),
('reactions-50', 'Ange Gardien', 'Donner 50 réactions', 'heart-circle', 'entraide', 'rare', '{"totalReactions": 50}'),
('reactions-100', 'Saint du Support', 'Donner 100 réactions', 'sparkles', 'entraide', 'epic', '{"totalReactions": 100}'),
('reactions-250', 'Messie de la Bienveillance', 'Donner 250 réactions', 'flash', 'entraide', 'legendary', '{"totalReactions": 250}'),

-- Badges de diversité
('all-categories', 'Touche-à-tout', 'Poster un fail dans chaque catégorie', 'apps-outline', 'special', 'epic', '{"categoriesUsed": 5}'),
('master-explorer', 'Explorateur Ultime', 'Maîtriser toutes les catégories', 'compass-outline', 'special', 'legendary', '{"categoriesUsed": 10}'),

-- Badges sociaux - Popularité
('popular-fail', 'Populaire', 'Recevoir 10 réactions sur un seul fail', 'flame-outline', 'special', 'rare', '{"maxReactionsOnFail": 10}'),
('viral-fail', 'Viral', 'Recevoir 25 réactions sur un seul fail', 'thunderstorm-outline', 'special', 'epic', '{"maxReactionsOnFail": 25}'),
('legendary-fail', 'Légende Internet', 'Recevoir 50 réactions sur un seul fail', 'planet-outline', 'special', 'legendary', '{"maxReactionsOnFail": 50}'),

-- Badges de temps et persévérance
('week-streak', 'Semaine de Courage', 'Poster au moins un fail par jour pendant 7 jours', 'calendar-outline', 'perseverance', 'rare', '{"weekStreak": 1}'),
('month-streak', 'Mois de Résilience', 'Poster régulièrement pendant 30 jours', 'time-outline', 'perseverance', 'epic', '{"monthStreak": 1}'),
('year-warrior', 'Guerrier de l\'Année', 'Actif pendant 365 jours', 'medal-outline', 'perseverance', 'legendary', '{"yearStreak": 1}'),

-- Badges d'humour
('comedian', 'Comédien', 'Recevoir 50 réactions "rire"', 'happy', 'humour', 'rare', '{"laughReactions": 50}'),
('jester', 'Bouffon Royal', 'Recevoir 100 réactions "rire"', 'chatbubble-ellipses', 'humour', 'epic', '{"laughReactions": 100}'),

-- Badges spéciaux et rares
('night-owl', 'Oiseau de Nuit', 'Poster après minuit', 'moon-outline', 'special', 'rare', '{"nightPosts": 10}'),
('early-bird', 'Lève-tôt', 'Poster avant 6h du matin', 'sunny-outline', 'special', 'rare', '{"earlyPosts": 10}'),
('weekend-warrior', 'Guerrier du Weekend', 'Actif principalement le weekend', 'calendar', 'perseverance', 'rare', '{"weekendActivity": 20}'),

-- Badges communautaires
('helper', 'Aide Précieuse', 'Donner beaucoup de réactions "support"', 'hand-left-outline', 'entraide', 'rare', '{"supportReactions": 30}'),
('empathy-master', 'Maître de l\'Empathie', 'Donner beaucoup de réactions "empathie"', 'people-circle', 'entraide', 'epic', '{"empathyReactions": 50}'),

-- Badges ultime
('completionist', 'Collectionneur Parfait', 'Débloquer tous les autres badges', 'library-outline', 'special', 'legendary', '{"allBadges": true}')

ON CONFLICT (id) DO NOTHING; -- Ne pas réinsérer si déjà présent

-- Commentaires pour la documentation
COMMENT ON TABLE public.badges_definitions IS 'Table de définition de tous les badges disponibles dans l''application';
COMMENT ON COLUMN public.badges_definitions.requirements IS 'Critères JSON pour débloquer le badge';
COMMENT ON COLUMN public.badges_definitions.rarity IS 'Rareté du badge : common, rare, epic, legendary';
