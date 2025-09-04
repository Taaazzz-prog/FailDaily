#!/bin/bash

# ===============================================
# 🚀 SCRIPT DE DÉPLOIEMENT FAILDAILY PRODUCTION
# ===============================================
# Déploiement automatisé sur serveur OVH Linux

set -euo pipefail

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="faildaily"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"
BACKUP_DIR="./backups"
LOG_FILE="./deploy.log"

# Fonctions utilitaires
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a $LOG_FILE
    exit 1
}

# Vérifications préalables
check_requirements() {
    log "🔍 Vérification des prérequis..."
    
    # Docker
    if ! command -v docker &> /dev/null; then
        error "Docker n'est pas installé"
    fi
    
    # Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose n'est pas installé"
    fi
    
    # Fichier d'environnement
    if [ ! -f "$ENV_FILE" ]; then
        error "Fichier $ENV_FILE manquant. Copiez .env.example vers .env et configurez-le"
    fi
    
    log "✅ Prérequis vérifiés"
}

# Sauvegarde
backup_database() {
    log "💾 Sauvegarde de la base de données..."
    
    mkdir -p $BACKUP_DIR
    
    if docker-compose -f $COMPOSE_FILE ps | grep -q "faildaily-db-prod"; then
        BACKUP_FILE="$BACKUP_DIR/faildaily_backup_$(date +%Y%m%d_%H%M%S).sql"
        
        docker-compose -f $COMPOSE_FILE exec -T database mysqldump \
            -u root -p$(grep DB_ROOT_PASSWORD $ENV_FILE | cut -d '=' -f2) \
            faildaily_prod > $BACKUP_FILE
        
        log "✅ Sauvegarde créée: $BACKUP_FILE"
    else
        warn "Base de données non trouvée, pas de sauvegarde"
    fi
}

# Déploiement
deploy() {
    log "🚀 Démarrage du déploiement FailDaily..."
    
    # Arrêt des anciens conteneurs
    log "🛑 Arrêt des anciens conteneurs..."
    docker-compose -f $COMPOSE_FILE down --remove-orphans
    
    # Nettoyage des images inutiles
    log "🧹 Nettoyage des images inutiles..."
    docker system prune -f
    
    # Construction et démarrage
    log "🔨 Construction des images..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    log "▶️  Démarrage des services..."
    docker-compose -f $COMPOSE_FILE up -d
    
    # Attente du démarrage
    log "⏳ Attente du démarrage des services..."
    sleep 30
    
    # Vérification de l'état
    check_health
}

# Vérification de santé
check_health() {
    log "🏥 Vérification de l'état des services..."
    
    # Vérification database
    if docker-compose -f $COMPOSE_FILE exec database mysqladmin ping -h localhost -u root -p$(grep DB_ROOT_PASSWORD $ENV_FILE | cut -d '=' -f2) > /dev/null 2>&1; then
        log "✅ Base de données: OK"
    else
        error "❌ Base de données: ERREUR"
    fi
    
    # Vérification backend
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log "✅ Backend API: OK"
    else
        error "❌ Backend API: ERREUR"
    fi
    
    # Vérification frontend
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log "✅ Frontend: OK"
    else
        error "❌ Frontend: ERREUR"
    fi
    
    log "🎉 Tous les services sont opérationnels!"
}

# Logs
show_logs() {
    log "📋 Affichage des logs..."
    docker-compose -f $COMPOSE_FILE logs --tail=50 -f
}

# Status
show_status() {
    log "📊 État des services:"
    docker-compose -f $COMPOSE_FILE ps
    
    echo -e "\n${BLUE}📊 Utilisation des ressources:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Menu principal
case "${1:-deploy}" in
    "deploy")
        check_requirements
        backup_database
        deploy
        ;;
    "backup")
        backup_database
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "health")
        check_health
        ;;
    "stop")
        log "🛑 Arrêt des services..."
        docker-compose -f $COMPOSE_FILE down
        ;;
    "restart")
        log "🔄 Redémarrage des services..."
        docker-compose -f $COMPOSE_FILE restart
        ;;
    "update")
        log "🔄 Mise à jour..."
        git pull
        deploy
        ;;
    *)
        echo "Usage: $0 {deploy|backup|logs|status|health|stop|restart|update}"
        echo ""
        echo "Commandes disponibles:"
        echo "  deploy  - Déploiement complet (défaut)"
        echo "  backup  - Sauvegarde de la base de données"
        echo "  logs    - Affichage des logs en temps réel"
        echo "  status  - État des services et ressources"
        echo "  health  - Vérification de santé"
        echo "  stop    - Arrêt des services"
        echo "  restart - Redémarrage des services"
        echo "  update  - Mise à jour depuis Git et redéploiement"
        exit 1
        ;;
esac
