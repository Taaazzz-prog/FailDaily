# Script PowerShell de déploiement FailDaily avec Traefik
# Usage: .\deploy-traefik.ps1

Write-Host "🚀 Déploiement FailDaily avec Traefik..." -ForegroundColor Green

# Variables
$REMOTE_USER = "taaazzz"
$REMOTE_HOST = "51.75.55.185"
$REMOTE_PATH = "/home/taaazzz/apps/faildaily"

try {
    # 1. Arrêter l'ancienne configuration nginx
    Write-Host "📦 Arrêt de l'ancienne configuration nginx..." -ForegroundColor Yellow
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_PATH} && docker-compose -f docker/production/docker-compose.yaml down --remove-orphans 2>/dev/null || true"

    # 2. Synchroniser les fichiers avec rsync
    Write-Host "📁 Synchronisation des fichiers..." -ForegroundColor Yellow
    $excludeParams = @(
        "--exclude='node_modules'",
        "--exclude='.git'", 
        "--exclude='backend-api/uploads'",
        "--exclude='frontend/dist'"
    )
    & rsync -avz --delete $excludeParams "./" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

    # 3. Build et démarrage avec Traefik
    Write-Host "🏗️ Build et démarrage des services..." -ForegroundColor Yellow
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_PATH} && docker-compose -f docker/production/docker-compose.traefik.yml up -d --build"

    # 4. Attendre que les services soient prêts
    Write-Host "⏳ Attente du démarrage des services..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30

    # 5. Vérification de l'état des services
    Write-Host "🔍 Vérification de l'état des services..." -ForegroundColor Yellow
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_PATH} && docker-compose -f docker/production/docker-compose.traefik.yml ps"

    # 6. Tests de connectivité
    Write-Host "🧪 Tests de connectivité..." -ForegroundColor Yellow
    Write-Host "- Test health backend:"
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "curl -f https://faildaily.com/health 2>/dev/null || echo 'Health check failed'"

    Write-Host "- Test frontend:"
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "curl -f -s -o /dev/null -w '%{http_code}' https://faildaily.com/ 2>/dev/null || echo 'Frontend check failed'"

    # 7. Afficher les logs récents
    Write-Host "📋 Logs récents:" -ForegroundColor Yellow
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_PATH} && docker-compose -f docker/production/docker-compose.traefik.yml logs --tail=10"

    Write-Host "✅ Déploiement terminé!" -ForegroundColor Green
    Write-Host "🌐 Application disponible sur: https://faildaily.com" -ForegroundColor Cyan
    Write-Host "🔧 Dashboard Traefik: https://traefik.faildaily.com" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Commandes utiles:" -ForegroundColor Yellow
    Write-Host "  Logs: ssh ${REMOTE_USER}@${REMOTE_HOST} 'cd ${REMOTE_PATH} && docker-compose -f docker/production/docker-compose.traefik.yml logs -f'"
    Write-Host "  Status: ssh ${REMOTE_USER}@${REMOTE_HOST} 'cd ${REMOTE_PATH} && docker-compose -f docker/production/docker-compose.traefik.yml ps'"
    Write-Host "  Restart: ssh ${REMOTE_USER}@${REMOTE_HOST} 'cd ${REMOTE_PATH} && docker-compose -f docker/production/docker-compose.traefik.yml restart'"

} catch {
    Write-Host "❌ Erreur lors du déploiement: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
