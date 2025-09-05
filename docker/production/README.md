# 🚀 FailDaily - Production avec Traefik

## Configuration

- **Reverse Proxy:** Traefik v3.0 avec SSL automatique (Let's Encrypt)
- **Frontend:** Node.js avec `serve` (port 80)
- **Backend:** Node.js Express (port 3000)
- **Database:** MySQL 8.0.35

## Déploiement

### 1. Configuration des variables d'environnement

Copiez `.env.example` vers `.env` et configurez :

```bash
cp .env.example .env
nano .env
```

### 2. Déploiement automatique

```bash
# Depuis Windows/WSL
./deploy-traefik.ps1

# Depuis Linux/Mac
./deploy-traefik.sh
```

### 3. Déploiement manuel

```bash
# Sur le serveur OVH
docker-compose -f docker/production/docker-compose.traefik.yml up -d --build
```

## Accès

- **Site:** https://faildaily.com
- **API:** https://faildaily.com/api/
- **Traefik Dashboard:** http://IP:8080 (temporaire)

## Volumes persistants

- `faildaily_mysql-data`: Données MySQL
- `faildaily_backend-uploads`: Fichiers uploadés
- `faildaily_traefik-ssl-certs`: Certificats SSL

## Monitoring

```bash
# Vérifier les services
docker-compose -f docker/production/docker-compose.traefik.yml ps

# Logs
docker-compose -f docker/production/docker-compose.traefik.yml logs -f

# Status Traefik
curl http://localhost:8080/api/rawdata
```
