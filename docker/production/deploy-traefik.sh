#!/bin/bash
# ============================================
# 🚀 DÉPLOIEMENT TRAEFIK PRODUCTION - FAILDAILY
# ============================================
# Script de déploiement automatisé avec Traefik + SSL

set -e

echo "🚀 Déploiement FailDaily avec Traefik..."

# Variables
COMPOSE_FILE="docker-compose.ssl-production.yml"
PROJECT_NAME="faildaily"

# Vérification des prérequis
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Fichier $COMPOSE_FILE introuvable"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "❌ Fichier .env introuvable"
    exit 1
fi

# Arrêt des services existants
echo "⏹️ Arrêt des services existants..."
docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --remove-orphans

# Création des volumes si nécessaire
echo "📦 Création des volumes..."
docker volume create faildaily_mysql-data-ssl || true
docker volume create faildaily_backend-uploads-ssl || true
docker volume create faildaily_traefik-ssl-certs || true

# Build et démarrage
echo "🔨 Build et démarrage des services..."
docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d --build

echo "✅ Déploiement terminé !"
echo "🌐 Site : https://faildaily.com"
echo "📊 PowerPoint : https://api.faildaily.com"
echo "📋 Dashboard Traefik : https://faildaily.com:8080"
