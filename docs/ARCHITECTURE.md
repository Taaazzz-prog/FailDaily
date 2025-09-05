# Architecture FailDaily - Guide Complet

## 🏗️ Structure du Projet

```
FailDaily/
├── 📱 frontend/                # Application Ionic/Angular
│   ├── src/                   # Code source frontend
│   │   ├── app/              # Application Angular
│   │   ├── assets/           # Ressources statiques
│   │   └── theme/            # Styles SCSS
│   ├── android/              # Projet Android Capacitor
│   ├── ios/                  # Projet iOS Capacitor
│   ├── www/                  # Build de production
│   ├── capacitor.config.ts   # Configuration Capacitor
│   ├── ionic.config.json     # Configuration Ionic
│   ├── angular.json          # Configuration Angular
│   ├── package.json          # Dépendances frontend
│   └── .env                  # Variables d'environnement frontend
├── 🚀 backend-api/           # API Node.js
│   ├── src/                  # Code source API
│   │   ├── routes/           # Routes Express
│   │   ├── middleware/       # Middlewares
│   │   └── utils/            # Utilitaires
│   ├── tests/                # Tests API
│   ├── uploads/              # Fichiers uploadés
│   ├── package.json          # Dépendances backend
│   └── .env                  # Variables d'environnement backend
├── 🐳 docker/                # Configuration Docker
│   ├── frontend.Dockerfile   # Dockerfile frontend
│   ├── backend.Dockerfile    # Dockerfile backend
│   └── docker-compose.yaml   # Orchestration Docker
├── 📚 docs/                  # Documentation
│   ├── BACKEND_GAPS_ANALYSIS.md
│   ├── TECHNICAL-GUIDE.md
│   └── MIGRATION_MySQL_FailDaily_COMPLETE.sql
├── 📋 package.json           # Configuration monorepo
├── 🚀 start.ps1             # Script de démarrage Windows
├── 🚀 start.sh              # Script de démarrage Unix/Linux
└── 📖 README.md             # Documentation principale
```

## 🛠️ Installation et Configuration

### Prérequis
- Node.js 18+ 
- npm 8+
- MySQL 8.0
- Ionic CLI
- Android Studio (pour Android)
- Xcode (pour iOS, macOS uniquement)

### Installation rapide
```bash
# Cloner le projet
git clone <repository-url>
cd FailDaily

# Installer toutes les dépendances
npm install
npm run install:all

# Configurer l'environnement
cp frontend/.env.example frontend/.env
cp backend-api/.env.example backend-api/.env
```

## 🚀 Commandes de Développement

### Scripts Monorepo (depuis la racine)
```bash
# Installation
npm run install:all          # Installer toutes les dépendances

# Développement
npm run dev:frontend         # Frontend uniquement
npm run dev:backend          # Backend uniquement  
npm run dev:full            # Frontend + Backend ensemble

# Build
npm run build:frontend      # Build du frontend
npm run build:backend       # Build du backend
npm run build:all          # Build complet

# Tests
npm run test:frontend       # Tests frontend
npm run test:backend        # Tests backend
npm run test:all           # Tous les tests

# Docker
npm run docker:build       # Build des images Docker
npm run docker:up          # Démarrer les containers
npm run docker:down        # Arrêter les containers

# Mobile
npm run mobile:sync        # Synchroniser Capacitor
npm run android:build      # Build Android
npm run android:run        # Lancer sur Android
npm run ios:build          # Build iOS
npm run ios:run            # Lancer sur iOS
```

### Scripts PowerShell (Windows)
```powershell
.\start.ps1 install         # Installation complète
.\start.ps1 dev            # Développement complet
.\start.ps1 frontend       # Frontend uniquement
.\start.ps1 backend        # Backend uniquement
.\start.ps1 android        # Build Android
.\start.ps1 ios            # Build iOS
.\start.ps1 docker         # Démarrage Docker
.\start.ps1 test           # Tests complets
```

## 📱 Développement Frontend

### Démarrage
```bash
cd frontend
ionic serve                # Serveur de développement
ionic build               # Build de production
```

### Configuration Capacitor
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.faildaily.app',
  appName: 'FailDaily',
  webDir: 'www'
};
```

### Build Mobile
```bash
# Android
ionic capacitor build android
ionic capacitor run android

