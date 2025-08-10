-- Script de test pour le badge reactions-25 de bruno@taazzz.be

-- 1. Trouver l'ID utilisateur de bruno@taazzz.be
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'bruno@taazzz.be';

-- 2. Compter ses réactions données (remplacer USER_ID_HERE par l'ID trouvé ci-dessus)
-- SELECT COUNT(*) as reactions_donnees 
-- FROM reactions 
-- WHERE user_id = 'USER_ID_HERE';

-- 3. Vérifier s'il a déjà le badge reactions-25
-- SELECT * 
-- FROM user_badges ub
-- JOIN badge_definitions bd ON ub.badge_id = bd.id
-- WHERE ub.user_id = 'USER_ID_HERE' AND bd.id = 'reactions-25';

-- 4. Si le badge n'est pas attribué et qu'il a 25+ réactions, l'attribuer manuellement
-- INSERT INTO user_badges (user_id, badge_id, earned_at, created_at)
-- VALUES ('USER_ID_HERE', 'reactions-25', NOW(), NOW())
-- ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 5. Vérification finale - lister tous ses badges
-- SELECT bd.id, bd.name, bd.category, ub.earned_at
-- FROM user_badges ub
-- JOIN badge_definitions bd ON ub.badge_id = bd.id  
-- WHERE ub.user_id = 'USER_ID_HERE'
-- ORDER BY ub.earned_at DESC;

-- Note: Remplacez 'USER_ID_HERE' par l'ID réel de bruno@taazzz.be trouvé dans la première requête
