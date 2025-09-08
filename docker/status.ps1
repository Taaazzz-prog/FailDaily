#!/usr/bin/env pwsh
# ====================================================================
# 🐳 Status Script pour FailDaily Docker - Vérifications rapides
# ====================================================================

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "🐳 FAILDAILY DOCKER - STATUS CHECK" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan

# Vérifier si Docker est en cours d'exécution
Write-Host "`n🔍 Vérification de Docker..." -ForegroundColor Blue
try {
    docker version --format '{{.Server.Version}}' | Out-Null
    Write-Host "✅ Docker est en cours d'exécution" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker n'est pas en cours d'exécution" -ForegroundColor Red
    exit 1
}

# Vérifier les conteneurs
Write-Host "`n📦 Status des conteneurs:" -ForegroundColor Blue
$containers = docker ps --filter "name=faildaily" --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
if ($containers.Count -gt 1) {
    $containers | Format-Table -AutoSize
    Write-Host "✅ Tous les conteneurs sont actifs" -ForegroundColor Green
} else {
    Write-Host "❌ Aucun conteneur FailDaily trouvé" -ForegroundColor Red
}

# Tester les services
Write-Host "`n🌐 Test des services:" -ForegroundColor Blue

# Test Backend API
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend API (http://localhost:3001) - OK" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend API (http://localhost:3001) - ERREUR" -ForegroundColor Red
}

# Test Frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend (http://localhost:8081) - OK" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend (http://localhost:8081) - ERREUR" -ForegroundColor Red
}

# Test Database
try {
    $result = docker exec faildaily_db mysql -u root -pfaildaily_root_password_local -e "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema='faildaily';" 2>$null
    $tableCount = ($result -split "`n" | Select-String -Pattern "^\d+$").ToString()
    if ([int]$tableCount -ge 26) {
        Write-Host "✅ Base de données MySQL (localhost:3308) - OK ($tableCount tables)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Base de données MySQL - Tables manquantes (trouvé: $tableCount, attendu: 26+)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Base de données MySQL (localhost:3308) - ERREUR" -ForegroundColor Red
}

Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "🎯 ACCÈS RAPIDE:" -ForegroundColor Yellow
Write-Host "   • Frontend: http://localhost:8081" -ForegroundColor White
Write-Host "   • API:      http://localhost:3001" -ForegroundColor White
Write-Host "   • MySQL:    localhost:3308" -ForegroundColor White
Write-Host "=====================================================================" -ForegroundColor Cyan
