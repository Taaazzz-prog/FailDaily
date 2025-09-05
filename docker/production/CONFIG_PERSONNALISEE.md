# ⚙️ Configuration Personnalisée FailDaily - Traefik

## Configuration Traefik Avancée

### 1. Configuration statique (docker-compose.traefik.yml)

```yaml
services:
  traefik:
    image: traefik:v3.0
    command:
      # 🔧 Configuration API et Dashboard
      - "--api.insecure=false"
      - "--api.dashboard=true"
      - "--api.debug=false"
      
      # 🌐 Points d'entrée
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      
      # 🔒 Redirection HTTPS automatique
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
      - "--entrypoints.web.http.redirections.entrypoint.permanent=true"
      
      # 🐳 Provider Docker
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.docker.network=production_faildaily-network"
      - "--providers.docker.watch=true"
      
      # 🎫 Certificats Let's Encrypt
      - "--certificatesresolvers.letsencrypt.acme.email=bruno@taaazzz.be"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      # Environnement de test Let's Encrypt (décommenter pour prod)
      # - "--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"
      
      # 📊 Logs
      - "--log.level=INFO"
      - "--log.format=json"
      - "--accesslog=true"
      - "--accesslog.format=json"
      
      # 📈 Métriques (optionnel)
      - "--metrics.prometheus=true"
      - "--metrics.prometheus.buckets=0.1,0.3,1.2,5.0"
```

### 2. Configuration dynamique via labels Docker

#### Frontend (Angular/Ionic)
```yaml
frontend:
  labels:
    # Activation du service dans Traefik
    - "traefik.enable=true"
    
    # 🌐 Routeur principal (HTTPS)
    - "traefik.http.routers.frontend-secure.rule=Host(`faildaily.com`) || Host(`www.faildaily.com`)"
    - "traefik.http.routers.frontend-secure.entrypoints=websecure"
    - "traefik.http.routers.frontend-secure.tls=true"
    - "traefik.http.routers.frontend-secure.tls.certresolver=letsencrypt"
    
    # 🔄 Redirection www → non-www
    - "traefik.http.routers.frontend-secure.middlewares=www-redirect@docker,spa-fallback@docker"
    - "traefik.http.middlewares.www-redirect.redirectregex.regex=^https://www\\.faildaily\\.com/(.*)"
    - "traefik.http.middlewares.www-redirect.redirectregex.replacement=https://faildaily.com/$${1}"
    - "traefik.http.middlewares.www-redirect.redirectregex.permanent=true"
    
    # 📱 SPA Fallback pour Angular
    - "traefik.http.middlewares.spa-fallback.errors.status=404"
    - "traefik.http.middlewares.spa-fallback.errors.service=frontend@docker"
    - "traefik.http.middlewares.spa-fallback.errors.query=/index.html"
    
    # 🎯 Service backend
    - "traefik.http.services.frontend.loadbalancer.server.port=80"
    - "traefik.http.services.frontend.loadbalancer.healthcheck.path=/"
    - "traefik.http.services.frontend.loadbalancer.healthcheck.interval=30s"
    
    # 🛡️ Headers de sécurité
    - "traefik.http.middlewares.security-headers.headers.frameDeny=true"
    - "traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true"
    - "traefik.http.middlewares.security-headers.headers.browserXssFilter=true"
    - "traefik.http.middlewares.security-headers.headers.referrerPolicy=no-referrer-when-downgrade"
    - "traefik.http.middlewares.security-headers.headers.customRequestHeaders.X-Forwarded-Proto=https"
```

#### Backend (API Node.js)
```yaml
backend:
  labels:
    # Activation du service dans Traefik
    - "traefik.enable=true"
    
    # 🔗 Routeur API (HTTPS)
    - "traefik.http.routers.api-secure.rule=(Host(`faildaily.com`) || Host(`www.faildaily.com`)) && PathPrefix(`/api/`)"
    - "traefik.http.routers.api-secure.entrypoints=websecure"
    - "traefik.http.routers.api-secure.tls=true"
    - "traefik.http.routers.api-secure.tls.certresolver=letsencrypt"
    
    # ⚡ Middleware de rate limiting
    - "traefik.http.routers.api-secure.middlewares=api-ratelimit@docker,api-cors@docker"
    - "traefik.http.middlewares.api-ratelimit.ratelimit.burst=100"
    - "traefik.http.middlewares.api-ratelimit.ratelimit.average=50"
    
    # 🌍 Headers CORS
    - "traefik.http.middlewares.api-cors.headers.accessControlAllowMethods=GET,POST,PUT,DELETE,OPTIONS"
    - "traefik.http.middlewares.api-cors.headers.accessControlAllowOriginList=https://faildaily.com"
    - "traefik.http.middlewares.api-cors.headers.accessControlAllowHeaders=Content-Type,Authorization,X-Requested-With"
    - "traefik.http.middlewares.api-cors.headers.accessControlMaxAge=86400"
    
    # 🎯 Service backend
    - "traefik.http.services.api.loadbalancer.server.port=3000"
    - "traefik.http.services.api.loadbalancer.healthcheck.path=/health"
    - "traefik.http.services.api.loadbalancer.healthcheck.interval=30s"
    
    # 🔄 Health check séparé
    - "traefik.http.routers.api-health.rule=Host(`faildaily.com`) && Path(`/health`)"
    - "traefik.http.routers.api-health.entrypoints=websecure"
    - "traefik.http.routers.api-health.tls=true"
```

