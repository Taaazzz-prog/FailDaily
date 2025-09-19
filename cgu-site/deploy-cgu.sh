#!/bin/bash

# Script de déploiement du site CGU sur cgu.faildaily.com
# Utilisation : ./deploy-cgu.sh

set -e

echo "🚀 Déploiement du site CGU FailDaily"
echo "=================================="

# Variables
CGU_DOMAIN="cgu.faildaily.com"
CONTAINER_NAME="faildaily_cgu"
NETWORK_NAME="faildaily-network"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifications préalables
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    if [ ! -f "docker-compose.cgu.yml" ]; then
        log_error "Fichier docker-compose.cgu.yml introuvable"
        exit 1
    fi
    
    if [ ! -f "cgu-nginx.conf" ]; then
        log_error "Fichier cgu-nginx.conf introuvable"
        exit 1
    fi
    
    if [ ! -f "index.html" ]; then
        log_error "Fichier index.html introuvable"
        exit 1
    fi
    
    log_success "Prérequis validés"
}

# Créer le réseau Docker si nécessaire
create_network() {
    log_info "Vérification du réseau Docker..."
    
    if ! docker network ls | grep -q "$NETWORK_NAME"; then
        log_info "Création du réseau $NETWORK_NAME..."
        docker network create $NETWORK_NAME
        log_success "Réseau créé"
    else
        log_success "Réseau existant"
    fi
}

# Arrêter le conteneur existant
stop_existing_container() {
    log_info "Arrêt du conteneur existant..."
    
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        docker stop $CONTAINER_NAME
        log_success "Conteneur arrêté"
    fi
    
    if docker ps -aq -f name=$CONTAINER_NAME | grep -q .; then
        docker rm $CONTAINER_NAME
        log_success "Conteneur supprimé"
    fi
}

# Démarrer le nouveau conteneur
start_container() {
    log_info "Démarrage du conteneur CGU..."
    
    docker-compose -f docker-compose.cgu.yml up -d
    
    if [ $? -eq 0 ]; then
        log_success "Conteneur démarré"
    else
        log_error "Erreur lors du démarrage"
        exit 1
    fi
}

# Attendre que le conteneur soit prêt
wait_for_container() {
    log_info "Attente de la disponibilité du conteneur..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec $CONTAINER_NAME nginx -t &> /dev/null; then
            log_success "Conteneur prêt"
            return 0
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    log_error "Le conteneur n'est pas prêt après ${max_attempts} tentatives"
    return 1
}

# Tester la configuration
test_deployment() {
    log_info "Tests de déploiement..."
    
    # Test de la configuration Nginx
    if docker exec $CONTAINER_NAME nginx -t; then
        log_success "Configuration Nginx valide"
    else
        log_error "Configuration Nginx invalide"
        return 1
    fi
    
    # Test de l'accès local
    if docker exec $CONTAINER_NAME curl -f http://localhost/ > /dev/null 2>&1; then
        log_success "Site accessible localement"
    else
        log_warning "Site non accessible localement"
    fi
    
    # Afficher les logs récents
    log_info "Logs récents du conteneur :"
    docker logs --tail 10 $CONTAINER_NAME
}

# Afficher les informations de déploiement
show_deployment_info() {
    echo ""
    echo "🎉 Déploiement terminé !"
    echo "======================"
    echo ""
    echo "🌐 Site CGU accessible sur : https://$CGU_DOMAIN"
    echo "🐳 Conteneur Docker : $CONTAINER_NAME"
    echo "📊 Status : $(docker inspect --format='{{.State.Status}}' $CONTAINER_NAME)"
    echo ""
    echo "📋 Commandes utiles :"
    echo "  • Logs : docker logs -f $CONTAINER_NAME"
    echo "  • Restart : docker restart $CONTAINER_NAME"
    echo "  • Stop : docker stop $CONTAINER_NAME"
    echo "  • Shell : docker exec -it $CONTAINER_NAME sh"
    echo ""
    echo "🔧 Monitoring :"
    echo "  • Health : docker ps | grep $CONTAINER_NAME"
    echo "  • Config test : docker exec $CONTAINER_NAME nginx -t"
    echo "  • Reload config : docker exec $CONTAINER_NAME nginx -s reload"
    echo ""
}

# Fonction principale
main() {
    echo ""
    log_info "Début du déploiement à $(date)"
    echo ""
    
    check_prerequisites
    create_network
    stop_existing_container
    start_container
    
    if wait_for_container; then
        test_deployment
        show_deployment_info
        log_success "Déploiement réussi ! 🎉"
    else
        log_error "Échec du déploiement"
        docker logs $CONTAINER_NAME
        exit 1
    fi
}

# Gestion des signaux
trap 'log_error "Déploiement interrompu"; exit 1' INT TERM

# Exécution
main "$@"