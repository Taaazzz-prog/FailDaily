# 🚀 Guide de Déploiement FailDaily - Production avec Traefik

## Prérequis

### Serveur OVH
- **OS:** Ubuntu 22.04 LTS
- **RAM:** 4GB minimum
- **Stockage:** 40GB SSD minimum
- **Réseau:** IP publique fixe

### Software requis
```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Docker et Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose v2
sudo apt install docker-compose-plugin

# Outils système
sudo apt install -y git rsync ufw fail2ban
```

## Configuration DNS

### Enregistrements requis
```
Type A: faildaily.com → IP_SERVEUR_OVH
Type A: www.faildaily.com → IP_SERVEUR_OVH
Type A: api.faildaily.com → IP_SERVEUR_OVH (optionnel)
```

### Vérification DNS
```bash
# Tester la propagation DNS
nslookup faildaily.com
dig faildaily.com A
```

## Sécurité du Serveur

### Firewall UFW
```bash
# Configuration UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Autoriser SSH (changez le port si nécessaire)
sudo ufw allow 22/tcp

# Autoriser HTTP/HTTPS pour Traefik
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Dashboard Traefik (temporaire)
sudo ufw allow 8080/tcp

# Activer le firewall
sudo ufw enable
```

### Fail2Ban pour SSH
```bash
# Configuration Fail2Ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Redémarrer Fail2Ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

### Utilisateur non-root
```bash
# Créer utilisateur dédié
sudo adduser taaazzz
sudo usermod -aG sudo taaazzz
sudo usermod -aG docker taaazzz

# Configuration SSH pour l'utilisateur
su - taaazzz
mkdir ~/.ssh
chmod 700 ~/.ssh
# Copier votre clé publique dans ~/.ssh/authorized_keys
```

## Préparation du Déploiement

### 1. Configuration des variables d'environnement

```bash
# Sur le serveur OVH
cd /home/taaazzz/apps/faildaily/docker/production
cp .env.example .env
nano .env
```

**Configuration .env pour production :**
```bash
# 🌐 Application
NODE_ENV=production
APP_NAME=FailDaily
APP_VERSION=1.0.0

# 🚀 Backend API
BACKEND_PORT=3000
CORS_ORIGIN=https://faildaily.com,https://www.faildaily.com
API_BASE_URL=https://faildaily.com/api

# 🔐 JWT Security (GÉNÉRER UN NOUVEAU SECRET)
JWT_SECRET=VOTRE_SECRET_JWT_SUPER_SECURISE_DE_64_CARACTERES_MINIMUM
JWT_EXPIRES_IN=24h

# 🗄️ MySQL Database
DB_HOST=db
DB_PORT=3306
DB_USER=faildaily_user
DB_PASSWORD=VOTRE_MOT_DE_PASSE_MYSQL_SECURISE
DB_NAME=faildaily
DB_ROOT_PASSWORD=VOTRE_MOT_DE_PASSE_ROOT_MYSQL_SECURISE

# 🚦 Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 2. Préparation des volumes persistants

```bash
# Créer les volumes Docker
docker volume create faildaily_mysql-data
docker volume create faildaily_backend-uploads

# Vérifier les volumes
docker volume ls | grep faildaily
```

## Méthodes de Déploiement

### Méthode 1: Script Automatique (Recommandé)

**Depuis votre machine Windows :**
```powershell
cd "d:/Web API/FailDaily/docker/production"
.\deploy-traefik.ps1
```

**Depuis Linux/Mac :**
```bash
cd "d:/Web API/FailDaily/docker/production"
chmod +x deploy-traefik.sh
./deploy-traefik.sh
```

### Méthode 2: Déploiement Manuel

**1. Synchronisation des fichiers :**
```bash
# Depuis votre machine locale
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='backend-api/uploads' \
  --exclude='frontend/dist' \
  ./ taaazzz@51.75.55.185:/home/taaazzz/apps/faildaily/
```

**2. Build et démarrage sur le serveur :**
```bash
# Sur le serveur OVH
cd /home/taaazzz/apps/faildaily
docker-compose -f docker/production/docker-compose.traefik.yml down --remove-orphans
docker-compose -f docker/production/docker-compose.traefik.yml up -d --build
```

### Méthode 3: Déploiement via Git

**1. Configuration Git sur le serveur :**
```bash
# Sur le serveur OVH
cd /home/taaazzz/apps
git clone https://github.com/Taaazzz-prog/FailDaily.git faildaily
cd faildaily
```

**2. Mise à jour et déploiement :**
```bash
# Mettre à jour le code
git pull origin main

# Déployer
docker-compose -f docker/production/docker-compose.traefik.yml up -d --build
```

## Configuration SSL Let's Encrypt

### Automatique via Traefik
Traefik gère automatiquement les certificats SSL. La configuration est dans `docker-compose.traefik.yml` :

```yaml
certificatesresolvers:
  letsencrypt:
    acme:
      email: bruno@taaazzz.be
      storage: /letsencrypt/acme.json
      httpchallenge:
        entrypoint: web
```

### Vérification des certificats
```bash
# Vérifier l'obtention du certificat
docker-compose logs traefik | grep acme

# Tester HTTPS
curl -I https://faildaily.com

# Vérifier la redirection HTTP→HTTPS
curl -I http://faildaily.com
```

