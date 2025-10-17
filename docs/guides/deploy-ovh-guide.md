# 🚀 Guide de déploiement FailDaily sur serveur OVH

## 📋 Prérequis sur le serveur OVH

1. **Docker et Docker Compose** installés
2. **Git** installé
3. **Nom de domaine faildaily.com** configuré chez OVH
4. **Ports 80, 443, 8080** ouverts
5. **Au moins 2GB de RAM** disponible

## 🎯 Étapes de déploiement

### 1. Connexion au serveur
```bash
ssh taaazzz@51.75.55.185
```

### 2. Téléchargement et exécution du script
```bash
# Télécharger le script de déploiement
wget https://raw.githubusercontent.com/Taaazzz-prog/FailDaily/main/deploy-ovh.sh
chmod +x deploy-ovh.sh

# Exécuter le déploiement
./deploy-ovh.sh
```

### 3. Configuration de l'environnement
```bash
# Éditer le fichier de configuration
nano /home/taaazzz/FailDaily/docker/.env.production

# Remplacer les valeurs suivantes :
# - @51008473@Alexia@ (mot de passe MySQL)
# - faildaily_super_secret_key_for_production_2025_bruno_taaazzz (JWT)
# - faildaily.com
# - @51008473@Alexia@ (mot de passe email)
# - sk-proj-f_HCilJnjOUl... (clé OpenAI)
```

### 4. Configuration DNS chez OVH
Dans votre espace client OVH, ajouter les enregistrements DNS :

```
Type A : faildaily.com → 51.75.55.185
Type A : api.faildaily.com → 51.75.55.185
Type A : www.faildaily.com → 51.75.55.185
```

### 5. Redémarrage des services
```bash
cd /home/taaazzz/FailDaily
docker-compose -f docker-compose.ssl-production.yml restart
```

## 🔍 Vérification du déploiement

### Services actifs
```bash
cd /home/taaazzz/FailDaily
docker-compose -f docker-compose.ssl-production.yml ps
```

### Logs en temps réel
```bash
cd /home/taaazzz/FailDaily

# Backend
docker-compose -f docker-compose.ssl-production.yml logs -f backend

# Frontend  
docker-compose -f docker-compose.ssl-production.yml logs -f frontend

# Traefik
docker-compose -f docker-compose.ssl-production.yml logs -f traefik
```

### Tests d'accès
- **Frontend** : https://faildaily.com
- **API Health** : https://faildaily.com/api/health
- **Dashboard Traefik** : https://faildaily.com:8080

## 🔧 Maintenance

### Mise à jour de l'application
```bash
cd /var/www/faildaily
git pull origin main
docker-compose -f docker-compose.ssl-production.yml build --no-cache
docker-compose -f docker-compose.ssl-production.yml up -d
```

### Sauvegarde de la base de données
```bash
docker-compose -f docker-compose.ssl-production.yml exec db mysqldump \
  -u root -p$DB_ROOT_PASSWORD --databases faildaily \
  --routines --triggers --single-transaction > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restauration de la base de données
```bash
docker-compose -f docker-compose.ssl-production.yml exec -T db mysql \
  -u root -p$DB_ROOT_PASSWORD faildaily < backup_fichier.sql
```

## 🚨 Résolution de problèmes

### SSL ne fonctionne pas
1. Vérifier que les DNS pointent vers le serveur
2. Attendre la propagation DNS (jusqu'à 24h)
3. Redémarrer Traefik : `docker-compose restart traefik`

### Base de données inaccessible
1. Vérifier les logs MySQL : `docker-compose logs db`
2. Vérifier l'espace disque : `df -h`
3. Redémarrer MySQL : `docker-compose restart db`

### Erreur 502 Bad Gateway
1. Vérifier que le backend démarre : `docker-compose logs backend`
2. Vérifier la configuration Traefik
3. Tester l'API directement : `curl http://localhost:3000/health`

## 📞 Support

Pour toute question technique :
- **Logs détaillés** : Toujours inclure les logs dans votre demande
- **Configuration** : Vérifier le fichier .env.production
- **DNS** : Utiliser des outils comme https://dnschecker.org/

## 🔐 Sécurité

- ✅ Certificats SSL automatiques (Let's Encrypt)
- ✅ Firewall configuré (ports 80, 443, 8080 uniquement)
- ✅ Mots de passe forts obligatoires
- ✅ Rate limiting activé
- ✅ CORS configuré
- ✅ Headers de sécurité activés