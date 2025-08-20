#!/bin/bash

# FailDaily - Script de démarrage complet
echo "🚀 FailDaily - Démarrage du projet"

# Fonction d'aide
show_help() {
    echo "Usage: ./start.sh [option]"
    echo ""
    echo "Options:"
    echo "  install     Installer toutes les dépendances"
    echo "  dev         Démarrer frontend + backend en mode développement"
    echo "  frontend    Démarrer uniquement le frontend"
    echo "  backend     Démarrer uniquement le backend"
    echo "  android     Build et synchroniser Android"
    echo "  ios         Build et synchroniser iOS"
    echo "  docker      Démarrer avec Docker"
    echo "  test        Lancer tous les tests"
    echo "  help        Afficher cette aide"
}

# Installation des dépendances
install_deps() {
    echo "📦 Installation des dépendances..."
    npm install
    cd frontend && npm install
    cd ../backend-api && npm install
    cd ..
    echo "✅ Installation terminée"
}

# Démarrage en mode développement
start_dev() {
    echo "🛠️ Démarrage en mode développement..."
    npm run dev:full
}

# Démarrage frontend uniquement
start_frontend() {
    echo "📱 Démarrage du frontend..."
    cd frontend && ionic serve
}

# Démarrage backend uniquement
start_backend() {
    echo "🚀 Démarrage du backend..."
    cd backend-api && npm start
}

# Build Android
build_android() {
    echo "🤖 Build Android..."
    cd frontend
    ionic build
    npx capacitor sync android
    npx capacitor open android
}

# Build iOS
build_ios() {
    echo "🍎 Build iOS..."
    cd frontend
    ionic build
    npx capacitor sync ios
    npx capacitor open ios
}

# Démarrage Docker
start_docker() {
    echo "🐳 Démarrage avec Docker..."
    cd docker && docker-compose up -d --build
    echo "✅ Containers démarrés"
    echo "📱 Frontend: http://localhost:80"
    echo "🚀 Backend: http://localhost:3000"
}

# Tests
run_tests() {
    echo "🧪 Lancement des tests..."
    npm run test:all
}

# Main
case "${1:-help}" in
    install)
        install_deps
        ;;
    dev)
        start_dev
        ;;
    frontend)
        start_frontend
        ;;
    backend)
        start_backend
        ;;
    android)
        build_android
        ;;
    ios)
        build_ios
        ;;
    docker)
        start_docker
        ;;
    test)
        run_tests
        ;;
    help|*)
        show_help
        ;;
esac
