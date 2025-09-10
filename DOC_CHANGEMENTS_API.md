# Changements d’API — Alignement Backend/Frontend

Ce document liste les changements appliqués pour aligner les réponses backend avec les attentes du frontend.

## Authentification
- POST `/api/auth/register`
  - Avant: `{ message, user, token }`
  - Maintenant: `{ success: true, message, user, token }`

- GET `/api/auth/verify`
  - Avant: `{ valid: true, user }`
  - Maintenant: `{ success: true, valid: true, user }`

- POST `/api/auth/logout`
  - Avant: `{ message }`
  - Maintenant: `{ success: true, message }`

- GET `/api/auth/profile`
  - Avant: `{ success: true, data: { ...user } }`
  - Maintenant: `{ success: true, user: { ... } }`

- PUT `/api/auth/profile`
  - Avant: `{ success: true, message, data: { ...user } }`
  - Maintenant: `{ success: true, message, user: { ... } }`

- POST `/api/auth/password-reset/confirm` (nouveau)
  - Entrée: `{ token, newPassword }`
  - Réponse: `{ success: true, message }` ou erreur (`INVALID_TOKEN`, `TOKEN_EXPIRED`, `TOKEN_USED`).
  - Notes: les tokens sont générés lors de `POST /api/auth/password-reset` et expirent (1h par défaut).

## Upload
- POST `/api/upload/image`
  - Avant: `{ success: true, message, data: { imageUrl } }`
  - Maintenant: `{ success: true, message, url: imageUrl, data: { imageUrl } }`
  - Raison: le frontend lit `response.url`.

## Modération (Admin)
- POST `/api/admin/fails/:id/moderate`
  - Nouvelles actions supportées et persistées dans `fail_moderation`:
    - `approve`: UPSERT status `approved`.
    - `hide`: met `is_anonyme=1` sur le fail et UPSERT status `hidden`.
    - `under_review`: UPSERT status `under_review`.
    - `delete`: supprime réactions, commentaires, reports, modération, puis le fail.
  - Réponse: `{ success: true, message, failId, action }`

## Notes
- Toutes les routes “fails” restent protégées (token requis), y compris `/api/fails/public`.
- Aucune rupture de contrat côté frontend après ces ajustements.