## Monitoring et Maintenance

### Vérification des services
```bash
# Status des containers
docker-compose -f docker/production/docker-compose.traefik.yml ps

# Santé des services
docker-compose -f docker/production/docker-compose.traefik.yml exec frontend wget -q --spider http://localhost:80/ && echo "Frontend OK"
docker-compose -f docker/production/docker-compose.traefik.yml exec backend curl -f http://localhost:3000/health && echo "Backend OK"
docker-compose -f docker/production/docker-compose.traefik.yml exec db mysqladmin ping -h localhost && echo "Database OK"
```

### Dashboard Traefik
```bash
# Accéder au dashboard
http://IP_SERVEUR:8080

# API Traefik
curl http://IP_SERVEUR:8080/api/rawdata | jq .
```

### Logs en temps réel
```bash
# Tous les services
docker-compose -f docker/production/docker-compose.traefik.yml logs -f

# Service spécifique
docker-compose -f docker/production/docker-compose.traefik.yml logs -f traefik
docker-compose -f docker/production/docker-compose.traefik.yml logs -f backend
```

### Surveillance des ressources
```bash
# Utilisation ressources par container
docker stats

# Espace disque
df -h
docker system df

# Volumes Docker
docker volume ls
docker volume inspect faildaily_mysql-data
```

## Backup et Restauration

### Script de backup automatique
```bash
#!/bin/bash
# /home/taaazzz/scripts/backup-faildaily.sh

BACKUP_DIR="/home/taaazzz/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup MySQL
docker-compose -f /home/taaazzz/apps/faildaily/docker/production/docker-compose.traefik.yml exec -T db mysqldump -u root -p$DB_ROOT_PASSWORD faildaily > $BACKUP_DIR/faildaily_db.sql

# Backup uploads
docker cp faildaily-backend-prod:/app/uploads $BACKUP_DIR/uploads

# Backup certificats SSL
docker cp faildaily-traefik-prod:/letsencrypt $BACKUP_DIR/ssl

# Compression
tar -czf $BACKUP_DIR.tar.gz -C $BACKUP_DIR .
rm -rf $BACKUP_DIR

echo "Backup terminé: $BACKUP_DIR.tar.gz"
```

### Cron pour backup automatique
```bash
# Ajouter au crontab
crontab -e

# Backup quotidien à 2h du matin
0 2 * * * /home/taaazzz/scripts/backup-faildaily.sh
```

## Mise à jour de l'application

### Mise à jour avec zéro downtime
```bash
# 1. Mettre à jour le code
git pull origin main

# 2. Build des nouvelles images
docker-compose -f docker/production/docker-compose.traefik.yml build

# 3. Mise à jour progressive (rolling update)
docker-compose -f docker/production/docker-compose.traefik.yml up -d --no-deps frontend
docker-compose -f docker/production/docker-compose.traefik.yml up -d --no-deps backend

# 4. Vérifier le bon fonctionnement
curl -f https://faildaily.com/api/health
```

## Troubleshooting

### Problèmes courants

**1. Certificat SSL non obtenu :**
```bash
# Vérifier les logs Traefik
docker-compose logs traefik | grep acme

# Vérifier que le domaine pointe vers le serveur
nslookup faildaily.com

# Vérifier que les ports 80/443 sont ouverts
sudo ufw status
```

**2. Service inaccessible :**
```bash
# Vérifier les labels Traefik
docker inspect faildaily-frontend-prod | grep traefik

# Vérifier le réseau Docker
docker network ls
docker network inspect production_faildaily-network
```

**3. Base de données inaccessible :**
```bash
# Vérifier MySQL
docker-compose exec db mysql -u root -p -e "SHOW DATABASES;"

# Vérifier les variables d'environnement
docker-compose exec backend env | grep DB_
```

### Commandes de debug
```bash
# Redémarrer un service spécifique
docker-compose -f docker/production/docker-compose.traefik.yml restart frontend

# Reconstruire complètement
docker-compose -f docker/production/docker-compose.traefik.yml down
docker-compose -f docker/production/docker-compose.traefik.yml up -d --build

# Nettoyer les images inutiles
docker system prune -a
```

## Performance et Optimisation

### Optimisations recommandées

**1. Système :**
```bash
# Limites de fichiers ouverts
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimisations réseau
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
sysctl -p
```

**2. Docker :**
```bash
# Configuration Docker daemon
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

sudo systemctl restart docker
```

**3. Monitoring avancé :**
```bash
# Installation de ctop pour monitoring containers
sudo wget https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7.7-linux-amd64 -O /usr/local/bin/ctop
sudo chmod +x /usr/local/bin/ctop
```

## Sécurité Avancée

### Durcissement Docker
```bash
# Utilisateur non-root pour Docker daemon
sudo nano /etc/docker/daemon.json
{
  "userns-remap": "default"
}
```

### Audit et Logs
```bash
# Configuration rsyslog pour Docker
echo "docker logs to syslog" >> /etc/rsyslog.conf

# Rotation des logs
cat > /etc/logrotate.d/docker << EOF
/var/log/docker/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0644 root root
}
EOF
```

Cette documentation complète vous guide à travers tous les aspects du déploiement de FailDaily avec Traefik, de la configuration initiale à la maintenance avancée.
