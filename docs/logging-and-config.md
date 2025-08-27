# Logging & Config — FailDaily (Guide Court)

## Objectif
Savoir où sont enregistrés les événements clés (logs), comment les consulter et comment configurer les points et seuils de modération via l’API d’administration.

---

## Canaux de Logs
- system_logs: événements système transverses (inscription, connexion, MAJ profil, création/suppression fail, réactions, reports, modération, etc.).
  - Exemples d’actions: `user_register`, `user_login`, `profile_update`, `fail_create`, `fail_update`, `fail_delete`, `fail_report`, `reaction_add`, `reaction_update`, `reaction_remove`, `comment_add`, `comment_update`, `comment_delete`, `comment_like`, `comment_unlike`, `comment_report`, `moderation_decision`.
- user_activities: traces orientées utilisateur (déjà en place dans auth et autres).
- reaction_logs: journal spécifique aux réactions (type, fail, points_awarded, user_agent, ip, etc.).

---

## Endpoints Logs
- GET `/api/logs/system?limit=100&level=info`
  - Récupère les logs système (filtrage possible par level).
- GET `/api/logs/user/:userId?limit=50`
  - Récupère les logs système pour un utilisateur donné.
- GET `/api/logs/comprehensive?level=info&action=fail_create&sinceHours=24`
  - Vue synthétique paramétrable pour le suivi ops.
- POST `/api/logs/system`
  - Ajoute un log système (réservé usages spécifiques).

---

## Config Admin (Points/Modération)
- GET `/api/admin/config`
  - Retourne la config consolidée `{ points, reaction_points, moderation }`.
- PUT `/api/admin/config`
  - Met à jour tout en une fois. Payload (exemple):
  ```json
  {
    "points": { "failCreate": 10, "commentCreate": 2, "reactionRemovePenalty": true },
    "reaction_points": { "courage": 5, "laugh": 3, "empathy": 2, "support": 3 },
    "moderation": { "failReportThreshold": 3, "commentReportThreshold": 3, "panelAutoRefreshSec": 20 }
  }
  ```
- GET `/api/admin/points/config` et PUT `/api/admin/points/config`
  - Gèrent uniquement la section `points`.
- GET `/api/admin/reactions/config` et PUT `/api/admin/reactions/config`
  - Gèrent uniquement `reaction_points`.
- GET `/api/admin/moderation/config` et PUT `/api/admin/moderation/config`
  - Gèrent uniquement `moderation`.

---

## Notes d’Implémentation
- Les points sont centralisés dans `user_points` (+ historique `user_point_events`).
- Les réactions créditent/décréditent l’auteur du fail selon `app_config.reaction_points`.
- Les commentaires créditent/décréditent l’auteur du commentaire selon `app_config.points.commentCreate`.
- La suppression d’un fail révoque les points liés aux réactions et aux commentaires.
- Les signalements de fails/commentaires s’enregistrent dans `fail_reports`/`comment_reports` et déclenchent une auto-mise en `hidden` si le seuil `app_config.moderation` est atteint.

---

## Bonnes Pratiques
- Consulter `/api/admin/config` après déploiement pour vérifier la config active.
- Pour audit rapide sur 24h: `GET /api/logs/comprehensive?sinceHours=24`.
- Export périodique de `user_point_events` si comptabilités externes.

