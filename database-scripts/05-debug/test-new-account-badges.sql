-- Script pour tester le déclenchement des badges sur un nouveau compte
-- L'utilisateur vient de créer le compte et a posté 1 fail + donné 4 réactions

-- 1. DIAGNOSTIC: Vérifier l'état actuel du nouveau compte
SELECT 
    u.id as user_id,
    u.email,
    u.created_at,
    COUNT(f.id) as total_fails,
    COUNT(r.id) as total_reactions_given,
    COUNT(ub.badge_id) as total_badges,
    STRING_AGG(ub.badge_id, ', ') as badges_unlocked
FROM auth.users u
LEFT JOIN fails f ON f.user_id = u.id
LEFT JOIN reactions r ON r.user_id = u.id
LEFT JOIN user_badges ub ON ub.user_id = u.id
WHERE u.email = 'test@test.fr'
GROUP BY u.id, u.email, u.created_at;

-- 2. VÉRIFIER les fails en détail
SELECT
    'FAILS' as type,
    f.id::text as item_id,
    f.created_at,
    f.title as description,
    f.category as extra_info
FROM fails f
JOIN auth.users u ON u.id = f.user_id
WHERE u.email = 'test@test.fr'
ORDER BY f.created_at DESC;

-- 3. VÉRIFIER les réactions en détail
SELECT
    'REACTIONS' as type,
    r.id::text as item_id,
    r.created_at,
    r.reaction_type as description,
    f.title as extra_info
FROM reactions r
JOIN fails f ON f.id = r.fail_id
JOIN auth.users u ON u.id = r.user_id
WHERE u.email = 'test@test.fr'
ORDER BY r.created_at DESC;

-- 4. DÉCLENCHER MANUELLEMENT les badges qui devraient être débloqués
-- Badge "Premier Courage" pour le premier fail
INSERT INTO user_badges (user_id, badge_id, unlocked_at)
SELECT 
    u.id,
    'first-fail' as badge_id,
    NOW() as unlocked_at
FROM auth.users u
WHERE u.email = 'test@test.fr'
  AND EXISTS (SELECT 1 FROM fails f WHERE f.user_id = u.id)
  AND NOT EXISTS (
      SELECT 1 FROM user_badges ub 
      WHERE ub.user_id = u.id AND ub.badge_id = 'first-fail'
  )
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Badge "Première Réaction" pour la première réaction donnée
INSERT INTO user_badges (user_id, badge_id, unlocked_at)
SELECT 
    u.id,
    'first-reaction' as badge_id,
    NOW() as unlocked_at
FROM auth.users u
WHERE u.email = 'test@test.fr'
  AND EXISTS (SELECT 1 FROM reactions r WHERE r.user_id = u.id)
  AND NOT EXISTS (
      SELECT 1 FROM user_badges ub 
      WHERE ub.user_id = u.id AND ub.badge_id = 'first-reaction'
  )
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 5. VÉRIFICATION FINALE: État après déclenchement manuel
SELECT 
    u.email,
    COUNT(f.id) as total_fails,
    COUNT(r.id) as total_reactions_given,
    COUNT(DISTINCT ub.badge_id) as unique_badges,
    STRING_AGG(DISTINCT ub.badge_id, ', ' ORDER BY ub.badge_id) as badges_list,
    STRING_AGG(
        DISTINCT CASE 
            WHEN ub.badge_id = 'first-fail' THEN 'Premier Courage'
            WHEN ub.badge_id = 'first-reaction' THEN 'Première Réaction'
            ELSE ub.badge_id
        END, 
        ', ' 
        ORDER BY CASE 
            WHEN ub.badge_id = 'first-fail' THEN 'Premier Courage'
            WHEN ub.badge_id = 'first-reaction' THEN 'Première Réaction'
            ELSE ub.badge_id
        END
    ) as badge_names
FROM auth.users u
LEFT JOIN fails f ON f.user_id = u.id
LEFT JOIN reactions r ON r.user_id = u.id
LEFT JOIN user_badges ub ON ub.user_id = u.id
WHERE u.email = 'test@test.fr'
GROUP BY u.id, u.email;

-- 6. DIAGNOSTIC: Pourquoi le système automatique ne fonctionne pas ?
SELECT 
    'DIAGNOSTIC' as info,
    'Le système EventBus ne se déclenche que lors de nouvelles actions' as explication,
    'Les actions passées ne déclenchent pas automatiquement les badges' as cause,
    'Il faut soit poster un nouveau fail, soit déclencher manuellement' as solution;