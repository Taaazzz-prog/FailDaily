#!/bin/bash
# ===============================================
# 🔒 SCRIPT D'INSTALLATION SSL AUTOMATIQUE
# ===============================================
# Configuration HTTPS pour FailDaily Production

set -e

echo "🔒 Installation SSL pour FailDaily"
echo "=================================="

# Variables
DOMAIN_MAIN="faildaily.com"
DOMAIN_WWW="www.faildaily.com"
DOMAIN_API="api.faildaily.com"
EMAIL="bruno@taaazzz.be"

# Couleurs pour les messages
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

# Étape 1: Créer les dossiers SSL
log_info "Création des dossiers SSL..."
mkdir -p ssl/certbot/conf
mkdir -p ssl/certbot/www
mkdir -p ssl/certbot/logs
log_success "Dossiers SSL créés"

# Étape 2: Arrêter les services actuels
log_info "Arrêt des services actuels..."
docker-compose -f docker-compose.prod.yml down
log_success "Services arrêtés"

# Étape 3: Démarrer Nginx en mode HTTP uniquement pour la validation
log_info "Démarrage temporaire pour validation Let's Encrypt..."
docker-compose -f docker-compose.prod.yml up -d frontend
sleep 5

# Étape 4: Obtenir les certificats SSL
log_info "Génération des certificats SSL avec Let's Encrypt..."

# Certificat pour le domaine principal
docker run --rm --name certbot \
    -v "$(pwd)/ssl/certbot/conf:/etc/letsencrypt" \
    -v "$(pwd)/ssl/certbot/www:/var/www/certbot" \
    -v "$(pwd)/ssl/certbot/logs:/var/log/letsencrypt" \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN_MAIN \
    -d $DOMAIN_WWW

# Certificat pour le sous-domaine API
docker run --rm --name certbot-api \
    -v "$(pwd)/ssl/certbot/conf:/etc/letsencrypt" \
    -v "$(pwd)/ssl/certbot/www:/var/www/certbot" \
    -v "$(pwd)/ssl/certbot/logs:/var/log/letsencrypt" \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN_API

log_success "Certificats SSL générés"

# Étape 5: Arrêter le mode temporaire
log_info "Arrêt du mode temporaire..."
docker-compose -f docker-compose.prod.yml down

# Étape 6: Mettre à jour la configuration pour SSL
log_info "Configuration SSL..."
cp nginx.ssl.conf nginx.conf
log_success "Configuration SSL appliquée"

# Étape 7: Redémarrer avec SSL
log_info "Redémarrage avec HTTPS..."
docker-compose -f docker-compose.prod.yml up -d

# Attendre que les services soient prêts
log_info "Attente de la disponibilité des services..."
sleep 10

# Étape 8: Tests de connectivité
log_info "Tests de connectivité HTTPS..."

# Test domaine principal
if curl -s -k https://$DOMAIN_MAIN/health > /dev/null; then
    log_success "✅ $DOMAIN_MAIN accessible en HTTPS"
else
    log_warning "⚠️  $DOMAIN_MAIN non accessible en HTTPS"
fi

# Test API
if curl -s -k https://$DOMAIN_API/health > /dev/null; then
    log_success "✅ $DOMAIN_API accessible en HTTPS"
else
    log_warning "⚠️  $DOMAIN_API non accessible en HTTPS"
fi

# Étape 9: Configuration du renouvellement automatique
log_info "Configuration du renouvellement automatique..."
cat > ssl-renew.sh << 'EOF'
#!/bin/bash
# Script de renouvellement automatique des certificats SSL

cd /home/taaazzz/apps/faildaily

# Renouveler les certificats
docker run --rm --name certbot-renew \
    -v "$(pwd)/ssl/certbot/conf:/etc/letsencrypt" \
    -v "$(pwd)/ssl/certbot/www:/var/www/certbot" \
    -v "$(pwd)/ssl/certbot/logs:/var/log/letsencrypt" \
    certbot/certbot renew --quiet

# Redémarrer nginx si les certificats ont été renouvelés
docker-compose -f docker-compose.prod.yml restart frontend

echo "✅ Renouvellement SSL vérifié le $(date)"
EOF

chmod +x ssl-renew.sh

log_success "Script de renouvellement créé"

# Étape 10: Affichage des informations finales
echo ""
echo "🎉 Installation SSL terminée !"
echo "================================"
echo ""
echo "🌐 Sites accessibles en HTTPS :"
echo "   • https://$DOMAIN_MAIN"
echo "   • https://$DOMAIN_WWW"  
echo "   • https://$DOMAIN_API"
echo ""
echo "🔄 Renouvellement automatique :"
echo "   • Script: ./ssl-renew.sh"
echo "   • Fréquence recommandée: chaque mois"
echo ""
echo "📋 Commandes utiles :"
echo "   • Vérifier les certificats: docker-compose logs frontend"
echo "   • Redémarrer SSL: docker-compose restart frontend"
echo "   • Renouveler: ./ssl-renew.sh"
echo ""
log_success "✅ FailDaily est maintenant sécurisé avec HTTPS !"
