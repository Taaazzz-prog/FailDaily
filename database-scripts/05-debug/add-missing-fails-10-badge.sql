-- Script pour ajouter le badge "fails-10" manquant
-- L'utilisateur a 12 fails mais n'a que 3 badges au lieu de 4

-- 1. DIAGNOSTIC: Vérifier l'état actuel
SELECT 
    'test@test.fr' as email,
    12 as total_fails,
    3 as current_badges,
    'fails-5, first-fail, first-reaction' as current_badges_list,
    'MANQUE: fails-10 (Courageux)' as missing_badge;

-- 2. AJOUTER le badge manquant "fails-10" pour l'utilisateur avec 12 fails
INSERT INTO user_badges (user_id, badge_id, unlocked_at)
VALUES 
    ('b64524ba-9daa-4fe7-8372-a9e94402ab83', 'fails-10', NOW())
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 3. VÉRIFICATION: État final des badges
SELECT 
    ub.badge_id,
    ub.unlocked_at,
    CASE 
        WHEN ub.badge_id = 'first-fail' THEN 'Premier Courage'
        WHEN ub.badge_id = 'first-reaction' THEN 'Première Réaction'
        WHEN ub.badge_id = 'fails-5' THEN 'Apprenti Courage'
        WHEN ub.badge_id = 'fails-10' THEN 'Courageux'
        WHEN ub.badge_id = 'fails-25' THEN 'Maître du Courage'
        ELSE ub.badge_id
    END as badge_name
FROM user_badges ub
WHERE ub.user_id = 'b64524ba-9daa-4fe7-8372-a9e94402ab83'
ORDER BY ub.unlocked_at;

-- 4. RAPPORT FINAL: Résumé complet
SELECT 
    u.email,
    COUNT(f.id) as total_fails,
    COUNT(r.id) as total_reactions_given,
    COUNT(DISTINCT ub.badge_id) as unique_badges,
    STRING_AGG(DISTINCT ub.badge_id, ', ' ORDER BY ub.badge_id) as badges_list,
    CASE 
        WHEN COUNT(f.id) >= 25 THEN 'Prochaine étape: fails-25 (Maître du Courage)'
        WHEN COUNT(f.id) >= 10 THEN 'Prochaine étape: fails-25 (' || COUNT(f.id) || '/25)'
        ELSE 'Objectif atteint!'
    END as next_goal
FROM auth.users u
LEFT JOIN fails f ON f.user_id = u.id
LEFT JOIN reactions r ON r.user_id = u.id
LEFT JOIN user_badges ub ON ub.user_id = u.id
WHERE u.email = 'test@test.fr'
GROUP BY u.id, u.email;