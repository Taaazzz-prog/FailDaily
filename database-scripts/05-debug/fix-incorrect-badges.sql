-- Script pour corriger les badges incorrects et diagnostiquer l'affichage
-- PROBLÈME 1: Badge "fails-5" débloqué alors que l'utilisateur n'a qu'1 fail
-- PROBLÈME 2: Interface affiche 0 badges alors qu'il y en a 3 en base

-- 1. DIAGNOSTIC: Vérifier les vrais stats de l'utilisateur
SELECT 
    u.email,
    COUNT(DISTINCT f.id) as real_fails_count,
    COUNT(DISTINCT r.id) as real_reactions_given,
    COUNT(DISTINCT ub.badge_id) as badges_in_db
FROM auth.users u
LEFT JOIN fails f ON f.user_id = u.id
LEFT JOIN reactions r ON r.user_id = u.id
LEFT JOIN user_badges ub ON ub.user_id = u.id
WHERE u.email = 'test@test.fr'
GROUP BY u.id, u.email;

-- 2. SUPPRIMER le badge "fails-5" incorrect (utilisateur n'a qu'1 fail)
DELETE FROM user_badges 
WHERE user_id = 'b64524ba-9daa-4fe7-8372-a9e94402ab83' 
  AND badge_id = 'fails-5';

-- 3. VÉRIFIER les badges restants (devrait être 2: first-fail + first-reaction)
SELECT 
    badge_id,
    unlocked_at,
    CASE 
        WHEN badge_id = 'first-fail' THEN 'Premier Courage'
        WHEN badge_id = 'first-reaction' THEN 'Première Réaction'
        ELSE badge_id
    END as badge_name
FROM user_badges 
WHERE user_id = 'b64524ba-9daa-4fe7-8372-a9e94402ab83'
ORDER BY unlocked_at;

-- 4. DIAGNOSTIC: Pourquoi l'interface affiche 0 badges ?
-- Vérifier si le service peut accéder aux badges
SELECT 
    'DIAGNOSTIC INTERFACE' as issue,
    'Vérifier que BadgeService.getUserBadgesNew() fonctionne' as solution,
    'Problème probable: mapping entre badge_id et Badge objects' as cause;

-- 5. VÉRIFIER la correspondance entre user_badges et badge_definitions
SELECT 
    ub.badge_id,
    bd.name as badge_name,
    bd.description,
    CASE 
        WHEN bd.id IS NULL THEN 'BADGE MANQUANT dans badge_definitions'
        ELSE 'OK'
    END as status
FROM user_badges ub
LEFT JOIN badge_definitions bd ON bd.id = ub.badge_id
WHERE ub.user_id = 'b64524ba-9daa-4fe7-8372-a9e94402ab83';

-- 6. LISTER les badges disponibles qui correspondent
SELECT 
    id,
    name,
    description,
    category,
    rarity
FROM badge_definitions 
WHERE id IN ('first-fail', 'first-reaction')
ORDER BY id;