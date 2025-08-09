-- Script pour diagnostiquer et corriger les badges manquants
-- Exécuter ce script pour débloquer automatiquement les badges qui auraient dû être débloqués

-- 1. Diagnostic : Vérifier les utilisateurs qui ont des fails mais pas de badges
SELECT 
    u.id as user_id,
    u.email,
    COUNT(f.id) as total_fails,
    COUNT(ub.badge_id) as total_badges,
    CASE 
        WHEN COUNT(f.id) >= 1 AND NOT EXISTS (
            SELECT 1 FROM user_badges ub2 
            WHERE ub2.user_id = u.id AND ub2.badge_id = 'first-fail'
        ) THEN 'MANQUE: Premier Courage'
        ELSE 'OK'
    END as status
FROM auth.users u
LEFT JOIN fails f ON f.user_id = u.id
LEFT JOIN user_badges ub ON ub.user_id = u.id
GROUP BY u.id, u.email
HAVING COUNT(f.id) > 0
ORDER BY total_fails DESC;

-- 2. Correction automatique : Débloquer le badge "Premier Courage" pour tous les utilisateurs qui ont au moins 1 fail
INSERT INTO user_badges (user_id, badge_id, unlocked_at)
SELECT DISTINCT 
    f.user_id,
    'first-fail' as badge_id,
    NOW() as unlocked_at
FROM fails f
WHERE NOT EXISTS (
    SELECT 1 FROM user_badges ub 
    WHERE ub.user_id = f.user_id 
    AND ub.badge_id = 'first-fail'
)
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 3. Débloquer le badge "Apprenti Courage" pour les utilisateurs avec 5+ fails
INSERT INTO user_badges (user_id, badge_id, unlocked_at)
SELECT 
    f.user_id,
    'fails-5' as badge_id,
    NOW() as unlocked_at
FROM (
    SELECT user_id, COUNT(*) as fail_count
    FROM fails
    GROUP BY user_id
    HAVING COUNT(*) >= 5
) f
WHERE NOT EXISTS (
    SELECT 1 FROM user_badges ub 
    WHERE ub.user_id = f.user_id 
    AND ub.badge_id = 'fails-5'
)
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 4. Débloquer le badge "Courageux" pour les utilisateurs avec 10+ fails
INSERT INTO user_badges (user_id, badge_id, unlocked_at)
SELECT 
    f.user_id,
    'fails-10' as badge_id,
    NOW() as unlocked_at
FROM (
    SELECT user_id, COUNT(*) as fail_count
    FROM fails
    GROUP BY user_id
    HAVING COUNT(*) >= 10
) f
WHERE NOT EXISTS (
    SELECT 1 FROM user_badges ub 
    WHERE ub.user_id = f.user_id 
    AND ub.badge_id = 'fails-10'
)
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 5. Débloquer le badge "Première Réaction" pour les utilisateurs qui ont donné au moins 1 réaction
INSERT INTO user_badges (user_id, badge_id, unlocked_at)
SELECT DISTINCT 
    r.user_id,
    'first-reaction' as badge_id,
    NOW() as unlocked_at
FROM reactions r
WHERE NOT EXISTS (
    SELECT 1 FROM user_badges ub 
    WHERE ub.user_id = r.user_id 
    AND ub.badge_id = 'first-reaction'
)
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 6. Vérification finale : Afficher le résultat
SELECT 
    u.id as user_id,
    u.email,
    COUNT(f.id) as total_fails,
    COUNT(r.id) as total_reactions_given,
    COUNT(ub.badge_id) as total_badges,
    STRING_AGG(ub.badge_id, ', ') as badges_unlocked
FROM auth.users u
LEFT JOIN fails f ON f.user_id = u.id
LEFT JOIN reactions r ON r.user_id = u.id
LEFT JOIN user_badges ub ON ub.user_id = u.id
GROUP BY u.id, u.email
HAVING COUNT(f.id) > 0 OR COUNT(r.id) > 0
ORDER BY total_fails DESC, total_reactions_given DESC;