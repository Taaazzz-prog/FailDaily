# Test de la fonction PostgreSQL
$dockerContainerName = "supabase_db_FailDaily"

Write-Host "Test de la fonction log_comprehensive_activity..."
Get-Content "test_function.sql" | docker exec -i $dockerContainerName psql -U postgres -d postgres
