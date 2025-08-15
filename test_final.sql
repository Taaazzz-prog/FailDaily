-- Test complet du système de logs après correction
SELECT log_comprehensive_activity(
    'auth',
    'auth',
    'register_test',
    'Test complet après correction',
    NULL,
    'profile',
    NULL,
    NULL,
    'Test avec tous les paramètres corrects',
    '{"test": "post correction", "type": "complet"}',
    NULL,
    NULL,
    '127.0.0.1',
    'Test Browser PostCorrection',
    'session_test_post_correction',
    true,
    NULL,
    'Message de test après correction',
    NULL
) as log_id;

-- Vérifier l'insertion
SELECT 
    id,
    event_type,
    event_category,
    event_level,
    action,
    title,
    message_fr,
    success,
    error_message,
    created_at
FROM activity_logs 
WHERE action = 'register_test'
ORDER BY created_at DESC 
LIMIT 1;
