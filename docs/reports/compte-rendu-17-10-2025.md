# Compte rendu FailDaily – 17/10/2025

## Périmètre et méthode
- Audit du backend Node.js/MySQL, du frontend Angular/Ionic et des suites de tests existantes.
- Revue statique du code, des routes exposées et des services front afin d’identifier l’alignement métier/technique.
- Focus sur les fonctionnalités critiques (authentification, fails, modération) et sur la cohérence des appels API entre front et back.

## Ce qui fonctionne
- Validation d’environnement, protection CORS/rate-limit et endpoints santé prêts pour la mise en production (`backend-api/server.js:50`).
- Inscription/login avec contrôle d’âge, consentement parental et journalisation, couverts par plusieurs tests Jest COPPA/JWT (`backend-api/src/controllers/authController.js:100`, `backend-api/tests/2_auth/2.1_registration-test.js:1`).
- Création, récupération et anonymisation des fails avec attribution de points et mapping complet (`backend-api/src/controllers/failsController.js:7`, `backend-api/tests/3_fails/3.1_fail-creation-test.js:1`).
- Commentaires et réactions avec protections JWT mais lecture publique via `optionalAuth`, plus workflow de modération automatisé (`backend-api/src/routes/comments.js:12`, `backend-api/src/routes/failsNew.js:3`).
- Front Ionic : flux de fails diffusé via `BehaviorSubject`, écoute des événements de réaction et rechargement contrôlé (debounce) (`frontend/src/app/services/fail.service.ts:22`, `frontend/src/app/home/home.page.ts:21`).

## Améliorations prioritaires
- Supprimer les identifiants MySQL logs codés en dur et forcer la lecture depuis l’environnement (`backend-api/src/config/database-logs.js:6`).
- Harmoniser les guards admin : le backend autorise les modérateurs, alors que le frontend les bloque (`backend-api/src/routes/admin.js:12`, `frontend/src/app/guards/admin.guard.ts:31`, `frontend/src/app/models/user-role.model.ts:32`).
- Corriger l’URL d’API en développement (frontend pointe sur 3002 alors que proxy/Ionic redirigent vers 3000) (`frontend/src/environments/environment.ts:28`, `frontend/proxy.conf.json:3`).
- Mutualiser/clarifier l’usage de `AuthService` et `HttpAuthService` côté front pour éviter la duplication de logique et les divergences d’appel (`frontend/src/app/services/auth.service.ts:19`, `frontend/src/app/services/http-auth.service.ts:16`).
- Encadrer les appels front vers `/logs/system` (limiter aux profils autorisés ou exposer un endpoint public côté backend) pour éviter des 403 systématiques (`frontend/src/app/services/http-auth.service.ts:298`, `backend-api/src/routes/logs.js:52`).

## Dysfonctionnements constatés
- Le service de notifications front consomme des routes `/api/notifications` inexistantes côté backend (pas de route dédiée), entraînant des erreurs réseau (`frontend/src/app/services/notification.service.ts:100`).
- Le service admin front vise des endpoints qui n’existent pas (`/admin/stats`, `/admin/points-config`, `/admin/user-activities`), rendant le tableau de bord inopérant (`frontend/src/app/services/admin-mysql.service.ts:33`) ; le backend propose uniquement `/api/admin/dashboard/stats` et `/api/admin/users`.
- Journalisation des connexions utilisateur via `/logs/system` échoue pour les rôles non admin (403) car l’API exige `requireAdmin` (`frontend/src/app/services/http-auth.service.ts:303`, `backend-api/src/routes/logs.js:52`).
- Aucune exposition publique des fails : toutes les routes `GET /api/fails/*` sont protégées par JWT (`backend-api/src/routes/failsNew.js:3`), ce qui contredit la promesse d’explorer des échecs sans compte.
- Scripts front d’administration (ex. restauration de config) invoquent des routes backend inexistantes (`frontend/src/app/services/admin-mysql.service.ts:80`) et produisent des erreurs silencieuses.

## Prochaines étapes suggérées
- 1. Sécuriser la configuration (variables d’environnement, suppression des secrets committés) et mettre à jour la documentation de déploiement.
- 2. Réaligner les routes front/back (notifications, admin, logs) et ajouter des tests d’intégration couvrant ces appels.
- 3. Décider de la stratégie d’accès public aux fails, adapter les guards/API et ajuster l’UX d’accueil en conséquence.
- 4. Simplifier la couche d’authentification front (choix d’un service unique) et centraliser la gestion des appels API/error handling.
- 5. Après correctifs, exécuter la batterie Jest backend + tests Angular afin de valider les régressions.
