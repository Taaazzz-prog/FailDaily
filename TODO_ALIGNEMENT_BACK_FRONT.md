# TODO — Alignement Backend/Frontend et Suivi

Ce fichier suit, étape par étape, l’alignement entre le backend (Express/MySQL) et le frontend (Angular/Ionic), ainsi que les vérifications et tests.

## Fait
- [x] Corriger le middleware d’erreurs Express (signature `(err, req, res, next)`).
- [x] Aligner Auth API côté backend:
  - [x] `POST /api/auth/register` → `success: true`.
  - [x] `GET /api/auth/verify` → `success: true` + `valid: true` + `user`.
  - [x] `POST /api/auth/logout` → `success: true`.
  - [x] `GET/PUT /api/auth/profile` → renvoyer `user` (et plus `data`).
- [x] Aligner Upload API:
  - [x] `POST /api/upload/image` → ajouter `url` (qui duplique `data.imageUrl`).
- [x] Conserver l’accès protégé aux fails (pas de route publique sans auth).
- [x] Modération admin des fails:
  - [x] UPSERT dans `fail_moderation` pour `approve`/`hide`/`under_review`.
  - [x] Suppression complète (`delete`) répercute sur réactions, commentaires, reports, modération, fail.
- [x] Frontend — `HttpFailService.getPublicFails()` lit désormais `response.fails`.

## À faire (prochaines étapes)
- [x] Unifier la configuration `.env` (sans exposer de secrets):
  - [x] Décider du port MySQL de référence (3306) et l’utiliser partout (`.env` racine et `backend-api/.env`).
  - [x] Vérifier `JWT_SECRET` unique et cohérent (défini dans backend-api/.env uniquement).
  - [x] Documenter l’ordre de priorité des `.env` (voir ENVIRONMENT_SPECS.md).
- [x] Vérifications frontend complémentaires:
  - [x] `validateToken()` lit `success: true` (aligné backend `verify`).
  - [x] `refreshUser()` et `updateProfile()` consomment `response.user` (backend renvoie aussi `data` par tolérance).
  - [x] Build frontend OK après ajout pages forgot/reset et liens login.
- [ ] Tests manuels suggérés:
  - [ ] Inscription (adulte) → login → `GET /auth/profile`.
  - [ ] Création fail → modération admin `approve` → visible dans `/fails` et `/fails/public`.
  - [ ] Upload image → `url` exploitée côté front.
  - [ ] Commentaire + like commentaire → stats et points (si activés) OK.
  - [ ] Logs systèmes consultables (`/api/logs/system`).
  - [ ] Reset password: génération token + confirmation via `/auth/password-reset/confirm`.

## Documentation (à produire)
- [x] Résumé des changements d’API (contrats de réponse) — `DOC_CHANGEMENTS_API.md`.
- [x] Plan de tests manuel — `TEST_PLAN_MANUEL.md`.
- [x] Notes d’environnement et ordre de chargement `.env` — mises à jour dans `ENVIRONMENT_SPECS.md`.

## Optionnel / Améliorations futures
- [x] Rendre les réponses backend plus tolérantes (inclure `user` et `data` sur profil).
- [ ] Ajouter des tests d’intégration backend (smoke): health, auth, fail create/list, modération approve.
- [ ] Ajouter des logs de validation sur modération pour traçabilité.

## Notes
- L’application nécessite authentification pour toutes les fonctionnalités, y compris `/api/fails/public`.
- Les modifications backend ont été limitées à l’alignement de schéma de réponse et la finalisation de la modération.
- Toute unification `.env` doit être validée en fonction de votre environnement MySQL effectif.
