#!/bin/bash

# FailDaily - Script de déploiement
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}

echo "🚀 FailDaily - Déploiement $ENVIRONMENT"

# Navigation vers la racine du projet
ROOT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_PATH"

deploy_staging() {
    echo "📦 Déploiement en staging..."
    
    # Build frontend
    echo "📱 Build frontend..."
    cd frontend
    npm run build
    
    # Build backend
    echo "🚀 Build backend..."
    cd ../backend-api
    npm run build
    
    # Docker build et push
    echo "🐳 Build et push Docker images..."
    cd ../docker
    docker-compose build
    docker tag faildaily_frontend:latest faildaily_frontend:$VERSION
    docker tag faildaily_backend:latest faildaily_backend:$VERSION
    
    echo "✅ Déploiement staging terminé"
    cd "$ROOT_PATH"
}

deploy_production() {
    echo "🔴 Déploiement en production..."
    echo "⚠️ Êtes-vous sûr de vouloir déployer en production ?"
    read -p "Tapez 'PRODUCTION' pour confirmer: " confirmation
    
    if [ "$confirmation" = "PRODUCTION" ]; then
        echo "📦 Déploiement production en cours..."
        
        # Tests avant déploiement
        echo "🧪 Lancement des tests..."
        npm run test:all
        
        if [ $? -eq 0 ]; then
            # Build production
            echo "📱 Build frontend production..."
            cd frontend
            npm run build -- --prod
            
            echo "🚀 Build backend production..."
            cd ../backend-api
            npm run build
            
            # Docker production
            echo "🐳 Build images production..."
            cd ../docker
            docker-compose -f docker-compose.prod.yml build
            
            echo "✅ Déploiement production terminé"
        else
            echo "❌ Tests échoués - Déploiement annulé"
        fi
    else
        echo "❌ Déploiement annulé"
    fi
    cd "$ROOT_PATH"
}

deploy_local() {
    echo "🏠 Déploiement local..."
    
    # Clean et rebuild
    echo "🧹 Nettoyage..."
    rm -rf frontend/www
    rm -rf backend-api/dist
    
    # Install dependencies
    echo "📦 Installation dépendances..."
    npm install
    cd frontend && npm install
    cd ../backend-api && npm install
    cd "$ROOT_PATH"
    
    # Build
    echo "🔨 Build complet..."
    npm run build:all
    
    echo "✅ Déploiement local terminé"
}

case "${ENVIRONMENT,,}" in
    "staging")
        deploy_staging
        ;;
    "production")
        deploy_production
        ;;
    "local")
        deploy_local
        ;;
    *)
        echo "❌ Environnement non reconnu: $ENVIRONMENT"
        echo "Environnements disponibles: local, staging, production"
        ;;
esac
