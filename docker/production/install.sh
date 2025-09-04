#!/bin/bash

# ===============================================
# 🚀 INSTALLATION RAPIDE FAILDAILY SUR OVH
# ===============================================
# Script d'installation automatique pour serveur Linux

set -euo pipefail

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}"
echo "==============================================="
echo "🚀 INSTALLATION FAILDAILY PRODUCTION"
echo "==============================================="
echo -e "${NC}"

# Vérification OS
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}❌ Ce script est conçu pour Linux${NC}"
    exit 1
fi

# Installation Docker si nécessaire
install_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}📦 Installation de Docker...${NC}"
        
        # Mise à jour du système
        sudo apt-get update
        
        # Installation des dépendances
        sudo apt-get install -y \
            apt-transport-https \
            ca-certificates \
            curl \
            gnupg \
            lsb-release
        
        # Ajout de la clé GPG Docker
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # Ajout du repository Docker
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
          $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Installation Docker
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io
        
        # Ajout de l'utilisateur au groupe docker
        sudo usermod -aG docker $USER
        
        echo -e "${GREEN}✅ Docker installé${NC}"
    else
        echo -e "${GREEN}✅ Docker déjà installé${NC}"
    fi
}

# Installation Docker Compose si nécessaire
install_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${YELLOW}📦 Installation de Docker Compose...${NC}"
        
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        
        echo -e "${GREEN}✅ Docker Compose installé${NC}"
    else
        echo -e "${GREEN}✅ Docker Compose déjà installé${NC}"
    fi
}

# Installation des outils système
install_system_tools() {
    echo -e "${YELLOW}📦 Installation des outils système...${NC}"
    
    sudo apt-get update
    sudo apt-get install -y \
        git \
        curl \
        wget \
        htop \
        nano \
        unzip \
        fail2ban \
        ufw
    
    echo -e "${GREEN}✅ Outils système installés${NC}"
}

# Configuration du firewall
configure_firewall() {
    echo -e "${YELLOW}🔥 Configuration du firewall...${NC}"
    
    # Configuration UFW
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    
    echo -e "${GREEN}✅ Firewall configuré${NC}"
}

# Configuration des limites système
configure_system_limits() {
    echo -e "${YELLOW}⚙️  Configuration des limites système...${NC}"
    
    # Augmenter les limites pour Docker
    echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
    echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
    echo "root soft nofile 65536" | sudo tee -a /etc/security/limits.conf
    echo "root hard nofile 65536" | sudo tee -a /etc/security/limits.conf
    
    # Configuration VM
    echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    
    echo -e "${GREEN}✅ Limites système configurées${NC}"
}

# Installation principale
main() {
    echo -e "${GREEN}🚀 Démarrage de l'installation...${NC}"
    
    install_system_tools
    install_docker
    install_docker_compose
    configure_firewall
    configure_system_limits
    
    echo -e "${GREEN}"
    echo "==============================================="
    echo "✅ INSTALLATION TERMINÉE"
    echo "==============================================="
    echo ""
    echo "Prochaines étapes:"
    echo "1. Redémarrez votre session: logout/login"
    echo "2. Clonez votre repo: git clone https://github.com/Taaazzz-prog/FailDaily.git faildaily"
    echo "3. Configurez: cd faildaily/docker/production"
    echo "4. Copiez: cp .env.example .env"
    echo "5. Éditez: nano .env"
    echo "6. Déployez: chmod +x deploy.sh && ./deploy.sh"
    echo ""
    echo "🌐 Votre application sera accessible sur:"
    echo "   https://faildaily.com"
    echo "==============================================="
    echo -e "${NC}"
}

# Exécution
main "$@"
