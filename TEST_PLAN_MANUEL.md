# Plan de Tests Manuel — Alignement Back/Front

Ce plan couvre les chemins critiques: auth, création fail + image, liste, modération, commentaires, logs.

## Pré-requis
- Backend lancé avec `DB_PORT=3306` et base importée.
- Un compte admin disponible (role = admin/super_admin) pour modération.
- Frontend configuré avec `environment.api.baseUrl = http://localhost:3000/api`.

## 1) Authentification
1. Inscription adulte (via UI ou API):
   - POST `/api/auth/register` avec `email`, `password`, `displayName` (facultatif: `birthDate`).
   - Attendu: `{ success: true, user, token }`.
2. Connexion:
   - POST `/api/auth/login` → `{ success: true, user, token }`.
3. Vérification token:
   - GET `/api/auth/verify` (Authorization: Bearer <token>) → `{ success: true, valid: true, user }`.
4. Profil:
   - GET `/api/auth/profile` → `{ success: true, user }`.
   - PUT `/api/auth/profile` (displayName/bio) → `{ success: true, user }`.
5. Reset password (confirm):
   - POST `/api/auth/password-reset` avec un email existant → récupérer le token depuis les logs backend (temporaire), ou DB.
   - POST `/api/auth/password-reset/confirm` avec `{ token, newPassword }` → attendu `{ success: true }`.

## 2) Upload Image
1. POST `/api/upload/image` (multipart, champ `image`) → `{ success: true, url, data: { imageUrl } }`.
2. Vérifier côté UI que `HttpFailService.uploadImage()` récupère bien l’URL.

## 3) Création de Fail & Listing
1. POST `/api/fails` avec `title`, `description`, `category`, `is_anonyme`, `imageUrl` (optionnel) → `{ success: true, fail }`.
2. GET `/api/fails` (auth) → `{ success: true, fails }` (peut être vide si non approuvé).
3. GET `/api/fails/public` (auth) → `{ success: true, fails }` (après approbation).

## 4) Modération Admin
1. En tant qu’admin: POST `/api/admin/fails/{id}/moderate` avec `{ action: 'approve' }`.
2. Vérifier que le fail apparaît dans `/api/fails` et `/api/fails/public`.
3. Tester `hide`, `under_review`, `delete` et effets associés (anonymisation, disparition, suppression totale).

## 5) Commentaires & Réactions
1. POST `/api/fails/{id}/comments` → `{ success: true, data: { ... } }`.
2. GET `/api/fails/{id}/comments` → `{ success: true, data: { comments: [...] } }`.
3. POST `/api/fails/{id}/reactions` (ex: `courage`) → increment attendu dans les compteurs de la liste/fiche.

## 6) Logs
1. POST `/api/logs/system` (auth) → `{ success: true }`.
2. GET `/api/logs/system?limit=10` (auth) → dernières entrées visibles.

## 7) Parcours UI (sanity)
- Login → onglet home → création fail + image → modération approve (admin) → retour home: fail visible → commenter et réagir → profil (édition nom/bio) → déconnexion.
