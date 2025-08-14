-- Script de test pour créer des données avec compteurs invalides
-- Cela permettra de tester l'affichage détaillé de l'analyse

-- Créer quelques fails de test
INSERT INTO fails (id, user_id, title, description, courage_count, laugh_count, empathy_count, support_count, created_at, anonymous)
VALUES 
  (gen_random_uuid(), 
   (SELECT id FROM profiles LIMIT 1), 
   'Test Fail 1 - Compteurs Incorrects', 
   'Un fail de test avec des compteurs incorrects pour tester l''analyse',
   5, -- courage_count incorrect (sera différent des vraies réactions)
   3, -- laugh_count incorrect
   2, -- empathy_count incorrect  
   4, -- support_count incorrect
   NOW(),
   false),
   
  (gen_random_uuid(), 
   (SELECT id FROM profiles LIMIT 1), 
   'Test Fail 2 - Compteurs OK', 
   'Un autre fail de test avec compteurs corrects',
   0, -- sera correct car pas de réactions ajoutées
   0, 
   0, 
   0,
   NOW(),
   false);

-- Créer des réactions qui ne correspondent pas aux compteurs stockés
-- Pour le premier fail (celui avec des compteurs incorrects)
WITH test_fail AS (
  SELECT id, user_id FROM fails WHERE title = 'Test Fail 1 - Compteurs Incorrects'
)
INSERT INTO reactions (id, user_id, fail_id, reaction_type, created_at)
SELECT 
  gen_random_uuid(),
  test_fail.user_id,
  test_fail.id,
  'courage',
  NOW()
FROM test_fail
UNION ALL
SELECT 
  gen_random_uuid(),
  test_fail.user_id,
  test_fail.id,
  'courage',
  NOW()
FROM test_fail
UNION ALL
SELECT 
  gen_random_uuid(),
  test_fail.user_id,
  test_fail.id,
  'laugh',
  NOW()
FROM test_fail
UNION ALL
SELECT 
  gen_random_uuid(),
  test_fail.user_id,
  test_fail.id,
  'empathy',
  NOW()
FROM test_fail
UNION ALL
SELECT 
  gen_random_uuid(),
  test_fail.user_id,
  test_fail.id,
  'empathy',
  NOW()
FROM test_fail
UNION ALL
SELECT 
  gen_random_uuid(),
  test_fail.user_id,
  test_fail.id,
  'empathy',
  NOW()
FROM test_fail
UNION ALL
SELECT 
  gen_random_uuid(),
  test_fail.user_id,
  test_fail.id,
  'support',
  NOW()
FROM test_fail;

-- Ajouter aussi une réaction orpheline pour tester l'autre analyse
INSERT INTO reactions (id, user_id, fail_id, reaction_type, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM profiles LIMIT 1),
  gen_random_uuid(), -- fail_id qui n'existe pas = réaction orpheline
  'courage',
  NOW()
);

-- Vérification - ces requêtes montreront les problèmes créés
SELECT 'Compteurs stockés vs réels:' as verification;
SELECT 
  f.title,
  f.courage_count as stored_courage,
  COUNT(CASE WHEN r.reaction_type = 'courage' THEN 1 END) as actual_courage,
  f.laugh_count as stored_laugh,
  COUNT(CASE WHEN r.reaction_type = 'laugh' THEN 1 END) as actual_laugh,
  f.empathy_count as stored_empathy,
  COUNT(CASE WHEN r.reaction_type = 'empathy' THEN 1 END) as actual_empathy,
  f.support_count as stored_support,
  COUNT(CASE WHEN r.reaction_type = 'support' THEN 1 END) as actual_support
FROM fails f
LEFT JOIN reactions r ON f.id = r.fail_id
WHERE f.title LIKE 'Test Fail%'
GROUP BY f.id, f.title, f.courage_count, f.laugh_count, f.empathy_count, f.support_count;

SELECT 'Réactions orphelines:' as verification;
SELECT COUNT(*) as orphaned_reactions FROM reactions r
LEFT JOIN fails f ON r.fail_id = f.id
WHERE f.id IS NULL;
