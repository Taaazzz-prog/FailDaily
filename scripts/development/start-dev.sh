#!/bin/bash
# Script de démarrage simple pour FailDaily

echo "🚀 Démarrage FailDaily - Environnement de développement"
echo ""

# Fonction pour nettoyer les processus en cas d'arrêt
cleanup() {
    echo "🛑 Arrêt des services..."
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "ng serve" 2>/dev/null || true
    exit 0
}

# Intercepter Ctrl+C
trap cleanup INT

# Démarrer le backend
echo "🔧 Démarrage du backend (port 3000)..."
cd "backend-api"
node server.js &
BACKEND_PID=$!

# Attendre que le backend soit prêt
sleep 3

# Démarrer le frontend  
echo "🎨 Démarrage du frontend (port 4200)..."
cd "../frontend"
ng serve --proxy-config proxy.conf.json --port 4200 &
FRONTEND_PID=$!

echo ""
echo "✅ Services démarrés !"
echo "📡 Backend: http://localhost:3000"
echo "🌐 Frontend: http://localhost:4200"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter tous les services"

# Attendre les processus
wait $BACKEND_PID $FRONTEND_PID