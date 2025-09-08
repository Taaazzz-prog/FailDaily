# 🔧 Configuration des Environnements FailDaily
# ===============================================

**Date de configuration :** 8 septembre 2025
**Objectif :** Gérer le développement local et la production avec les bons endpoints

## 🎯 Problème résolu

Le frontend était configuré pour utiliser `https://faildaily.com` même en local, causant des erreurs CORS. Nous avons mis en place une configuration d'environnement appropriée.

## ⚙️ Configuration actuelle

### 🏠 Environnement de développement local (`environment.ts`)
```typescript
api: {
  baseUrl: 'http://localhost:3001/api', // API locale Docker
  // ...autres configurations
},
storage: {
  baseUrl: 'http://localhost:3001/storage',
  // ...autres configurations
}
```

### 🌐 Environnement de production (`environment.prod.ts`)
```typescript
api: {
  baseUrl: 'https://faildaily.com/api', // API production OVH
  // ...autres configurations
},
storage: {
  baseUrl: 'https://faildaily.com/storage',
  // ...autres configurations
}
```

## 🐳 Configuration Docker

### Dockerfile Frontend modifié
Le `frontend.Dockerfile` accepte maintenant un argument `BUILD_MODE` :
- **dev** : Utilise `environment.ts` (localhost:3001)
- **prod** : Utilise `environment.prod.ts` (faildaily.com)

```dockerfile
ARG BUILD_MODE=dev
RUN if [ "$BUILD_MODE" = "prod" ] ; then npm run build --prod ; else npm run build ; fi
```

### Docker Compose Local
```yaml
frontend:
  build:
    context: ../frontend
    dockerfile: ../docker/frontend.Dockerfile
    args:
      BUILD_MODE: dev  # Mode développement pour l'environnement local
```

### Docker Compose Production (sur OVH)
```yaml
frontend:
  build:
    context: ../frontend
    dockerfile: ../docker/frontend.Dockerfile
    args:
      BUILD_MODE: prod  # Mode production pour le serveur OVH
```

## 🚀 Déploiement

### 1. Développement Local
```bash
cd "d:\Web API\FailDaily\docker"

# Build en mode développement (par défaut)
docker-compose build frontend
docker-compose up -d
```
→ Frontend utilise `http://localhost:3001/api`

### 2. Production OVH
```bash
# Build en mode production
docker-compose build --build-arg BUILD_MODE=prod frontend
docker-compose up -d
```
→ Frontend utilise `https://faildaily.com/api`

## 🔄 Workflow de développement

1. **Développement local** : 
   - Backend : `http://localhost:3001`
   - Frontend : `http://localhost:8081`
   - Base de données : `localhost:3308`

2. **Test avant production** :
   - Même configuration mais avec build prod local
   - Vérification des endpoints de production

3. **Déploiement production** :
   - Push vers serveur OVH
   - Build avec `BUILD_MODE=prod`
   - Backend : `https://faildaily.com/api`
   - Frontend : `https://faildaily.com`

## 🔧 Commandes utiles

### Reconstruire le frontend en mode dev
```bash
cd "d:\Web API\FailDaily\docker"
docker-compose down frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Reconstruire le frontend en mode prod (pour test)
```bash
cd "d:\Web API\FailDaily\docker"
docker-compose build --build-arg BUILD_MODE=prod --no-cache frontend
docker-compose up -d frontend
```

### Vérifier la configuration utilisée
```bash
# Voir les logs du build
docker-compose logs frontend

# Inspecter le contenu du conteneur
docker exec -it faildaily_frontend cat /usr/share/nginx/html/main*.js | grep -o "localhost:300[0-9]"
```

## 🎯 Avantages de cette approche

✅ **Flexibilité** : Un seul Dockerfile pour dev et prod
✅ **Sécurité** : Configuration automatique selon l'environnement
✅ **Simplicité** : Changement avec un seul paramètre
✅ **Cohérence** : Même processus de build partout
✅ **Débogage** : Configuration claire et séparée

## 🚨 Points d'attention

⚠️ **Port Backend** : Toujours 3001 en local Docker (pas 3000)
⚠️ **CORS** : Backend doit autoriser `http://localhost:8081` en dev
⚠️ **Cache** : Utiliser `--no-cache` si les changements ne sont pas pris en compte
⚠️ **Environnements** : Bien vérifier quel fichier environment.*.ts est utilisé

## 📋 Checklist de vérification

- [ ] Backend répond sur `http://localhost:3001/api/health`
- [ ] Frontend accessible sur `http://localhost:8081`
- [ ] Pas d'erreurs CORS dans la console
- [ ] Login fonctionne avec un utilisateur test
- [ ] Base de données accessible (27 tables)

Cette configuration vous permet de développer en local avec la certitude que le déploiement en production se passera sans problème d'endpoint ! 🎉
