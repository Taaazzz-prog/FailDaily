# Audit Complet FailDaily — Frontend, Backend, Base de Données

Dernière mise à jour: génération automatique basée sur le code présent dans le dépôt.

## Résumé Exécutif

- Backend: architecture solide (Express + MySQL), endpoints étendus (auth, fails, commentaires, réactions, logs, admin). Plusieurs réponses JSON ne correspondent pas au contrat attendu par le frontend (auth/profil), et le flux de modération des fails est incomplet, rendant le feed potentiellement vide par défaut.
- Frontend: structure Angular/Ionic complète (routes, guards, services). Plusieurs services présument des formes de réponses différentes de celles renvoyées par le backend (auth, profil, fails publics, upload d’image), entraînant des échecs fonctionnels côté UI.
- BDD: schéma riche et cohérent (triggers inclus), import SQL fourni. Le statut de modération des fails (approved/hidden) est lu mais n’est jamais mis à jour via un endpoint admin → contenu non visible.
- Priorités: aligner les contrats d’API Auth/Profil avec le frontend, corriger l’upload image et la récupération des fails publics côté front OU uniformiser le backend, ajouter les endpoints d’approbation des fails (fail_moderation), corriger le handler global d’erreurs Express, unifier la configuration .env (ports DB).

---

## Portée et Méthode

- Analyse statique des sources:
  - Backend: `backend-api/` (Express, routes, contrôleurs, middleware, config MySQL, migrations SQL)
  - Frontend: `frontend/` (Angular/Ionic, services, environments, routing)
  - BDD: `backend-api/migrations/faildaily.sql` + scripts d’import
- Pas d’exécution en local, pas de connexion réseau; conclusions basées sur le code et la cohérence des contrats front/back.

---

## Backend (Node / Express / MySQL)

### Ce qui fonctionne (confirmé par lecture du code)

- Serveur et middlewares:
  - `helmet`, `cors`, `express-rate-limit`, `morgan`, `express.json/urlencoded`, statiques pour `/uploads` et `/powerpoint` — `backend-api/server.js`
  - Health/info: `GET /health`, `/api/health` (redirection), `/api/info`
- Connexion MySQL:
  - Pool via `mysql2/promise` avec `testConnection()` (SELECT 1) — `src/config/database.js`
  - API utilitaires: `executeQuery`, `executeTransaction`, `closePool`
  - Gestion LIMIT/OFFSET avec contournement (textProtocol) pour MySQL 9.1 — options `textProtocol: true`
- Auth (partiel mais fonctionnel):
  - `POST /api/auth/login` → retourne `{ success: true, user, token }` — `src/controllers/authController.js`
  - `POST /api/auth/logout` (log activité) — idem
  - `POST /api/auth/password-reset` (demande: succès générique, envoi email TODO) — idem
  - JWT middleware: `authenticateToken`, `requireAdmin`, `optionalAuth` — `src/middleware/auth.js`
- Fails:
  - Routes: `src/routes/failsNew.js`
  - Contrôleur: `src/controllers/failsController.js` (create, list, public, byId, update, delete)
  - Création: insertion fail + insertion en `fail_moderation` (under_review) + points + log — visible seulement si `approved`
- Commentaires:
  - `POST/GET/PUT/DELETE /api/fails/:id/comments` — `src/routes/comments.js` + `src/controllers/commentsController.js`
  - Tables auxiliaires créées à la volée: `comment_reactions`, `comment_reports`, `comment_moderation`
  - Attribution de points sur création commentaire (user_points + user_point_events)
- Réactions:
  - `POST/DELETE/GET /api/fails/:id/reactions` — `src/routes/reactions.js` + contrôleur
- Logs & Admin:
  - `GET/POST /api/logs/system`, `GET /api/logs/user/:id`, `GET/PUT /api/logs/comprehensive` — `src/routes/logs.js`
  - Admin: dashboard stats, listing users (avec filtres), config modération (get/put), reported fails/comments, filtres par statut, actions modération commentaires/fails (voir limites ci-dessous) — `src/routes/admin.js`
- Upload:
  - `POST /api/upload/image` (5MB) et `POST /api/upload/avatar` (2MB), `DELETE /api/upload/image/:filename`, `GET /api/upload/info/:filename` — `src/routes/upload.js`

### Points problématiques / incohérences côté backend

- Contrats de réponse Auth/Profil vs frontend:
  - Register: `POST /api/auth/register` retourne `{ message, user, token }` sans `success: true`. Le frontend (HttpAuthService) attend `success` → il croit que l’inscription échoue.
  - Verify: `GET /api/auth/verify` retourne `{ valid: true, user }`, alors que le frontend attend `success` → token considéré invalide → déconnexion.
  - Profil: `GET/PUT /api/auth/profile` retourne `{ success, data: {...} }` mais le frontend attend `{ success, user }` → rafraîchissement/mise à jour échouent.
