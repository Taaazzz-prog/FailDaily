AGENTS.md — Guide d’utilisation pour l’agent (Codex)
0) Mission & périmètre

But : assurer la cohérence bout-en-bout Frontend (Angular/Ionic) ↔ Backend (Node/Express) ↔ Base MySQL.

Exigé :

Chaque action UI invoque le bon endpoint ; le backend traite correctement ; la base est écrite/lue comme attendu.

Les contrats JSON renvoyés par le backend matchent les modèles TypeScript du frontend.

Les règles d’anonymat de publication et d’âge sont strictement appliquées.

Autorisé : petits refactors non destructifs, corrections de mapping/typos, ajout de tests, docs.

Hors scope : refontes majeures/DB destructives sans accord explicite.

1) Monorepo & exécution

Monorepo npm workspaces ; lockfile unique au root (package-lock.json).

Node recommandé 22.x (ou 20.x), même version local/CI/sandbox.

Installation (root) :

npm ci --include=dev


CI / Smoke sans DB : le backend supporte DB_DISABLED=true (le pool MySQL peut être désactivé). Le “smoke” ne doit pas ouvrir la DB.

Secrets : ne jamais committer de secrets. Mettre/mettre à jour backend-api/.env.example si de nouvelles variables sont nécessaires.

Build frontend : Angular 20 ; inlineCritical:false et fonts.inline:false pour éviter les fetch externes au build.

2) Architecture (rappel)
Base MySQL faildaily

Tables clés attendues :

users(id, email, password_hash, role, account_status, registration_step, date_of_birth, created_at, updated_at, …)

profiles(user_id, username, display_name, avatar_url, bio, registration_completed, legal_consent, age_verification, …)

fails(id, user_id, title, description, category, image_url, is_public TINYINT(1), comments_count INT, reactions JSON, created_at, updated_at)

comments(id, fail_id, user_id, content, is_encouragement TINYINT(1), created_at)

reactions(id, user_id, fail_id, reaction_type, created_at)

(+) logs, badges, config, vues/triggers éventuels.

Index utiles :
fails(user_id), comments(fail_id), reactions(fail_id,user_id) (unique si logique d’une réaction par utilisateur).

