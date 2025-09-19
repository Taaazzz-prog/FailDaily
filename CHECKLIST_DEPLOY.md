# 📋 CHECKLIST - Fichiers à transférer sur le serveur OVH
# ================================================================

## 🎯 FICHIERS ESSENTIELS (via VS Code Remote SSH)

### 📄 Scripts de déploiement
- [ ] deploy-ovh.sh
- [ ] docker-compose.ssl-production.yml  
- [ ] docker/.env.production.template

### 🗄️ Base de données
- [ ] backend-api/migrations/faildaily.sql (fichier principal unique)

### 🐳 Configuration Docker
- [ ] backend-api/Dockerfile
- [ ] docker/frontend.Dockerfile
- [ ] docker/nginx.conf

### ⚙️ Configuration backend
- [ ] backend-api/.env.production
- [ ] backend-api/package.json
- [ ] backend-api/server.js

### 🎨 Frontend build
- [ ] frontend/package.json
- [ ] frontend/angular.json
- [ ] frontend/src/environments/environment.ts

## 🚀 COMMANDES À EXÉCUTER SUR LE SERVEUR

```bash
# 1. Rendre le script exécutable
chmod +x deploy-ovh.sh

# 2. Lancer le déploiement
./deploy-ovh.sh

# 3. Vérifier les services
docker-compose -f docker-compose.ssl-production.yml ps

# 4. Voir les logs
docker-compose -f docker-compose.ssl-production.yml logs -f
```

## 📊 VÉRIFICATIONS POST-DÉPLOIEMENT

- [ ] Services Docker actifs
- [ ] Base de données importée  
- [ ] SSL Let's Encrypt configuré
- [ ] Site accessible sur https://faildaily.com
- [ ] API accessible sur https://faildaily.com/api/health

================================================================