## Variables d'Environnement Avancées

### 1. Configuration .env Production

```bash
# ====================================
# CONFIGURATION FAILDAILY PRODUCTION
# ====================================

# 🌐 Environnement
NODE_ENV=production
DEBUG=false
APP_NAME=FailDaily
APP_VERSION=2.0.0

# 🚀 Backend Configuration
BACKEND_PORT=3000
BACKEND_HOST=0.0.0.0
BACKEND_WORKERS=2

# 🌍 CORS et domaines
CORS_ORIGIN=https://faildaily.com,https://www.faildaily.com
FRONTEND_URL=https://faildaily.com
API_BASE_URL=https://faildaily.com/api

# 🔐 Sécurité JWT
JWT_SECRET=VotreSuperSecretJWTDe64CaracteresMinimumPourLaSecurite2024!
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ALGORITHM=HS256

# 🗄️ Base de données MySQL
DB_HOST=db
DB_PORT=3306
DB_USER=faildaily_user
DB_PASSWORD=MotDePasseSecurisePourMySQL2024!
DB_NAME=faildaily
DB_ROOT_PASSWORD=MotDePasseRootSecurisePourMySQL2024!
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci
DB_CONNECTION_LIMIT=10
DB_TIMEOUT=10000

# 🚦 Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes en ms
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
RATE_LIMIT_SKIP_FAILED_REQUESTS=false

# 📧 Configuration Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@faildaily.com
SMTP_PASS=MotDePasseEmailSecurise
EMAIL_FROM=FailDaily <noreply@faildaily.com>

# 📁 Uploads et Storage
UPLOAD_MAX_SIZE=5242880  # 5MB en bytes
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp
UPLOAD_PATH=/app/uploads
STORAGE_TYPE=local

# 🔍 Logs
LOG_LEVEL=info
LOG_FORMAT=combined
LOG_FILE=/app/logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# 🎯 Métriques et Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
PROMETHEUS_PORT=9090

# 🛡️ Sécurité avancée
HELMET_ENABLED=true
TRUST_PROXY=true
SESSION_SECRET=VotreSecretDeSessionSecurise2024!
BCRYPT_ROUNDS=12

# 🌐 Internationalisation
DEFAULT_LOCALE=fr
SUPPORTED_LOCALES=fr,en
TIMEZONE=Europe/Paris
```

### 2. Configuration MySQL avancée

```yaml
# Dans docker-compose.traefik.yml
db:
  image: mysql:8.0.35
  command: [
    '--default-authentication-plugin=mysql_native_password',
    '--character-set-server=utf8mb4',
    '--collation-server=utf8mb4_unicode_ci',
    '--innodb-buffer-pool-size=256M',
    '--innodb-log-file-size=64M',
    '--innodb-flush-log-at-trx-commit=2',
    '--innodb-file-per-table=1',
    '--max-connections=200',
    '--max-allowed-packet=32M',
    '--query-cache-type=0',
    '--query-cache-size=0',
    '--slow-query-log=1',
    '--slow-query-log-file=/var/log/mysql/slow.log',
    '--long-query-time=2',
    '--log-queries-not-using-indexes=1',
    '--binlog-expire-logs-seconds=86400'
  ]
```

## Optimisations Performance

### 1. Configuration Traefik pour haute charge

```yaml
# Ajout dans la configuration Traefik
command:
  # Performance optimizations
  - "--entrypoints.web.transport.respondingTimeouts.readTimeout=60s"
  - "--entrypoints.web.transport.respondingTimeouts.writeTimeout=60s"
  - "--entrypoints.web.transport.respondingTimeouts.idleTimeout=180s"
  - "--entrypoints.websecure.transport.respondingTimeouts.readTimeout=60s"
  - "--entrypoints.websecure.transport.respondingTimeouts.writeTimeout=60s"
  - "--entrypoints.websecure.transport.respondingTimeouts.idleTimeout=180s"
  
  # Load balancing
  - "--providers.docker.defaultRule=Host(`localhost`)"
  - "--providers.docker.swarmMode=false"
  
  # Circuit breaker
  - "--ping.entryPoint=web"
```

