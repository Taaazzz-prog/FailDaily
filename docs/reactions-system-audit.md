# Audit Fonctionnel — Système de Réactions (Frontend/Backend)

## Contexte

Objectif: dresser un état des lieux du système de réactions (clic sur 4 réactions, écriture dans `reactions`, mise à jour des compteurs côté API, et journalisation dans `reaction_logs`). Les éléments ci-dessous synthétisent ce que fait le frontend, ce que fait le backend, ce qui marche, ce qui est à corriger/optimiser, et ce qu’il reste à faire.

---

## Ce que fait le Frontend

- Appels API principaux (service Angular `mysql.service.ts`).
  - `GET /api/fails/public` avec `limit`/`offset` pour la liste publique.
  - `GET /api/fails/:id` pour le détail d’un fail (attend `{ success: true, fail: {...} }`).
  - `GET /api/fails/:id/reactions` pour récupérer:
    - `data.reactions`: liste détaillée des réactions (type, user, createdAt)
    - `data.counts`: compteurs par type
    - `data.userReaction`: la réaction de l’utilisateur courant
  - `POST /api/fails/:id/reactions` avec `{ reactionType }` pour ajouter/modifier (toggle si même type).
  - `DELETE /api/fails/:id/reactions/:reactionType` (format legacy du frontend) pour supprimer la réaction du type donné.
- Post-traitements côté UI:
  - Détermine la réaction de l’utilisateur via `data.userReaction`.
  - Recalcule des compteurs localement si nécessaire (à partir de `data.reactions`).
  - Déclenche une mise à jour des “courage points” via un mapping local `calculateCouragePoints()` (types: `heart`, `thumbs_up`, `fire`, `clap`, `muscle`).

---

## Ce que fait le Backend

- Routes montées (Express):
  - `GET /api/fails/:id` (via `failsNew.js` -> `FailsController.getFailByIdEndpoint`).
  - `POST /api/fails/:id/reactions`, `DELETE /api/fails/:id/reactions`, `GET /api/fails/:id/reactions` (via `ReactionsController`).
  - DELETE alternatif ajouté: `DELETE /api/fails/:id/reactions/:reactionType` (compat frontend).
- `ReactionsController` (réellement utilisé pour les réactions):
  - Types valides: `courage`, `laugh`, `empathy`, `support`.
  - `POST`:
    - Toggle: si même type déjà présent → suppression; sinon → update du type.
    - Insertion si aucune réaction existante.
    - Journalise désormais dans `reaction_logs` et `user_activities` (ajout/modif/suppression).
  - `DELETE`:
    - Supprime la réaction de l’utilisateur (par fail, et éventuellement par type si fourni dans l’URL).
    - Journalise dans `reaction_logs`.
  - `GET`:
    - Retourne la liste détaillée, les `counts` par type, `userReaction`.
- `FailsController` (failsNew.js):
  - Liste et détail des fails, calculs de `comments_count` et `reactions_count` via sous-requêtes.
  - Support d’ID type string (UUID) corrigé sur plusieurs endpoints (évite des 500 lors des rafraîchissements post-réaction).

---

## Ce qui fonctionne parfaitement

- `POST /api/fails/:id/reactions`:
  - Ajout, toggle (suppression si même type), et update → OK.
  - La table `reactions` est correctement remplie/actualisée.
- `GET /api/fails/:id/reactions`:
  - Retourne la liste des réactions, les `counts` par type et `userReaction` → OK.
- `DELETE /api/fails/:id/reactions/:reactionType` (legacy) et `DELETE /api/fails/:id/reactions`:
  - Suppriment la réaction de l’utilisateur → OK (compat assurée).
- Journalisation `reaction_logs`:
  - Un enregistrement est créé pour ajout, modification, suppression, avec méta (user, fail, type, IP, UA) → OK.

---

## À corriger / améliorer

- Alignement des types de réactions Front/Back:
  - Front calcule des points avec `heart`, `thumbs_up`, `fire`, `clap`, `muscle`.
  - Back n’accepte que `courage`, `laugh`, `empathy`, `support`.
  - Action: harmoniser les valeurs avec le backend qui est correct.
- `GET /api/fails/:id` et ID de type UUID vs int:
  - Plusieurs usages `parseInt(id)` ont été corrigés, mais revérifier l’intégralité du contrôleur pour éviter toute régression.
  - Le schéma migrations (`faildaily.sql`) définit `fails.id` en `CHAR(36)` (UUID) alors que `FailsController.createFail` s’attend à un `insertId` (auto-incrément). À aligner (utiliser UUID côté code, ou modifier schéma si choix d’un INT auto VERIFER LA STRUCTURE DE LA BASE DE DONNEE AVANT MODIFICATION).
- Dénormalisation `fails.reactions` (JSON):
  - Le champ JSON n’est pas mis à jour au fil des réactions (source potentielle d’incohérence avec la table `reactions`).
  - Recommandation: soit supprimer la dépendance UI à ce champ en calculant toujours depuis `reactions`, soit maintenir `fails.reactions` via `AFTER INSERT/UPDATE/DELETE` triggers ou via le contrôleur dès qu’une réaction change.
- Robustesse logging:
  - `reaction_logs` est écrit mais la politique d’attribution de points (`points_awarded`) est à clarifier (actuellement 0). Si des XP/points sont requis, les renseigner ici et/ou déléguer à un service XP.
- Vues (`incrementViewCount`):
  - Utilise `fail_views` et `views_count` non présents dans toutes les migrations. À créer si désiré ou à protéger par feature flag.

---

## Ce qu’il reste à faire

- Harmoniser définitivement les types de réactions (mapping FE ↔ BE) et ajuster `calculateCouragePoints`.
- Normaliser l’ID des fails:
  - Décider entre UUID (CHAR(36)) et INT AUTO_INCREMENT.
  - Adapter `createFail`/`getFailById`/routes en conséquence (génération via `UUID()` en SQL ou via `uuid` en Node si UUID retenu).
- (recommandée): Supprimer l’usage applicatif de `fails.reactions` (JSON) et s’appuyer uniquement sur la table `reactions` pour les compteurs.
- Tester bout-en-bout les 4 réactions dans l’UI (ajout, switch de type, suppression) avec rafraîchissement auto des compteurs depuis `/reactions`.
- Si système de points/badges lié aux réactions: brancher le calcul réel (XP/Badges) au moment de l’`addReaction` et du `removeReaction` (et consigner les points dans `reaction_logs`).
- Cree une table pour le stockage des points des utilisateurs dans la base de donnée mysql (cree script sql pour insertion manuel), point configurable dans le pannel admin (voir existant et ajouter ce qui manque)

---

## Notes de test rapide (manuelle)

1) Ajouter une réaction
```
POST /api/fails/:id/reactions
{ "reactionType": "courage" }
```
→ Attendu: success, entrée `reactions`, log `reaction_logs`, `GET /:id/reactions` reflète le count.

2) Changer de type
```
POST /api/fails/:id/reactions
{ "reactionType": "laugh" }
```
→ Attendu: update du type, nouveau log, `counts` mis à jour.

3) Supprimer
```
DELETE /api/fails/:id/reactions/laugh
```
→ Attendu: suppression, log, counts décrémentés.

4) Vérifier les logs
```
SELECT * FROM reaction_logs WHERE fail_id = :id ORDER BY created_at DESC;
```

