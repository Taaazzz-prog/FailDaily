# 🐳 Script de déploiement Docker FailDaily (Windows)
# ==================================================

Write-Host "🚀 Déploiement FailDaily avec Docker" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Arrêt des conteneurs existants
Write-Host "🛑 Arrêt des conteneurs existants..." -ForegroundColor Yellow
docker-compose down

# Nettoyage des images obsolètes
Write-Host "🧹 Nettoyage des images obsolètes..." -ForegroundColor Yellow
docker image prune -f

# Construction et démarrage
Write-Host "🔨 Construction et démarrage des conteneurs..." -ForegroundColor Yellow
docker-compose up --build -d

# Attendre que la base soit prête
Write-Host "⏳ Attente de la base de données..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Vérification des conteneurs
Write-Host "✅ Vérification des conteneurs..." -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "🎉 Déploiement terminé !" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host "Frontend: http://localhost" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "MySQL:    localhost:3306" -ForegroundColor Cyan
