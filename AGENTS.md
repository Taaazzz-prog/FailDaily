# AGENTS.md — Guide d'utilisation pour l'agent (Codex)

## 0) Mission & Périmètre
- **Objectif principal** : corriger bugs, aligner contrat **frontend ↔ backend**, améliorer fiabilité, garder le stack Docker fonctionnel.
- **Objectif secondaire** : petits refactors, docs, tests minimaux.
- **Hors scope** : refontes majeures sans validation explicite.

## 1) Architecture Générale FailDaily

### Base de données MySQL (`faildaily`)
**Structure principale :**
- **`users`** : Utilisateurs principaux (id, email, password_hash, role, account_status, registration_step)
- **`profiles`** : Profils détaillés (user_id, username, display_name, avatar_url, bio, registration_completed, legal_consent, age_verification, preferences, stats)
- **`fails`** : Publications d'échecs (id, user_id, title, description, category, image_url, is_public, reactions JSON, comments_count)
- **`comments`** : Commentaires sur les fails (id, fail_id, user_id, content, is_encouragement)
- **`reactions`** : Réactions aux fails (id, user_id, fail_id, reaction_type) - table de liaison unique
- **`badges`** & **`badge_definitions`** : Système de badges et gamification
- **`user_badges`** : Attribution des badges aux utilisateurs
- **Logs complets** : `activity_logs`, `user_activities`, `reaction_logs`, `system_logs`, `user_management_logs`
- **Système légal** : `legal_documents`, `user_legal_acceptances`, `parental_consents`
- **Configuration** : `app_config`, `user_preferences`

**Vues importantes :**
- **`user_profiles_complete`** : Vue complète utilisateur + profil avec validation d'âge et conformité légale

**Triggers automatiques :**
- Création automatique du profil après insertion d'un utilisateur
- Initialisation des réactions JSON pour les fails
- Mise à jour des préférences par défaut

### Backend API (Node.js/Express + MySQL)
**Port :** 3000 (développement), MySQL sur port 3306
**Structure :**
```
backend-api/
├── server.js (point d'entrée)
├── src/
│   ├── config/database.js (connexion MySQL avec mysql2/promise)
│   ├── controllers/ (logique métier)
│   │   ├── authController.js
│   │   ├── failController.js
│   │   ├── failsController.js
│   │   ├── commentsController.js
│   │   ├── reactionsController.js
│   │   └── ...
│   ├── routes/ (définition des endpoints)
│   │   ├── auth.js
│   │   ├── fails.js
│   │   ├── registration.js
│   │   ├── reactions.js
│   │   └── ...
│   └── middleware/auth.js (JWT authentication)
├── tests/ (Jest tests)
└── uploads/ (stockage images)
```

**APIs principales :**
- **Auth** : `/api/auth/{register,login,verify,logout,profile}`
- **Fails** : `/api/fails/{CRUD,public}` avec upload d'images
- **Registration** : `/api/registration/register` (processus complet)
- **Reactions** : `/api/reactions/{CRUD}` 
- **Comments** : `/api/comments/{CRUD}`

**Sécurité :**
- JWT tokens avec middleware `authenticateToken`
- Rate limiting, CORS, Helmet
- Bcryptjs pour le hashing des mots de passe
- Upload d'images sécurisé avec multer

### Frontend (Angular 20 + Ionic 8)
**Port :** 4200 (développement)
**Architecture standalone** (pas de modules, imports directs)
**Structure :**
```
frontend/src/app/
├── components/ (composants réutilisables)
├── pages/ (pages principales)
│   ├── auth/ (authentification)
│   ├── home/ (accueil)
│   ├── profile/ (profil utilisateur)
│   ├── post-fail/ (création fails)
│   ├── admin/ (administration)
│   └── ...
├── services/ (services Angular)
│   ├── auth.service.ts (gestion authentification)
│   ├── mysql.service.ts (communication API)
│   ├── fail.service.ts (gestion fails)
│   └── ...
├── models/ (interfaces TypeScript)
│   ├── user.model.ts
│   ├── fail.model.ts
│   ├── badge.model.ts
│   └── ...
└── guards/ (protection des routes)
```

**Services principaux :**
- **AuthService** : Gestion utilisateurs connectés, tokens JWT, auto-déconnexion
- **MysqlService** : Interface HTTP vers l'API backend 
- **FailService** : CRUD des fails
- **RegistrationService** : Processus d'inscription complet

## 2) Structure du dépôt
- `frontend/` — App Ionic/Angular (build prod servi via Nginx).
- `backend-api/` — API Node.js/Express + MySQL (`mysql2/promise`).
- `docker/` — Artefacts Docker (Dockerfiles + `docker-compose.yaml`).
- `docs/` — Documentation.
- `README.md` — Guide principal.

