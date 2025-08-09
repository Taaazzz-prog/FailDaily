-- CORRECTION IMMÉDIATE DES BADGES
-- Exécute ce script dans Supabase SQL Editor

-- 1. Supprimer le badge incorrect "fails-5"
DELETE FROM user_badges 
WHERE badge_id = 'fails-5' 
AND user_id IN (
    SELECT id FROM auth.users 
    WHERE email LIKE '%test%'
);

-- 2. Créer badge_definitions si elle n'existe pas
CREATE TABLE IF NOT EXISTS badge_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT,
    rarity TEXT,
    requirement_type TEXT,
    requirement_value TEXT
);

-- 3. Insérer les badges de base
INSERT INTO badge_definitions (id, name, description, icon, category, rarity, requirement_type, requirement_value) VALUES
('first-fail', 'Premier Courage', 'Poster votre premier fail', 'heart-outline', 'COURAGE', 'common', 'fail_count', '1'),
('first-reaction', 'Première Réaction', 'Donner votre première réaction', 'happy-outline', 'ENTRAIDE', 'common', 'reaction_given', '1'),
('fails-5', 'Apprenti Courage', 'Poster 5 fails', 'ribbon-outline', 'COURAGE', 'common', 'fail_count', '5'),
('fails-10', 'Courageux', 'Poster 10 fails', 'trophy-outline', 'COURAGE', 'rare', 'fail_count', '10'),
('reactions-10', 'Supporteur', 'Donner 10 réactions', 'people-outline', 'ENTRAIDE', 'common', 'reaction_given', '10'),
('popular-fail', 'Populaire', 'Recevoir 10 réactions sur un fail', 'flame-outline', 'SPECIAL', 'rare', 'max_reactions_single', '10')
ON CONFLICT (id) DO NOTHING;

-- 4. Permissions pour que les utilisateurs puissent lire badge_definitions
GRANT SELECT ON badge_definitions TO authenticated;

-- FINI. Maintenant rafraîchis ton app.