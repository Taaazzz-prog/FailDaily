#!/bin/bash

# Script de déploiement FailDaily avec Traefik
# Usage: ./deploy-traefik.sh

set -e

echo "🚀 Déploiement FailDaily avec Traefik..."

# Variables
REMOTE_USER="taaazzz"
REMOTE_HOST="51.75.55.185"
REMOTE_PATH="/home/taaazzz/apps/faildaily"

# 1. Arrêter l'ancienne configuration nginx
echo "📦 Arrêt de l'ancienne configuration nginx..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_PATH} && docker-compose -f docker/production/docker-compose.yaml down --remove-orphans || true"

# 2. Synchroniser les fichiers
echo "📁 Synchronisation des fichiers..."
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='backend-api/uploads' \
  --exclude='frontend/dist' \
  ./ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/

# 3. Build et démarrage avec Traefik
echo "🏗️ Build et démarrage des services..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_PATH} && docker-compose -f docker/production/docker-compose.traefik.yml up -d --build"

# 4. Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# 5. Vérification de l'état des services
echo "🔍 Vérification de l'état des services..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_PATH} && docker-compose -f docker/production/docker-compose.traefik.yml ps"

# 6. Tests de connectivité
echo "🧪 Tests de connectivité..."
echo "- Test health backend:"
ssh ${REMOTE_USER}@${REMOTE_HOST} "curl -f https://faildaily.com/health || echo 'Health check failed'"

echo "- Test frontend:"
ssh ${REMOTE_USER}@${REMOTE_HOST} "curl -f -s -o /dev/null -w '%{http_code}' https://faildaily.com/ || echo 'Frontend check failed'"

# 7. Afficher les logs si nécessaire
echo "📋 Logs récents:"
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_PATH} && docker-compose -f docker/production/docker-compose.traefik.yml logs --tail=10"

echo "✅ Déploiement terminé!"
echo "🌐 Application disponible sur: https://faildaily.com"
echo "🔧 Dashboard Traefik: https://traefik.faildaily.com (admin/admin)"
echo ""
echo "📝 Commandes utiles:"
echo "  Logs: ssh ${REMOTE_USER}@${REMOTE_HOST} 'cd ${REMOTE_PATH} && docker-compose -f docker/production/docker-compose.traefik.yml logs -f'"
echo "  Status: ssh ${REMOTE_USER}@${REMOTE_HOST} 'cd ${REMOTE_PATH} && docker-compose -f docker/production/docker-compose.traefik.yml ps'"
echo "  Restart: ssh ${REMOTE_USER}@${REMOTE_HOST} 'cd ${REMOTE_PATH} && docker-compose -f docker/production/docker-compose.traefik.yml restart'"
