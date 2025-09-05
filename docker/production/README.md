# FailDaily - Configuration Docker Production

Cette configuration Docker est optimisée pour un déploiement production sur serveur OVH Linux.

## 🚀 Déploiement rapide

```bash
# Sur votre serveur OVH Linux
git clone [votre-repo] faildaily
cd faildaily
cp docker/production/.env.example docker/production/.env
# Éditez les variables d'environnement
nano docker/production/.env
# Lancez l'application
docker-compose -f docker/production/docker-compose.prod.yml up -d
```

## 📁 Structure

```
docker/production/
├── docker-compose.prod.yml    # Orchestration production
├── backend.prod.Dockerfile    # Backend optimisé
├── frontend.prod.Dockerfile   # Frontend optimisé  
├── nginx.conf                 # Config Nginx
├── .env.example              # Variables d'environnement
└── deploy.sh                 # Script de déploiement
```

## 🔧 Optimisations

- **Multi-stage builds** pour des images légères
- **Node.js 22** (votre version requise)
- **Alpine Linux** pour la sécurité et la taille
- **Nginx** optimisé pour le frontend
- **MySQL 8.0** avec volume persistant
- **Variables d'environnement** sécurisées
- **Health checks** intégrés
- **Restart policies** automatiques

## 🛡️ Sécurité

- Images basées sur Alpine Linux
- Utilisateur non-root
- Variables sensibles externalisées
- Ports internes uniquement
- Reverse proxy Nginx

## 📊 Monitoring

- Health checks pour tous les services
- Logs structurés
- Métriques de ressources
- Alertes de redémarrage