## 3) Environnements & Secrets
- Ne **jamais** committer de secrets.
- Fichiers d'exemple :
  - `backend-api/.env.example` :
    ```
    PORT=3000
    DB_HOST=db
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=change-me
    DB_NAME=faildaily
    CORS_ORIGIN=http://localhost
    JWT_SECRET=your-super-secret-jwt-key
    ```
  - `frontend/.env.example` :
    ```
    API_URL=http://localhost:3000
    ```
- Si un secret est nécessaire : mettre/mettre à jour l'`.env.example` correspondant et documenter la variable dans la PR.

## 4) Politique de branches (mode "branche unique")
- Travaille uniquement sur la branche `main`.
- Pousse directement sur `main`.
- N'ouvre pas de Pull Request.
- Messages de commit en **français** et format **Conventional Commits** (ex. `fix(api): corrige l'appel à executeQuery`).

## 5) Exécution & Validation

### Backend (Port 3000)
- Install : `cd backend-api && npm ci`
- Lint/Typecheck : `npm run lint || npx eslint . || true` ; `npm run build || npx tsc --noEmit || true`
- Tests : `npm test` (ajouter au moins des tests smoke si vides)
- Run : `npm start` ou `node server.js`
- **Status actuel** : ✅ Serveur fonctionnel, connecté à MySQL, 3 utilisateurs en base

### Frontend (Port 4200)
- Install : `cd frontend && npm ci`
- Build prod : `npm run build` (Angular/Ionic)
- Dev local : `npm start` (ng serve)
- **Status actuel** : ✅ Compilation réussie, serveur démarré sur http://localhost:4200

### Docker
- Orchestration : `cd docker && docker compose up -d --build`
- Attendu : backend up et connecté DB, frontend joint le backend.

## 6) Contrat API (Front ↔ Back)

### Cohérence des données
**IMPORTANT** : Respecter la convention **snake_case** côté base de données, **camelCase** côté frontend.

**Exemples critiques :**
- DB : `is_public` → Frontend : `is_public` (gardé en snake_case pour cohérence API)
- DB : `display_name` → Frontend : `displayName` (avec mapping si nécessaire)
- DB : `user_id` → Frontend : `userId`

