#!/bin/bash

# ===============================================
# 🚀 DÉPLOIEMENT ULTRA-RAPIDE FAILDAILY
# ===============================================
# Un seul script pour tout installer et déployer

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}"
echo "==============================================="
echo "🚀 DÉPLOIEMENT ULTRA-RAPIDE FAILDAILY"
echo "==============================================="
echo -e "${NC}"

# Variables
REPO_URL="https://github.com/VotreRepo/FailDaily.git"  # À MODIFIER
PROJECT_DIR="faildaily"

# Vérifications
if [[ "$EUID" -eq 0 ]]; then
    echo -e "${RED}❌ Ne pas exécuter en tant que root${NC}"
    exit 1
fi

if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}❌ Script conçu pour Linux uniquement${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Installation des dépendances système...${NC}"

# Mise à jour système
sudo apt update -qq

# Installation Docker si nécessaire
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}🐳 Installation Docker...${NC}"
    
    sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt update -qq
    sudo apt install -y docker-ce docker-ce-cli containerd.io
    sudo usermod -aG docker $USER
fi

# Installation Docker Compose si nécessaire
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}📦 Installation Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Installation Git si nécessaire
if ! command -v git &> /dev/null; then
    sudo apt install -y git
fi

echo -e "${YELLOW}📥 Téléchargement du projet...${NC}"

# Suppression ancien projet si existe
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}🧹 Suppression ancienne installation...${NC}"
    cd $PROJECT_DIR/docker/production 2>/dev/null && ./deploy.sh stop 2>/dev/null || true
    cd - > /dev/null
    sudo rm -rf $PROJECT_DIR
fi

# Clone du projet
git clone $REPO_URL $PROJECT_DIR
cd $PROJECT_DIR/docker/production

echo -e "${YELLOW}⚙️  Configuration de l'environnement...${NC}"

# Configuration environnement
cp .env.example .env

# Génération de secrets aléatoires
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '\n' | tr -d '=+/')
DB_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d '\n' | tr -d '=+/')

# Remplacement dans .env
sed -i "s/CHANGEZ_CETTE_CLE_SECRETE_TRES_LONGUE_ET_COMPLEXE_PRODUCTION/$JWT_SECRET/" .env
sed -i "s/CHANGEZ_CE_MOT_DE_PASSE_MYSQL_COMPLEXE/$DB_PASSWORD/" .env
sed -i "s/CHANGEZ_CE_MOT_DE_PASSE_ROOT_MYSQL_ULTRA_SECURISE/$DB_ROOT_PASSWORD/" .env

# Configuration IP publique
PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
sed -i "s/https:\/\/faildaily.com/http:\/\/$PUBLIC_IP/" .env

echo -e "${YELLOW}🚀 Déploiement de l'application...${NC}"

# Rendre le script exécutable
chmod +x deploy.sh

# Déploiement
./deploy.sh deploy

echo -e "${GREEN}"
echo "==============================================="
echo "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
echo "==============================================="
echo ""
echo "📍 Votre application FailDaily est accessible :"
echo "   🌐 Frontend : http://$PUBLIC_IP/"
echo "   🔌 API      : http://$PUBLIC_IP/api/"
echo "   💚 Health   : http://$PUBLIC_IP/health"
echo ""
echo "🔧 Commandes utiles :"
echo "   cd $PROJECT_DIR/docker/production"
echo "   ./deploy.sh status   # État des services"
echo "   ./deploy.sh logs     # Voir les logs"
echo "   ./deploy.sh backup   # Sauvegarder"
echo "   ./deploy.sh restart  # Redémarrer"
echo ""
echo "🔒 Sécurité :"
echo "   - JWT Secret : Généré automatiquement"
echo "   - DB Password : Généré automatiquement"
echo "   - Firewall : Configurez UFW si nécessaire"
echo ""
echo "📋 Next Steps :"
echo "   1. Configurez votre domaine si vous en avez un"
echo "   2. Mettez en place HTTPS avec Let's Encrypt"
echo "   3. Configurez des sauvegardes automatiques"
echo "==============================================="
echo -e "${NC}"

# Information sur le redémarrage de session
if groups $USER | grep -q docker; then
    echo -e "${YELLOW}ℹ️  Docker est déjà configuré pour votre utilisateur${NC}"
else
    echo -e "${YELLOW}⚠️  Redémarrez votre session SSH pour utiliser Docker sans sudo${NC}"
fi
