# 🚀 Guide de Déploiement FailDaily sur Serveur OVH

## 📋 Guide Complet - Copier/Coller

### 1️⃣ Préparation du Serveur OVH

```bash
# Connexion à votre serveur
ssh taaazzz@51.75.55.185

# Création du dossier d'installation (recommandé)
mkdir -p /home/taaazzz/apps
cd /home/taaazzz/apps

# Installation automatique (repository public)
curl -fsSL https://raw.githubusercontent.com/Taaazzz-prog/FailDaily/main/docker/production/install.sh | bash

# ⚠️ IMPORTANT: Après l'installation, redémarrez votre session
logout
# Reconnectez-vous pour que les permissions Docker soient actives
ssh taaazzz@51.75.55.185
```

### 2️⃣ Déploiement de l'Application

```bash
# Clonage du projet (repository public)
cd /home/taaazzz/apps
git clone https://github.com/Taaazzz-prog/FailDaily.git faildaily
cd faildaily/docker/production

# Configuration environnement
cp .env.example .env
nano .env

# ⚠️ CRITIQUE: Si erreur "permission denied" Docker:
# Vous DEVEZ redémarrer votre session pour les permissions Docker
# logout puis reconnectez-vous avec ssh taaazzz@51.75.55.185

# IMPORTANT: Vérifiez ces valeurs dans .env :
# - JWT_SECRET=@@@JeSuisLeCreateurDeCetteApplication@PrionsEnsemble@@@
# - DB_PASSWORD=@51008473@Alexia@
# - DB_ROOT_PASSWORD=@51008473@Alexia@Root@
# - CORS_ORIGIN=https://faildaily.com

# Rendre le script exécutable
chmod +x deploy.sh

# Déploiement complet
./deploy.sh deploy
```

### 3️⃣ Vérification du Déploiement

```bash
# Vérifier l'état des services
./deploy.sh status

# Vérifier la santé
./deploy.sh health

# Voir les logs
./deploy.sh logs
```

### 4️⃣ Configuration DNS/Domaine

```bash
# Dans votre DNS OVH, créez un enregistrement A :
# @ ou www -> 51.75.55.185

# Puis mettez à jour le CORS dans .env :
# CORS_ORIGIN=https://faildaily.com

# Redémarrez après modification
./deploy.sh restart
```

## 🔧 Commands Utiles

```bash
# Déploiement complet
./deploy.sh deploy

# Sauvegarde base de données
./deploy.sh backup

# Voir les logs en temps réel
./deploy.sh logs

# État des services
./deploy.sh status

# Arrêter l'application
./deploy.sh stop

# Redémarrer l'application
./deploy.sh restart

# Mise à jour depuis Git
./deploy.sh update
```

## 📊 Monitoring

```bash
# Utilisation des ressources
docker stats

# Logs spécifiques
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs database

# Espace disque
df -h
docker system df
```

## 🔒 Sécurité

### Pare-feu UFW
```bash
sudo ufw status
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### SSL/HTTPS (avec Let's Encrypt)
```bash
# Installation Certbot
sudo apt install -y certbot python3-certbot-nginx

# Génération certificat
sudo certbot --nginx -d faildaily.com

# Auto-renouvellement
sudo crontab -e
# Ajouter : 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🐛 Dépannage

### Vérification des logs en cas d'erreur
```bash
# Logs de la base de données (problème le plus fréquent)
docker-compose -f docker-compose.prod.yml logs database

# Logs du backend (vérifier les erreurs de connexion)
docker-compose -f docker-compose.prod.yml logs backend

# Logs du frontend  
docker-compose -f docker-compose.prod.yml logs frontend

# Vérifier l'état des conteneurs
docker-compose -f docker-compose.prod.yml ps

# Redémarrer un service spécifique
docker-compose -f docker-compose.prod.yml restart database
docker-compose -f docker-compose.prod.yml restart backend

# Logs en temps réel pour debugging
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Nettoyage complet de la base de données (en cas de corruption)
```bash
# Arrêter tous les services
docker-compose -f docker-compose.prod.yml down

# Supprimer les volumes de base de données (⚠️ PERTE DE DONNÉES)
docker volume rm faildaily_mysql-data

# Relancer le déploiement
./deploy.sh deploy
```

### Problèmes courants
```bash
# Ports occupés
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3000

# Redémarrer Docker
sudo systemctl restart docker

# Nettoyer Docker
docker system prune -af

# Logs d'erreur
docker-compose -f docker-compose.prod.yml logs --tail=100

# Reconstruire sans cache
docker-compose -f docker-compose.prod.yml build --no-cache
```

### Vérification base de données
```bash
# Connexion à MySQL
docker-compose -f docker-compose.prod.yml exec database mysql -u root -p

# Dans MySQL :
SHOW DATABASES;
USE faildaily;
SHOW TABLES;
SELECT COUNT(*) FROM users;
```

## 📈 Performance

### Optimisations serveur
```bash
# Augmenter les limites de fichiers
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimisations réseau
echo "net.core.somaxconn = 65536" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Monitoring avancé
```bash
# Installation htop
sudo apt install -y htop iotop nethogs

# Surveillance en temps réel
htop
iotop
nethogs
```

## 🔄 Maintenance

### Sauvegardes automatiques
```bash
# Créer script de sauvegarde
nano /home/user/backup-faildaily.sh

#!/bin/bash
cd /home/user/faildaily/docker/production
./deploy.sh backup
# Optionnel : upload vers S3, FTP, etc.

# Rendre exécutable
chmod +x /home/user/backup-faildaily.sh

# Programmer dans crontab
crontab -e
# Ajouter : 0 2 * * * /home/user/backup-faildaily.sh
```

### Mises à jour
```bash
# Mise à jour automatique
./deploy.sh update

# Mise à jour manuelle
git pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 🎯 URLs d'accès

- **Application Frontend** : https://faildaily.com/
- **API Backend** : https://faildaily.com/api/
- **Health Check** : https://faildaily.com/health

## 📞 Support

En cas de problème :
1. Vérifiez les logs : `./deploy.sh logs`
2. Vérifiez l'état : `./deploy.sh status`
3. Consultez la documentation Docker
4. Redémarrez en dernier recours : `./deploy.sh restart`
