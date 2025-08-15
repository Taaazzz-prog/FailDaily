# Script PowerShell pour diagnostiquer la base de données
$dockerContainerName = "supabase_db_FailDaily"

# Vérifier si le conteneur existe et fonctionne
Write-Host "Vérification du conteneur Docker..."
docker ps -a | Where-Object { $_ -match $dockerContainerName }

# Exécuter le script de diagnostic
Write-Host "Exécution du diagnostic..."
Get-Content "diagnostic.sql" | docker exec -i $dockerContainerName psql -U postgres -d postgres

Write-Host "Diagnostic terminé."