Backend (Node/Express + MySQL2)
backend-api/
  server.js                // exporte app ; startServer() optionnel ; require-safe
  src/config/database.js   // mysql2/promise ; executeQuery ; executeTransaction ; DB_DISABLED
  src/controllers/*.js
  src/routes/*.js
  src/middleware/auth.js   // authenticateToken
  tests/                   // Jest + Supertest


Contraintes :

server.js exporte app et ne démarre que si require.main === module.

database.js :

pas de secret en dur ; récupérer via .env

test de connexion par SELECT 1

DB_DISABLED=true → pool désactivé ; executeQuery lève une erreur explicite si appelé.

Frontend (Angular 20 + Ionic 8)
frontend/src/app/
  services/*.ts         // auth.service, fail.service, registration.service, ...
  models/*.ts           // user.model, fail.model, ...
  pages/*               // auth/, home/, profile/, post-fail/, ...
  guards/*              // Auth guards


Intercepteur HTTP recommandé pour JWT.

Les modèles TS doivent correspondre aux retours backend.

3) Contrats de données & nommage

DB en snake_case ↔ Frontend en camelCase.

Mapping obligatoire côté backend (sortie API) :

users.display_name → displayName

fails.image_url → imageUrl

fails.comments_count → commentsCount

fails.is_public (TINYINT 0/1) → boolean (!!row.is_public)

Auteur d’un fail :
users.id → authorId,
users.username/display_name → authorName,
profiles.avatar_url → authorAvatar.

Anonymat / visibilité (is_public / is_active)

Référence canonique API : is_public (DB TINYINT(1) ; 0/1).

1 (true) : visible par utilisateurs connectés, anonymisé (pas de nom réel d’auteur).

0 (false) : privé (visible uniquement par l’auteur).

Tous les fails (même is_public=1) sont visibles uniquement si l’utilisateur est connecté.

Endpoint /api/fails/public : retourne uniquement les fails is_public=1, auth requise.

⚠️ Si du code/DB emploie is_active pour cet usage, unifier :

Préféré : migrer à is_public côté API (adapter front).

Temporaire : alias SQL SELECT is_active AS is_public côté backend + TODO de migration.

Règles d’âge (inscription)

< 13 ans : refus (HTTP 400, { code:'AGE_UNDER_MINIMUM' }).

13–16 ans : consentement parental requis (parental_consent=true sinon 400 { code:'PARENTAL_CONSENT_REQUIRED' }).

> 16 ans : OK.

Backend (route /api/registration/register) : valider avant insertion.

Frontend : UI bloque <13 ; exige consentement 13–16.

4) Plan d’audit & corrections (à exécuter)
4.1. Cartographie des appels front ↔ routes back
# Routes réellement appelées par le front
rg -nE "http(s)?://|/api/" frontend/src/app | cut -c1-200

# Routes exposées par le backend
rg -nE "router\.(get|post|put|delete)\(|app\.use\(" backend-api/src/routes


Action : Pour chaque route front trouvée, vérifier que l’endpoint existe, la méthode HTTP correspond, et que le schéma de retour matche les modèles TS.

4.2. Nommage/mapping & auth
# Mismatches courants
rg -n "isPublic|is_public|is_active" backend-api frontend/src/app
rg -n "display_name|displayName|image_url|imageUrl|comments_count|commentsCount" backend-api frontend/src/app

# Protection JWT
rg -n "authenticateToken" backend-api/src


Action :

Normaliser is_public (alias éventuel depuis is_active),

Vérifier snake→camel sur toutes les réponses,

Protéger les routes nécessaires par authenticateToken.

4.3. Schéma DB & contraintes

Vérifier types/présence :

fails.is_public TINYINT(1) NOT NULL DEFAULT 0

comments.is_encouragement TINYINT(1) DEFAULT 0

users.date_of_birth DATE (ou VARCHAR ISO, mais documenté)

Indices minimum : fails(user_id), comments(fail_id), reactions(fail_id,user_id UNIQUE) si une réaction unique par user/fail.

4.4. Comportements attendus (E2E)

GET /api/fails (auth) → retourne uniquement les fails de l’utilisateur.

GET /api/fails/public (auth) → retourne uniquement is_public=1, anonymisés.

POST /api/fails (auth) :

payload : { title, description, category?, imageUrl?, is_public: boolean }

validation basique (title/description non vides)

écriture DB : is_public 0/1 (convertir le bool).

4.5. Erreurs & format

Format d’erreur API :
HTTP <code> + { "error": "<message lisible>", "code": "<CODE_CONSTANT>" }.

Codes minimum : AGE_UNDER_MINIMUM, PARENTAL_CONSENT_REQUIRED, NOT_FOUND, UNAUTHORIZED, VALIDATION_ERROR, INTERNAL_ERROR, RATE_LIMIT_EXCEEDED.

5) Tests (utiliser/compléter backend-api/tests/)

Backend – Jest + Supertest (exemples à couvrir)

Âge — registration.age.test.js

<13 → 400 {code:'AGE_UNDER_MINIMUM'}

13–16 sans consentement → 400 {code:'PARENTAL_CONSENT_REQUIRED'}

13–16 avec consentement → 201

>16 → 201

Visibilité — fails.visibility.test.js

création is_public=false → non présent dans /api/fails/public, accessible uniquement à l’auteur

création is_public=true → présent dans /api/fails/public (auth requise), anonymisé

Forme des retours — fails.shape.test.js

imageUrl, commentsCount, is_public booléen côté API (cast), pas de isPublic

Auth guard — routes fails/comments requièrent JWT

Uploads (si présents) — refuser type non image (400 INVALID_FILE_TYPE)

Frontend (si tests activés)

Services : fail.service.ts, registration.service.ts → bons endpoints, mapping correct.

Guards : accès public restreint aux utilisateurs connectés.

Components critiques : soumission fail respecte is_public voulu.

6) Livrables attendus

Diff clair des fichiers modifiés (front, back, SQL s’il y a migration).

Corrections de mapping/nommage (is_active ↔ is_public, snake→camel).

Tests ajoutés/mis à jour (âge & visibilité) + résultats verts.

Docs mises à jour : backend-api/.env.example (sans secrets) + ce fichier si décisions prises.

Journal de décisions (si alias temporaire gardé, etc.).

7) Commandes “runbook”
# Install (root, workspaces)
npm ci --include=dev || npm install --include=dev

# Lint & tests backend
npm run -w backend-api lint
npm run -w backend-api test -- --runInBand

# Build frontend
npm run -w frontend build

# Audit cohérence (grep rapides)
rg -nE "http(s)?://|/api/" frontend/src/app | cut -c1-200
rg -nE "router\.(get|post|put|delete)\(|app\.use\(" backend-api/src/routes
rg -n "isPublic|is_public|is_active" backend-api frontend/src/app
rg -n "display_name|displayName|image_url|imageUrl|comments_count|commentsCount" backend-api frontend/src/app
rg -n "authenticateToken" backend-api/src
rg -n "date_of_birth|parental|age|consent" backend-api frontend/src/app

# Démarrage local (si DB disponible)
cd backend-api && node server.js   # API sur 3000
# (autre terminal)
cd frontend && npm start           # Front sur 4200

8) CI GitHub Actions (référence)

Le dépôt contient .github/workflows/ci.yml. Points importants :

Install au root (workspaces) ; cache npm activé.

Lint + tests backend, puis build frontend.

Smoke backend sans DB :

- name: Smoke backend
  env:
    NODE_ENV: test
    DB_DISABLED: "true"
  run: node -e "require('./backend-api/server'); console.log('SERVER_BOOT_OK')"

9) Pièges connus & décisions techniques

is_public : DB = 0/1 (TINYINT) ; API = booléen ; Front = boolean.
Ne pas confondre avec “public sans authentification” (toujours auth requise).

Alias is_active : s’il existe → unifier en is_public (ou alias temporaire + TODO).

Snake vs camel : faire le mapping dans les contrôleurs (ou helper de mapping central).

node-fetch v3 (ESM only) vs CJS : préférer undici ou node-fetch@2 si require est utilisé.

ESLint : flat config .mjs ou .eslintrc.cjs ; script "lint": "eslint . --ext .js,.cjs,.mjs".

Angular build : optimization.styles.inlineCritical=false & fonts.inline=false (évite 403 sur CSS externes).

Uploads : limiter types & taille ; gérer LIMIT_FILE_SIZE et types non image.

DB : database.js ne doit pas tenter de se connecter au require ; SELECT 1 pour test ; DB_DISABLED supporté.

10) Check-list finale d’acceptation

 Les endpoints utilisés par le front existent et les méthodes HTTP sont correctes.

 Les schémas JSON renvoyés matchent les modèles TS du front (champs, types, noms).

 is_public gère bien l’anonymat (0/1 DB ↔ boolean API/Front) ; /api/fails/public requiert auth.

 Règles d’âge appliquées & testées : <13 refus ; 13–16 consentement ; >16 OK.

 Routes sensibles protégées par authenticateToken.

 Tests backend verts ; build frontend OK ; CI verte (smoke sans DB).

 Pas de secrets en clair ; .env.example à jour.