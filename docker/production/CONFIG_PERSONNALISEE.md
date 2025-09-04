# ===============================================
# 🎯 CONFIGURATION PERSONNALISÉE FAILDAILY
# ===============================================
# Fichier de référence avec toutes vos données

## 🌐 Informations de base
DOMAIN=faildaily.com
EMAIL=faildaily@taaazzz.be
SERVER_IP=51.75.55.185
SERVER_USER=taaazzz

## 🔒 Sécurité
JWT_SECRET=@@@JeSuisLeCreateurDeCetteApplication@PrionsEnsemble@@@
DB_PASSWORD=@51008473@Alexia@
DB_ROOT_PASSWORD=@51008473@Alexia@Root@

## 📦 Repository
GIT_REPO=https://github.com/Taaazzz-prog/FailDaily.git
GIT_BRANCH=main

## 🚀 URLs finales
APP_URL=https://faildaily.com
API_URL=https://faildaily.com/api
HEALTH_URL=https://faildaily.com/health

## 📝 Commandes de déploiement rapide
# ssh taaazzz@51.75.55.185
# curl -fsSL https://raw.githubusercontent.com/Taaazzz-prog/FailDaily/main/docker/production/install.sh | bash
# git clone https://github.com/Taaazzz-prog/FailDaily.git faildaily
# cd faildaily/docker/production
# cp .env.example .env
# ./deploy.sh deploy

## 🔧 Vérifications post-installation
# ./deploy.sh status
# ./deploy.sh health
# curl https://faildaily.com/health

## 🌐 DNS Configuration
# Type: A
# Name: @
# Target: 51.75.55.185
# TTL: 300

# Type: CNAME
# Name: www
# Target: faildaily.com
# TTL: 300

## 🔒 SSL Let's Encrypt
# sudo certbot --nginx -d faildaily.com -d www.faildaily.com

## 📧 Configuration email (future)
# SMTP_HOST=mail.taaazzz.be
# SMTP_PORT=587
# SMTP_USER=faildaily@taaazzz.be
# SMTP_PASS=[À configurer]

## 🎯 Statut de configuration
- ✅ Repository GitHub configuré
- ✅ Domaine acheté (faildaily.com)
- ✅ Serveur OVH prêt (51.75.55.185)
- ✅ Mots de passe définis
- ✅ Configuration Docker complète
- ⏳ DNS à configurer
- ⏳ SSL à installer
- ⏳ Déploiement à effectuer
