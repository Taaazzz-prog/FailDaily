# TODO - FailDaily (itératif)

Statut: en cours. Ce fichier liste des tâches exécutées en boucle jusqu’à validation. Les items « Cloud-safe » sont faisables sans MySQL/Chrome.

## Préparation (Cloud-safe)
- [x] Vérifier structure monorepo et scripts npm
- [ ] Vérifier variables d’environnement minimales (`backend-api/.env`, `frontend/.env`)
- [x] Lancer smoke test backend (`npm run smoke:backend`)
- [x] Vérifier endpoint santé via Supertest (sans DB)
- [x] Ajouter test Jest de smoke `/health` (`backend-api/tests/0_smoke.health.test.js`)

## Backend (Cloud-safe)
- [x] Lancer ESLint backend et corriger erreurs bloquantes
- [x] Exécuter un micro-test « santé » isolé (Supertest /health)
- [x] Préparer scripts de test séquentiels (auth → fail → réactions → badges → profil) pour exécution locale (E2E ajouté)

## Frontend (Cloud-safe)
- [x] Lancer ESLint frontend et corriger erreurs bloquantes
- [x] Tenter un build Angular (sans tests Karma)

## Tests étendus (Local requis)
- [ ] Provisionner MySQL 9.1 locale + schéma (importer `faildaily.sql`)
- [ ] Renseigner `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` dans `backend-api/.env`
- [ ] Désarmer `DB_DISABLED` et démarrer l’API (`npm run dev:backend`)
- [ ] Importer la base via script: `npm run -w backend-api db:import`
- [ ] Exécuter le smoke Jest: `npm run -w backend-api test:smoke`
- [ ] Exécuter la suite Jest complète backend (`npm run test:backend`)
- [ ] Installer Chrome headless et exécuter tests Angular (Karma)
  - [ ] Option CI: lancer manuellement le job E2E `workflow_dispatch` dans GitHub Actions (service MySQL auto + import SQL)

## Qualité & CI/CD
- [ ] Vérifier cohérence routes vs. guide (exhaustivité)
- [ ] Vérifier Dockerfiles et docker-compose (builds à froid)
- [ ] Préparer jobs GitHub Actions (lint, smoke, build)
  - [ ] Job backend: lint + jest smoke (DB_DISABLED=true)
  - [ ] Job frontend: lint + build
  - [x] Workflow ajouté: `.github/workflows/ci.yml`
  - [x] Job E2E manuel avec MySQL service (workflow_dispatch)

## Livraison
- [ ] Rapport final: changements, tests passés, limites restantes, next steps

---

Historique des passes d’exécution sera ajouté en bas au fur et à mesure.

