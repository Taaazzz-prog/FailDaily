# Script de test des fonctions corrigées via API REST

# Test de log_user_login
$loginBody = @{
    p_user_id = "f211d624-55b8-4aa2-a77d-f8e425fc1513"
    p_action = "test_login"
    p_category = "auth"
    p_description = "Test de connexion après correction"
    p_metadata = @{ test = $true; timestamp = (Get-Date).ToString() }
} | ConvertTo-Json

$loginHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    'Content-Type' = 'application/json'
}

Write-Host "Test de log_user_login..."
try {
    $loginResponse = Invoke-RestMethod -Uri "http://127.0.0.1:54321/rest/v1/rpc/log_user_login" -Method Post -Body $loginBody -Headers $loginHeaders
    Write-Host "✅ log_user_login réussie: $loginResponse" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur log_user_login: $($_.Exception.Message)" -ForegroundColor Red
}

# Test de log_comprehensive_activity
$compBody = @{
    p_user_id = "f211d624-55b8-4aa2-a77d-f8e425fc1513"
    p_action = "test_comprehensive"
    p_category = "profile"
    p_related_id = "f211d624-55b8-4aa2-a77d-f8e425fc1513"
    p_severity = "info"
    p_description = "Test d'activité complète après correction"
    p_metadata = @{ test = $true; comprehensive = $true; timestamp = (Get-Date).ToString() }
} | ConvertTo-Json

Write-Host "Test de log_comprehensive_activity..."
try {
    $compResponse = Invoke-RestMethod -Uri "http://127.0.0.1:54321/rest/v1/rpc/log_comprehensive_activity" -Method Post -Body $compBody -Headers $loginHeaders
    Write-Host "✅ log_comprehensive_activity réussie: $compResponse" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur log_comprehensive_activity: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Tests terminés!"
