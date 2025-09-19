#!/bin/bash

# ================================================================
# 🚀 Script de déploiement FailDaily pour serveur OVH
# ================================================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Démarrage du déploiement FailDaily..."

# Variables de configuration
PROJECT_DIR="/home/taaazzz/FailDaily"
DOCKER_COMPOSE_FILE="docker-compose.ssl-production.yml"
ENV_FILE="docker/.env.production"
GITHUB_REPO="https://github.com/Taaazzz-prog/FailDaily.git"
DOMAIN="faildaily.com"
EMAIL="contact@taaazzz-prog.fr"

# 1. Créer le répertoire du projet
echo "📁 Création du répertoire projet..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 2. Vérifier que Git est installé
if ! command -v git &> /dev/null; then
    echo "⚠️  Git n'est pas installé. Installation..."
    sudo apt update && sudo apt install git -y
fi

# 3. Cloner ou mettre à jour le projet
if [ -d ".git" ]; then
    echo "🔄 Mise à jour du projet existant..."
    git pull origin main
else
    echo "📥 Clonage du projet depuis GitHub..."
    git clone $GITHUB_REPO .
fi

# 4. Vérifier que Docker et Docker Compose sont installés
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  Docker Compose n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# 5. Créer le fichier d'environnement de production
echo "⚙️  Configuration de l'environnement de production..."
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Création du fichier .env.production..."
    cat > $ENV_FILE << 'EOF'
# ====================================================================
# 🐳 Configuration Docker pour FailDaily - PRODUCTION OVH
# ====================================================================

# ==========================================
# 🗄️ CONFIGURATION BASE DE DONNÉES MYSQL
# ==========================================
DB_ROOT_PASSWORD=@51008473@Alexia@
DB_NAME=faildaily
DB_USER=faildaily_user
DB_PASSWORD=@51008473@Alexia@
DB_HOST=db
DB_PORT=3306

# ==========================================
# 🔧 CONFIGURATION BACKEND API
# ==========================================
NODE_ENV=production
PORT=3000
JWT_SECRET=faildaily_super_secret_key_for_production_2025_bruno_taaazzz
API_BASE_URL=https://faildaily.com/api

# ==========================================
# 📧 CONFIGURATION EMAIL SMTP OVH
# ==========================================
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contact@taaazzz-prog.fr
SMTP_PASS=@51008473@Alexia@
SMTP_FROM=FailDaily <contact@taaazzz-prog.fr>
APP_WEB_URL=https://faildaily.com

# ==========================================
# 🔑 CLÉS API EXTERNES
# ==========================================
OPENAI_API_KEY=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
OPENAI_MODEL=gpt-3.5-turbo

# ==========================================
# 📱 CONFIGURATION UPLOADS
# ==========================================
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,gif,webp
UPLOAD_PATH=/app/uploads

# ==========================================
# 🌐 CONFIGURATION TRAEFIK/SSL
# ==========================================
TRAEFIK_EMAIL=contact@taaazzz-prog.fr
DOMAIN_NAME=faildaily.com
API_DOMAIN=api.faildaily.com

EOF
    echo "⚠️  IMPORTANT : Éditez le fichier $ENV_FILE avec vos vraies données !"
    echo "📝 Commande : nano $ENV_FILE"
fi

# 6. Créer les répertoires nécessaires
echo "📁 Création des répertoires de données..."
sudo mkdir -p uploads
sudo mkdir -p data/mysql
sudo mkdir -p data/letsencrypt
sudo chown -R 1000:1000 uploads
sudo chmod 755 uploads

# 7. Importer la base de données
echo "🗄️  Import de la base de données..."
if [ -f "backend-api/migrations/faildaily.sql" ]; then
    echo "📄 Fichier SQL principal trouvé, prêt pour l'import"
else
    echo "⚠️  Fichier SQL manquant : backend-api/migrations/faildaily.sql"
fi

# 8. Construire et démarrer les conteneurs
echo "🐳 Construction et démarrage des conteneurs Docker..."
docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
docker-compose -f $DOCKER_COMPOSE_FILE up -d

# 9. Attendre que MySQL soit prêt
echo "⏳ Attente que MySQL soit prêt..."
sleep 30

# 10. Importer la base de données si le fichier existe
if [ -f "backend-api/migrations/faildaily.sql" ]; then
    echo "📥 Import de la base de données..."
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T db mysql -u root -p$DB_ROOT_PASSWORD $DB_NAME < backend-api/migrations/faildaily.sql
    echo "✅ Base de données importée avec succès"
fi

# 11. Vérifier les services
echo "🔍 Vérification des services..."
docker-compose -f $DOCKER_COMPOSE_FILE ps

echo ""
echo "🎉 Déploiement terminé !"
echo "🌐 Votre application devrait être accessible sur : https://faildaily.com"
echo "🔧 Dashboard Traefik : https://faildaily.com:8080"
echo ""
echo "📝 N'oubliez pas de :"
echo "   1. Configurer vos DNS chez OVH"
echo "   2. Éditer le fichier $ENV_FILE"
echo "   3. Redémarrer les services : docker-compose -f $DOCKER_COMPOSE_FILE restart"
echo ""