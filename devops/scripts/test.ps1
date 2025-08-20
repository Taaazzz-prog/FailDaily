# FailDaily - Script de tests
param(
    [Parameter(Position=0)]
    [string]$TestType = "all",
    
    [switch]$Coverage,
    [switch]$Watch
)

Write-Host "🧪 FailDaily - Tests $TestType" -ForegroundColor Cyan

# Navigation vers la racine du projet
$rootPath = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $rootPath

function Test-Frontend {
    Write-Host "📱 Tests frontend..." -ForegroundColor Blue
    Set-Location frontend
    
    if ($Watch) {
        npm run test -- --watch
    } elseif ($Coverage) {
        npm run test -- --code-coverage
    } else {
        npm run test
    }
    
    $frontendResult = $LASTEXITCODE
    Set-Location $rootPath
    return $frontendResult
}

function Test-Backend {
    Write-Host "🚀 Tests backend..." -ForegroundColor Blue
    Set-Location backend-api
    
    if ($Watch) {
        npm run test -- --watch
    } elseif ($Coverage) {
        npm run test -- --coverage
    } else {
        npm run test
    }
    
    $backendResult = $LASTEXITCODE
    Set-Location $rootPath
    return $backendResult
}

function Test-E2E {
    Write-Host "🎭 Tests E2E..." -ForegroundColor Blue
    
    # Démarrer les services si nécessaire
    Write-Host "🚀 Démarrage des services..." -ForegroundColor Yellow
    Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev:backend" -PassThru
    Start-Sleep -Seconds 5
    Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev:frontend" -PassThru
    Start-Sleep -Seconds 10
    
    # Lancer les tests E2E
    Set-Location frontend
    npm run e2e
    $e2eResult = $LASTEXITCODE
    
    # Arrêter les services
    Write-Host "🛑 Arrêt des services..." -ForegroundColor Yellow
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    
    Set-Location $rootPath
    return $e2eResult
}

function Test-Age-Validation {
    Write-Host "👶 Tests validation d'âge..." -ForegroundColor Blue
    
    # Lancer le script de test d'âge
    if (Test-Path "devops\scripts\test-age-validation.js") {
        node "devops\scripts\test-age-validation.js"
    } else {
        Write-Host "❌ Script de test d'âge non trouvé" -ForegroundColor Red
        return 1
    }
    
    return $LASTEXITCODE
}

function Test-All {
    Write-Host "🎯 Tests complets..." -ForegroundColor Blue
    
    $results = @()
    
    # Tests unitaires frontend
    Write-Host "`n--- Tests Frontend ---" -ForegroundColor Cyan
    $frontendResult = Test-Frontend
    $results += @{ Name = "Frontend"; Result = $frontendResult }
    
    # Tests unitaires backend
    Write-Host "`n--- Tests Backend ---" -ForegroundColor Cyan
    $backendResult = Test-Backend
    $results += @{ Name = "Backend"; Result = $backendResult }
    
    # Tests validation d'âge
    Write-Host "`n--- Tests Validation Âge ---" -ForegroundColor Cyan
    $ageResult = Test-Age-Validation
    $results += @{ Name = "Age Validation"; Result = $ageResult }
    
    # Tests E2E (optionnel)
    if (-not $Watch) {
        Write-Host "`n--- Tests E2E ---" -ForegroundColor Cyan
        $e2eResult = Test-E2E
        $results += @{ Name = "E2E"; Result = $e2eResult }
    }
    
    # Résumé
    Write-Host "`n📊 Résumé des tests:" -ForegroundColor Yellow
    $totalFailures = 0
    foreach ($result in $results) {
        if ($result.Result -eq 0) {
            Write-Host "✅ $($result.Name): SUCCÈS" -ForegroundColor Green
        } else {
            Write-Host "❌ $($result.Name): ÉCHEC" -ForegroundColor Red
            $totalFailures++
        }
    }
    
    if ($totalFailures -eq 0) {
        Write-Host "`n🎉 Tous les tests sont passés!" -ForegroundColor Green
        return 0
    } else {
        Write-Host "`n💥 $totalFailures test(s) ont échoué" -ForegroundColor Red
        return 1
    }
}

switch ($TestType.ToLower()) {
    "frontend" { Test-Frontend }
    "backend" { Test-Backend }
    "e2e" { Test-E2E }
    "age" { Test-Age-Validation }
    "all" { Test-All }
    default {
        Write-Host "❌ Type de test non reconnu: $TestType" -ForegroundColor Red
        Write-Host "Types disponibles: frontend, backend, e2e, age, all" -ForegroundColor Yellow
        exit 1
    }
}
