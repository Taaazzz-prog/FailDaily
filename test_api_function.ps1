# Test de la fonction via l'API Supabase (simulant le call client)
$dockerContainerName = "supabase_db_FailDaily"

# Tester la fonction directement
$sqlQuery = @"
-- Test direct de la fonction
SELECT public.log_comprehensive_activity(
    'test_api'::text,
    'auth'::text,
    'api_test'::text,
    'Test API direct'::text,
    NULL::text,
    'profile'::text,
    NULL::text,
    NULL::text,
    'Test depuis script PowerShell'::text,
    '{"test": true, "source": "powershell"}'::jsonb,
    NULL::jsonb,
    NULL::jsonb,
    '127.0.0.1'::text,
    'PowerShell Test'::text,
    'ps_session'::text,
    true::boolean,
    NULL::text,
    'Test de la fonction API'::text,
    NULL::text
) as test_result;

-- Vérifier que l'insertion a fonctionné
SELECT 
    id,
    event_type,
    event_category,
    action,
    title,
    success,
    created_at
FROM public.activity_logs 
WHERE event_type = 'test_api'
ORDER BY created_at DESC 
LIMIT 1;
"@

$sqlQuery | docker exec -i $dockerContainerName psql -U postgres -d postgres
