# Test de la fonction via l'API REST de Supabase
$supabaseUrl = "http://127.0.0.1:54321"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Headers
$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

# Body de test
$body = @{
    p_event_type = "test_http"
    p_event_category = "auth"
    p_action = "http_test"
    p_title = "Test via HTTP API"
    p_user_id = $null
    p_resource_type = "test"
    p_resource_id = $null
    p_target_user_id = $null
    p_description = "Test de la fonction via l'API REST Supabase"
    p_payload = @{ test = $true; source = "powershell_http" }
    p_old_values = $null
    p_new_values = $null
    p_ip_address = "127.0.0.1"
    p_user_agent = "PowerShell Test Client"
    p_session_id = "http_test_session"
    p_success = $true
    p_error_code = $null
    p_error_message = "Test HTTP message"
    p_correlation_id = $null
} | ConvertTo-Json

Write-Host "=== TEST API REST SUPABASE ===" -ForegroundColor Yellow
Write-Host "URL: $supabaseUrl/rest/v1/rpc/log_comprehensive_activity" -ForegroundColor Cyan
Write-Host "Body: $body" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/log_comprehensive_activity" -Method POST -Headers $headers -Body $body
    Write-Host "✅ Succès !" -ForegroundColor Green
    Write-Host "Réponse: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur !" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}
