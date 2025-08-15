# Vérifier le schéma de la fonction
$dockerContainerName = "supabase_db_FailDaily"

$sqlQuery = @"
-- Vérifier dans quel schéma se trouve la fonction
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'log_comprehensive_activity';

-- Vérifier les permissions sur la fonction
SELECT 
    routine_schema,
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name = 'log_comprehensive_activity';

-- Vérifier si Supabase peut voir la fonction dans le schéma API
SELECT schema_name, function_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%log%';
"@

$sqlQuery | docker exec -i $dockerContainerName psql -U postgres -d postgres
