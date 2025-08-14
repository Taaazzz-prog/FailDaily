-- ===== TESTS POUR LE PANNEAU D'ADMINISTRATION =====

-- Test 1: Insérer des logs système de test
INSERT INTO system_logs (level, message, action, details) VALUES
    ('info', 'Application started successfully', 'app_start', '{"version": "1.0.0", "environment": "development"}'),
    ('warning', 'High memory usage detected', 'memory_warning', '{"usage": "85%", "threshold": "80%"}'),
    ('error', 'Database connection timeout', 'db_error', '{"timeout": "30s", "retries": 3}'),
    ('debug', 'User authentication processed', 'auth_debug', '{"user_id": "test-user", "method": "email"}');

-- Test 2: Insérer des logs de réactions de test
INSERT INTO reaction_logs (user_id, user_email, user_name, fail_id, fail_title, fail_author_name, reaction_type, points_awarded) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin@faildaily.com', 'Admin User', '22222222-2222-2222-2222-222222222222', 'Mon premier fail', 'Test User', 'courage', 2),
    ('33333333-3333-3333-3333-333333333333', 'user@faildaily.com', 'Regular User', '22222222-2222-2222-2222-222222222222', 'Mon premier fail', 'Test User', 'empathy', 2),
    ('11111111-1111-1111-1111-111111111111', 'admin@faildaily.com', 'Admin User', '44444444-4444-4444-4444-444444444444', 'Échec de cuisine', 'Another User', 'laugh', 1);

-- Test 3: Insérer des activités utilisateur de test
INSERT INTO user_activities (user_id, user_email, user_name, action, details, fail_id, reaction_type) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin@faildaily.com', 'Admin User', 'create_fail', '{"fail_id": "22222222-2222-2222-2222-222222222222", "category": "travail"}', '22222222-2222-2222-2222-222222222222', null),
    ('33333333-3333-3333-3333-333333333333', 'user@faildaily.com', 'Regular User', 'add_reaction', '{"reaction_type": "courage", "fail_id": "22222222-2222-2222-2222-222222222222"}', '22222222-2222-2222-2222-222222222222', 'courage'),
    ('11111111-1111-1111-1111-111111111111', 'admin@faildaily.com', 'Admin User', 'add_reaction', '{"reaction_type": "empathy", "fail_id": "44444444-4444-4444-4444-444444444444"}', '44444444-4444-4444-4444-444444444444', 'empathy');

-- Test 4: Vérifier les statistiques globales
SELECT * FROM get_database_stats();

-- Test 5: Vérifier que les logs sont bien créés
SELECT 
    'system_logs' as table_name,
    COUNT(*) as count
FROM system_logs
UNION ALL
SELECT 
    'reaction_logs' as table_name,
    COUNT(*) as count
FROM reaction_logs
UNION ALL
SELECT 
    'user_activities' as table_name,
    COUNT(*) as count
FROM user_activities
UNION ALL
SELECT 
    'app_config' as table_name,
    COUNT(*) as count
FROM app_config;

-- Test 6: Vérifier la configuration des points
SELECT key, value, description 
FROM app_config 
WHERE key = 'points_config';

-- Test 7: Tester les fonctions RPC
SELECT 'Orphaned reactions:' as test;
SELECT * FROM find_orphaned_reactions() LIMIT 5;

SELECT 'Invalid reaction counts:' as test;
SELECT * FROM find_invalid_reaction_counts() LIMIT 5;

-- Test 8: Vérifier les dernières activités
SELECT 
    user_name,
    action,
    details->>'fail_id' as fail_id,
    reaction_type,
    timestamp
FROM user_activities 
ORDER BY timestamp DESC 
LIMIT 10;
