# 🐳 FailDaily Docker Local Setup
# ================================

# Configuration pour lancer FailDaily en local avec la même base de données que le serveur OVH

## 📋 Prérequis

Assure-toi d'avoir installé :
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

## 🚀 Lancement rapide

### 1. Preparation des fichiers de configuration

```bash
# Naviguer vers le dossier Docker
cd "d:\Web API\FailDaily\docker"

# Copier la configuration d'exemple
cp .env .env.local
```

### 2. Lancer l'application complète

```bash
# Lancer tous les services (base de données + backend + frontend)
docker-compose up -d

# Ou avec reconstruction des images si nécessaire
docker-compose up --build -d
```

### 3. Initialiser la base de données

```bash
# Copier le dump SQL dans le conteneur MySQL
docker cp ../docs/MIGRATION_MySQL_FailDaily_COMPLETE.sql.backup faildaily_db:/tmp/

# Exécuter le script SQL
docker exec faildaily_db mysql -u root -pfaildaily_root_password faildaily < /tmp/MIGRATION_MySQL_FailDaily_COMPLETE.sql.backup
```

## 🔗 URLs d'accès

Une fois lancé, ton application sera accessible sur :

- **Frontend (Angular/Ionic):** http://localhost:8080
- **Backend API:** http://localhost:3000
- **Base de données MySQL:** localhost:3307 (port externe)

## 📊 Gestion de la base de données

### Connexion directe à MySQL

```bash
# Via Docker
docker exec -it faildaily_db mysql -u faildaily_user -pfaildaily_password faildaily

# Via client externe (HeidiSQL, phpMyAdmin, etc.)
Host: localhost
Port: 3307
Database: faildaily
User: faildaily_user
Password: faildaily_password
```

### Sauvegarder les données

```bash
# Créer un dump de la base locale
docker exec faildaily_db mysqldump -u root -pfaildaily_root_password faildaily > backup_local.sql
```

### Restaurer depuis le serveur OVH

```bash
# Si tu as un dump de production
docker cp votre_dump_ovh.sql faildaily_db:/tmp/
docker exec faildaily_db mysql -u root -pfaildaily_root_password faildaily < /tmp/votre_dump_ovh.sql
```

## 🛠️ Commandes utiles

### Gestion des conteneurs

```bash
# Voir les logs
docker-compose logs -f

# Redémarrer un service
docker-compose restart backend

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ PERTE DE DONNÉES)
docker-compose down -v
```

### Debugging

```bash
# Entrer dans le conteneur backend
docker exec -it faildaily_backend sh

# Entrer dans le conteneur MySQL
docker exec -it faildaily_db bash

# Voir les variables d'environnement
docker exec faildaily_backend env
```

## 🔄 Synchronisation avec OVH

### Exporter depuis OVH (sur votre serveur)

```bash
# Se connecter au serveur OVH via SSH
ssh votre_user@votre_serveur_ovh

# Créer un dump de la base de production
docker exec faildaily_db mysqldump -u faildaily_user -pfaildaily_password faildaily > faildaily_production_$(date +%Y%m%d).sql

# Télécharger le fichier
scp votre_user@votre_serveur_ovh:~/faildaily_production_*.sql ./
```

### Importer en local

```bash
# Copier le dump dans le conteneur local
docker cp faildaily_production_*.sql faildaily_db:/tmp/

# Restaurer
docker exec faildaily_db mysql -u root -pfaildaily_root_password faildaily < /tmp/faildaily_production_*.sql
```

## 🔧 Configuration avancée

### Ports personnalisés

Si tu veux changer les ports, modifie le fichier `docker-compose.yaml` :

```yaml
ports:
  - "8081:80"    # Frontend sur port 8081
  - "3001:3000"  # Backend sur port 3001  
  - "3308:3306"  # MySQL sur port 3308
```

### Variables d'environnement

Modifie le fichier `.env` pour ajuster :

```bash
# Base de données
DB_PASSWORD=ton_mot_de_passe_personnel

# JWT
JWT_SECRET=ta_clé_jwt_locale

# URLs
VITE_API_URL=http://localhost:3001/api
```

## 🆘 Dépannage

### Problèmes courants

1. **Port déjà utilisé**
   ```bash
   # Vérifier les ports utilisés
   netstat -an | findstr :8080
   
   # Arrêter les services en conflit ou changer les ports
   ```

2. **Base de données vide**
   ```bash
   # Réinitialiser et restaurer
   docker-compose down -v
   docker-compose up -d
   # Puis relancer le script SQL
   ```

3. **Problèmes de permissions**
   ```bash
   # Sur Windows, lancer Docker Desktop en administrateur
   # Vérifier que Docker a accès au dossier
   ```

### Logs détaillés

```bash
# Logs spécifiques par service
docker-compose logs backend
docker-compose logs frontend  
docker-compose logs db

# Logs en temps réel
docker-compose logs -f --tail=100
```

## 🎯 Résumé

Avec cette configuration, tu auras :
- ✅ Une copie exacte de ta base de données OVH en local
- ✅ Le même environnement de développement que la production
- ✅ Possibilité de sync bidirectionnelle avec ton serveur
- ✅ Isolation complète via Docker
- ✅ Hot-reload pour le développement
