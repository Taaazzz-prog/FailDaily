# Script PowerShell de déploiement FailDaily local avec Traefik
# Usage: .\deploy-local.ps1

Write-Host "🚀 Déploiement FailDaily local avec Traefik..." -ForegroundColor Green

try {
    # 1. Arrêter les anciens conteneurs s'ils existent
    Write-Host "📦 Arrêt des anciens conteneurs..." -ForegroundColor Yellow
    docker-compose -f docker-compose.local.yml down --remove-orphans 2>$null

    # 2. Build et démarrage avec Traefik
    Write-Host "🏗️ Build et démarrage des services..." -ForegroundColor Yellow
    docker-compose -f docker-compose.local.yml up -d --build

    # 3. Attendre que les services soient prêts
    Write-Host "⏳ Attente du démarrage des services..." -ForegroundColor Yellow
    Start-Sleep -Seconds 20

    # 4. Vérification de l'état des services
    Write-Host "🔍 Vérification de l'état des services..." -ForegroundColor Yellow
    docker-compose -f docker-compose.local.yml ps

    # 5. Tests de connectivité
    Write-Host "🧪 Tests de connectivité..." -ForegroundColor Yellow
    Write-Host "- Test health backend:"
    try {
        $healthResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ Backend OK (Status: $($healthResponse.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "❌ Backend check failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host "- Test frontend:"
    try {
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:8000/" -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ Frontend OK (Status: $($frontendResponse.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "❌ Frontend check failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    # 6. Afficher les logs récents
    Write-Host "📋 Logs récents:" -ForegroundColor Yellow
    docker-compose -f docker-compose.local.yml logs --tail=5

    Write-Host "✅ Déploiement local terminé!" -ForegroundColor Green
    Write-Host "🌐 Application disponible sur: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "🔧 Dashboard Traefik: http://localhost:8080" -ForegroundColor Cyan
    Write-Host "🗄️ Base de données: localhost:3307" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Commandes utiles:" -ForegroundColor Yellow
    Write-Host "  Logs: docker-compose -f docker-compose.local.yml logs -f"
    Write-Host "  Status: docker-compose -f docker-compose.local.yml ps"
    Write-Host "  Restart: docker-compose -f docker-compose.local.yml restart"
    Write-Host "  Stop: docker-compose -f docker-compose.local.yml down"

} catch {
    Write-Host "❌ Erreur lors du déploiement: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
