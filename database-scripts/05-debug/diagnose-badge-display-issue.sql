-- Script de diagnostic pour le problème d'affichage des badges
-- Problème : L'interface affiche 0 badges alors que l'utilisateur en a 3 en base

-- 1. Vérifier les badges de l'utilisateur test
SELECT 
    'Badges utilisateur dans user_badges:' as info,
    user_id,
    badge_id,
    unlocked_at
FROM user_badges 
WHERE user_id = (
    SELECT id FROM auth.users 
    WHERE email LIKE '%test%' 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- 2. Vérifier si la table badge_definitions existe et contient des données
SELECT 
    'Contenu de badge_definitions:' as info,
    COUNT(*) as total_badges
FROM badge_definitions;

-- 3. Lister tous les badges dans badge_definitions
SELECT 
    'Badges disponibles dans badge_definitions:' as info,
    id,
    name,
    category,
    rarity
FROM badge_definitions
ORDER BY category, rarity;

-- 4. Vérifier la correspondance entre user_badges et badge_definitions
SELECT 
    'Correspondance badges utilisateur <-> définitions:' as info,
    ub.badge_id,
    bd.name,
    CASE 
        WHEN bd.id IS NULL THEN 'MANQUANT dans badge_definitions'
        ELSE 'OK'
    END as status
FROM user_badges ub
LEFT JOIN badge_definitions bd ON ub.badge_id = bd.id
WHERE ub.user_id = (
    SELECT id FROM auth.users 
    WHERE email LIKE '%test%' 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- 5. Si badge_definitions est vide, créer les badges de base
DO $$
DECLARE
    badge_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO badge_count FROM badge_definitions;
    
    IF badge_count = 0 THEN
        RAISE NOTICE 'Table badge_definitions vide, insertion des badges de base...';
        
        INSERT INTO badge_definitions (id, name, description, icon, category, rarity, requirement_type, requirement_value) VALUES
        ('first-fail', 'Premier Courage', 'Poster votre premier fail', 'heart-outline', 'COURAGE', 'common', 'fail_count', '1'),
        ('first-reaction', 'Première Réaction', 'Donner votre première réaction à un fail', 'happy-outline', 'ENTRAIDE', 'common', 'reaction_given', '1'),
        ('fails-5', 'Apprenti Courage', 'Poster 5 fails', 'ribbon-outline', 'COURAGE', 'common', 'fail_count', '5'),
        ('fails-10', 'Courageux', 'Poster 10 fails', 'trophy-outline', 'COURAGE', 'rare', 'fail_count', '10'),
        ('fails-25', 'Maître du Courage', 'Poster 25 fails', 'star-outline', 'COURAGE', 'epic', 'fail_count', '25'),
        ('reactions-10', 'Supporteur', 'Donner 10 réactions', 'people-outline', 'ENTRAIDE', 'common', 'reaction_given', '10'),
        ('reactions-50', 'Grand Supporteur', 'Donner 50 réactions', 'heart', 'ENTRAIDE', 'rare', 'reaction_given', '50'),
        ('all-categories', 'Touche-à-tout', 'Poster un fail dans chaque catégorie', 'apps-outline', 'SPECIAL', 'epic', 'categories_used', '5'),
        ('week-streak', 'Semaine de Courage', 'Poster au moins un fail par jour pendant 7 jours', 'calendar-outline', 'PERSEVERANCE', 'rare', 'streak_days', '7'),
        ('popular-fail', 'Populaire', 'Recevoir 10 réactions sur un seul fail', 'flame-outline', 'SPECIAL', 'rare', 'max_reactions_single', '10')
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Badges de base insérés dans badge_definitions';
    ELSE
        RAISE NOTICE 'Table badge_definitions contient déjà % badges', badge_count;
    END IF;
END $$;

-- 6. Vérifier à nouveau après insertion
SELECT 
    'Vérification finale - badges utilisateur mappés:' as info,
    ub.badge_id,
    bd.name,
    bd.description,
    bd.category,
    bd.rarity
FROM user_badges ub
JOIN badge_definitions bd ON ub.badge_id = bd.id
WHERE ub.user_id = (
    SELECT id FROM auth.users 
    WHERE email LIKE '%test%' 
    ORDER BY created_at DESC 
    LIMIT 1
)
ORDER BY ub.unlocked_at;

-- 7. Statistiques finales
SELECT 
    'Statistiques finales:' as info,
    (SELECT COUNT(*) FROM badge_definitions) as total_badges_disponibles,
    (SELECT COUNT(*) FROM user_badges WHERE user_id = (
        SELECT id FROM auth.users 
        WHERE email LIKE '%test%' 
        ORDER BY created_at DESC 
        LIMIT 1
    )) as badges_utilisateur,
    (SELECT COUNT(*) 
     FROM user_badges ub 
     JOIN badge_definitions bd ON ub.badge_id = bd.id 
     WHERE ub.user_id = (
        SELECT id FROM auth.users 
        WHERE email LIKE '%test%' 
        ORDER BY created_at DESC 
        LIMIT 1
    )) as badges_mappés_correctement;