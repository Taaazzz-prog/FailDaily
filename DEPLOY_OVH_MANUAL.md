# 🚀 COMMANDES DE DÉPLOIEMENT OVH - CSS FIXES
# =============================================
# À exécuter manuellement sur votre serveur OVH

# 1. Se connecter au serveur OVH
ssh debian@51.75.55.185

# 2. Aller dans le dossier du projet
cd /var/www/FailDaily

# 3. Synchroniser avec les dernières modifications
git fetch origin
git reset --hard origin/main
git log --oneline -3

# 4. Vérifier que les corrections CSS sont présentes
echo "🔍 Vérification des corrections CSS..."
grep "build:docker" frontend/package.json
grep "build:docker" docker/frontend.Dockerfile

# 5. Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs..."
cd docker
docker-compose down

# 6. Nettoyer les images obsolètes
echo "🧹 Nettoyage..."
docker system prune -f

# 7. Reconstruire COMPLÈTEMENT avec les nouvelles configs
echo "🔨 Reconstruction avec CSS fixes..."
docker-compose build --no-cache --pull

# 8. Redémarrer les services
echo "🚀 Redémarrage..."
docker-compose up -d

# 9. Attendre et vérifier
echo "⏳ Attente du démarrage..."
sleep 20

# 10. Tester les services
echo "🧪 Tests des services..."
curl -s https://faildaily.com/api/health | grep "status"
curl -s https://faildaily.com | grep "FailDaily"

# 11. Vérifier les conteneurs
docker ps

echo "✅ Déploiement terminé !"
echo "🎨 Testez l'interface admin sur : https://faildaily.com/tabs/admin"
echo "🔑 Login: bruno@taaazzz.be / @51008473@"