# iOS  
ionic capacitor build ios
ionic capacitor run ios
```

## 🚀 Développement Backend

### Démarrage
```bash
cd backend-api
npm start                  # Serveur de développement
npm run dev               # Mode watch avec nodemon
npm test                  # Tests
```

### Configuration API
- **Port** : 3000 (par défaut)
- **Base de données** : MySQL 8.0
- **Authentification** : JWT
- **Documentation** : Swagger (en développement)

## 🐳 Déploiement Docker

### Build et démarrage
```bash
cd docker
docker-compose build      # Build des images
docker-compose up -d      # Démarrage en arrière-plan
docker-compose logs -f    # Logs en temps réel
docker-compose down       # Arrêt des services
```

### Services Docker
- **Frontend** : node:20-alpine avec serve (port 80)
- **Backend** : node:20-alpine (port 3000)
- **Database** : mysql:8.0 (port 3306)
- **Reverse Proxy** : traefik:v3.0 (ports 80/443)

## 🔧 Configuration Environnement

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3001
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_NAME=FailDaily
VITE_DEBUG_MODE=true
```

### Backend (.env)
```bash
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=faildaily
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

## 📊 Architecture Technique

### Frontend Stack
- **Framework** : Angular 18
- **UI** : Ionic 8
- **Mobile** : Capacitor 7
- **État** : Services Angular + RxJS
- **Styling** : SCSS + Ionic Components

### Backend Stack
- **Runtime** : Node.js 20
- **Framework** : Express.js
- **Base de données** : MySQL 8.0
- **ORM** : MySQL2 (raw queries)
- **Authentification** : JWT + bcrypt
- **Validation** : Express-validator

### DevOps
- **Containerisation** : Docker + Docker Compose
- **CI/CD** : GitHub Actions (à configurer)
- **Tests** : Jest (backend) + Jasmine/Karma (frontend)
- **Linting** : ESLint + Prettier

## 🚦 Workflow de Développement

### 1. Développement Local
```bash
# Terminal 1 - Backend
cd backend-api && npm start

# Terminal 2 - Frontend  
cd frontend && ionic serve

# Ou utiliser le script
npm run dev:full
```

### 2. Tests
```bash
# Tests backend
cd backend-api && npm test

# Tests frontend
cd frontend && npm test

# Tests complets
npm run test:all
```

### 3. Build Mobile
```bash
# Android
cd frontend
ionic build
npx capacitor sync android
npx capacitor open android

# iOS
cd frontend
ionic build  
npx capacitor sync ios
npx capacitor open ios
```

### 4. Déploiement
```bash
# Production Docker
cd docker
docker-compose -f docker-compose.prod.yml up -d

# Ou via script
npm run docker:up
```

## 🔒 Sécurité

### Variables d'Environnement
- ❌ Jamais commiter les fichiers `.env`
- ✅ Utiliser `.env.example` comme template
- ✅ Configurer différents environnements (dev/staging/prod)

### API Security
- ✅ Authentification JWT
- ✅ Validation des entrées
- ✅ Rate limiting
- ✅ CORS configuré
- ✅ Hashage des mots de passe (bcrypt)

## 📈 Monitoring et Logs

### Logs Backend
```bash
# Logs en temps réel
cd backend-api && npm run dev

# Logs Docker
docker-compose logs -f backend
```

### Métriques
- Performance API
- Erreurs d'authentification  
- Usage des endpoints
- Santé de la base de données

## 🚀 Déploiement Production

### Variables d'Environnement Production
```bash
# Frontend
VITE_API_URL=https://api.faildaily.com
VITE_DEBUG_MODE=false

# Backend  
NODE_ENV=production
DB_SSL=true
JWT_SECRET=complex_production_secret
```

### Checklist Déploiement
- [ ] Variables d'environnement configurées
- [ ] Base de données migrée
- [ ] SSL/TLS configuré
- [ ] Monitoring activé
- [ ] Backups configurés
- [ ] Tests passants
- [ ] Build mobile testé

## 📞 Support

### Problèmes Courants
1. **Port occupé** : Changer les ports dans `.env`
2. **Base de données** : Vérifier MySQL et les credentials
3. **Capacitor** : Nettoyer et resynchroniser
4. **Build mobile** : Vérifier Android Studio/Xcode

### Debugging
```bash
# Logs détaillés backend
DEBUG=* npm start

# Mode verbose Ionic
ionic serve --verbose

# Logs Capacitor
npx capacitor run android -l
```

Pour plus d'aide, consultez la documentation dans `docs/` ou créez une issue GitHub.
