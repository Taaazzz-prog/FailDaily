# 🏗️ Architecture FailDaily - Production avec Traefik

## Vue d'ensemble

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    FRONTEND     │    │     BACKEND     │    │    DATABASE     │
│  (Node.js+serve)│    │   (Node.js)     │    │    (MySQL)      │
│     Port 80     │    │    Port 3000    │    │    Port 3306    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                ┌─────────────────┴─────────────────┐
                │          TRAEFIK v3.0             │
                │      (Reverse Proxy + SSL)        │
                │       Ports 80/443/8080          │
                └───────────────────────────────────┘
                                 │
                         ┌───────┴───────┐
                         │   Internet    │
                         │ faildaily.com │
                         └───────────────┘
```

## Services Docker

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| traefik | traefik:v3.0 | 80,443,8080 | Reverse proxy, SSL, load balancer |
| frontend | node:20-alpine | 80 | Application Angular/Ionic |
| backend | node:20-alpine | 3000 | API REST Node.js/Express |
| db | mysql:8.0.35 | 3306 | Base de données MySQL |

## Volumes persistants

| Volume | Type | Chemin | Usage |
|--------|------|--------|-------|
| faildaily_mysql-data | Named | /var/lib/mysql | Données MySQL |
| faildaily_backend-uploads | Named | /app/uploads | Fichiers uploadés |
| faildaily_traefik-ssl-certs | Named | /letsencrypt | Certificats SSL Let's Encrypt |

## Réseau

| Service | IP interne | Externe |
|---------|------------|---------|
| Traefik | Dynamic | 80,443,8080 |
| Frontend | Dynamic | Via Traefik |
| Backend | Dynamic | Via Traefik |
| Database | Dynamic | Interne seulement |

## Configuration Traefik

### Points d'entrée
```yaml
entrypoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"
```

### Certificats SSL
```yaml
certificatesResolvers:
  letsencrypt:
    acme:
      email: bruno@taaazzz.be
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
```

### Routing automatique
- **Frontend**: PathPrefix(`/`) → service frontend:80
- **Backend**: PathPrefix(`/api/`) → service backend:3000
- **Health**: Path(`/health`) → service backend:3000

## Sécurité

### SSL/TLS
- Certificats automatiques Let's Encrypt
- Redirection HTTP → HTTPS automatique
- HSTS activé
- Protocoles TLS 1.2/1.3 uniquement

### Utilisateurs non-root
- Frontend : `appuser` (UID 1001)
- Backend : `appuser` (UID 1001)
- Database : `mysql` (UID 999)

### Réseau
- **Port 80/443** : Traefik (Public)
- **Port 8080** : Dashboard Traefik (Temporaire)
- **Port 3000/3306** : Services internes uniquement

### Firewall recommandé
```bash
# Autoriser seulement HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp  # Dashboard (à fermer après config)
```

## Monitoring et Health Checks

### Health Checks intégrés
```yaml
# Frontend
healthcheck:
  test: ["CMD", "wget", "--spider", "http://localhost:80/"]
  interval: 30s
  timeout: 10s
  retries: 3

# Backend  
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health')"]
  interval: 30s
  timeout: 10s
  retries: 3

# Database
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
  interval: 30s
  timeout: 10s
  retries: 5
```

### Logs centralisés
```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f traefik
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f db
```

### Métriques Traefik
```bash
# API Traefik
curl http://localhost:8080/api/rawdata

# Services actifs
curl http://localhost:8080/api/http/services

# Certificats SSL
curl http://localhost:8080/api/http/routers
```

## Performance

### Frontend (serve)
- Gzip automatique pour les assets statiques
- Cache des fichiers statiques (1 an)
- SPA fallback pour Angular routing
- Health check léger

### Backend (Node.js)
- PM2 pour la gestion des processus
- Variables d'environnement optimisées
- Connection pooling MySQL
- Rate limiting via middleware

### Database (MySQL)
- InnoDB buffer pool optimisé
- Connexions max configurées
- Slow query log activé
- Charset UTF8MB4

### Traefik
- Auto-discovery des services Docker
- Load balancing automatique
- Compression GZIP
- Cache des certificats SSL

## Backup et Restauration

### Données critiques
```bash
# Backup MySQL
docker-compose exec db mysqldump -u root -p faildaily > backup.sql

# Backup uploads
docker cp faildaily-backend-prod:/app/uploads ./uploads-backup

# Backup certificats SSL
docker cp faildaily-traefik-prod:/letsencrypt ./ssl-backup
```

### Restauration
```bash
# Restaurer MySQL
docker-compose exec -T db mysql -u root -p faildaily < backup.sql

# Restaurer uploads
docker cp ./uploads-backup/. faildaily-backend-prod:/app/uploads/

# Restaurer SSL (si nécessaire)
docker cp ./ssl-backup/. faildaily-traefik-prod:/letsencrypt/
```

## Migration depuis Nginx

### Différences principales
| Aspect | Nginx (ancien) | Traefik (nouveau) |
|--------|----------------|-------------------|
| Configuration | Fichiers .conf statiques | Labels Docker dynamiques |
| SSL | Certbot manuel | Let's Encrypt automatique |
| Service Discovery | Manuel | Automatique |
| Reload | Redémarrage requis | Hot reload |
| Dashboard | Aucun | Interface web intégrée |

### Avantages Traefik
- ✅ Configuration automatique via labels Docker
- ✅ SSL Let's Encrypt sans intervention
- ✅ Service discovery automatique
- ✅ Hot reload des configurations
- ✅ Dashboard de monitoring intégré
- ✅ Pas de duplication de logique CORS
- ✅ Scaling automatique des services