### 2. Middleware de compression

```yaml
# Labels pour compression
labels:
  - "traefik.http.middlewares.gzip-compress.compress=true"
  - "traefik.http.middlewares.gzip-compress.compress.excludedcontenttypes=text/event-stream"
```

### 3. Cache des assets statiques

```yaml
# Middleware de cache pour les assets
labels:
  - "traefik.http.middlewares.cache-assets.headers.customResponseHeaders.Cache-Control=public, max-age=31536000"
  - "traefik.http.routers.frontend-assets.rule=Host(`faildaily.com`) && PathPrefix(`/assets/`, `/static/`)"
  - "traefik.http.routers.frontend-assets.middlewares=cache-assets@docker"
```

## Monitoring et Observabilité

### 1. Métriques Prometheus

```yaml
# Configuration dans docker-compose.traefik.yml
traefik:
  command:
    - "--metrics.prometheus=true"
    - "--metrics.prometheus.addentrypointslabels=true"
    - "--metrics.prometheus.addrouterslabels=true"
    - "--metrics.prometheus.addserviceslabels=true"
  ports:
    - "9090:9090"  # Port métriques Prometheus
```

### 2. Dashboard de monitoring

```bash
# Accès au dashboard Traefik
http://IP_SERVEUR:8080

# Métriques Prometheus
http://IP_SERVEUR:9090/metrics

# Health checks
curl https://faildaily.com/health
curl https://faildaily.com/api/health
```

### 3. Logs structurés

```yaml
# Configuration des logs JSON dans Traefik
command:
  - "--log.format=json"
  - "--log.filePath=/var/log/traefik/traefik.log"
  - "--accesslog.format=json"
  - "--accesslog.filePath=/var/log/traefik/access.log"
  - "--accesslog.fields.names.ClientUsername=drop"
  - "--accesslog.fields.headers.defaultmode=keep"
  - "--accesslog.fields.headers.names.User-Agent=redact"
  - "--accesslog.fields.headers.names.Authorization=drop"
  - "--accesslog.fields.headers.names.Content-Type=keep"
```

## Sécurité Avancée

### 1. Whitelist IP pour dashboard

```yaml
# Restriction d'accès au dashboard Traefik
traefik:
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.dashboard.rule=Host(`traefik.faildaily.com`)"
    - "traefik.http.routers.dashboard.middlewares=auth-dashboard@docker,whitelist-dashboard@docker"
    - "traefik.http.middlewares.whitelist-dashboard.ipwhitelist.sourcerange=1.2.3.4/32,5.6.7.8/32"
    - "traefik.http.middlewares.auth-dashboard.basicauth.users=admin:$$2y$$10$$hash..."
```

### 2. Protection DDoS

```yaml
# Rate limiting global
labels:
  - "traefik.http.middlewares.global-ratelimit.ratelimit.burst=1000"
  - "traefik.http.middlewares.global-ratelimit.ratelimit.average=500"
  - "traefik.http.middlewares.global-ratelimit.ratelimit.period=1m"
```

### 3. Headers de sécurité avancés

```yaml
# Headers de sécurité complets
labels:
  - "traefik.http.middlewares.security-headers.headers.frameDeny=true"
  - "traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true"
  - "traefik.http.middlewares.security-headers.headers.browserXssFilter=true"
  - "traefik.http.middlewares.security-headers.headers.referrerPolicy=no-referrer-when-downgrade"
  - "traefik.http.middlewares.security-headers.headers.forceSTSHeader=true"
  - "traefik.http.middlewares.security-headers.headers.stsSeconds=31536000"
  - "traefik.http.middlewares.security-headers.headers.stsIncludeSubdomains=true"
  - "traefik.http.middlewares.security-headers.headers.stsPreload=true"
  - "traefik.http.middlewares.security-headers.headers.contentSecurityPolicy=default-src 'self'"
```

## Configuration Multi-Environnement

### 1. Staging Environment

```yaml
# docker-compose.staging.yml
version: '3.8'
services:
  traefik:
    command:
      - "--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"
  
  frontend:
    labels:
      - "traefik.http.routers.frontend-secure.rule=Host(`staging.faildaily.com`)"
  
  backend:
    environment:
      - NODE_ENV=staging
      - DB_NAME=faildaily_staging
```

### 2. Configuration par environnement

