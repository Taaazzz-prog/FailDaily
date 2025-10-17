# Plan d'action FailDaily – 17/10/2025

Ce guide transforme le compte rendu du 17/10/2025 en feuille de route séquencée. Chaque bloc doit être suivi dans l'ordre pour garantir un résultat propre et testé.

## 1. Sécuriser la configuration des logs
1. Ouvrir `backend-api/src/config/database-logs.js:6` et remplacer les identifiants codés en dur par des lectures obligatoires de variables d’environnement (`process.env.LOGS_DB_*`). Bloquer le démarrage si une clé manque.
2. Mettre à jour la documentation d’installation (`README.md` ou fichier infra déjà utilisé) pour lister les variables nécessaires.
3. Vérifier que `.env` local/CI contient les nouvelles clés chiffrées.
4. Lancer `npm test` dans `backend-api` pour s’assurer que la modification n’introduit pas de régression.

## 2. Harmoniser l’accès Admin/Moderation
1. Décider du périmètre cible : modérateurs autorisés ou non dans l’interface admin. Noter la décision dans `docs/` ou le ticket associé.
2. Adapter le backend pour refléter la décision (par ex. ajuster `requireAdmin` dans `backend-api/src/routes/admin.js:12`).
3. Aligner le frontend (`frontend/src/app/guards/admin.guard.ts:31`, `frontend/src/app/models/user-role.model.ts:32`) pour qu’il calcule les mêmes règles.
4. Tester manuellement en simulant un utilisateur aux rôles `moderator`, `admin`, `super_admin`.
5. Exécuter `npm test` côté backend (les tests COPPA et admin doivent rester verts) puis `npm run test` côté frontend.

## 3. Corriger la configuration API en développement
1. Ouvrir `frontend/src/environments/environment.ts:28` et remplacer `baseUrl: 'http://localhost:3002/api'` par l’URL réellement utilisée (probablement `http://localhost:3000/api` pour coller au proxy `frontend/proxy.conf.json:3`).
2. Vérifier les autres environnements (`frontend/src/environments/environment.prod.ts`) et scripts (`package.json`) pour cohérence.
3. Relancer `ionic serve` et valider que les appels API ne retournent plus d’erreurs réseau.
4. Lancer `npm run test` dans `frontend` pour garantir qu’aucun test ne dépend de l’ancien port.

## 4. Unifier les services d’authentification front
1. Cartographier les usages de `AuthService` et `HttpAuthService` (recherche `rg "AuthService" -g"*.ts"` et `rg "HttpAuthService"`).
2. Choisir un service principal (recommandé : conserver une seule implémentation Axios/HttpClient).
3. Migrer progressivement les composants/pages vers le service retenu, en supprimant les duplications (login, register, profil).
4. Nettoyer les imports/redondances et supprimer le service obsolète.
5. Vérifier les tests Angular liés à l’authentification (`frontend/src/app/home/home.page.spec.ts`, etc.) via `npm run test`.

## 5. Journalisation des connexions
1. Choisir la stratégie : soit relaxer la route backend (`backend-api/src/routes/logs.js:52`) pour accepter les rôles non admin, soit déplacer l’appel côté front vers un endpoint autorisé.
2. Implémenter la stratégie (ajout d’un middleware plus souple, ou création d’une route dédiée type `/api/logs/public-login`).
3. Mettre à jour `frontend/src/app/services/http-auth.service.ts:303` pour refléter la nouvelle route ou conditionner l’appel selon le rôle.
4. Tester un login utilisateur standard et s’assurer qu’il n’y a plus de `403` en console.
5. Exécuter `npm test` dans `backend-api` pour couvrir les routes protégées.

## 6. Notifications front (routes manquantes)
1. Lister les endpoints utilisés (`frontend/src/app/services/notification.service.ts:100` et suivants).
2. Implémenter les routes correspondantes côté backend (nouveau fichier dans `backend-api/src/routes`) OU désactiver/différer ces appels si la fonctionnalité n’est pas prioritaire.
3. Si désactivation : entourer les appels de garde (feature flag) et mettre à jour l’UX pour éviter les toasts d’erreur.
4. Ajouter des tests (Jest côté backend ou tests unitaires Angular) pour garantir le comportement retenu.
5. Relancer `npm test` et `npm run test`.

## 7. Services Admin côté frontend
1. Recenser les endpoints réellement exposés par le backend (`backend-api/src/routes/admin.js`).
2. Adapter `frontend/src/app/services/admin-mysql.service.ts:33` et suivants pour viser les routes existantes (`/api/admin/dashboard/stats`, `/api/admin/users`, etc.).
3. Pour les fonctionnalités manquantes (points config, restoration), décider de les implémenter côté backend ou de retirer leurs usages côté front (masquer les boutons).
4. Tester les écrans admin dans le navigateur pour vérifier qu’aucune requête ne part vers un endpoint inexistant.
5. Exécuter les tests Angular (`npm run test`) pour confirmer que les mocks/fixtures restent valides.

## 8. Accès public aux fails
1. Clarifier le besoin produit : doit-on permettre la consultation publique ? Documenter la décision.
2. Si oui : dupliquer la route d’anonymisation pour accepter `optionalAuth` ou retirer `authenticateToken` sur certaines routes (`backend-api/src/routes/failsNew.js:3`), en conservant la logique de visibilité/ modération.
3. Adapter le frontend (`frontend/src/app/home/home.page.ts:20`, `frontend/src/app/services/fail.service.ts:22`) pour charger les fails même hors session (en utilisant `optionalAuth` côté backend).
4. Vérifier les tests existants (création/lecture des fails) et en ajouter si nécessaire pour couvrir le cas non authentifié.
5. Relancer `npm test` (backend) puis `npm run test` (frontend), et valider manuellement qu’un utilisateur non connecté peut parcourir la page d’accueil sans erreur.

## 9. Validation finale
1. Lancer la suite complète côté backend :
   - `cd backend-api && npm test`
2. Lancer la suite complète côté frontend :
   - `cd frontend && npm run test`
3. Réaliser un smoke test manuel : inscription, connexion, consultation des fails, accès admin (si rôle).
4. Documenter les changements (CHANGELOG ou note interne) avant toute mise en production.

Suivre chaque bloc dans l’ordre. Ne passer au suivant qu’une fois les tests associés verts et la validation manuelle effectuée.
