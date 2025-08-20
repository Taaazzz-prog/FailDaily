#!/bin/bash
# 🐳 Script de déploiement Docker FailDaily
# =========================================

echo "🚀 Déploiement FailDaily avec Docker"
echo "===================================="

# Arrêt des conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down

# Nettoyage des images obsolètes
echo "🧹 Nettoyage des images obsolètes..."
docker image prune -f

# Construction et démarrage
echo "🔨 Construction et démarrage des conteneurs..."
docker-compose up --build -d

# Attendre que la base soit prête
echo "⏳ Attente de la base de données..."
sleep 30

# Vérification des conteneurs
echo "✅ Vérification des conteneurs..."
docker-compose ps

echo ""
echo "🎉 Déploiement terminé !"
echo "========================"
echo "Frontend: http://localhost"
echo "Backend:  http://localhost:3000"
echo "MySQL:    localhost:3306"