**Note importante sur `is_public` :**
- `is_public = true` : Le fail peut être affiché de manière **anonyme** (sans nom d'auteur) pour les utilisateurs connectés
- `is_public = false` : Le fail est **privé** et seul l'auteur peut le voir
- **Tous les utilisateurs doivent être connectés** pour voir les fails, même ceux marqués `is_public = true`
- L'endpoint `/api/fails/public` retourne uniquement les fails avec `is_public = true` mais **nécessite toujours une authentification** 

**Structures JSON de référence :**

**User (backend → frontend) :**
```json
{
  "id": "uuid",
  "email": "email",
  "displayName": "string", 
  "avatar": "string",
  "role": "user|admin",
  "totalFails": 0,
  "couragePoints": 0,
  "badges": [],
  "emailConfirmed": boolean,
  "registrationCompleted": boolean
}
```

**Fail (backend → frontend) :**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string", 
  "category": "humour|travail|social|personnel|autre",
  "imageUrl": "string|null",
  "authorId": "uuid",
  "authorName": "string",
  "authorAvatar": "string",
  "reactions": {
    "courage": 0,
    "empathy": 0, 
    "laugh": 0,
    "support": 0
  },
  "commentsCount": 0,
  "is_public": boolean,
  "createdAt": "ISO string"
}
```

### Endpoints principaux
- **Auth** : `POST /api/auth/login`, `GET /api/auth/verify`, `POST /api/auth/logout`
- **Registration** : `POST /api/registration/register` (processus complet avec vérification d'âge)
- **Fails** : 
  - `GET /api/fails` (tous les fails de l'utilisateur connecté)
  - `POST /api/fails` (créer un nouveau fail)
  - `GET /api/fails/public` (fails anonymes avec `is_public = true`, **authentification requise**)
- **Reactions** : `POST /api/reactions`, `DELETE /api/reactions/:id`
- **Comments** : `GET /api/comments/:failId`, `POST /api/comments`

## 7) Utilitaires DB & Transactions
- Signature de référence : `executeQuery(query, params)`.
- Pour transactions :
  1) Pattern **callback** : `executeTransaction(pool, async (conn) => { await executeQueryWithConn(conn, q, p) })`.
  2) Pattern **batch** : `executeTransaction([{query, params}, ...])` **uniquement si déjà implémenté** dans le module DB.
- Préserver l'accès à `affectedRows` lors des refactors (ex. tâches de cleanup).

## 8) Changements autorisés (sans demander)
- Typos, commentaires, dead code.
- Harmonisation des appels DB vers la signature officielle.
- Petits tests (Jest + Supertest) pour routes critiques (`/fails`, `/comments`, `/auth`).
- Ajustements Docker/Dockerfiles sans changement d'interface externe.
- Corrections de bugs mineurs dans la logique métier.
- Amélioration des logs et du debugging.

## 9) Changements soumis à approbation
- Migrations SQL destructrices.
- Breaking changes d'API publique (paths, schémas).
- Ajout de reverse proxy/TLS, grosses montées de version.
- Modifications des triggers ou vues SQL.
- Changements du système d'authentification JWT.

## 10) Standards de tests (minimum)
- Ajouter au moins un **smoke test** :
  - `GET /api/fails` → `200` + tableau (si données).
  - Si champ `is_public` exposé : vérifier `is_public` (pas `isPublic`) sauf mapper explicite.
- Tout correctif de bug doit idéalement inclure un test qui **échoue avant** et **réussit après**.
- Tests d'intégration : vérifier communication frontend ↔ backend.

## 11) Exigences PR
- Titre : clair + **Conventional Commit**.
- Description : ce qui change, pourquoi, risques, étapes de validation (manuelles/automatisées).
- Inclure : fichiers clés modifiés, comportement avant/après, TODO éventuels.

## 12) Checklist qualité avant PR
- [ ] Plus de `executeQuery(connection, ...)` hors transaction (ou utiliser `executeQueryWithConn` dans le callback).
- [ ] Lint & build OK (backend / frontend si touché).
- [ ] Stack Docker build & démarre si touché.
- [ ] Tests min. passent (ou ajoutés).
- [ ] Communication frontend ↔ backend testée en live.

## 13) État actuel du système (22 août 2025)

### ✅ Fonctionnel
- **Backend API** : Serveur démarré sur port 3000, connecté à MySQL
- **Frontend Angular** : Compilation réussie, serveur sur port 4200  
- **Base de données** : Structure complète avec 3 utilisateurs de test
- **Authentification** : JWT fonctionnel, middleware de sécurité
- **Upload d'images** : Multer configuré pour les fails
- **Tests** : Structure Jest en place

### 🔧 Points d'attention
- **Bcrypt** : Utilisation de `bcryptjs` dans package.json mais `bcrypt` dans le code (corrigé)
- **Cohérence API** : Vérifier mapping snake_case ↔ camelCase
- **Tests** : Ajouter plus de tests d'intégration
- **Docker** : Valider le déploiement complet

### 📋 Configuration de test
Pour tester l'application en live :
1. **Backend** : `cd backend-api && node server.js` (port 3000)
2. **Frontend** : `cd frontend && npm start` (port 4200)  
3. **Accès** : http://localhost:4200
4. **Test utilisateur** : `adulte1@adulte.fr` `51008473` (disponible en base)

## 14) Commandes utiles (à exécuter dans la sandbox)
- Recherche :
  - `rg "executeQuery\\(connection" backend-api/src`
  - `rg "isPublic" -n` (repérer camelCase vs snake_case)
- Backend :
  - `cd backend-api && npm ci && (npm run lint || true) && (npm test || true)`
- Frontend :
  - `cd frontend && npm ci && npm run build`
- Docker :
  - `cd docker && docker compose up -d --build && docker compose logs --tail=200`
- Démarrage complet :
  - `cd backend-api && node server.js` (terminal 1)
  - `cd frontend && npm start` (terminal 2)

## 15) Style & Format
- Respecter l'existant (ESLint/format).
- Conserver les commentaires FR et corriger les accents/typos.
- Éviter les refactors "cosmétiques" massifs.
- Utiliser les modèles TypeScript définis pour la cohérence.

## 16) Pièges connus
- Tests vides : ne pas conclure "OK" si `npm test` ne teste rien ; ajouter un smoke test.
- **`is_public` : NE PAS confondre avec "public sans authentification"** - même les fails `is_public = true` nécessitent une connexion utilisateur. `is_public` contrôle uniquement l'**anonymisation** de l'auteur.
- `is_public` vs `isPublic` : garder la cohérence (ou mapper clairement).
- Opérations DELETE volumineuses MySQL : préférer batching / indexation ; attention aux locks.
- Frontend `.env` : si utilisé, s'assurer de l'injection au **build**.
- **Angular standalone** : Imports directs requis (RouterLink, AsyncPipe, etc.).
- **MySQL2** : Utiliser les promises, pas les callbacks.
- **JWT** : Vérifier l'expiration et le refresh des tokens.
