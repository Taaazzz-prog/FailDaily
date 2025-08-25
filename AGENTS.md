
# Guide Technique & Fonctionnel Ultra-Complet - FailDaily

---

## 1. Stack Technique

### Frontend
- **Angular 20** (standalone components)
- **Ionic 8** + **Capacitor 7** (Android/iOS)
- **TypeScript, SCSS**
- **Librairies** : @angular/*, @ionic/angular, @capacitor/*, RxJS, Lodash, Moment.js, Fontsource, Ionicons
- **Tests** : Jasmine, Karma
- **Lint** : ESLint, Angular ESLint

### Backend
- **Node.js 22** + **Express 4.21**
- **MySQL 9.1.0** (utf8mb4)
- **Architecture** : MVC, RESTful API
- **Librairies** : express, mysql2, jsonwebtoken, bcryptjs, multer, helmet, cors, express-rate-limit, morgan, dotenv, uuid
- **Tests** : Jest, Supertest
- **Lint** : ESLint

### Monorepo & DevOps
- **npm workspaces**
- **Scripts** : start, dev, build, test, lint, clean
- **Outils** : concurrently, rimraf
- **CI/CD** : Github Actions
- **Docker** : backend & frontend Dockerfile, docker-compose

---

## 2. Routes API REST (Exhaustif)

### Authentification
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/verify
- POST /api/auth/logout
- GET /api/auth/check-email
- GET /api/auth/profile
- PUT /api/auth/profile
- PUT /api/auth/password
- POST /api/auth/password-reset

### Utilisateurs
- GET /api/users/:userId/stats
- GET /api/users/:userId/badges
- GET /api/users/:userId/fails

### Fails
- GET /api/fails
- GET /api/fails/search
- GET /api/fails/categories
- GET /api/fails/tags
- GET /api/fails/stats
- GET /api/fails/public
- POST /api/fails
- GET /api/fails/:id
- PUT /api/fails/:id
- DELETE /api/fails/:id

### Badges
- GET /api/badges/available
- GET /api/badges
- GET /api/user/badges
- POST /api/user/xp

### Réactions
- POST /api/fails/:id/reactions
- DELETE /api/fails/:id/reactions
- GET /api/fails/:id/reactions
- GET /api/user/reactions/stats

### Commentaires
- POST /api/fails/:id/comments
- GET /api/fails/:id/comments
- PUT /api/fails/:id/comments/:commentId
- DELETE /api/fails/:id/comments/:commentId
- GET /api/user/comments/stats

### Upload
- POST /api/upload/image
- POST /api/upload/avatar

### Logs & Debug
- GET /api/logs/system
- GET /api/logs/user/:userId
- GET /api/logs
- GET /api/debug/stats
- GET /api/debug/health

### Age Verification (COPPA)
- POST /api/age/verify
- PUT /api/age/update-birth-date
- GET /api/age/user-age
- GET /api/age/statistics
- GET /api/age/coppa-compliance

### Administration
- GET /api/admin/stats
- GET /api/admin/users
- PUT /api/admin/config
- GET /api/admin/logs
- GET /api/admin/fails
- PUT /api/admin/fails/:id
- POST /api/admin/logs/user-action
- POST /api/admin/logs/user-login

---

## 3. Fonctionnalités Utilisateurs & Admin

### Utilisateurs
- Inscription avec vérification d'âge (COPPA)
- Connexion sécurisée (JWT)
- Reset mot de passe
- Profil personnalisable (avatar, bio, pseudo)
- Consentements légaux automatisés
- Création de fail (texte, image, vidéo)
- Catégorisation, publication anonyme/publique
- Recherche avancée, statistiques personnelles
- Système de badges (70+, progression XP, raretés)
- Réactions multiples, commentaires, modération auto
- Timeline, objectifs mensuels, notifications push
- Personnalisation, accessibilité, mode sombre/clair

### Panel Admin
- Dashboard métriques système
- Logs système/utilisateur
- Monitoring API/DB
- Gestion utilisateurs, rôles, suspension
- Modération fails, signalements, commentaires
- Gestion badges (création, attribution, stats)
- Configuration système, XP, notifications
- Sécurité COPPA/RGPD, backup, alertes

---

## 4. Système de Badges (Ultra-Exhaustif)

- 70+ badges répartis en COURAGE, HUMOUR, ENTRAIDE, PERSEVERANCE, RESILIENCE, SPECIAL
- 4 raretés : common, rare, epic, legendary
- Déblocage automatique selon actions (fails, réactions, encouragements, streaks, etc.)
- Progression XP et niveaux
- API endpoints pour attribution/déblocage
- Exemples :
		- Premier Courage : Partager son premier fail courageux
		- Courage Épique : Partager 10 fails courageux
		- Maître du Rire : Partager 10 fails humoristiques
		- Soutien Épique : Encourager 10 utilisateurs
		- Survivant : Surmonter 50 défis personnels
- Voir analyse-faildailyV1.md pour la liste complète et les requirements SQL

---

## 5. Architecture, Sécurité & Design

- Authentification JWT + refresh tokens
- Rate limiting IP, CORS, Helmet
- Validation stricte des données
- Monitoring, alertes, backup auto
- SSL/TLS partout
- Monorepo npm workspaces
- API RESTful documentée
- MVC backend, standalone components frontend
- Dockerisation complète, CI/CD Github Actions
- Design "imperfection intentionnelle" pastel, manuscrit
- Typographies : Caveat, Comfortaa, Kalam, Inter
- Animations : wobble, heartbeat, glow, responsive

---

## 6. Base de Données (Schéma, Exemples, Badges, Légal)

### Tables principales
- users, profiles, fails, comments, badges, badge_definitions, legal_documents, user_activities, reactions, system_logs, user_badges, user_legal_acceptances, user_management_logs, user_preferences, parental_consents

### Exemples de données
- Utilisateur, profil, fail, activité, document légal, badge (voir analyse-faildailyV1.md)

### Définitions de badges
- Table badge_definitions : id, name, description, icon, category, rarity, requirement_type, requirement_value
- Extraits :
		- courage-1 : Premier Courage, flame-outline, COURAGE, common, courage_fails, 1
		- viral-laugh : Sensation Virale, trending-up-outline, HUMOUR, legendary, laugh_reactions, 500
		- survivor : Survivant, shield-checkmark-outline, RESILIENCE, legendary, challenges_overcome, 50

### Documents légaux
- Conditions d'utilisation, Politique de confidentialité, Règles de la communauté, Politique des données

### Dump SQL complet
- Structure, inserts, triggers, vues, contraintes, badges, documents légaux (voir analyse-faildailyV1.md)

---

## 7. Workflows Développeur & Cloud

### Installation cloud-safe
- npm install --omit=optional
- npm install --force || npm install --legacy-peer-deps
- npm uninstall @fontsource/* (cloud uniquement, ne pas committer)
- npm list express mysql2 || npm install express mysql2 jsonwebtoken

### Fix ESLint
- Renommer eslint.config.js en .mjs
- Ajouter "type": "module" dans package.json
- Utiliser .eslintrc.cjs si besoin

### Fix Lint Frontend
- npm run lint -- --fix
- Désactiver temporairement strict mode (cloud)

### Installation outils manquants
- npm install -g jest @angular/cli
- OU npm install --save-dev jest @angular/cli

### Tests cloud-safe
- NODE_ENV=test DB_DISABLED=true node -e "..."

### Audit cohérence
- Node.js script pour chercher les patterns
- find + xargs si dispo

### Variables d'environnement
- backend/.env : PORT, DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET, CORS_ORIGIN
- frontend/environment.ts : apiUrl

### Checklist validation cloud
- git stash, npm install --force, fix ESLint/lint, tests unitaires, cohérence endpoints, nettoyage post-test

---

## 8. Payloads API & Cas d'Usage

### Exemple création fail
POST /api/fails
{
	"title": "J'ai raté mon entretien",
	"content": "J'ai oublié de préparer mes réponses...",
	"category": "courage",
	"isAnonymous": false,
	"mediaUrl": "https://faildaily.com/uploads/fails/fail-12345.jpg"
}

### Exemple déblocage badge
POST /api/user/badges/unlock
{
	"badgeId": 7
}

### Cas d'usage utilisateur
- Inscription & connexion (COPPA, JWT)
- Partage fail, réactions, progression XP, badges
- Interaction sociale, personnalisation, confidentialité
- Panel admin : modération, gestion utilisateurs, logs, stats

---

## 9. Schémas, Wireframes, UML

- Architecture globale : Frontend <-> Backend API <-> MySQL
- Wireframes : Home, Badges, Profil, Publication fail
- UML : Utilisateur, Fail, Badge

---

## 10. Références Complètes

- Pour tout détail, voir analyse-faildailyV1.md (dump SQL, badges, légaux, payloads, wireframes, design, workflows)

---
