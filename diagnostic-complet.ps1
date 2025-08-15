# Diagnostic complet de la base de données
$dockerContainerName = "supabase_db_FailDaily"

Write-Host "=== DIAGNOSTIC STRUCTURE ACTIVITY_LOGS ==="
$sqlQuery = @"
-- Vérifier la structure complète de activity_logs
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'activity_logs' 
ORDER BY ordinal_position;

-- Vérifier la définition exacte de la fonction
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'log_comprehensive_activity';

-- Vérifier les types de paramètres de la fonction
SELECT 
    p.parameter_name, 
    p.data_type, 
    p.parameter_mode,
    p.parameter_default
FROM information_schema.parameters p
JOIN information_schema.routines r ON p.specific_name = r.specific_name
WHERE r.routine_name = 'log_comprehensive_activity'
ORDER BY p.ordinal_position;
"@

$sqlQuery | docker exec -i $dockerContainerName psql -U postgres -d postgres
