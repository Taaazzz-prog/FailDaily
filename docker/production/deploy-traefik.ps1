# ============================================
# 🚀 DÉPLOIEMENT TRAEFIK PRODUCTION - FAILDAILY
# ============================================
# Script PowerShell de déploiement automatisé avec Traefik + SSL

param(
    [switch]$Force = $false
)

Write-Host "🚀 Déploiement FailDaily avec Traefik..." -ForegroundColor Green

# Variables
$ComposeFile = "docker-compose.ssl-production.yml"
$ProjectName = "faildaily"

# Vérification des prérequis
if (-not (Test-Path $ComposeFile)) {
    Write-Host "❌ Fichier $ComposeFile introuvable" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path ".env")) {
    Write-Host "❌ Fichier .env introuvable" -ForegroundColor Red
    exit 1
}

try {
    # Arrêt des services existants
    Write-Host "⏹️ Arrêt des services existants..." -ForegroundColor Yellow
    docker-compose -f $ComposeFile -p $ProjectName down --remove-orphans

    # Création des volumes si nécessaire
    Write-Host "📦 Création des volumes..." -ForegroundColor Blue
    docker volume create faildaily_mysql-data-ssl
    docker volume create faildaily_backend-uploads-ssl
    docker volume create faildaily_traefik-ssl-certs

    # Build et démarrage
    Write-Host "🔨 Build et démarrage des services..." -ForegroundColor Cyan
    docker-compose -f $ComposeFile -p $ProjectName up -d --build

    Write-Host "✅ Déploiement terminé !" -ForegroundColor Green
    Write-Host "🌐 Site : https://faildaily.com" -ForegroundColor White
    Write-Host "📊 PowerPoint : https://api.faildaily.com" -ForegroundColor White
    Write-Host "📋 Dashboard Traefik : https://faildaily.com:8080" -ForegroundColor White
}
catch {
    Write-Host "❌ Erreur lors du déploiement : $_" -ForegroundColor Red
    exit 1
}
