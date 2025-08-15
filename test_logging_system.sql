-- Test rapide du système de logging
-- Exécutez ceci dans l'éditeur SQL de Supabase pour vérifier que tout fonctionne

-- 1. Vérifier que la fonction existe
SELECT proname 
FROM pg_proc 
WHERE proname = 'log_comprehensive_activity';

-- 2. Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('activity_logs', 'user_sessions', 'usage_metrics');

-- 3. Test d'insertion de log
SELECT log_comprehensive_activity(
    'test_system',
    'system',
    'test_logging',
    'Test du système de logging',
    NULL,
    'test',
    gen_random_uuid(),
    NULL,
    'Test pour vérifier que le logging fonctionne correctement',
    '{"test": true, "timestamp": "2025-08-15"}',
    NULL,
    NULL,
    '127.0.0.1',
    'Test User Agent',
    'test_session_123',
    true,
    NULL,
    50,
    NULL
);

-- 4. Vérifier que le log a été inséré
SELECT 
    id,
    event_type,
    event_category,
    action,
    title,
    description,
    success,
    created_at
FROM activity_logs 
WHERE action = 'test_logging'
ORDER BY created_at DESC 
LIMIT 1;

-- 5. Compter les logs existants
SELECT 
    event_category,
    COUNT(*) as log_count
FROM activity_logs 
GROUP BY event_category
ORDER BY log_count DESC;
