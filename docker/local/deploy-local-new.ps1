#!/usr/bin/env pwsh

Write-Host "🚀 Déploiement FailDaily Local avec Docker + Traefik" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Arrêter les services existants
Write-Host "⏹️  Arrêt des services existants..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml down

# Nettoyer les images si nécessaire
Write-Host "🧹 Nettoyage des images anciennes..." -ForegroundColor Yellow
docker image prune -f

# Rebuild et démarrer
Write-Host "🔨 Reconstruction et démarrage des services..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml up -d --build

# Attendre que les services soient prêts
Write-Host "⏳ Attente du démarrage des services..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Vérifier l'état des services
Write-Host "🔍 Vérification de l'état des services..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml ps

# Tester les endpoints
Write-Host "`n🔍 Tests de connectivité..." -ForegroundColor Green

# Test API Health
Write-Host "🏥 Test API Health..."
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET
    Write-Host "✅ API Health: $($healthResponse.status)" -ForegroundColor Green
    Write-Host "   Environment: $($healthResponse.environment)" -ForegroundColor Gray
    Write-Host "   Version: $($healthResponse.version)" -ForegroundColor Gray
} catch {
    Write-Host "❌ API Health: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Frontend
Write-Host "🌐 Test Frontend..."
try {
    $frontResponse = Invoke-WebRequest -Uri "http://localhost:8000/" -UseBasicParsing
    if ($frontResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend: OK ($(($frontResponse.Content.Length)) bytes)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Base de données
Write-Host "🗃️  Test Base de données..."
try {
    # Test avec l'utilisateur applicatif
    $dbTest = docker-compose -f docker-compose.local.yml exec -T db mysql -u faildaily_user -p'@51008473@Alexia@' -D faildaily -e "SELECT 1 as test;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Base de données: Connexion OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Base de données: Connexion FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Base de données: FAILED" -ForegroundColor Red
}

Write-Host "`n🎯 URLs disponibles:" -ForegroundColor Green
Write-Host "   📱 Application: http://localhost:8000" -ForegroundColor White
Write-Host "   🔧 API: http://localhost:8000/api/" -ForegroundColor White  
Write-Host "   🚦 Traefik Dashboard: http://localhost:8080" -ForegroundColor White
Write-Host "   🗃️  MySQL: localhost:3307" -ForegroundColor White

Write-Host "`n✅ Déploiement terminé!" -ForegroundColor Green
