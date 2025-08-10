-- DEBUG: Vérifier les badges "reactions-25" et "reactions-10" pour bruno@taazzz.be

-- 1. Vérifier l'utilisateur et ses statistiques
SELECT 
    'USER STATS' as type,
    u.email,
    u.id as user_id,
    COUNT(DISTINCT f.id) as total_fails,
    COUNT(DISTINCT r.id) as total_reactions_given,
    COUNT(DISTINCT r2.id) as total_reactions_received
FROM auth.users u
LEFT JOIN fails f ON f.user_id = u.id
LEFT JOIN reactions r ON r.user_id = u.id  -- Réactions données par l'utilisateur
LEFT JOIN fails f2 ON f2.user_id = u.id
LEFT JOIN reactions r2 ON r2.fail_id = f2.id  -- Réactions reçues sur ses fails
WHERE u.email = 'bruno@taazzz.be'
GROUP BY u.id, u.email;

-- 2. Vérifier la définition des badges "reactions" dans badge_definitions
SELECT 
    'BADGE DEFINITIONS' as type,
    id,
    name,
    description,
    category,
    rarity,
    requirement_type,
    requirement_value
FROM badge_definitions
WHERE id IN ('reactions-10', 'reactions-25', 'first-reaction')
ORDER BY requirement_value::integer;

-- 3. Vérifier les badges déjà débloqués pour Bruno
SELECT 
    'CURRENT BADGES' as type,
    ub.badge_id,
    bd.name,
    bd.requirement_type,
    bd.requirement_value,
    ub.unlocked_at
FROM user_badges ub
JOIN badge_definitions bd ON bd.id = ub.badge_id
JOIN auth.users u ON u.id = ub.user_id
WHERE u.email = 'bruno@taazzz.be'
ORDER BY ub.unlocked_at;

-- 4. Vérifier si Bruno a donné au moins 25 réactions (pour reactions-25)
SELECT 
    'REACTION COUNT CHECK' as type,
    u.email,
    COUNT(r.id) as total_reactions_given,
    CASE 
        WHEN COUNT(r.id) >= 25 THEN '✅ Eligible pour reactions-25'
        WHEN COUNT(r.id) >= 10 THEN '✅ Eligible pour reactions-10'
        ELSE '❌ Pas encore assez de réactions'
    END as eligibility_status
FROM auth.users u
LEFT JOIN reactions r ON r.user_id = u.id
WHERE u.email = 'bruno@taazzz.be'
GROUP BY u.id, u.email;

-- 5. Débloquement manuel des badges manquants
-- Badge "reactions-10" si l'utilisateur a donné 10+ réactions
INSERT INTO user_badges (user_id, badge_id, unlocked_at)
SELECT 
    u.id,
    'reactions-10' as badge_id,
    NOW() as unlocked_at
FROM auth.users u
WHERE u.email = 'bruno@taazzz.be'
  AND (
      SELECT COUNT(*) FROM reactions r WHERE r.user_id = u.id
  ) >= 10
  AND NOT EXISTS (
      SELECT 1 FROM user_badges ub 
      WHERE ub.user_id = u.id AND ub.badge_id = 'reactions-10'
  )
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Badge "reactions-25" si l'utilisateur a donné 25+ réactions
INSERT INTO user_badges (user_id, badge_id, unlocked_at)
SELECT 
    u.id,
    'reactions-25' as badge_id,
    NOW() as unlocked_at
FROM auth.users u
WHERE u.email = 'bruno@taazzz.be'
  AND (
      SELECT COUNT(*) FROM reactions r WHERE r.user_id = u.id
  ) >= 25
  AND NOT EXISTS (
      SELECT 1 FROM user_badges ub 
      WHERE ub.user_id = u.id AND ub.badge_id = 'reactions-25'
  )
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 6. Vérification finale après déclenchement manuel
SELECT 
    'FINAL VERIFICATION' as type,
    u.email,
    COUNT(DISTINCT ub.badge_id) as total_badges,
    STRING_AGG(DISTINCT ub.badge_id, ', ' ORDER BY ub.badge_id) as badge_list,
    STRING_AGG(DISTINCT bd.name, ', ' ORDER BY bd.name) as badge_names
FROM auth.users u
LEFT JOIN user_badges ub ON ub.user_id = u.id
LEFT JOIN badge_definitions bd ON bd.id = ub.badge_id
WHERE u.email = 'bruno@taazzz.be'
GROUP BY u.id, u.email;