- Modération des fails incomplète:
  - À la création, un enregistrement `fail_moderation` est ajouté en `under_review`.
  - Les listings (`getFails`, `getPublicFails`) filtrent `WHERE (fm.status = 'approved')` → par défaut, rien n’est visible.
  - L’endpoint admin "approve" ne met pas à jour `fail_moderation` (il faut un UPSERT pour `status='approved'`).
- Handler d’erreurs Express incorrect:
  - Signature du middleware d’erreurs manque `next` (doit être `(err, req, res, next)`) — `server.js`.
- "Public" pas vraiment public:
  - `GET /api/fails/public` est protégé par `authenticateToken`. Soit rendre la route accessible publiquement, soit renommer pour éviter l’ambiguïté.
- Environnements divergents:
  - backend-api/.env → `DB_PORT=3308`; racine `.env` → `DB_PORT=3306`. Risque de connexion échouée selon l’instance MySQL.

### Actions recommandées (backend)

1) Aligner les contrats d’API avec le frontend (ou inversement):
   - `POST /api/auth/register` → ajouter `success: true`.
   - `GET /api/auth/verify` → retourner `{ success: true, user }` au lieu de `{ valid: true, ... }`.
   - `GET/PUT /api/auth/profile` → retourner `{ success: true, user: {...} }` (ou adapter le frontend pour lire `data`).
2) Finaliser la modération des fails:
   - Ajouter un endpoint Admin qui fait UPSERT dans `fail_moderation (fail_id, status)` à `approved/hidden`.
   - Vérifier que les listings affichent bien les `approved` après action.
3) Corriger le handler d’erreurs Express:
   - Utiliser la signature `(err, req, res, next)` pour intercepter correctement les erreurs.
4) Unifier la configuration .env:
   - Choisir un port unique pour MySQL (3306 recommandé) et l’appliquer dans backend-api/.env et `.env` racine.
5) Sécurité/Logs:
   - Vérifier que les logs ne stockent pas d’informations sensibles (PII) sans raison.

---

## Frontend (Angular / Ionic)

### Ce qui fonctionne (confirmé par lecture du code)

- Bootstrapping et routing:
  - `provideHttpClient()`, Ionic, routes/guards, pages structurées — `src/main.ts`, `src/app/app.routes.ts`
- Services disponibles et organisés:
  - Auth (`http-auth.service.ts`), Fails (`http-fail.service.ts`), Comments (`comment.service.ts`), Admin, Badge, Notifications, etc.
