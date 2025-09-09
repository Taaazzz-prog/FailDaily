# 🚀 Guide de Démarrage Rapide - FailDaily

## ⚡ **Lancement Immédiat (5 minutes)**

### 🐳 **Option 1 - Docker (Recommandée)**
```bash
# Cloner et lancer
git clone https://github.com/Taaazzz-prog/FailDaily.git
cd FailDaily
.\docker\start-local.ps1 --with-data

# Accès immédiat
# Frontend: http://localhost:8080
# Backend:  http://localhost:3000  
# MySQL:    localhost:3306
```

### 💻 **Option 2 - Développement Local**
```bash
# Prérequis: Node.js 22+, MySQL 8+
npm install
npm run dev:full

# Frontend: http://localhost:8100
# Backend:  http://localhost:3000
```

---

## 🛠️ **Commandes Essentielles**

### 🔧 **Scripts Principaux**
```bash
# Développement
npm run dev:full          # Frontend + Backend
npm run dev:frontend      # Frontend uniquement  
npm run dev:backend       # Backend uniquement

# Tests
npm run test:all          # Tous les tests
npm run test:backend      # Tests API
npm run test:frontend     # Tests Angular

# Production
npm run build:all         # Build complet
npm run start:prod        # Lancement production
```

### 🐳 **Scripts Docker**
```bash
# Lancement
.\docker\start-local.ps1          # Basique
.\docker\start-local.ps1 --rebuild    # Avec rebuild
.\docker\start-local.ps1 --with-data  # Avec import DB

# Monitoring
.\docker\status.ps1               # État des services
.\docker\deploy.ps1               # Redéploiement

# Synchronisation
.\docker\sync-from-ovh.ps1 -ServerHost "IP" -ServerUser "user"
```

---

## 📊 **Vérification de l'Installation**

### ✅ **Tests de Santé**
```bash
# Backend disponible
curl http://localhost:3000/health
# Réponse: {"status":"ok","timestamp":"..."}

# Frontend accessible  
curl http://localhost:8080
# Réponse: Page d'accueil FailDaily

# Base de données
.\docker\status.ps1  # Vérifie MySQL + tables
```

### 🧪 **Tests Complets**
```bash
# Suite de tests backend
node backend-api/tests/run-all-tests.js

# Tests d'intégration
node test-frontend-backend-communication.js
node test-docker-communication.js
```

---

## 🏗️ **Architecture Rapide**

```
FailDaily/
├── 📱 frontend/              # Angular 20 + Ionic 8
├── 🚀 backend-api/          # Node.js 22 + Express  
├── 🐳 docker/               # Configuration Docker
├── 📚 docs/                 # Documentation technique
├── 🧪 tests/                # Scripts de test
└── 📋 Scripts principaux
```

### 🔄 **Flux de Données**
```
📱 Frontend (Angular) → 🌐 API (Node.js) → 🗄️ MySQL → 🏆 Badges → 💬 Notifications
```

---

## 🔐 **Configuration Initiale**

### 📝 **Variables d'Environnement**
```bash
# backend-api/.env
DB_HOST=localhost
DB_USER=root  
DB_PASSWORD=your_password
DB_NAME=faildaily
JWT_SECRET=your_jwt_secret

# frontend/src/environments/
API_BASE_URL=http://localhost:3000/api
```

### 🗄️ **Base de Données**
```bash
# Import automatique avec Docker
.\docker\start-local.ps1 --with-data

# Import manuel
mysql -u root -p faildaily < faildaily.sql
```

---

## 🚨 **Dépannage Rapide**

### ❌ **Problèmes Fréquents**
| Problème | Solution |
|----------|----------|
| Port 3000 occupé | `npx kill-port 3000` |
| MySQL non démarré | `.\docker\start-local.ps1` |
| Frontend non accessible | Vérifier `ionic serve` |
| Erreur CORS | Redémarrer backend |

### 🔍 **Diagnostic**
```bash
# État complet des services
.\docker\status.ps1

# Logs en temps réel  
docker-compose logs -f

# Tests de communication
node test-frontend-backend-communication.js
```

---

## 📚 **Documentation Complète**

- **[README Principal](README.md)** - Vue d'ensemble du projet
- **[Guide des Scripts](SCRIPTS_GUIDE.md)** - Tous les scripts disponibles  
- **[API Reference](API_ENDPOINTS.md)** - Documentation API complète
- **[Système de Badges](BADGES_GUIDE.md)** - Guide badges complet
- **[Architecture](docs/ARCHITECTURE.md)** - Architecture technique détaillée

---

## 🎯 **Prochaines Étapes**

1. **🔍 Explorer** l'interface à http://localhost:8080
2. **📡 Tester** l'API à http://localhost:3000/api
3. **🏆 Comprendre** le système de badges
4. **🧪 Exécuter** les tests complets
5. **🚀 Déployer** en production avec Docker

---

*Guide mis à jour - Septembre 2025*