```bash
# .env.staging
NODE_ENV=staging
CORS_ORIGIN=https://staging.faildaily.com
DB_NAME=faildaily_staging
LOG_LEVEL=debug
METRICS_ENABLED=true

# .env.production  
NODE_ENV=production
CORS_ORIGIN=https://faildaily.com
DB_NAME=faildaily
LOG_LEVEL=info
METRICS_ENABLED=false
```

## Backup et Restauration Avancée

### 1. Script de backup automatisé

```bash
#!/bin/bash
# /home/taaazzz/scripts/backup-faildaily-advanced.sh

# Configuration
BACKUP_BASE_DIR="/home/taaazzz/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE_DIR/faildaily_$TIMESTAMP"
RETENTION_DAYS=30
COMPOSE_FILE="/home/taaazzz/apps/faildaily/docker/production/docker-compose.traefik.yml"

# Création du répertoire de backup
mkdir -p "$BACKUP_DIR"

# Backup MySQL avec compression
echo "🗄️ Backup de la base de données..."
docker-compose -f "$COMPOSE_FILE" exec -T db mysqldump \
  --single-transaction \
  --routines \
  --triggers \
  --all-databases \
  -u root -p"$DB_ROOT_PASSWORD" | gzip > "$BACKUP_DIR/mysql_full_backup.sql.gz"

# Backup des uploads
echo "📁 Backup des fichiers uploadés..."
docker run --rm -v faildaily_backend-uploads:/source -v "$BACKUP_DIR":/backup alpine \
  tar -czf /backup/uploads_backup.tar.gz -C /source .

# Backup des certificats SSL
echo "🔒 Backup des certificats SSL..."
docker run --rm -v faildaily_traefik-ssl-certs:/source -v "$BACKUP_DIR":/backup alpine \
  tar -czf /backup/ssl_certs_backup.tar.gz -C /source .

# Backup de la configuration
echo "⚙️ Backup de la configuration..."
cp -r /home/taaazzz/apps/faildaily/docker/production "$BACKUP_DIR/config"

# Nettoyage des anciens backups
echo "🧹 Nettoyage des anciens backups..."
find "$BACKUP_BASE_DIR" -name "faildaily_*" -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \;

# Compression finale
echo "📦 Compression finale..."
tar -czf "$BACKUP_BASE_DIR/faildaily_$TIMESTAMP.tar.gz" -C "$BACKUP_BASE_DIR" "faildaily_$TIMESTAMP"
rm -rf "$BACKUP_DIR"

echo "✅ Backup terminé: faildaily_$TIMESTAMP.tar.gz"

# Envoi vers stockage distant (optionnel)
# rsync -av "$BACKUP_BASE_DIR/faildaily_$TIMESTAMP.tar.gz" user@backup-server:/backups/
```

### 2. Restauration d'urgence

```bash
#!/bin/bash
# Script de restauration d'urgence

BACKUP_FILE="$1"
COMPOSE_FILE="/home/taaazzz/apps/faildaily/docker/production/docker-compose.traefik.yml"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.tar.gz>"
    exit 1
fi

# Extraction du backup
TEMP_DIR="/tmp/faildaily_restore_$(date +%s)"
mkdir -p "$TEMP_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Arrêt des services
echo "⏹️ Arrêt des services..."
docker-compose -f "$COMPOSE_FILE" down

# Restauration MySQL
echo "🗄️ Restauration de la base de données..."
docker volume create faildaily_mysql-data
gunzip < "$TEMP_DIR"/*/mysql_full_backup.sql.gz | \
docker run -i --rm -v faildaily_mysql-data:/var/lib/mysql mysql:8.0.35 \
mysql -u root -p"$DB_ROOT_PASSWORD"

# Restauration des uploads
echo "📁 Restauration des uploads..."
docker volume create faildaily_backend-uploads
docker run --rm -v faildaily_backend-uploads:/target -v "$TEMP_DIR":/backup alpine \
tar -xzf /backup/*/uploads_backup.tar.gz -C /target

# Restauration SSL
echo "🔒 Restauration des certificats SSL..."
docker volume create faildaily_traefik-ssl-certs
docker run --rm -v faildaily_traefik-ssl-certs:/target -v "$TEMP_DIR":/backup alpine \
tar -xzf /backup/*/ssl_certs_backup.tar.gz -C /target

# Redémarrage des services
echo "🚀 Redémarrage des services..."
docker-compose -f "$COMPOSE_FILE" up -d

# Nettoyage
rm -rf "$TEMP_DIR"

echo "✅ Restauration terminée"
```

Cette configuration personnalisée vous donne un contrôle total sur votre déploiement FailDaily avec Traefik, incluant la performance, la sécurité, le monitoring et la sauvegarde automatisée.