- Environnements:
  - `frontend/src/environments/environment.ts` (production=true; baseUrl http://localhost:3000/api)
- Robustesse Comments côté front:
  - `CommentService.list` gère plusieurs formes de réponses (`res.comments`, `res.data.comments`, tableau brut).

### Points problématiques / incohérences côté frontend

- Auth/Profil (contrats non alignés):
  - `HttpAuthService.register`: attend `response.success` (absent côté backend register) → perçoit un échec.
  - `validateToken()`: attend `success` mais backend renvoie `valid` → déconnexion automatique.
  - `refreshUser()` et `updateProfile()`: attendent `response.user`; backend renvoie `data`.
- Upload d’image:
  - `uploadImage` attend `response.url`; backend renvoie `response.data.imageUrl` → l’URL n’est pas consommée → fails créés sans image.
- Fails publics:
  - `getPublicFails` mappe un tableau brut, alors que backend renvoie `{ success, fails, pagination }` → renvoie fréquemment `[]`.
- Route "public" et auth:
  - La route backend `/api/fails/public` est protégée; si le front s’attend à un accès public réel, l’UX ne correspond pas au backend.
- Environnements multiples:
  - Des `.env` frontend avec variables `VITE_*` ne sont pas utilisés par Angular CLI; la source de vérité est `environment.ts`.

### Actions recommandées (frontend)

- Adapter les services aux réponses réelles OU exiger la mise à jour du backend:
  - Auth: accepter `{ user }` sous `data` ou backend renvoie sous `user`.
  - Verify: considérer `valid === true` comme succès (ou backend renvoie `success`).
  - Upload: utiliser `response.data.imageUrl`.
  - Fails publics: lire `response.fails` et gérer la pagination.
- Clarifier la sémantique "public":
  - Si l’accès public est souhaité, retirer `authenticateToken` côté backend pour `/api/fails/public` et ajuster le front en conséquence.
- Tests d’intégration front (facultatif mais utile):
  - Simuler les réponses backend attendues pour détecter les écarts de contrat automatiquement.

---

## Base de Données (MySQL)

### Ce qui fonctionne (confirmé par lecture du SQL et du code)

- Schéma:
  - Tables principales: `users`, `profiles`, `fails`, `comments`, `reactions`, `system_logs`, `app_config`, `user_points`, `user_point_events`, etc. — `backend-api/migrations/faildaily.sql`
  - Triggers:
    - `users_after_insert` → crée une ligne `profiles` minimale.
    - `profiles_before_insert` → initialise `preferences` et `stats`.
- Données de config:
  - `app_config` contient `points`, `reaction_points`, `moderation` — utilisés par les contrôleurs (ex: CommentsController, FailsController, Admin routes).
- Import:
  - Script Node `scripts/db-import.js` (nécessite le client `mysql` installé) — importe `migrations/faildaily.sql`.

### Points problématiques / incohérences côté BDD

- Modération des fails:
  - `fail_moderation` est lu (filtre `approved`) mais jamais mis à jour par un endpoint admin (seulement côté création fail → `under_review`).
- Ports BDD:
  - `.env` divergents (3306 vs 3308). Aligner sur une valeur fiable.

### Actions recommandées (BDD)

- Ajouter une écriture claire du statut de modération:
  - Endpoint admin pour UPSERT dans `fail_moderation` (`approved`/`hidden`).
- Vérifier l’alignement des champs `profiles`:
  - Le trigger crée un squelette (avec `preferences`/`stats`), les contrôleurs mettent ensuite `display_name`, `registration_completed`, etc. (cohérent, mais à surveiller lors de migrations futures).

---

## Écarts Front/Back (tableau de correspondance rapide)

- Auth/Register:
  - Front attend: `{ success, token, user }`
  - Back renvoie: `{ message, token, user }` (sans `success`) → ajouter `success: true` ou adapter le front.
- Auth/Verify:
  - Front attend: `{ success, user }`
  - Back renvoie: `{ valid, user }` → renvoyer `success` ou adapter le front pour accepter `valid`.
- Profile (GET/PUT):
  - Front attend: `{ success, user }`
  - Back renvoie: `{ success, data }` → renvoyer `user` ou adapter le front.
- Upload image:
  - Front attend: `{ url }`
  - Back renvoie: `{ success, data: { imageUrl } }` → lire `data.imageUrl`.
- Fails publics:
  - Front attend parfois un tableau brut
  - Back renvoie: `{ success, fails, pagination }` → lire `fails`.

---

## Priorités (Roadmap courte)

1) Contrats d’API Auth/Profil
- Ajouter `success` dans `register` et `verify` côté backend, renvoyer `user` (pas `data`) sur `GET/PUT /auth/profile` (ou adapter immédiatement le frontend si l’on préfère changer le client).

2) Modération des fails
- Endpoint admin pour `approve/hide` avec écriture dans `fail_moderation`.
- Vérifier que les listes ne sont pas vides par défaut (les fails `approved` sortent bien).

3) Upload et Fails publics (frontend)
- `uploadImage` → consommer `response.data.imageUrl`.
- `getPublicFails` → consommer `response.fails`.

4) Correctifs techniques
- Corriger la signature du handler d’erreurs Express (inclure `next`).
- Unifier `.env` (ports DB, secrets, etc.) + documentation d’amorçage.

---

## Annexes — Points de Code Notables

- Backend
  - Entrée serveur: `backend-api/server.js`
  - DB utilitaires: `backend-api/src/config/database.js`
  - Auth: routes `src/routes/auth.js`, contrôleur `src/controllers/authController.js`, middleware `src/middleware/auth.js`
  - Fails: routes `src/routes/failsNew.js`, contrôleur `src/controllers/failsController.js`
  - Comments: routes `src/routes/comments.js`, contrôleur `src/controllers/commentsController.js`
  - Upload: `src/routes/upload.js`
  - Logs: `src/routes/logs.js`
  - Admin: `src/routes/admin.js`
  - Migrations: `backend-api/migrations/faildaily.sql`

- Frontend
  - Environnements: `frontend/src/environments/environment.ts`
  - Routing: `frontend/src/app/app.routes.ts`
  - Services: `frontend/src/app/services/*` (auth, fail, comment, admin, badge, etc.)

---

## Conclusion

Le projet est très bien structuré et proche d’un bout-en-bout fonctionnel. Les problèmes observés se concentrent principalement sur des divergences de schéma de réponse API entre le backend et le frontend, ainsi que sur la finalisation du flux de modération des fails (passage à `approved`). En priorisant l’alignement des contrats d’API et la modération, l’application devrait afficher un feed cohérent et permettre l’inscription/connexion/profil sans friction. L’unification de la configuration d’environnement et la correction du handler d’erreurs Express compléteront un socle technique robuste.

