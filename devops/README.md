# FailDaily - Documentation DevOps

## 🛠️ Scripts DevOps Disponibles

### 📁 Structure
```
devops/
├── scripts/
│   ├── start.ps1 / start.sh          # Démarrage du projet
│   ├── deploy.ps1 / deploy.sh        # Scripts de déploiement
│   ├── test.ps1 / test.sh            # Scripts de tests
│   ├── reset-repo.ps1                # Réinitialisation du dépôt Git
│   └── test-age-validation.js        # Tests spécifiques validation d'âge
├── ci-cd/
│   └── github-actions.yml            # Pipeline CI/CD GitHub Actions
└── README.md                         # Cette documentation
```

## 🚀 Scripts de Démarrage

### Windows (PowerShell)
```powershell
# Démarrage complet
.\devops\scripts\start.ps1

# Démarrage frontend uniquement
.\devops\scripts\start.ps1 frontend

# Démarrage backend uniquement
.\devops\scripts\start.ps1 backend

# Démarrage avec build mobile
.\devops\scripts\start.ps1 mobile
```

### Linux/macOS (Bash)
```bash
# Démarrage complet
./devops/scripts/start.sh

# Démarrage frontend uniquement
./devops/scripts/start.sh frontend

# Démarrage backend uniquement
./devops/scripts/start.sh backend

# Démarrage avec build mobile
./devops/scripts/start.sh mobile
```

## 🧪 Scripts de Tests

### Commandes de Tests
```powershell
# Tests complets
.\devops\scripts\test.ps1

# Tests frontend uniquement
.\devops\scripts\test.ps1 frontend

# Tests backend uniquement
.\devops\scripts\test.ps1 backend

# Tests E2E
.\devops\scripts\test.ps1 e2e

# Tests validation d'âge
.\devops\scripts\test.ps1 age

# Tests avec couverture
.\devops\scripts\test.ps1 -Coverage

# Tests en mode watch
.\devops\scripts\test.ps1 frontend -Watch
```

### Tests de Validation d'Âge
Le script `test-age-validation.js` teste automatiquement :
- ✅ Blocage des < 13 ans
- ✅ Consentement parental pour 13-16 ans
- ✅ Accès direct pour 17+ ans

### Tests de Charge
```powershell
# Tests de charge API (5 utilisateurs par défaut)
npm run load-test api

# Tests de charge registration avec validation d'âge
npm run load-test registration 10

# Tests complets
npm run load-test all 15
```

## 🚀 Scripts de Déploiement

### Environnements Disponibles
```powershell
# Déploiement local (développement)
.\devops\scripts\deploy.ps1 local

# Déploiement staging
.\devops\scripts\deploy.ps1 staging

# Déploiement production (avec confirmation)
.\devops\scripts\deploy.ps1 production
```

### Fonctionnalités des Déploiements
- **Local** : Clean, install, build complet
- **Staging** : Build et push vers staging
- **Production** : Tests obligatoires + confirmation manuelle

## 🐳 Docker

Le dossier `docker/` reste à la racine pour :
- Accès direct aux contextes de build
- Compatibilité avec les outils existants
- Simplicité de configuration

## 📊 CI/CD Pipeline

### GitHub Actions
Le fichier `devops/ci-cd/github-actions.yml` configure :
- ✅ Tests automatiques sur push/PR
- ✅ Tests de validation d'âge
- ✅ Audit de sécurité
- ✅ Build Docker automatisé
- ✅ Déploiement automatique

### Branches
- `main` → Production
- `develop` → Staging
- Feature branches → Tests uniquement

## 🔧 Configuration

### Variables d'Environnement
Créez un fichier `.env` dans chaque dossier :
```bash
# backend-api/.env
DATABASE_URL=mysql://user:pass@localhost:3306/faildaily
JWT_SECRET=your-secret-key
EMAIL_SERVICE_API_KEY=your-email-key

# frontend/.env
API_BASE_URL=http://localhost:3000
```

### Secrets GitHub Actions
Configurez dans les settings GitHub :
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- Autres secrets spécifiques à votre infrastructure

## 📱 Développement Mobile

### Android
```powershell
# Build Android
.\devops\scripts\start.ps1 mobile

# Ou manuellement
cd frontend
npm run build
npx cap copy android
npx cap run android
```

### iOS
```bash
# Build iOS (macOS uniquement)
./devops/scripts/start.sh mobile

# Ou manuellement
cd frontend
npm run build
npx cap copy ios
npx cap run ios
```

## 🐛 Dépannage

### Services Non Disponibles
```bash
# Vérifier les ports
netstat -tlnp | grep :3000
netstat -tlnp | grep :8100

# Redémarrer les services
pkill -f "node"
./devops/scripts/start.sh
```

### Problèmes Docker
```bash
# Nettoyer Docker
docker system prune -f
docker-compose down --volumes

# Rebuild complet
cd docker
docker-compose build --no-cache
```

### Erreurs de Tests
```bash
# Nettoyer les caches
npm run clean
rm -rf node_modules package-lock.json
npm install

# Relancer les tests
./devops/scripts/test.sh
```

## 📈 Monitoring

### Logs de Développement
```bash
# Logs backend
tail -f backend-api/logs/app.log

# Logs frontend (console du navigateur)
# F12 → Console

# Logs Docker
docker-compose logs -f
```

### Métriques de Performance
- Tests de charge : `npm run load-test`
- Analyse bundle : `npm run analyze`
- Audit performances : `npm run lighthouse`
- Audit sécurité : `npm run security-audit`

### Scripts Avancés
```powershell
# Tests de charge complets
npm run load-test all 50 60s

# Tests de charge API uniquement
npm run load-test api 100 120s

# Tests de charge registration avec validation d'âge
npm run load-test registration 30 45s

# Analyse complète des performances
.\devops\scripts\performance-analysis.ps1 all

# Analyse des dépendances
.\devops\scripts\performance-analysis.ps1 deps
```

## 🤝 Contribution

1. Créer une branche feature
2. Développer + tests
3. Lancer `./devops/scripts/test.sh`
4. Créer une Pull Request
5. CI/CD automatique + review

## 📞 Support

Pour toute question sur les scripts DevOps :
1. Consulter cette documentation
2. Vérifier les logs des scripts
3. Tester en mode debug : `./script.sh --verbose`

# Scripts DevOps FailDaily

## Scripts disponibles

### reset-repo.ps1
Automatise la réinitialisation du dépôt Git vers l'état de la branche distante.

```powershell
# Reset simple
.\devops\scripts\reset-repo.ps1

# Reset sur une autre branche
.\devops\scripts\reset-repo.ps1 -Branch develop

# Reset sans confirmation
.\devops\scripts\reset-repo.ps1 -Force
```

### dev-workflow.ps1
Workflow complet de développement.

```powershell
# Reset du dépôt uniquement
.\devops\scripts\dev-workflow.ps1 -Action reset

# Construction des conteneurs
.\devops\scripts\dev-workflow.ps1 -Action build

# Déploiement
.\devops\scripts\dev-workflow.ps1 -Action deploy

# Reset + Build + Deploy
.\devops\scripts\dev-workflow.ps1 -Action full-reset

# Affichage du statut
.\devops\scripts\dev-workflow.ps1 -Action status
```

## Logs

Les logs sont automatiquement créés dans `devops\logs\` avec horodatage.

## Sécurité

- Vérification de l'état Git avant reset
- Demande de confirmation pour les changements destructifs
- Option `-Force` pour automatisation CI/CD