### Historique
- 2025-09-01: Smoke backend OK, health check OK, corrections ESLint backend (duplicate method, variable non définie), ESLint frontend ajusté (règles relaxées), corrections templates (@ → &#64;), build Angular OK.

---

## Parcours Utilisateur & Tests (détaillé)

Prérequis local: MySQL opérationnel, schéma importé via `faildaily.sql`, variables `.env` renseignées.

### Authentification & Profil
- [x] `POST /api/auth/register` (adulte): crée utilisateur + profil (implémenté)
- [x] `POST /api/auth/login`: récupère token JWT (implémenté)
- [x] `GET /api/auth/verify`: valide token (implémenté)
- [x] `GET /api/auth/profile`: récupère profil (displayName, avatarUrl, bio, points) (implémenté)
- [x] `PUT /api/auth/profile`: modifie `displayName`, `bio`, `avatarUrl` (implémenté)
- [x] `PUT /api/auth/password`: change mot de passe (implémenté)
- [x] `POST /api/auth/password-reset`: demande reset (mocké si mail non configuré) (implémenté)
  - [ ] Tests E2E: à valider localement (DB requise)

Scénario de test (Supertest): register → login → verify → get profile → update profile → change password.

### Vérification d’âge (COPPA)
- [ ] `POST /api/age-verification/verify`: calcule statut
- [ ] `PUT /api/age-verification/update-birth-date`
- [ ] `GET /api/age-verification/user-age`
- [ ] `GET /api/age-verification/statistics`
- [ ] `GET /api/age-verification/coppa-compliance`

Tests: adultes, mineurs 13–16, <13 refusés.

Règles d'inscription & profil (implémentées):
- [x] < 13 ans: inscription refusée (aucun profil créé)
- [x] 13–16 ans: compte créé, profil créé avec `account_status=pending`, `registration_completed=0`, consentement parental requis
- [x] ≥ 17 ans: compte et profil créés, `account_status=active`, `registration_completed=1`

Tests ajoutés:
- [ ] `backend-api/tests/2_auth/2.0_coppa-profile-creation.test.js` (nécessite DB)

### Fails
- [ ] `POST /api/upload/image`: upload image, retourne `url`
- [ ] `POST /api/fails`: crée un fail (titre, description, category, is_anonyme, imageUrl)
- [ ] `GET /api/fails/public`: liste publique avec anonymisation (booléen `is_anonyme`, pas d’`user_id` exposé si anonyme)
- [ ] `GET /api/fails/:id`: récupère un fail mappé (réactions, commentaires, auteur anonymisé si besoin)
- [ ] `PUT /api/fails/:id`: mise à jour par l’auteur uniquement
- [ ] `DELETE /api/fails/:id`: suppression par l’auteur
- [ ] `POST /api/fails/:id/report`: signalement pour modération (auto-hide selon seuil)
  - [x] Implémentation API en place (failsController + routes)
  - [ ] Tests E2E (création, lecture, update, suppression) à exécuter localement

Scénario de test: upload → create fail (avec imageUrl) → get by id → list public → update → delete.

### Réactions
- [ ] `POST /api/fails/:id/reactions` (types: courage, empathy, laugh, support)
- [ ] `DELETE /api/fails/:id/reactions`
- [ ] `GET /api/fails/:id/reactions`
- [ ] `GET /api/user/reactions/stats`
  - [x] Implémentation API en place
  - [ ] Tests E2E à exécuter

Tests: ajouter/retirer réactions, compteurs mis à jour, `user_reaction` reflété.

### Commentaires
- [ ] `POST /api/fails/:id/comments`
- [ ] `GET /api/fails/:id/comments`
- [ ] `PUT /api/fails/:id/comments/:commentId`
- [ ] `DELETE /api/fails/:id/comments/:commentId`
- [ ] `GET /api/user/comments/stats`
  - [x] Implémentation API en place
  - [ ] Tests E2E à exécuter

Tests: CRUD commentaires + stats.

### Badges & XP
- [ ] `GET /api/badges/available` et `GET /api/badges`: récupérations basées sur `badge_definitions`
- [ ] `POST /api/badges/check-unlock/:userId`: vérifie et débloque automatiquement
- [ ] `GET /api/user/badges` (si exposé)
- [ ] `POST /api/user/xp` (si exposé)
  - [x] Implémentation API en place
  - [ ] Tests E2E à exécuter

Tests: créer fails et réactions pour atteindre des `requirement_type` (ex: `fail_count`, `reactions_received`, `streak_days`), vérifier déblocage et persistance dans `badges`/`user_points`.

### Uploads
- [ ] `POST /api/upload/image`: valider formats, taille, stockage, URL
- [ ] `POST /api/upload/avatar`: upload avatar et mise à jour profil
  - [x] Implémentation API en place (multer + dossier /uploads)
  - [ ] Tests E2E à exécuter

Tests: rejets formats/taille, acceptation image valide, chemin accessible sous `/uploads`.

Références tests ajoutés:
- [x] `backend-api/tests/0_smoke.health.test.js` (cloud-safe)
- [ ] `backend-api/tests/5_user_journey.test.js` (E2E local avec DB)

### Admin (optionnel pour parcours utilisateur)
- [ ] `GET /api/admin/stats`, `GET /api/admin/users`, `GET /api/admin/logs`, `PUT /api/admin/config`
- [ ] `GET /api/admin/fails`, `PUT /api/admin/fails/:id`
- [ ] `PUT /api/admin/users/:id/parental-approve` (activer un compte 13–16 ans après validation parentale)
- [ ] `PUT /api/admin/users/:id/parental-revoke` (révoquer une validation parentale et repasser en attente)
- [ ] `PUT /api/admin/users/:id/parental-reject` (marquer un refus explicite)
- [x] `GET /api/admin/users?status=pending` (filtrer les comptes en attente)
- [x] `GET /api/admin/users?role=user|admin|moderator|super_admin` (filtrer par rôle)
- [x] `GET /api/admin/users?consent=needed|approved|revoked|rejected|pending|none` (filtrer par statut COPPA)
- [x] `GET /api/admin/users?reg=0|1` (filtrer par complétion d'inscription)
- [x] `GET /api/admin/users?q=...` (recherche email/nom)
- [x] `GET /api/admin/users?createdFrom=YYYY-MM-DD&createdTo=YYYY-MM-DD` (filtre par date de création)
 - [x] Scroll infini: `GET /api/admin/users?limit=50&offset=0` (+ `pagination.hasMore`, `nextOffset`)
  - [x] Implémentation API en place (admin.js)
  - [ ] Tests E2E à exécuter

Tests ajoutés:
- [ ] `backend-api/tests/2_auth/2.1_parental-approve-admin.test.js`
- [ ] `backend-api/tests/2_auth/2.2_parental-revoke-reject-admin.test.js`
- [ ] `backend-api/tests/2_auth/2.4_admin-users-filter.test.js`
- [ ] `backend-api/tests/2_auth/2.5_admin-users-consent-filter.test.js`
 - [ ] `backend-api/tests/2_auth/2.6_admin-users-infinite-scroll.test.js`

---

## Plan d’implémentation & Exécution locale

1) Base de données
- [ ] Placer `faildaily.sql` (structure + data) et l’importer: `mysql -u <user> -p <db> < faildaily.sql`
- [ ] Vérifier tables essentielles: `users`, `profiles`, `fails`, `reactions`, `comments`, `badge_definitions`, `badges`, `user_points`, `fail_reports`, `fail_moderation`

2) Environnement backend
- [ ] `backend-api/.env`: `PORT=3000`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `CORS_ORIGIN`
- [ ] `DB_DISABLED=false`
- [ ] Démarrer: `npm run dev:backend`

3) Suite de tests backend
- [ ] `npm run test:backend` (Jest)
- [ ] `npm run -w backend-api test:e2e` (parcours complet)
- [ ] Vérifier et corriger si des endpoints divergent des payloads attendus

4) Frontend
- [ ] `frontend/.env` / `environment.ts`: `apiUrl`
- [ ] Exécuter `npm run -w frontend start` et valider parcours UI principaux

5) CI/CD (bonus)
- [ ] Workflows GitHub Actions: lint + build + smoke backend
  - [ ] Lancer manuellement le workflow E2E pour valider intégration avec MySQL
