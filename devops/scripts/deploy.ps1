# FailDaily - Script de déploiement
param(
    [Parameter(Position=0)]
    [string]$Environment = "staging",
    
    [Parameter(Position=1)]
    [string]$Version = "latest"
)

Write-Host "🚀 FailDaily - Déploiement $Environment" -ForegroundColor Cyan

# Navigation vers la racine du projet
$rootPath = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $rootPath

function Deploy-Staging {
    Write-Host "📦 Déploiement en staging..." -ForegroundColor Blue
    
    # Build frontend
    Write-Host "📱 Build frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm run build
    
    # Build backend
    Write-Host "🚀 Build backend..." -ForegroundColor Yellow
    Set-Location ../backend-api
    npm run build
    
    # Docker build et push
    Write-Host "🐳 Build et push Docker images..." -ForegroundColor Yellow
    Set-Location ../docker
    docker-compose build
    docker tag faildaily_frontend:latest faildaily_frontend:$Version
    docker tag faildaily_backend:latest faildaily_backend:$Version
    
    Write-Host "✅ Déploiement staging terminé" -ForegroundColor Green
    Set-Location $rootPath
}

function Deploy-Production {
    Write-Host "🔴 Déploiement en production..." -ForegroundColor Red
    Write-Host "⚠️ Êtes-vous sûr de vouloir déployer en production ?" -ForegroundColor Yellow
    $confirmation = Read-Host "Tapez 'PRODUCTION' pour confirmer"
    
    if ($confirmation -eq "PRODUCTION") {
        Write-Host "📦 Déploiement production en cours..." -ForegroundColor Blue
        
        # Tests avant déploiement
        Write-Host "🧪 Lancement des tests..." -ForegroundColor Yellow
        npm run test:all
        
        if ($LASTEXITCODE -eq 0) {
            # Build production
            Write-Host "📱 Build frontend production..." -ForegroundColor Yellow
            Set-Location frontend
            npm run build -- --prod
            
            Write-Host "🚀 Build backend production..." -ForegroundColor Yellow
            Set-Location ../backend-api
            npm run build
            
            # Docker production
            Write-Host "🐳 Build images production..." -ForegroundColor Yellow
            Set-Location ../docker
            docker-compose -f docker-compose.prod.yml build
            
            Write-Host "✅ Déploiement production terminé" -ForegroundColor Green
        } else {
            Write-Host "❌ Tests échoués - Déploiement annulé" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Déploiement annulé" -ForegroundColor Red
    }
    Set-Location $rootPath
}

function Deploy-Local {
    Write-Host "🏠 Déploiement local..." -ForegroundColor Blue
    
    # Clean et rebuild
    Write-Host "🧹 Nettoyage..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force frontend\www -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force backend-api\dist -ErrorAction SilentlyContinue
    
    # Install dependencies
    Write-Host "📦 Installation dépendances..." -ForegroundColor Yellow
    npm install
    Set-Location frontend && npm install
    Set-Location ../backend-api && npm install
    Set-Location $rootPath
    
    # Build
    Write-Host "🔨 Build complet..." -ForegroundColor Yellow
    npm run build:all
    
    Write-Host "✅ Déploiement local terminé" -ForegroundColor Green
}

switch ($Environment.ToLower()) {
    "staging" { Deploy-Staging }
    "production" { Deploy-Production }
    "local" { Deploy-Local }
    default { 
        Write-Host "❌ Environnement non reconnu: $Environment" -ForegroundColor Red
        Write-Host "Environnements disponibles: local, staging, production" -ForegroundColor Yellow
    }
}
