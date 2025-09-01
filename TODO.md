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
- [ ] Préparer scripts de test séquentiels (auth → fail → réactions → badges → profil) pour exécution locale

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

## Qualité & CI/CD
- [ ] Vérifier cohérence routes vs. guide (exhaustivité)
- [ ] Vérifier Dockerfiles et docker-compose (builds à froid)
- [ ] Préparer jobs GitHub Actions (lint, smoke, build)
  - [ ] Job backend: lint + jest smoke (DB_DISABLED=true)
  - [ ] Job frontend: lint + build

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
- [ ] `POST /api/auth/register` (adulte): crée utilisateur + profil
- [ ] `POST /api/auth/login`: récupère token JWT
- [ ] `GET /api/auth/verify`: valide token
- [ ] `GET /api/auth/profile`: récupère profil (displayName, avatarUrl, bio, points)
- [ ] `PUT /api/auth/profile`: modifie `displayName`, `bio`, `avatarUrl`
- [ ] `PUT /api/auth/password`: change mot de passe
- [ ] `POST /api/auth/password-reset`: demande reset (mocké si mail non configuré)

Scénario de test (Supertest): register → login → verify → get profile → update profile → change password.

### Vérification d’âge (COPPA)
- [ ] `POST /api/age-verification/verify`: calcule statut
- [ ] `PUT /api/age-verification/update-birth-date`
- [ ] `GET /api/age-verification/user-age`
- [ ] `GET /api/age-verification/statistics`
- [ ] `GET /api/age-verification/coppa-compliance`

Tests: adultes, mineurs 13–16, <13 refusés.

### Fails
- [ ] `POST /api/upload/image`: upload image, retourne `url`
- [ ] `POST /api/fails`: crée un fail (titre, description, category, is_anonyme, imageUrl)
- [ ] `GET /api/fails/public`: liste publique avec anonymisation (booléen `is_anonyme`, pas d’`user_id` exposé si anonyme)
- [ ] `GET /api/fails/:id`: récupère un fail mappé (réactions, commentaires, auteur anonymisé si besoin)
- [ ] `PUT /api/fails/:id`: mise à jour par l’auteur uniquement
- [ ] `DELETE /api/fails/:id`: suppression par l’auteur
- [ ] `POST /api/fails/:id/report`: signalement pour modération (auto-hide selon seuil)

Scénario de test: upload → create fail (avec imageUrl) → get by id → list public → update → delete.

### Réactions
- [ ] `POST /api/fails/:id/reactions` (types: courage, empathy, laugh, support)
- [ ] `DELETE /api/fails/:id/reactions`
- [ ] `GET /api/fails/:id/reactions`
- [ ] `GET /api/user/reactions/stats`

Tests: ajouter/retirer réactions, compteurs mis à jour, `user_reaction` reflété.

### Commentaires
- [ ] `POST /api/fails/:id/comments`
- [ ] `GET /api/fails/:id/comments`
- [ ] `PUT /api/fails/:id/comments/:commentId`
- [ ] `DELETE /api/fails/:id/comments/:commentId`
- [ ] `GET /api/user/comments/stats`

Tests: CRUD commentaires + stats.

### Badges & XP
- [ ] `GET /api/badges/available` et `GET /api/badges`: récupérations basées sur `badge_definitions`
- [ ] `POST /api/badges/check-unlock/:userId`: vérifie et débloque automatiquement
- [ ] `GET /api/user/badges` (si exposé)
- [ ] `POST /api/user/xp` (si exposé)

Tests: créer fails et réactions pour atteindre des `requirement_type` (ex: `fail_count`, `reactions_received`, `streak_days`), vérifier déblocage et persistance dans `badges`/`user_points`.

### Uploads
- [ ] `POST /api/upload/image`: valider formats, taille, stockage, URL
- [ ] `POST /api/upload/avatar`: upload avatar et mise à jour profil

Tests: rejets formats/taille, acceptation image valide, chemin accessible sous `/uploads`.

Références tests ajoutés:
- [x] `backend-api/tests/0_smoke.health.test.js` (cloud-safe)
- [ ] `backend-api/tests/5_user_journey.test.js` (E2E local avec DB)

### Admin (optionnel pour parcours utilisateur)
- [ ] `GET /api/admin/stats`, `GET /api/admin/users`, `GET /api/admin/logs`, `PUT /api/admin/config`
- [ ] `GET /api/admin/fails`, `PUT /api/admin/fails/:id`

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
- [ ] Vérifier et corriger si des endpoints divergent des payloads attendus

4) Frontend
- [ ] `frontend/.env` / `environment.ts`: `apiUrl`
- [ ] Exécuter `npm run -w frontend start` et valider parcours UI principaux

5) CI/CD (bonus)
- [ ] Workflows GitHub Actions: lint + build + smoke backend
