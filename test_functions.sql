-- Test direct des fonctions d'analyse pour voir si elles fonctionnent

-- Test 1: Vérifier si les fonctions existent
SELECT 'Fonctions disponibles:' as test;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%reaction%' OR routine_name LIKE '%orphaned%'
ORDER BY routine_name;

-- Test 2: Appeler les fonctions d'analyse
SELECT 'Test find_orphaned_reactions:' as test;
SELECT * FROM find_orphaned_reactions() LIMIT 5;

SELECT 'Test find_invalid_reaction_counts:' as test;
SELECT * FROM find_invalid_reaction_counts() LIMIT 5;
