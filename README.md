# FailDaily - Application de Partage d'Échecs Constructifs

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)](https://github.com/Taaazzz-prog/FailDaily)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-blue.svg)](#)
[![Tech](https://img.shields.io/badge/Tech-Angular%2020%20%7C%20Ionic%208%20%7C%20Node.js%2022%20%7C%20MySQL%208-orange.svg)](#)
[![Tests](https://img.shields.io/badge/Tests-16%20Backend%20%7C%2011%20Frontend-success.svg)](#)

## 🏗️ **Structure du Projet**

```
FailDaily/
├── 📁 backend-api/          # API Node.js + Express
├── � frontend/             # Application Ionic/Angular  
├── 📁 docker/               # Configuration Docker
├── 📁 docs/                 # Documentation complète
│   ├── 📁 guides/           # Guides techniques
│   ├── 📁 reports/          # Rapports de validation
│   └── 📁 planning/         # Planification et todo
├── 📁 scripts/              # Scripts d'automatisation
│   ├── 📁 development/      # Scripts de développement
│   ├── 📁 deployment/       # Scripts de déploiement
│   └── 📁 maintenance/      # Scripts de maintenance
├── 📁 tools/                # Outils de debug et analyse
├── 📁 config/               # Configuration système
└── 📁 e2e/                  # Tests end-to-end Cypress
```

## �🚀 **Démarrage Rapide**

```bash
# 1. Cloner le projet
git clone https://github.com/Taaazzz-prog/FailDaily.git
cd FailDaily

# 2. Lancer avec Docker (recommandé)
.\scripts\development\start-dev.ps1

# 3. Accéder à l'application
# Frontend: http://localhost:8000 (via Traefik)
# API:      http://localhost:3002/api
# MySQL:    localhost:3308
# Admin:    http://localhost:8090 (Traefik Dashboard)
```

**🔗 Documentation :** [Scripts Guide](docs/guides/SCRIPTS_GUIDE.md) | [API Reference](docs/specs/API_ENDPOINTS.md) | [Badges System](docs/guides/BADGES_GUIDE.md) | [Changements API](docs/specs/DOC_CHANGEMENTS_API.md) | [Plan de tests](docs/reports/TEST_PLAN_MANUEL.md) | [SMTP OVH](docs/OVH_EMAIL_SMTP.md)

### 🔐 Variables d’environnement indispensables (Backend)

Le module de logs utilise désormais uniquement des variables d’environnement. Ajoutez les clés suivantes à votre fichier `.env` backend :

```
LOGS_DB_HOST=...
LOGS_DB_PORT=...
LOGS_DB_USER=...
LOGS_DB_PASSWORD=...
LOGS_DB_NAME=...
```

> Si l’une de ces variables manque, l’API arrêtera son démarrage pour éviter l’utilisation de secrets codés en dur.

## 🎯 **Concept & Vision**

FailDaily révolutionne les réseaux sociaux en encourageant la **vulnérabilité positive** et l'**apprentissage par l'échec**. Contrairement aux plateformes traditionnelles qui cultivent la perfection artificielle, FailDaily célèbre l'imperfection humaine et transforme les échecs en opportunités de croissance collective.

## 🏗️ **Architecture Projet** (Restructurée)

```
FailDaily/
├── 📁 backend-api/              # 🚀 API Node.js + Express
│   ├── src/                     # Code source (routes, services, middleware)
│   ├── tests/                   # Tests Jest (16 suites + tests fonctionnels)
│   ├── migrations/              # Migrations base de données
│   └── uploads/                 # Fichiers uploadés (avatars)
├── 📁 frontend/                 # 📱 Application Ionic/Angular  
│   ├── src/                     # Code source (components, services, pages)
│   ├── android/                 # Build Android (Capacitor)
│   ├── ios/                     # Build iOS (Capacitor)
│   └── www/                     # Build production web
├── 📁 docker/                   # 🐳 Infrastructure conteneurisée
│   ├── local/                   # Environnement développement
│   ├── production/              # Environnement production
│   └── e2e/                     # Tests end-to-end
├── 📁 docs/                     # � Documentation complète
│   ├── guides/                  # Guides techniques (déploiement, tests)
│   ├── reports/                 # Rapports de validation et status
│   ├── planning/                # Planification et todo lists
│   └── specs/                   # Spécifications techniques
├── 📁 scripts/                  # � Automatisation
│   ├── development/             # Scripts de développement (start-dev.*)
│   ├── deployment/              # Scripts de déploiement (OVH, monitoring)
│   └── maintenance/             # Scripts de maintenance et synchronisation
├── 📁 tools/                    # 🛠️ Outils de debug et analyse
├── 📁 config/                   # ⚙️ Configuration système
├── 📁 e2e/                      # 🧪 Tests Cypress end-to-end
└── 📁 devops/                   # 🚀 CI/CD et infrastructure
```

### **Stack Technologique**
- **Frontend** : Angular 20 + Ionic 8 (PWA/Mobile)
- **Backend** : Node.js + Express.js (API REST)
- **Base de données** : MySQL 8.0 (WampServer local)
- **Authentification** : JWT + bcrypt
- **Services** : 15+ services Angular modulaires
    ├── 8 tables principales
    ├── Système de badges dynamique
    └── Triggers automatisés
```

---

## ✅ **FONCTIONNALITÉS IMPLÉMENTÉES**

### 🔐 **Système d'Authentification Complet**
- **Inscription sécurisée** avec validation email/mot de passe
- **Connexion JWT** avec tokens de rafraîchissement
- **Consentement RGPD** intégré (gestion des mineurs)
- **Réinitialisation de mot de passe** par email
- **Gestion des sessions** multi-appareils

### 👤 **Gestion des Profils Utilisateur**
- **Profils personnalisables** (nom, avatar, bio)
- **Statistiques détaillées** (fails postés, réactions reçues, streaks)
- **Système de courage points** avec calculs automatiques
- **Paramètres de confidentialité** granulaires
- **Historique d'activité** complet

### 📝 **Publication de Fails**
- **Interface intuitive** pour partager des échecs
- **Upload d'images** avec compression automatique
- **Catégorisation** (professionnel, personnel, social, etc.)
- **Mode anonyme** optionnel
- **Modération IA** (OpenAI) anti-toxicité
- **Accès sécurisé** : les fails ne sont visibles que par des utilisateurs authentifiés

### 🏆 **Système de Badges Gamifié**
- **58 badges disponibles** dans 6 catégories
- **Déblocage automatique** basé sur les actions utilisateur
- **Système de XP** et progression
- **Badges d'accomplissement** et de régularité
- **Interface d'administration** pour créer/modifier les badges

### 💖 **Interactions Positives Uniquement**
- **Courage Hearts** au lieu de "likes"
- **Réactions encourageantes** prédéfinies
- **Commentaires modérés** automatiquement
- **Système de soutien** communautaire
- **Pas de comparaisons toxiques**

### 👑 **Interface d'Administration**
- **Dashboard complet** avec métriques
- **Gestion des utilisateurs** (rôles, bans, statistiques)
- **Modération de contenu** centralisée
- **Système de logs** détaillé
- **Configuration des points** et récompenses

---

## 🚧 **FONCTIONNALITÉS EN DÉVELOPPEMENT**

### 🔔 **Système de Notifications**
- **Push notifications** configurées (en test)
- **Rappels quotidiens** personnalisables (18h-22h)
- **Notifications de badges** débloqués
- **Alertes de modération** pour les admins

### 📧 **Communication par Email**
- **Emails de vérification** d'inscription
- **Consentement parental** pour les mineurs
- **Rapports d'activité** hebdomadaires
- **Notifications importantes** par email

### 🎮 **Fonctionnalités Avancées** (Beta)
- **Voice Notes** : Messages vocaux d'encouragement
- **Group Challenges** : Défis collectifs
- **AI Counselor** : Conseils personnalisés basés sur l'IA
- **Streaks de vulnérabilité** : Encourager la régularité

---

## 📋 **ROADMAP & TODO LIST**

### 🔥 **Priorité Haute (Sprint Actuel)**

#### Backend API
- [ ] **Finaliser notifications push** (Firebase integration)
- [ ] **Système d'emails** (SendGrid/Nodemailer)
- [x] **API de modération** avancée (hidden/approved/rejected, seuils, panneaux admin)
- [x] **Système de rapports** utilisateur (signalements fails/comments + seuil auto-masquage)
- [ ] **Cache Redis** pour performances

#### Frontend Mobile
- [ ] **Optimisations PWA** (offline, cache)
- [ ] **Animations** d'interface améliorées
- [ ] **Mode sombre** natif
- [ ] **Gestes** intuitifs (swipe, pull-to-refresh)
- [ ] **Accessibilité** (WCAG compliance)

#### Base de Données
- [ ] **Index de performance** optimisés
- [ ] **Procédures stockées** pour analytics
- [ ] **Système de backup** automatisé
- [ ] **Monitoring** temps réel

### ⚡ **Priorité Moyenne (Prochains Sprints)**

#### Fonctionnalités Sociales
- [ ] **Système de follow** entre utilisateurs
- [ ] **Feed personnalisé** basé sur les follows
- [ ] **Mentions** et notifications sociales
- [ ] **Partage** de fails vers autres plateformes
- [ ] **Groupes/Communautés** thématiques

#### Analytics & Insights
- [ ] **Dashboard personnel** avec graphiques
- [ ] **Insights IA** sur les patterns d'échecs
- [ ] **Recommandations** personnalisées
- [ ] **Export de données** RGPD
- [ ] **Rapports d'impact** personnel

#### Gamification Avancée
- [ ] **Système de niveaux** global
- [ ] **Badges collaboratifs** (équipe)
- [ ] **Challenges temporaires** (événements)
- [ ] **Récompenses virtuelles** échangeables
- [ ] **Classements** communautaires bienveillants

### 🔮 **Priorité Basse (Vision Long Terme)**

#### Intelligence Artificielle
- [ ] **Analyse de sentiment** des posts
- [ ] **Détection de détresse** psychologique
- [ ] **Recommandations de ressources** d'aide
- [ ] **Coach IA** personnalisé
- [ ] **Prédiction de patterns** destructeurs

#### Intégrations Externes
- [ ] **API publique** pour développeurs
- [ ] **Webhooks** pour services tiers
- [ ] **Intégration calendrier** (Google/Outlook)
- [ ] **Connect social** (import fails depuis autres apps)
- [ ] **Partenariats** avec plateformes de bien-être

#### Monétisation Éthique
- [ ] **Abonnement Premium** (fonctionnalités avancées)
- [ ] **Dons** volontaires à des associations
- [ ] **Contenu éducatif** payant (workshops)
- [ ] **Certifications** en développement personnel
- [ ] **API commerciale** pour entreprises

---

## 🛠️ **DÉTAILS TECHNIQUES**

### **Services Angular Implémentés**
```typescript
✅ AuthService         // Authentification, gestion session
✅ MysqlService         // Communication base de données  
✅ BadgeService         // Gestion système de badges
✅ FailService          // Gestion des posts/fails
✅ AdminMysqlService    // Administration système
✅ ComprehensiveLogger  // Logging avancé
✅ DebugService         // Outils de débogage
✅ ConsentService       // Gestion RGPD
✅ PushService          // Notifications push
✅ ModerationService    // Modération automatique
```

### **Pages Fonctionnelles**
```typescript
✅ /auth/register       // Inscription utilisateur
✅ /auth/login          // Connexion
✅ /profile             // Profil personnel
✅ /edit-profile        // Modification profil
✅ /post-fail           // Publication échec
✅ /badges              // Collection badges
✅ /admin               // Interface admin
✅ /privacy-settings    // Paramètres confidentialité
✅ /debug               // Outils développeur
✅ /legal               // Documents légaux
```

### **API Endpoints MySQL**
```bash
# Authentification
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/password-reset
POST /api/auth/password-reset/confirm

# Utilisateurs  
GET  /api/auth/profile
PUT  /api/auth/profile
GET  /api/users/:userId/stats

# Badges
GET  /api/badges/available
GET  /api/users/:userId/badges
GET  /api/users/:userId/badges/ids
POST /api/badges/check-unlock/:userId

# Administration
GET  /api/admin/users
GET  /api/admin/dashboard
GET  /api/admin/moderation/config
PUT  /api/admin/fails/:id/moderation   # approved | hidden | under_review | rejected

# Inscription & Vérification
POST /api/registration/register
POST /api/registration/resend-verification
POST /api/registration/verify-email
POST /api/registration/parent-consent/request
POST /api/registration/parent-consent/confirm
```

---

## 📊 **MÉTRIQUES & PERFORMANCE**

### **Performance Technique**
- ⚡ **Temps de chargement** : < 2s (première visite)
- 🚀 **Temps de réponse API** : < 200ms (95% des requêtes)
- 📱 **PWA Score** : 95/100 (Lighthouse)
- 🔐 **Sécurité** : A+ (SSL Labs)

### **Objectifs Business**
- 👥 **100 utilisateurs actifs** (première phase)
- 📝 **10 fails/jour** en moyenne (communauté)
- 🏆 **80% d'engagement** avec le système de badges
- 💖 **Ratio positif** 90%+ sur les interactions

---

## 🚀 **DÉPLOIEMENT**

### **Environnement Local (Docker recommandé)**
```bash
# Déployer la stack locale (DB + migrations + Traefik + API + Frontend)
npm run deploy:docker

# Accès
# Frontend (Traefik) :  http://localhost:8000
# Backend API        :  http://localhost:3000
# MySQL (host)       :  127.0.0.1:3308
```

### **Production (Prêt)**
- ✅ **Build optimisé** (Angular AOT)
- ✅ **Docker containers** configurés
- ✅ **Variables d'environnement** sécurisées
- ✅ **SSL/HTTPS** ready
- ✅ **Monitoring** logs intégré

---

*FailDaily - Transformons nos échecs en succès collectifs* 🌟

> For AI coding agent usage and guardrails, see [AGENTS.md](./AGENTS.md).
