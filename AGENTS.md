# AGENTS.md — Guide d’utilisation pour l’agent (Codex)

## 0) Mission & Périmètre
- **Objectif principal** : corriger bugs, aligner contrat **frontend ↔ backend**, améliorer fiabilité, garder le stack Docker fonctionnel.
- **Objectif secondaire** : petits refactors, docs, tests minimaux.
- **Hors scope** : refontes majeures sans validation explicite.

## 1) Structure du dépôt
- `frontend/` — App Ionic/Angular (build prod servi via Nginx).
- `backend-api/` — API Node.js/Express + MySQL (`mysql2/promise`).
- `docker/` — Artefacts Docker (Dockerfiles + `docker-compose.yaml`).
- `docs/` — Documentation.
- `README.md` — Guide principal.

## 2) Environnements & Secrets
- Ne **jamais** committer de secrets.
- Fichiers d’exemple :
  - `backend-api/.env.example` :
    ```
    PORT=3000
    DB_HOST=db
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=change-me
    DB_NAME=faildaily
    CORS_ORIGIN=http://localhost
    ```
  - `frontend/.env.example` :
    ```
    API_URL=http://localhost:3000
    ```
- Si un secret est nécessaire : mettre/mettre à jour l’`.env.example` correspondant et documenter la variable dans la PR.

## 3) Politique de branches (mode “branche unique”)
- Travaille uniquement sur la branche `main`. 
- Pousse toutes tes modifications sur `main`. 
- Messages de commit en **français** et format **Conventional Commits** (ex. `fix(api): corrige l’appel à executeQuery`).


## 4) Exécution & Validation
### Backend
- Install : `cd backend-api && npm ci`
- Lint/Typecheck : `npm run lint || npx eslint . || true` ; `npm run build || npx tsc --noEmit || true`
- Tests : `npm test` (ajouter au moins des tests smoke si vides)
- Run : `npm start` ou `node src/server.js` (adapter si besoin)

### Frontend
- Install : `cd frontend && npm ci`
- Build prod : `npm run build` (Angular/Ionic)
- Dev local : `ionic serve` (non prod)

### Docker
- Orchestration : `cd docker && docker compose up -d --build`
- Attendu : backend up et connecté DB, frontend joint le backend.

## 5) Contrat API (Front ↔ Back)
- Respecter la convention de schéma côté API (ex. `is_public` en **snake_case**). Si changement : mettre à jour **frontend** + ajouter test ou note.
- Générer au besoin une **matrice endpoints** (path/method/payload) avant modifications impactant les deux côtés.

## 6) Utilitaires DB & Transactions
- Signature de référence : `executeQuery(query, params)`.
- Pour transactions :
  1) Pattern **callback** : `executeTransaction(pool, async (conn) => { await executeQueryWithConn(conn, q, p) })`.
  2) Pattern **batch** : `executeTransaction([{query, params}, ...])` **uniquement si déjà implémenté** dans le module DB.
- Préserver l’accès à `affectedRows` lors des refactors (ex. tâches de cleanup).

## 7) Changements autorisés (sans demander)
- Typos, commentaires, dead code.
- Harmonisation des appels DB vers la signature officielle.
- Petits tests (Jest + Supertest) pour routes critiques (`/fails`, `/comments`, `/auth`).
- Ajustements Docker/Dockerfiles sans changement d’interface externe.

## 8) Changements soumis à approbation
- Migrations SQL destructrices.
- Breaking changes d’API publique (paths, schémas).
- Ajout de reverse proxy/TLS, grosses montées de version.

## 9) Standards de tests (minimum)
- Ajouter au moins un **smoke test** :
  - `GET /api/fails` → `200` + tableau (si données).
  - Si champ `is_public` exposé : vérifier `is_public` (pas `isPublic`) sauf mapper explicite.
- Tout correctif de bug doit idéalement inclure un test qui **échoue avant** et **réussit après**.

## 10) Exigences PR
- Titre : clair + **Conventional Commit**.
- Description : ce qui change, pourquoi, risques, étapes de validation (manuelles/automatisées).
- Inclure : fichiers clés modifiés, comportement avant/après, TODO éventuels.

## 11) Checklist qualité avant PR
- [ ] Plus de `executeQuery(connection, ...)` hors transaction (ou utiliser `executeQueryWithConn` dans le callback).
- [ ] Lint & build OK (backend / frontend si touché).
- [ ] Stack Docker build & démarre si touché.
- [ ] Tests min. passent (ou ajoutés).

## 12) Commandes utiles (à exécuter dans la sandbox)
- Recherche :
  - `rg "executeQuery\\(connection" backend-api/src`
  - `rg "isPublic" -n` (repérer camelCase vs snake_case)
- Backend :
  - `cd backend-api && npm ci && (npm run lint || true) && (npm test || true)`
- Frontend :
  - `cd frontend && npm ci && npm run build`
- Docker :
  - `cd docker && docker compose up -d --build && docker compose logs --tail=200`

## 13) Style & Format
- Respecter l’existant (ESLint/format).
- Conserver les commentaires FR et corriger les accents/typos.
- Éviter les refactors “cosmétiques” massifs.

## 14) Pièges connus
- Tests vides : ne pas conclure “OK” si `npm test` ne teste rien ; ajouter un smoke test.
- `is_public` vs `isPublic` : garder la cohérence (ou mapper clairement).
- Opérations DELETE volumineuses MySQL : préférer batching / indexation ; attention aux locks.
- Frontend `.env` : si utilisé, s’assurer de l’injection au **build**.


