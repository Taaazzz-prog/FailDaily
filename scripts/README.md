# 🔧 Scripts FailDaily

## 📋 Index des Scripts d'Automatisation

### 🚀 Développement (`development/`)
- **`start-dev.ps1`** - Démarrage environnement de développement (PowerShell)
- **`start-dev.sh`** - Démarrage environnement de développement (Bash)

**Usage :**
```bash
# Windows
.\scripts\development\start-dev.ps1

# Linux/macOS
./scripts/development/start-dev.sh
```

### 📦 Déploiement (`deployment/`)
- **`deploy-to-ovh.ps1`** - Déploiement automatique vers serveur OVH
- **`deploy-ovh-css-fix.ps1`** - Correction CSS spécifique au déploiement OVH
- **`monitor-deploy.ps1`** - Monitoring des déploiements

**Usage :**
```bash
# Déploiement complet
.\scripts\deployment\deploy-to-ovh.ps1

# Correction CSS uniquement  
.\scripts\deployment\deploy-ovh-css-fix.ps1

# Monitoring continu
.\scripts\deployment\monitor-deploy.ps1
```

### 🔧 Maintenance (`maintenance/`)
- **`check-server-sync.ps1`** - Vérification synchronisation serveur (rapide)
- **`check-server-sync-full.ps1`** - Vérification synchronisation complète
- **`fix-frontend.ps1`** - Correction automatique problèmes frontend
- **`rapport-sync-final.ps1`** - Génération rapport de synchronisation
- **`verif-exhaustive-differences.ps1`** - Vérification exhaustive des différences

**Usage :**
```bash
# Vérification rapide
.\scripts\maintenance\check-server-sync.ps1

# Vérification complète
.\scripts\maintenance\check-server-sync-full.ps1

# Correction automatique
.\scripts\maintenance\fix-frontend.ps1
```

## 🛠️ Outils de Debug (`../tools/`)
- **`analyze-badges.js`** - Analyse du système de badges
- **`check-badges-db.js`** - Vérification intégrité badges en base
- **`debug-admin-production.js`** - Debug panneau admin en production
- **`debug-complet.js`** - Debug complet de l'application
- **`debug-next-challenges.js`** - Debug système de challenges
- **`test-admin-endpoints.sh`** - Tests des endpoints admin

**Usage :**
```bash
# Analyse badges
node tools/analyze-badges.js

# Debug complet
node tools/debug-complet.js

# Test endpoints admin
./tools/test-admin-endpoints.sh
```

## 🐳 Docker (voir `../docker/`)
- **Configuration complète** dans le dossier `docker/`
- **Scripts de démarrage** : `start-local.ps1`, `deploy.ps1`
- **Environnements** : local, production, e2e

## 📋 Conventions d'Usage

### Scripts PowerShell (.ps1)
- **Plateforme :** Windows
- **Execution Policy :** `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- **Syntaxe :** `.\scripts\category\script-name.ps1`

### Scripts Bash (.sh)
- **Plateforme :** Linux/macOS
- **Permissions :** `chmod +x scripts/category/script-name.sh`
- **Syntaxe :** `./scripts/category/script-name.sh`

### Scripts Node.js (.js)
- **Plateforme :** Cross-platform
- **Prérequis :** Node.js 18+
- **Syntaxe :** `node tools/script-name.js`

## 🚨 Scripts Critiques

### ⚠️ Production Only
- `deploy-to-ovh.ps1` - **Ne jamais exécuter en développement**
- `monitor-deploy.ps1` - **Monitoring production uniquement**

### 🔒 Permissions Requises
- Scripts de déploiement : **Accès SSH au serveur OVH**
- Scripts de maintenance : **Accès base de données**
- Scripts de debug : **Accès fichiers logs**

## 📊 Status des Scripts

| Script | Status | Dernière MAJ | Validé |
|--------|--------|--------------|--------|
| `start-dev.ps1` | ✅ Opérationnel | 17/10/2025 | ✅ |
| `deploy-to-ovh.ps1` | ✅ Opérationnel | 17/10/2025 | ✅ |
| `check-server-sync.ps1` | ✅ Opérationnel | 17/10/2025 | ✅ |
| `fix-frontend.ps1` | ✅ Opérationnel | 17/10/2025 | ✅ |
| Tous outils debug | ✅ Opérationnel | 17/10/2025 | ✅ |