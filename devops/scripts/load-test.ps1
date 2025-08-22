# FailDaily - Script de tests de charge simplifié
param(
    [Parameter(Position=0)]
    [string]$Target = "help",
    
    [Parameter(Position=1)]
    [int]$Users = 5
)

Write-Host "FailDaily - Tests de charge" -ForegroundColor Cyan

function Show-Help {
    Write-Host "Usage: .\load-test.ps1 [target] [users]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Parametres:" -ForegroundColor White
    Write-Host "  target      api, registration, all, help" -ForegroundColor Green
    Write-Host "  users       Nombre d'utilisateurs (defaut: 5)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Exemples:" -ForegroundColor White
    Write-Host "  .\load-test.ps1 api 10" -ForegroundColor Cyan
    Write-Host "  .\load-test.ps1 registration 5" -ForegroundColor Cyan
}

function Test-Backend-Available {
    try {
        Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 3 | Out-Null
        Write-Host "Backend disponible" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Backend non disponible - Demarrez avec: npm run dev:backend" -ForegroundColor Red
        return $false
    }
}

function Test-API-Load {
    Write-Host "Test de charge API avec $Users utilisateurs..." -ForegroundColor Blue
    
    $success = 0
    $errors = 0
    $startTime = Get-Date
    
    for ($i = 1; $i -le $Users; $i++) {
        try {
            Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 2 | Out-Null
            $success++
            Write-Host "Requete $i - OK" -ForegroundColor Green
        } catch {
            $errors++
            Write-Host "Requete $i - ERREUR" -ForegroundColor Red
        }
        Start-Sleep -Milliseconds 200
    }
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host "`nResultats:" -ForegroundColor Yellow
    Write-Host "Succes: $success" -ForegroundColor Green
    Write-Host "Erreurs: $errors" -ForegroundColor Red
    Write-Host "Duree: $duration secondes" -ForegroundColor Yellow
}

function Test-Registration-Load {
    Write-Host "Test de charge Registration avec $Users utilisateurs..." -ForegroundColor Blue
    
    $adultOK = 0
    $minorOK = 0
    $childBlocked = 0
    $errors = 0
    
    for ($i = 1; $i -le $Users; $i++) {
        $email = "loadtest$i@example.com"
        
        # Test adulte
        try {
            $adultBody = @{
                email = $email
                password = "Test123!"
                displayName = "Adult$i"
                birthDate = "1990-01-01"
            } | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -Body $adultBody -ContentType "application/json" -TimeoutSec 3
            if ($response.token) {
                $adultOK++
                Write-Host "Adulte $i - Inscrit" -ForegroundColor Green
            }
        } catch {
            $errors++
            Write-Host "Adulte $i - Erreur" -ForegroundColor Red
        }
        
        Start-Sleep -Milliseconds 300
        
        # Test mineur
        $minorEmail = "minor$i@example.com"
        try {
            $minorBody = @{
                email = $minorEmail
                password = "Test123!"
                displayName = "Minor$i"
                birthDate = "2010-01-01"
            } | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -Body $minorBody -ContentType "application/json" -TimeoutSec 3
            if ($response.parentalConsentRequired) {
                $minorOK++
                Write-Host "Mineur $i - Consentement requis" -ForegroundColor Yellow
            }
        } catch {
            $errors++
            Write-Host "Mineur $i - Erreur" -ForegroundColor Red
        }
        
        Start-Sleep -Milliseconds 300
    }
    
    Write-Host "`nResultats Registration:" -ForegroundColor Yellow
    Write-Host "Adultes inscrits: $adultOK" -ForegroundColor Green
    Write-Host "Mineurs (consentement): $minorOK" -ForegroundColor Yellow
    Write-Host "Erreurs: $errors" -ForegroundColor Red
}

# Verification backend seulement si ce n'est pas l'aide
if ($Target.ToLower() -ne "help") {
    if (-not (Test-Backend-Available)) {
        exit 1
    }
}

# Execution
switch ($Target.ToLower()) {
    "api" { Test-API-Load }
    "registration" { Test-Registration-Load }
    "all" { 
        Test-API-Load
        Write-Host "`n" -ForegroundColor White
        Test-Registration-Load
    }
    default { Show-Help }
}

Write-Host "`nTests termines!" -ForegroundColor Green
