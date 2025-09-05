# 🏗️ Architecture Docker FailDaily Production

## 🌐 Architecture des Services

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │    Database     │
│  (Nginx+Angular)│    │   (Node.js)     │    │    (MySQL)      │
│                 │    │                 │    │                 │
│  Port: 80       │◄──►│  Port: 3000     │◄──►│  Port: 3306     │
│  Container:     │    │  Container:     │    │  Container:     │
│  faildaily-     │    │  faildaily-     │    │  faildaily-     │
│  frontend-prod  │    │  backend-prod   │    │  db-prod        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔌 Mapping des Ports

| Service  | Port Interne | Port Externe | Accès |
|----------|-------------|-------------|--------|
| Frontend | 8080        | 80          | Public |
| Backend  | 3000        | 3001        | Interne |
| Database | 3306        | 3307        | Interne |

## 📁 Volumes Docker

| Volume       | Type  | Montage                   | Usage |
|-------------|-------|---------------------------|--------|
| mysql-data  | Named | /var/lib/mysql           | Persistance DB |
| nginx-cache | Named | /var/cache/nginx         | Cache Nginx |
| app-logs    | Named | /var/log/nginx, /app/logs| Logs |
| uploads     | Bind  | ./data/uploads           | Fichiers uploadés |

## 🌐 Network Configuration

**Réseau Docker** : `faildaily-network` (172.20.0.0/16)

| Service  | IP Statique |
|----------|-------------|
| Database | 172.20.0.10 |
| Backend  | 172.20.0.20 |
| Frontend | 172.20.0.30 |

## 🔒 Variables d'Environnement Critiques

### Backend
```bash
NODE_ENV=production
DB_HOST=database
JWT_SECRET=[généré-automatiquement]
CORS_ORIGIN=http://votre-ip-serveur
```

### Database
```bash
MYSQL_ROOT_PASSWORD=[généré-automatiquement]
MYSQL_DATABASE=faildaily_prod
MYSQL_USER=faildaily_user
MYSQL_PASSWORD=[généré-automatiquement]
```

## 📊 Monitoring & Health Checks

### Frontend
- **Health Check** : `wget http://localhost:8080/health`
- **Interval** : 30s
- **Timeout** : 5s

### Backend
- **Health Check** : `curl http://localhost:3000/api/health`
- **Interval** : 30s
- **Timeout** : 10s

### Database
- **Health Check** : `mysqladmin ping`
- **Interval** : 30s
- **Timeout** : 10s

## 🚦 Ordre de Démarrage

1. **Database** (MySQL 8.0)
2. **Backend** (attend database healthy)
3. **Frontend** (attend backend healthy)

## 📈 Optimisations Performance

### MySQL
```sql
innodb_buffer_pool_size = 256M
max_connections = 200
query_cache_size = 64M
```

### Nginx
```nginx
worker_processes auto
gzip on
keepalive_timeout 65
client_max_body_size 10M
```

### Node.js
```javascript
keepAliveTimeout: 65000
maxConnections: 100
```

## 🔧 Commandes Docker Utiles

```bash
# Voir les conteneurs
docker ps

# Voir les volumes
docker volume ls

# Voir le réseau
docker network inspect faildaily-network

# Logs d'un service
docker-compose -f docker-compose.prod.yml logs backend

# Entrer dans un conteneur
docker exec -it faildaily-backend-prod bash

# Statistiques en temps réel
docker stats

# Espace disque
docker system df
```

## 🛡️ Sécurité

### Utilisateurs Non-Root
- Frontend : `nginx-app` (UID 1001)
- Backend : `nodejs` (UID 1001)
- Database : `mysql` (default)

### Ports Exposés
- **Port 80** : Nginx (Frontend + Proxy API)
- **Port 3001** : Backend (localhost seulement)
- **Port 3307** : MySQL (localhost seulement)

### Isolation Réseau
- Services communiquent via réseau Docker interne
- Seul le frontend est exposé publiquement
- API accessible via proxy Nginx uniquement

## 📝 Logs

```bash
# Emplacement des logs
./logs/                 # Logs applicatifs
docker logs [container] # Logs conteneurs

# Rotation automatique des logs Docker
# Configurée dans docker-compose.yml
```

## 🔄 Backup & Restore

### Sauvegarde Automatique
```bash
# Script inclus
./deploy.sh backup

# Fichier créé
./backups/faildaily_backup_YYYYMMDD_HHMMSS.sql
```

### Restauration
```bash
docker-compose -f docker-compose.prod.yml exec -T database \
  mysql -u root -p[password] faildaily_prod < backup.sql
```
