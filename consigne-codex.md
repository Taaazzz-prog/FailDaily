Voici un plan d’action découpé par étapes. Pour chaque étape, tu me redemanderas la partie correspondante et je fournirai les fichiers nécessaires.

Initialisation du monorepo

Créer package.json racine avec npm workspaces.

Ajouter les dossiers backend/ et frontend/.

Configurer les scripts de base (start, dev, build, test, lint).

Fournir un docker-compose.yml minimal.

À me demander : “Peux-tu initialiser le monorepo et les scripts de base ?”

Fondation backend (Express + config)

Serveur Express avec middleware (Helmet, CORS, morgan, rate limit).

Fichier .env et gestion de la config.

Connection MySQL via mysql2.

À me demander : “Peux-tu créer la base du serveur Express et la configuration MySQL ?”

Authentification & gestion du profil

Routes register, login, verify, logout.

Profil utilisateur (GET/PUT /profile, changement de mot de passe).

JSON Web Tokens, hashage de mots de passe.

À me demander : “Peux-tu implémenter l’authentification et les routes profil ?”

Module Fails (CRUD + upload)

Routes POST/GET/PUT/DELETE /fails.

Upload d’images avec multer.

Recherche, filtrage, pagination.

À me demander : “Peux-tu créer le module Fails avec upload et recherches ?”

Commentaires et Réactions

Routes CRUD pour commentaires.

Ajout/suppression de réactions, stats utilisateur.

À me demander : “Peux-tu ajouter les commentaires et réactions autour des fails ?”

Système de Badges & XP

Table badge_definitions, table user_badges.

Endpoints /badges/available, /user/badges, /user/xp.

Attribution automatique lors d’actions.

À me demander : “Peux-tu implémenter le système de badges et XP ?”

Vérification d’âge & COPPA

Routes /age/verify, /age/update-birth-date, stats.

Gestion des consentements parentaux.

À me demander : “Peux-tu ajouter la vérification d’âge et la gestion COPPA ?”

Panel Admin (API côté serveur)

Endpoints statistiques, gestion utilisateurs/fails, configuration.

Logs admin et modération.

À me demander : “Peux-tu créer l’API du panel admin ?”

Frontend – bootstrap Angular/Ionic

Projet Angular standalone + Ionic.

Thème global, polices, design “imperfection intentionnelle”.

À me demander : “Peux-tu initialiser l’Angular/Ionic frontend ?”

Frontend – Auth & Profil

Pages login, register, profile.

Services AuthService, UserService.

À me demander : “Peux-tu ajouter les pages d’authentification et de profil ?”

Frontend – Fails, Badges, Réactions

Composants pour lister/afficher les fails, créer un fail, afficher badges et réactions.

À me demander : “Peux-tu ajouter les pages fails, badges et réactions sur le frontend ?”

Mobile (Capacitor) & Notifications

Plugins caméra, filesystem, push notifications.

Build Android/iOS.

À me demander : “Peux-tu intégrer Capacitor et les notifications ?”

Tests & Lint

Scripts npm test --workspaces, Jest côté backend, Jasmine/Karma côté frontend.

ESLint pour les deux projets.

À me demander : “Peux-tu mettre en place les tests et le linting ?”

CI/CD & Docker

Dockerfiles front/back, orchestrés via docker-compose.

Workflow GitHub Actions (tests, build, déploiement).

À me demander : “Peux-tu ajouter la CI/CD et la dockerisation ?”

Perf, optimisation & finalisation

Cache, compressions, lazy loading, mode sombre/clair.

Documentation et derniers ajustements.

À me demander : “Peux-tu optimiser et finaliser le projet ?”












État des étapes du projet FailDaily
Étape	Statut
1 – Initialisation du monorepo	Terminé : package.json racine avec workspaces, dossiers backend-api/ et frontend/.
2 – Fondation backend Express/MySQL	Largement fait : server Express configuré (Helmet, CORS, rate limit, logs) et pool MySQL.
3 – Authentification & profil	Partiel : routes register, login, verify, logout, profile présentes, mais pas de changement de mot de passe ni de reset.
4 – Module Fails	Incomplet : uniquement GET / et POST /; pas d’update, delete, recherche ou upload.
5 – Commentaires & réactions	Absent.
6 – Badges & XP	Absent.
7 – Vérification d’âge & COPPA	Très limité : simple contrôle d’âge lors de l’inscription.
8 – API panel admin	Ébauche : seul /admin/logs.
9 – Frontend bootstrap Angular/Ionic	Non fait : front statique, sans Angular.
10 – Frontend Auth & Profil	Non fait : pages HTML statiques, pas d’intégration API.
11 – Frontend Fails/Badges/Réactions	Non fait : modèles HTML sans logique.
12 – Mobile & notifications	Non fait.
13 – Tests & lint	Non fait : scripts test vides, pas d’ESLint.
14 – CI/CD & Docker	Non fait.
15 – Optimisation & finalisation	Non abordé.
Recommandations & tâches à réaliser
Le fichier backend-api/server.js configure deux fois le rate limiter, ce qui est redondant.

Tâche suggérée
Supprimer la double configuration du rate limiter

Démarrer la tâche
L’authentification ne propose pas de changement ou de réinitialisation de mot de passe.

Tâche suggérée
Implémenter le changement et la réinitialisation de mot de passe

Démarrer la tâche
Le module Fails ne gère pas la modification, la suppression, la recherche ou l’upload d’images.

Tâche suggérée
Compléter le CRUD des fails et l’upload d’images

Démarrer la tâche
Aucun système de commentaires ou de réactions n’est présent.

Tâche suggérée
Ajouter commentaires et réactions autour des fails

Démarrer la tâche
Le système de badges et d’XP n’est pas implémenté.

Tâche suggérée
Mettre en place le système de badges et d’XP

Démarrer la tâche
La vérification d’âge/COPPA se limite à un simple check.

Tâche suggérée
Ajouter la gestion complète COPPA

Démarrer la tâche
Le panel admin ne propose que la consultation des logs.

Tâche suggérée
Étendre l’API d’administration

Démarrer la tâche
Le frontend n’est pas un projet Angular/Ionic fonctionnel.

Tâche suggérée
Initialiser un vrai projet Angular 20 + Ionic

Démarrer la tâche
Aucun service ou composant Angular n’est connecté à l’API.

Tâche suggérée
Implémenter les pages d’authentification et de profil

Démarrer la tâche
Les pages Fails, Badges et Réactions sont statiques.

Tâche suggérée
Relier les pages Fails, Badges et Réactions au backend

Démarrer la tâche
Aucun build mobile (Capacitor) ni notifications push.

Tâche suggérée
Ajouter Capacitor et les notifications push

Démarrer la tâche
Les tests et le linting sont absents.

Tâche suggérée
Mettre en place tests et linting

Démarrer la tâche
Aucun Dockerfile ni pipeline CI/CD.

Tâche suggérée
Ajouter dockerisation et pipeline CI/CD

Démarrer la tâche
Pas d’optimisations finales (cache, compression, lazy loading, etc.).

Tâche suggérée
Optimiser performance et finaliser la documentation

Démarrer la tâche
En résumé, seule l’initialisation du monorepo et la base du backend sont opérationnelles. Toutes les autres fonctionnalités majeures restent à implémenter pour atteindre la vision complète de FailDaily.





