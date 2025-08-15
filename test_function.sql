-- Test de la fonction log_comprehensive_activity avec valeurs valides
SELECT log_comprehensive_activity(
    'auth',
    'auth', -- Changé de 'authentication' à 'auth' qui est autorisé
    'register_failed',
    'Échec inscription utilisateur',
    'test-user-id',
    'profile',
    'test-resource-id',
    NULL,
    'Test de la fonction après correction',
    '{"test": true, "error": "Erreur de test"}',
    NULL,
    NULL,
    '127.0.0.1',
    'Test Browser',
    'test_session',
    false,
    'TEST_ERROR',
    'Message d''erreur de test',
    'correlation_1755246907568_7ozu1rh3n'
) as log_id;

-- Vérifier que l'insertion a fonctionné
SELECT 
    id,
    event_type,
    action,
    title,
    success,
    error_code,
    correlation_id,
    created_at
FROM activity_logs 
WHERE event_type = 'auth'
ORDER BY created_at DESC 
LIMIT 3;
