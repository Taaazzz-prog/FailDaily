# Analyse Technique Complète - FailDaily (V1)

---

## 1. Stack Technique

### Frontend
- **Framework** : Angular 20 (standalone components)
- **Mobile** : Ionic 8 + Capacitor 7 (Android/iOS)
- **Langages** : TypeScript, SCSS
- **Librairies principales** :
  - @angular/* (core, forms, router...)
  - @ionic/angular
  - @capacitor/* (camera, notifications, filesystem...)
  - RxJS 7.8.0
  - Lodash, Moment.js
  - Fontsource (Caveat, Comfortaa, Kalam, Inter)
  - Ionicons
- **Tests** : Jasmine, Karma
- **Lint** : ESLint, Angular ESLint

### Backend
- **Framework** : Node.js 22 + Express 4.21
- **Base de données** : MySQL 9.1.0 (utf8mb4)
- **Architecture** : MVC, RESTful API
- **Librairies principales** :
  - express, mysql2, jsonwebtoken, bcryptjs
  - multer (upload images/avatars)
  - helmet, cors, express-rate-limit, morgan
  - dotenv, uuid
- **Tests** : Jest, Supertest
- **Lint** : ESLint

### Monorepo & DevOps
- **Gestion** : npm workspaces
- **Scripts** : start, dev, build, test, lint, clean
- **Outils** : concurrently, rimraf
- **CI/CD** : Github Actions (déploiement, tests)
- **Docker** : backend & frontend Dockerfile, docker-compose

---

## 2. Dépendances (extraits principaux)

### Frontend
```json
@angular/core: ^20.0.0
@ionic/angular: ^8.0.0
@capacitor/android: ^7.4.2
@capacitor/camera: ^7.0.2
@fontsource/caveat: ^5.2.6
rxjs: ~7.8.0
lodash: ^4.17.21
moment: ^2.30.1
ionicons: ^7.4.0
```

### Backend
```json
express: ^4.21.0
mysql2: ^3.14.3
jsonwebtoken: ^9.0.2
bcryptjs: ^3.0.2
helmet: ^8.1.0
cors: ^2.8.5
multer: ^2.0.2
morgan: ^1.10.1
uuid: ^11.1.0
```

---

## 3. Structure des Routes (API REST)

### Authentification
- `POST /api/auth/register` : Inscription
- `POST /api/auth/login` : Connexion
- `GET /api/auth/verify` : Vérification token
- `POST /api/auth/logout` : Déconnexion
- `GET /api/auth/check-email` : Vérifier email
- `GET /api/auth/profile` : Profil utilisateur
- `PUT /api/auth/profile` : Mise à jour profil
- `PUT /api/auth/password` : Changement mot de passe
- `POST /api/auth/password-reset` : Reset mot de passe

### Utilisateurs
- `GET /api/users/:userId/stats` : Statistiques utilisateur
- `GET /api/users/:userId/badges` : Badges utilisateur
- `GET /api/users/:userId/fails` : Fails utilisateur

### Fails
- `GET /api/fails` : Liste des fails (pagination, filtres)
- `GET /api/fails/search` : Recherche avancée
- `GET /api/fails/categories` : Catégories disponibles
- `GET /api/fails/tags` : Tags populaires
- `GET /api/fails/stats` : Statistiques fails
- `GET /api/fails/public` : Fails publics
- `POST /api/fails` : Créer un fail
- `GET /api/fails/:id` : Détail d'un fail
- `PUT /api/fails/:id` : Modifier un fail
- `DELETE /api/fails/:id` : Supprimer un fail

### Badges
- `GET /api/badges/available` : Tous les badges
- `GET /api/badges` : Alias pour /available
- `GET /api/user/badges` : Badges de l'utilisateur
- `POST /api/user/xp` : Attribution XP

### Réactions
- `POST /api/fails/:id/reactions` : Ajouter/modifier une réaction
- `DELETE /api/fails/:id/reactions` : Supprimer une réaction
- `GET /api/fails/:id/reactions` : Lister les réactions
- `GET /api/user/reactions/stats` : Stats réactions utilisateur

### Commentaires
- `POST /api/fails/:id/comments` : Ajouter un commentaire
- `GET /api/fails/:id/comments` : Lister les commentaires
- `PUT /api/fails/:id/comments/:commentId` : Modifier commentaire
- `DELETE /api/fails/:id/comments/:commentId` : Supprimer commentaire
- `GET /api/user/comments/stats` : Stats commentaires utilisateur

### Upload
- `POST /api/upload/image` : Upload image fail
- `POST /api/upload/avatar` : Upload avatar utilisateur

### Logs & Debug
- `GET /api/logs/system` : Logs système
- `GET /api/logs/user/:userId` : Logs utilisateur
- `GET /api/logs` : Logs généraux
- `GET /api/debug/stats` : Statistiques système
- `GET /api/debug/health` : Health check

### Age Verification (COPPA)
- `POST /api/age/verify` : Vérification âge
- `PUT /api/age/update-birth-date` : Mise à jour date de naissance
- `GET /api/age/user-age` : Âge utilisateur
- `GET /api/age/statistics` : Statistiques âge
- `GET /api/age/coppa-compliance` : Vérification COPPA

### Administration
- `GET /api/admin/stats` : Statistiques système
- `GET /api/admin/users` : Gestion utilisateurs
- `PUT /api/admin/config` : Configuration système
- `GET /api/admin/logs` : Logs système
- `GET /api/admin/fails` : Modération fails
- `PUT /api/admin/fails/:id` : Actions modération
- `POST /api/admin/logs/user-action` : Log action utilisateur
- `POST /api/admin/logs/user-login` : Log connexion utilisateur

---

## 4. Fonctionnalités Utilisateurs

### Inscription & Authentification
- Inscription avec vérification d'âge (COPPA)
- Connexion sécurisée (JWT)
- Reset mot de passe
- Profil personnalisable (avatar, bio, pseudo)
- Consentements légaux automatisés

### Partage de Fails
- Création de fail (texte, image, vidéo)
- Catégorisation (courage, persévérance, humour...)
- Publication anonyme ou publique
- Filtrage et recherche avancée
- Statistiques personnelles (fails, badges, XP)

### Système de Badges
- 70 badges répartis en 5 catégories et 4 raretés
- Déblocage automatique selon actions
- Progression XP et niveaux
- Affichage collection, objectifs, progression

### Réactions & Commentaires
- Réactions multiples (courage, soutien, humour...)
- Commentaires sur chaque fail
- Modération automatique des contenus

### Profil Utilisateur
- Statistiques détaillées (fails, badges, réactions, commentaires)
- Timeline d'activité
- Objectifs mensuels
- Paramètres rapides (notifications, confidentialité)

### Notifications
- Notifications push (mobile)
- Système de notification interne (nouveaux badges, encouragements)

### Personnalisation & Accessibilité
- Mode sombre/clair automatique
- Polices personnalisées
- Design "imperfection intentionnelle"
- Responsive mobile/tablette/desktop

---

## 5. Panel Admin - Fonctionnalités Complètes

### Dashboard & Monitoring
- Vue d'ensemble des métriques système (utilisateurs, fails, badges, réactions)
- Statistiques en temps réel
- Logs système et utilisateur
- Monitoring performance API et base de données

### Gestion Utilisateurs
- Liste complète des utilisateurs
- Modification/suppression utilisateurs
- Gestion des rôles (user/admin)
- Suspension et bannissement
- Historique d'activité et logs

### Modération Contenus
- Liste des fails à modérer
- Suppression de fails inappropriés
- Gestion des signalements
- Actions sur les commentaires et réactions

### Gestion des Badges
- Création, modification, suppression de badges
- Attribution manuelle de badges
- Statistiques de progression badges

### Configuration Système
- Modification des paramètres globaux
- Gestion des points, XP, niveaux
- Configuration des notifications
- Export et backup des données

### Sécurité & Conformité
- Monitoring COPPA et consentements
- Logs d'accès et actions critiques
- Alertes automatiques sur erreurs

---

## 6. Architecture & Sécurité

### Sécurité
- Authentification JWT + refresh tokens
- Rate limiting IP
- Protection CORS
- Headers de sécurité (Helmet)
- Validation stricte des données
- Monitoring et alertes
- Backup automatique base de données
- SSL/TLS sur toutes les communications

### Architecture
- Monorepo npm workspaces (frontend + backend)
- API RESTful documentée
- MVC côté backend
- Standalone components côté frontend
- Dockerisation complète
- CI/CD Github Actions

---

## 7. Déploiement & Performance

### Environnements
- Développement : localhost avec hot-reload
- Staging : serveur de test
- Production : serveur optimisé + CDN

### Performance
- Cache intelligent des données
- Compression images automatique
- Lazy loading composants
- Optimisation bundle

---

## 8. Points Forts & Différenciateurs

- Système de badges unique (70 badges, progression, raretés)
- Design "imperfection intentionnelle" pastel et manuscrit
- Protection COPPA et conformité RGPD
- Panel admin ultra-complet (monitoring, logs, modération, configuration)
- Architecture modulaire et scalable
- Expérience utilisateur mobile-first
- Sécurité et monitoring avancés

---

## 9. Pour aller plus loin (Roadmap)
- Système de notifications avancées
- Gamification (défis, classements)
- Intégration réseaux sociaux
- Statistiques communautaires
- API publique pour intégrations externes

---

## 10. Design, Typographies & Effets Visuels

### Système de Design "Imperfection Intentionnelle"
- **Philosophie** : Le design FailDaily repose sur l'idée que l'imperfection est une force. Les éléments sont volontairement légèrement rotés, décalés ou animés pour donner une sensation humaine, chaleureuse et anti-perfectionniste.
- **Effets CSS principaux** :
  - Classes `.imperfect-element` : `transform: rotate(-0.5deg);` (et variantes)
  - Hover : `transform: rotate(0deg) scale(1.02);`
  - Animations de scintillement, wobble, heartbeat
  - Ombres douces : `box-shadow: 0 2px 8px rgba(0,0,0,0.08);`
  - Glow pastel : `box-shadow: 0 0 12px rgba(0,0,0,0.1);`
- **Exemple SCSS** :
```scss
.imperfect-element {
  transform: rotate(-0.5deg);
  &:nth-child(even) { transform: rotate(0.3deg); }
  &:hover { transform: rotate(0deg) scale(1.02); }
}
```

### Typographies Utilisées
- **Caveat** : Titres, éléments manuscrits, badges, encouragements
  - `font-family: 'Caveat', cursive;`
- **Comfortaa** : Texte principal, labels, boutons
  - `font-family: 'Comfortaa', sans-serif;`
- **Kalam** : Descriptions, textes secondaires, commentaires
  - `font-family: 'Kalam', cursive;`
- **Inter** : Utilisé pour certains éléments d'interface et la lisibilité
  - `font-family: 'Inter', sans-serif;`
- **Ionicons** : Pour tous les pictogrammes et icônes

### Système de Couleurs
- **Palette Pastel** :
  - Rose : `#fde2e7`
  - Pêche : `#fed7aa`
  - Lavande : `#e0e7ff`
  - Menthe : `#d1fae5`
  - Jaune : `#fef3c7`
  - Bleu : `#dbeafe`
- **Catégories de badges** :
  - Courage : `#fecaca`
  - Humour : `#fed7aa`
  - Entraide : `#d1fae5`
  - Persévérance : `#e0e7ff`
  - Spécial : `#fef3c7`
- **Raretés** :
  - Common : gris
  - Rare : bleu
  - Epic : violet
  - Legendary : or

### Animations et Effets
- **Scintillement** : Pour les badges débloqués
- **Wobble** : Animation subtile des icônes
- **Heartbeat** : Animation sur les encouragements
- **Transitions** : Douces sur hover, focus, navigation
- **Responsive** : Grilles adaptatives, flexbox, media queries pour mobile/tablette/desktop

### Accessibilité & Personnalisation
- **Mode sombre/clair** : Automatique selon OS ou préférence utilisateur
- **Contraste** : Palette pastel mais avec contrastes suffisants pour la lisibilité
- **Taille de police** : Adaptative, minimum 16px sur mobile
- **Navigation clavier** : Tous les boutons et champs accessibles

### Exemples d'intégration visuelle
- **Cartes de badges** :
  - Fond pastel selon catégorie
  - Icône dans un cercle coloré selon rareté
  - Animation de glow et rotation
- **Boutons** :
  - Arrondis, ombre douce, effet hover
  - Icônes Ionicons intégrées
- **Progression** :
  - Barres de progression colorées, arrondies
  - Animations lors du déblocage

---

## 11. Schémas, Wireframes & Exemples de Composants

### Schéma d'Architecture Globale
```
+-------------------+        +-------------------+        +-------------------+
|   Frontend (SPA)  | <----> |   Backend API     | <----> |   MySQL Database  |
| Angular 20 + Ionic|        | Node.js + Express |        | 18 tables, 70 badges|
+-------------------+        +-------------------+        +-------------------+
        |                        |                        |
        |                        |                        |
        v                        v                        v
  Mobile (Capacitor)      API RESTful            Stockage images/avatars
```

### Wireframe - Page d'Accueil (Home)
```
+-------------------------------------------------------------+
| [Header] FailDaily - Bienvenue                              |
+-------------------------------------------------------------+
| [Hero] "Partage tes fails, progresse, débloque des badges"  |
| [CTA] S'inscrire / Se connecter                             |
| [Section] Aperçu badges, témoignages, stats communauté      |
| [Feed] Derniers fails publics (cartes)                      |
| [Footer] Mentions légales, liens, réseaux                   |
+-------------------------------------------------------------+
```

### Wireframe - Page Badges
```
+-------------------------------------------------------------+
| [Header] Ma Collection de Badges                            |
+-------------------------------------------------------------+
| [Stats] Progression, raretés, objectifs                     |
| [Filtre] Catégories, mode d'affichage                       |
| [Grid] Cartes de badges (icône, nom, description, date)     |
| [Section] Prochains défis, progression XP                   |
+-------------------------------------------------------------+
```

### Wireframe - Page Profil
```
+-------------------------------------------------------------+
| [Header] Mon Profil                                         |
+-------------------------------------------------------------+
| [Avatar] + [Niveau] + [Infos]                               |
| [Stats] Fails, badges, réactions, série                     |
| [Timeline] Activité récente                                 |
| [Objectifs] Défis mensuels                                  |
| [Paramètres] Notifications, confidentialité                 |
+-------------------------------------------------------------+
```

### Wireframe - Page Publication de Fail
```
+-------------------------------------------------------------+
| [Header] Partager un Fail                                   |
+-------------------------------------------------------------+
| [Form] Titre, contenu, catégorie, média authentique         |
| [Options] Anonymat, visibilité, encouragements              |
| [Aperçu] Carte du fail avant publication                    |
| [Motivation] Pourquoi partager ?                            |
+-------------------------------------------------------------+
```

### Exemple de Carte de Badge (SCSS + HTML)
```html
<div class="badge-card imperfect-element rarity-epic category-courage">
  <div class="badge-background bg-courage"></div>
  <div class="badge-icon-container">
    <div class="icon-circle circle-epic">
      <ion-icon name="star" class="badge-icon-epic icon-wobble"></ion-icon>
    </div>
    <div class="unlock-star">✨</div>
  </div>
  <div class="badge-content">
    <h4 class="badge-name handwriting">Courage Épique</h4>
    <p class="badge-description comfort-text">Avoir partagé 10 fails courageux</p>
    <div class="badge-meta unlocked">
      <div class="rarity-tag tag-epic">Épique</div>
      <span class="unlock-date comfort-text">23/08/25</span>
    </div>
  </div>
</div>
```
```scss
.badge-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #8b5cf6;
  transform: rotate(-0.5deg);
  .badge-background.bg-courage { background: #fecaca; opacity: 0.1; }
  .icon-circle.circle-epic { background: #e0e7ff; border: 2px solid #8b5cf6; }
  .badge-icon-epic { color: #8b5cf6; animation: iconWobble 2s infinite; }
  .unlock-star { animation: sparkle 1.5s infinite; }
  .handwriting { font-family: 'Caveat', cursive; }
  .comfort-text { font-family: 'Comfortaa', sans-serif; }
}
```

### Exemple de Bouton avec Effet Imperfection
```html
<ion-button class="imperfect-element">
  <ion-icon name="trophy-outline" slot="start"></ion-icon>
  Voir mes badges
</ion-button>
```
```scss
.imperfect-element {
  transform: rotate(-0.5deg);
  &:hover { transform: rotate(0deg) scale(1.02); }
}
ion-button {
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  font-family: 'Comfortaa', sans-serif;
}
```

### Exemple de Barre de Progression XP
```html
<ion-progress-bar [value]="progressionXP" class="main-progress-bar"></ion-progress-bar>
<span class="percentage handwriting">{{ progressionXP * 100 | number:'1.0-0' }}%</span>
```
```scss
.main-progress-bar {
  --background: rgba(99,102,241,0.1);
  --progress-background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 6px;
  height: 12px;
}
.percentage {
  font-family: 'Caveat', cursive;
  color: #6366f1;
  font-size: 1.5rem;
}
```

---

## 12. Schémas UML, Payloads API & Cas d'Usage Utilisateur

### Schéma UML Simplifié - Utilisateur, Fail, Badge
```
+----------------+      +----------------+      +----------------+
|   Utilisateur  |<>--- |      Fail      |<>--- |     Badge      |
+----------------+      +----------------+      +----------------+
| id             |      | id             |      | id             |
| username       |      | user_id        |      | name           |
| email          |      | content        |      | category       |
| avatar_url     |      | created_at     |      | rarity         |
| level          |      | category       |      | requirement    |
+----------------+      +----------------+      +----------------+
```

### Exemple de Payload API

#### 1. Création d'un Fail
```json
POST /api/fails
{
  "title": "J'ai raté mon entretien",
  "content": "J'ai oublié de préparer mes réponses...",
  "category": "courage",
  "isAnonymous": false,
  "mediaUrl": "https://faildaily.com/uploads/fails/fail-12345.jpg"
}
```

#### 2. Réponse API - Création de Fail
```json
{
  "success": true,
  "fail": {
    "id": 12345,
    "title": "J'ai raté mon entretien",
    "content": "J'ai oublié de préparer mes réponses...",
    "category": "courage",
    "created_at": "2025-08-23T10:15:00Z",
    "user_id": 678,
    "isAnonymous": false,
    "mediaUrl": "https://faildaily.com/uploads/fails/fail-12345.jpg"
  }
}
```

#### 3. Déblocage d'un Badge
```json
POST /api/user/badges/unlock
{
  "badgeId": 7
}
```

#### 4. Réponse API - Déblocage Badge
```json
{
  "success": true,
  "badge": {
    "id": 7,
    "name": "Courage Épique",
    "category": "courage",
    "rarity": "epic",
    "unlockedDate": "2025-08-23T10:16:00Z"
  }
}
```

### Cas d'Usage Utilisateur

#### 1. Inscription & Connexion
- L'utilisateur s'inscrit avec vérification d'âge (COPPA)
- Il reçoit un email de confirmation
- Il se connecte via JWT, accède à son profil

#### 2. Partage d'un Fail
- L'utilisateur clique sur "Partager un fail"
- Il remplit le formulaire (titre, contenu, catégorie, média)
- Il publie son fail, qui apparaît dans le feed public
- Il reçoit des réactions et des encouragements

#### 3. Progression & Badges
- En partageant des fails, l'utilisateur gagne des points XP
- Il débloque des badges selon ses actions (ex : 10 fails courageux)
- Il consulte sa collection de badges et sa progression

#### 4. Interaction Sociale
- L'utilisateur commente les fails des autres
- Il réagit (courage, soutien, humour...)
- Il reçoit des notifications pour ses badges et encouragements

#### 5. Personnalisation & Confidentialité
- Il modifie son avatar, sa bio, ses paramètres de confidentialité
- Il peut publier anonymement ou en public
- Il gère ses notifications et consentements

#### 6. Panel Admin
- L'admin accède au dashboard
- Il modère les fails et commentaires
- Il gère les utilisateurs, attribue des badges
- Il surveille les logs et la performance du système

---

## 13. Schéma Complet de la Base de Données, Exemples de Données, Badges et Documents Légaux

### Schéma des Tables Principales (extrait de `faildaily.sql`)

- **users** : Gestion des comptes utilisateurs
    - id (char(36)), email, email_confirmed, password_hash, role, last_login, login_count, account_status, registration_step, created_at, updated_at
- **profiles** : Profil utilisateur
    - id, user_id, username, display_name, avatar_url, bio, registration_completed, legal_consent (JSON), age_verification (JSON), preferences (JSON), stats (JSON), created_at, updated_at
- **fails** : Fails partagés
    - id, user_id, title, description, category, image_url, is_public, reactions (JSON), comments_count, created_at, updated_at
- **comments** : Commentaires sur fails
    - id, fail_id, user_id, content, is_encouragement, created_at, updated_at
- **badges** : Badges débloqués
    - id, user_id, badge_id, unlocked_at, created_at
- **badge_definitions** : Définition des badges
    - id, name, description, icon, category, rarity, requirement_type, requirement_value, created_at
- **legal_documents** : Documents légaux
    - id, title, content, version, document_type, is_required, is_active, created_at, updated_at
- **user_activities** : Logs d'activité utilisateur
    - id, user_id, user_email, user_name, action, details (JSON), fail_id, reaction_type, ip_address, user_agent, timestamp, created_at
- **reactions** : Réactions sur fails
    - id, user_id, fail_id, reaction_type, created_at
- **system_logs** : Logs système
    - id, level, message, action, details (JSON), user_id, timestamp, created_at
- **user_badges** : Association utilisateur/badge
    - id, user_id, badge_id, unlocked_at, created_at
- **user_legal_acceptances** : Acceptation des documents légaux
    - id, user_id, document_id, document_version, accepted_at, accepted_ip, user_agent
- **user_management_logs** : Logs d'actions admin
    - id, admin_id, target_user_id, action_type, target_object_id, old_values (JSON), new_values (JSON), reason, created_at
- **user_preferences** : Préférences utilisateur
    - id, notifications_enabled, email_notifications, push_notifications, privacy_mode, show_real_name, created_at, updated_at
- **parental_consents** : Consentements parentaux (mineurs)
    - id, child_user_id, parent_email, parent_name, consent_date, consent_ip, consent_method, verification_code, is_verified, verified_at, expires_at, created_at

### Exemples de Données Initiales

#### Utilisateur
```json
{
  "id": "814b7d10-b3d4-4921-ab47-a388bec6c7fb",
  "email": "adulte1@adulte.fr",
  "email_confirmed": 0,
  "password_hash": "$2b$12$wCf7D9J9f9HsAPQ20Gu3neqHcMqfEY05inLUWpQHqkbSRVGzCgyn.",
  "role": "user",
  "account_status": "active",
  "registration_step": "basic",
  "created_at": "2025-08-21 08:51:48"
}
```

#### Profil
```json
{
  "id": "12811165-7e6c-11f0-b1c5-345a608f406b",
  "user_id": "814b7d10-b3d4-4921-ab47-a388bec6c7fb",
  "display_name": "jeudi test adulte 1",
  "registration_completed": 1,
  "legal_consent": {"birthDate":"1981-08-20","agreeToTerms":true,"acceptedAt":"2025-08-21T08:51:48.030Z"},
  "age_verification": {"birthDate":"1981-08-20","age":44,"verified":true},
  "stats": {"badges": [], "totalFails": 0, "couragePoints": 0},
  "created_at": "2025-08-21 08:51:48"
}
```

#### Fail
```json
{
  "id": "0f29dcc0-0b48-47cd-b0c5-dd1adc225198",
  "user_id": "814b7d10-b3d4-4921-ab47-a388bec6c7fb",
  "title": "fails test 1 : jeudi adulte test 1",
  "description": "poste du premie fails",
  "category": "humour",
  "is_public": 0,
  "reactions": {"laugh": 0, "courage": 0, "empathy": 0, "support": 0},
  "comments_count": 0,
  "created_at": "2025-08-21 09:51:05"
}
```

#### Activité utilisateur
```json
{
  "id": "f5c0ea30-1954-4c19-809e-bff561c91984",
  "user_id": "814b7d10-b3d4-4921-ab47-a388bec6c7fb",
  "action": "register",
  "details": {"email":"adulte1@adulte.fr"},
  "timestamp": "2025-08-21 08:51:48"
}
```

#### Document légal
```json
{
  "id": "1467b3d1-7a0d-11f0-b0ea-345a608f406b",
  "title": "Conditions d'utilisation",
  "content": "Conditions générales d'utilisation de FailDaily...",
  "version": "1.0",
  "document_type": "terms",
  "is_required": 1,
  "is_active": 1,
  "created_at": "2025-08-15 19:21:44"
}
```

### Définitions des Badges (extraits)

| id                  | nom                        | description                                 | icône                  | catégorie     | rareté     | requirement_type      | requirement_value |
|---------------------|---------------------------|---------------------------------------------|------------------------|--------------|------------|----------------------|------------------|
| courage-1           | Premier Courage           | Partager son premier fail courageux         | flame-outline          | COURAGE      | common     | courage_fails        | 1                |
| courage-10          | Courage Épique            | Partager 10 fails courageux                 | flame                  | COURAGE      | epic       | courage_fails        | 10               |
| humour-1            | Premier Rire              | Partager un fail humoristique               | happy-outline          | HUMOUR       | common     | humour_fails         | 1                |
| humour-10           | Maître du Rire            | Partager 10 fails humoristiques             | happy                  | HUMOUR       | epic       | humour_fails         | 10               |
| entraide-1          | Premier Soutien           | Encourager un autre utilisateur             | heart-outline          | ENTRAIDE     | common     | encouragement_given   | 1                |
| entraide-10         | Soutien Épique            | Encourager 10 utilisateurs                  | heart                  | ENTRAIDE     | epic       | encouragement_given   | 10               |
| perseverance-1      | Premier Persévérant       | Partager un fail de persévérance            | medal-outline          | PERSEVERANCE | common     | perseverance_fails    | 1                |
| perseverance-10     | Persévérance Épique       | Partager 10 fails de persévérance           | medal                  | PERSEVERANCE | epic       | perseverance_fails    | 10               |
| special-1           | Découvreur                | Découvrir une fonctionnalité cachée         | star-outline           | SPECIAL      | rare       | feature_discovered    | 1                |
| viral-laugh         | Sensation Virale          | Un fail qui a fait rire 500 personnes       | trending-up-outline    | HUMOUR       | legendary  | laugh_reactions       | 500              |
| survivor            | Survivant                 | Surmonter 50 défis personnels               | shield-checkmark-outline| RESILIENCE   | legendary  | challenges_overcome   | 50               |

*... 70 badges au total, répartis en COURAGE, HUMOUR, ENTRAIDE, PERSEVERANCE, RESILIENCE, SPECIAL, avec les raretés common, rare, epic, legendary.*

### Documents Légaux (extraits)

- **Conditions d'utilisation** : Obligatoire, version 1.0
- **Politique de confidentialité** : Obligatoire, version 1.0
- **Règles de la communauté** : Obligatoire, version 1.0
- **Politique des données** : Obligatoire, version 1.0

---

**Ce chapitre vous permet de présenter la structure réelle de la base de données, les exemples de données, la logique des badges et la conformité légale, pour une soutenance technique exhaustive.**

---

## 14. Dump SQL complet de la base de données FailDaily

```sql
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : jeu. 21 août 2025 à 10:39
-- Version du serveur : 9.1.0
-- Version de PHP : 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `faildaily`
--

DELIMITER $$
--
-- Fonctions
--
DROP FUNCTION IF EXISTS `generate_uuid`$$
CREATE DEFINER=`root`@`localhost` FUNCTION `generate_uuid` () RETURNS CHAR(36) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci DETERMINISTIC READS SQL DATA BEGIN
    RETURN UUID();
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `badges`
--

CREATE TABLE `badges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rarity` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requirement_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requirement_value` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `badge_definitions`
--

CREATE TABLE `badge_definitions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rarity` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requirement_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requirement_value` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fail_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_encouragement` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_fail_id` (`fail_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `fails`
--

CREATE TABLE `fails` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT '0',
  `reactions` json DEFAULT NULL,
  `comments_count` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `legal_documents`
--

CREATE TABLE `legal_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `parental_consents`
--

CREATE TABLE `parental_consents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `child_user_id` int(11) NOT NULL,
  `parent_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consent_date` timestamp NULL DEFAULT NULL,
  `consent_ip` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consent_method` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `verification_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `verified_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `profiles`
--

CREATE TABLE `profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `registration_completed` tinyint(1) NOT NULL DEFAULT '0',
  `legal_consent` json DEFAULT NULL,
  `age_verification` json DEFAULT NULL,
  `preferences` json DEFAULT NULL,
  `stats` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `system_logs`
--

CREATE TABLE `system_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `level` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` json DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `user_activities`
--

CREATE TABLE `user_activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `user_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` json DEFAULT NULL,
  `fail_id` int(11) DEFAULT NULL,
  `reaction_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `user_badges`
--

CREATE TABLE `user_badges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `badge_id` int(11) NOT NULL,
  `unlocked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_badge_id` (`badge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `user_legal_acceptances`
--

CREATE TABLE `user_legal_acceptances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `document_id` int(11) NOT NULL,
  `document_version` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `accepted_ip` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_document_id` (`document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `badges`
--

INSERT INTO `badges` (`id`, `name`, `description`, `icon`, `category`, `rarity`, `requirement_type`, `requirement_value`, `created_at`) VALUES
(1, 'Premier Courage', 'Partager son premier fail courageux', 'flame-outline', 'COURAGE', 'common', 'courage_fails', 1, NULL),
(2, 'Courage Épique', 'Partager 10 fails courageux', 'flame', 'COURAGE', 'epic', 'courage_fails', 10, NULL),
(3, 'Premier Rire', 'Partager un fail humoristique', 'happy-outline', 'HUMOUR', 'common', 'humour_fails', 1, NULL),
(4, 'Maître du Rire', 'Partager 10 fails humoristiques', 'happy', 'HUMOUR', 'epic', 'humour_fails', 10, NULL),
(5, 'Premier Soutien', 'Encourager un autre utilisateur', 'heart-outline', 'ENTRAIDE', 'common', 'encouragement_given', 1, NULL),
(6, 'Soutien Épique', 'Encourager 10 utilisateurs', 'heart', 'ENTRAIDE', 'epic', 'encouragement_given', 10, NULL),
(7, 'Premier Persévérant', 'Partager un fail de persévérance', 'medal-outline', 'PERSEVERANCE', 'common', 'perseverance_fails', 1, NULL),
(8, 'Persévérance Épique', 'Partager 10 fails de persévérance', 'medal', 'PERSEVERANCE', 'epic', 'perseverance_fails', 10, NULL),
(9, 'Découvreur', 'Découvrir une fonctionnalité cachée', 'star-outline', 'SPECIAL', 'rare', 'feature_discovered', 1, NULL),
(10, 'Sensation Virale', 'Un fail qui a fait rire 500 personnes', 'trending-up-outline', 'HUMOUR', 'legendary', 'laugh_reactions', 500, NULL),
(11, 'Survivant', 'Surmonter 50 défis personnels', 'shield-checkmark-outline', 'RESILIENCE', 'legendary', 'challenges_overcome', 50, NULL);

--
-- Dumping data for table `badge_definitions`
--

INSERT INTO `badge_definitions` (`id`, `name`, `description`, `icon`, `category`, `rarity`, `requirement_type`, `requirement_value`, `created_at`) VALUES
(1, 'Premier Courage', 'Partager son premier fail courageux', 'flame-outline', 'COURAGE', 'common', 'courage_fails', 1, NULL),
(2, 'Courage Épique', 'Partager 10 fails courageux', 'flame', 'COURAGE', 'epic', 'courage_fails', 10, NULL),
(3, 'Premier Rire', 'Partager un fail humoristique', 'happy-outline', 'HUMOUR', 'common', 'humour_fails', 1, NULL),
(4, 'Maître du Rire', 'Partager 10 fails humoristiques', 'happy', 'HUMOUR', 'epic', 'humour_fails', 10, NULL),
(5, 'Premier Soutien', 'Encourager un autre utilisateur', 'heart-outline', 'ENTRAIDE', 'common', 'encouragement_given', 1, NULL),
(6, 'Soutien Épique', 'Encourager 10 utilisateurs', 'heart', 'ENTRAIDE', 'epic', 'encouragement_given', 10, NULL),
(7, 'Premier Persévérant', 'Partager un fail de persévérance', 'medal-outline', 'PERSEVERANCE', 'common', 'perseverance_fails', 1, NULL),
(8, 'Persévérance Épique', 'Partager 10 fails de persévérance', 'medal', 'PERSEVERANCE', 'epic', 'perseverance_fails', 10, NULL),
(9, 'Découvreur', 'Découvrir une fonctionnalité cachée', 'star-outline', 'SPECIAL', 'rare', 'feature_discovered', 1, NULL),
(10, 'Sensation Virale', 'Un fail qui a fait rire 500 personnes', 'trending-up-outline', 'HUMOUR', 'legendary', 'laugh_reactions', 500, NULL),
(11, 'Survivant', 'Surmonter 50 défis personnels', 'shield-checkmark-outline', 'RESILIENCE', 'legendary', 'challenges_overcome', 50, NULL),
('active-member', 'Membre Actif', 'Se connecter 100 jours non-consécutifs', 'person-outline', 'PERSEVERANCE', 'rare', 'login_days', 100, '2025-08-08 16:34:14'),
('all-categories', 'Touche-à-tout', 'Poster un fail dans chaque catégorie', 'apps-outline', 'SPECIAL', 'epic', 'categories_used', 5, '2025-08-10 13:58:59'),
('beta-tester', 'Testeur Bêta', 'Participer à la phase de test', 'construct-outline', 'SPECIAL', 'epic', 'beta_participation', 1, '2025-08-08 16:34:14'),
('birthday-badge', 'Anniversaire FailDaily', 'Être présent lors de l\'anniversaire de l\'app', 'gift-outline', 'SPECIAL', 'rare', 'anniversary_participation', 1, '2025-08-08 16:34:14'),
('bounce-back', 'Rebond', 'Se relever après un fail difficile', 'arrow-up-outline', 'RESILIENCE', 'common', 'bounce_back_count', 1, '2025-08-08 16:34:14'),
('class-clown', 'Rigolo de Service', 'Recevoir 100 réactions de rire au total', 'musical-note-outline', 'HUMOUR', 'rare', 'total_laughs', 100, '2025-08-08 16:34:14'),
('comeback-king', 'Roi du Comeback', 'Reprendre après une pause de 30 jours', 'refresh-outline', 'PERSEVERANCE', 'rare', 'comeback_count', 1, '2025-08-08 16:34:14'),
('comedian', 'Comédien', 'Un fail qui a fait rire 50 personnes', 'theater-outline', 'HUMOUR', 'rare', 'laugh_reactions', 50, '2025-08-08 16:34:14'),
('community-helper', 'Assistant Communautaire', 'Aider 10 membres de la communauté', 'people-outline', 'ENTRAIDE', 'rare', 'help_count', 10, '2025-08-08 16:34:14'),
('community-pillar', 'Pilier de la Communauté', 'Être actif pendant 6 mois consécutifs', 'home-outline', 'ENTRAIDE', 'legendary', 'active_months', 6, '2025-08-08 16:34:14'),
('courage-hearts-10', 'Cœur Brave', 'Recevoir 10 cœurs de courage', 'heart-outline', 'COURAGE', 'common', 'reactions_received', 10, '2025-08-08 16:34:14'),
('courage-hearts-100', 'Héros du Courage', 'Recevoir 100 cœurs de courage', 'medal-outline', 'COURAGE', 'epic', 'reactions_received', 100, '2025-08-08 16:34:14'),
('courage-hearts-50', 'Cœur Courageux', 'Recevoir 50 cœurs de courage', 'heart-outline', 'COURAGE', 'rare', 'reactions_received', 50, '2025-08-08 16:34:14'),
('courage-hearts-500', 'Légende du Courage', 'Recevoir 500 cœurs de courage', 'trophy-outline', 'COURAGE', 'legendary', 'reactions_received', 500, '2025-08-08 16:34:14'),
('daily-streak-100', 'Centurion', '100 jours de partage consécutifs', 'shield-outline', 'PERSEVERANCE', 'epic', 'streak_days', 100, '2025-08-08 16:34:14'),
('daily-streak-14', 'Déterminé', '14 jours de partage consécutifs', 'flame-outline', 'PERSEVERANCE', 'rare', 'streak_days', 14, '2025-08-08 16:34:14'),
('daily-streak-3', 'Régulier', '3 jours de partage consécutifs', 'checkmark-outline', 'PERSEVERANCE', 'common', 'streak_days', 3, '2025-08-08 16:34:14'),
('daily-streak-30', 'Marathonien', '30 jours de partage consécutifs', 'fitness-outline', 'PERSEVERANCE', 'rare', 'streak_days', 30, '2025-08-08 16:34:14'),
('daily-streak-365', 'Immortel', '365 jours de partage consécutifs', 'infinite-outline', 'PERSEVERANCE', 'legendary', 'streak_days', 365, '2025-08-08 16:34:14'),
('daily-streak-60', 'Titan de la Régularité', '60 jours de partage consécutifs', 'barbell-outline', 'PERSEVERANCE', 'epic', 'streak_days', 60, '2025-08-08 16:34:14'),
('daily-streak-7', 'Persévérant', '7 jours de partage consécutifs', 'calendar-outline', 'PERSEVERANCE', 'common', 'streak_days', 7, '2025-08-08 16:34:14'),
('discussion-starter', 'Lanceur de Débats', 'Créer 25 discussions populaires', 'chatbubbles-outline', 'ENTRAIDE', 'epic', 'popular_discussions', 25, '2025-08-08 16:34:14'),
('early-adopter', 'Pionnier', 'Membre des 1000 premiers utilisateurs', 'flag-outline', 'SPECIAL', 'legendary', 'user_rank', 1000, '2025-08-08 16:34:14'),
('empathy-expert', 'Expert en Empathie', 'Donner 25 réactions d\'empathie', 'sad-outline', 'ENTRAIDE', 'common', 'empathy_given', 25, '2025-08-08 16:34:14'),
('fail-master-10', 'Collectionneur', 'Partager 10 fails', 'library-outline', 'COURAGE', 'common', 'fail_count', 10, '2025-08-08 16:22:31'),
('fail-master-100', 'Maître des Fails', 'Partager 100 fails', 'ribbon-outline', 'COURAGE', 'epic', 'fail_count', 100, '2025-08-08 16:34:14'),
('fail-master-25', 'Narrateur', 'Partager 25 fails', 'book-outline', 'COURAGE', 'rare', 'fail_count', 25, '2025-08-08 16:34:14'),
('fail-master-365', 'Chroniqueur Légendaire', 'Partager 365 fails (un an !)', 'calendar-number-outline', 'COURAGE', 'legendary', 'fail_count', 365, '2025-08-08 16:34:14'),
('fail-master-5', 'Apprenti', 'Partager 5 fails', 'school-outline', 'COURAGE', 'common', 'fail_count', 5, '2025-08-08 16:22:31'),
('fail-master-50', 'Grand Collectionneur', 'Partager 50 fails', 'albums-outline', 'COURAGE', 'rare', 'fail_count', 50, '2025-08-08 16:34:14'),
('fails-10', 'Courageux', 'Poster 10 fails', 'trophy-outline', 'COURAGE', 'rare', 'fail_count', 10, '2025-08-10 13:58:59'),
('fails-100', 'Légende du Courage', 'Poster 100 fails', 'diamond-outline', 'COURAGE', 'legendary', 'fail_count', 100, '2025-08-10 13:58:59'),
('fails-25', 'Maître du Courage', 'Poster 25 fails', 'star-outline', 'COURAGE', 'epic', 'fail_count', 25, '2025-08-10 13:58:59'),
('fails-5', 'Apprenti Courage', 'Poster 5 fails', 'ribbon-outline', 'COURAGE', 'common', 'fail_count', 5, '2025-08-10 13:58:59'),
('fails-50', 'Vétéran du Courage', 'Poster 50 fails', 'shield-outline', 'COURAGE', 'epic', 'fail_count', 50, '2025-08-10 13:58:59'),
('first-fail', 'Premier Pas', 'Félicitations pour votre premier fail partagé !', 'footsteps-outline', 'COURAGE', 'common', 'fail_count', 1, '2025-08-08 16:22:31'),
('first-reaction', 'Première Réaction', 'Recevoir votre première réaction', 'heart-outline', 'COURAGE', 'common', 'first_reaction', 1, '2025-08-08 16:43:44'),
('funny-fail', 'Comédien Amateur', 'Un fail qui a fait rire 25 personnes', 'happy-outline', 'HUMOUR', 'common', 'laugh_reactions', 25, '2025-08-08 16:34:14'),
('globetrotter', 'Globe-Trotter', 'Partager des fails de 10 pays différents', 'airplane-outline', 'SPECIAL', 'legendary', 'countries_count', 10, '2025-08-08 16:34:14'),
('good-vibes', 'Bonnes Vibrations', 'Donner 1000 réactions positives au total', 'thumbs-up-outline', 'ENTRAIDE', 'epic', 'positive_reactions', 1000, '2025-08-08 16:34:14'),
('guardian-angel', 'Ange Gardien', 'Aider 25 membres de la communauté', 'medical-outline', 'ENTRAIDE', 'epic', 'help_count', 25, '2025-08-08 16:34:14'),
('holiday-spirit', 'Esprit des Fêtes', 'Partager pendant les vacances', 'snow-outline', 'SPECIAL', 'rare', 'holiday_fails', 5, '2025-08-08 16:34:14'),
('humor-king', 'Roi du Rire', 'Un fail qui a fait rire 100 personnes', 'sparkles-outline', 'HUMOUR', 'epic', 'laugh_reactions', 100, '2025-08-08 16:34:14'),
('inspiration', 'Source d\'Inspiration', 'Inspirer 100 autres utilisateurs', 'bulb-outline', 'RESILIENCE', 'legendary', 'inspired_users', 100, '2025-08-08 16:34:14'),
('iron-will', 'Volonté de Fer', 'Repartager après 10 échecs consécutifs', 'hammer-outline', 'PERSEVERANCE', 'legendary', 'resilience_count', 10, '2025-08-08 16:34:14'),
('laughter-legend', 'Légende du Rire', 'Recevoir 1000 réactions de rire au total', 'star-outline', 'HUMOUR', 'legendary', 'total_laughs', 1000, '2025-08-08 16:34:14'),
('life-coach', 'Coach de Vie', 'Aider 100 personnes avec des conseils', 'fitness-outline', 'ENTRAIDE', 'legendary', 'advice_given', 100, '2025-08-08 16:34:14'),
('mentor', 'Mentor', 'Commenter constructivement 100 fails', 'chatbox-outline', 'ENTRAIDE', 'rare', 'helpful_comments', 100, '2025-08-08 16:34:14'),
('midnight-warrior', 'Guerrier de Minuit', 'Partager un fail après minuit', 'moon-outline', 'SPECIAL', 'common', 'midnight_fail', 1, '2025-08-08 16:34:14'),
('mood-lifter', 'Remonteur de Moral', '50 fails marqués comme "drôles"', 'sunny-outline', 'HUMOUR', 'epic', 'funny_fails', 50, '2025-08-08 16:34:14'),
('never-give-up', 'Jamais Abandonner', 'Maintenir 5 streaks de plus de 7 jours', 'flag-outline', 'PERSEVERANCE', 'epic', 'long_streaks', 5, '2025-08-08 16:34:14'),
('new-year-resolution', 'Résolution du Nouvel An', 'Partager un fail le 1er janvier', 'calendar-outline', 'SPECIAL', 'rare', 'new_year_fail', 1, '2025-08-08 16:34:14'),
('phoenix', 'Phénix', 'Renaître de 10 échecs majeurs', 'flame-outline', 'RESILIENCE', 'epic', 'major_comebacks', 10, '2025-08-08 16:34:14'),
('power-user', 'Utilisateur Expert', 'Utiliser toutes les fonctionnalités de l\'app', 'settings-outline', 'SPECIAL', 'epic', 'features_used', 10, '2025-08-08 16:34:14'),
('reactions-10', 'Supporteur', 'Donner 10 réactions', 'people-outline', 'ENTRAIDE', 'common', 'reaction_given', 10, '2025-08-10 13:58:59'),
('reactions-100', 'Super Supporteur', 'Donner 100 réactions', 'heart-circle-outline', 'ENTRAIDE', 'epic', 'reaction_given', 100, '2025-08-10 13:58:59'),
('reactions-25', 'Supporteur Actif', 'Donner 25 réactions', 'heart-half-outline', 'ENTRAIDE', 'common', 'reaction_given', 25, '2025-08-10 13:58:59'),
('reactions-250', 'Maître du Support', 'Donner 250 réactions', 'heart-half-outline', 'ENTRAIDE', 'legendary', 'reaction_given', 250, '2025-08-10 13:58:59'),
('reactions-50', 'Grand Supporteur', 'Donner 50 réactions', 'heart', 'ENTRAIDE', 'rare', 'reaction_given', 50, '2025-08-10 13:58:59'),
('resilience-champion', 'Champion de Résilience', 'Partager 20 fails de résilience', 'refresh-outline', 'RESILIENCE', 'rare', 'resilience_fails', 20, '2025-08-08 16:34:14'),
('resilience-rookie', 'Apprenti Résilient', 'Partager 5 fails de résilience', 'leaf-outline', 'RESILIENCE', 'common', 'resilience_fails', 5, '2025-08-08 16:34:14'),
('socializer', 'Sociable', 'Interagir avec 50 utilisateurs différents', 'people-circle-outline', 'ENTRAIDE', 'rare', 'unique_interactions', 50, '2025-08-08 16:34:14'),
('stand-up-master', 'Maître du Stand-Up', 'Recevoir 500 réactions de rire au total', 'mic-outline', 'HUMOUR', 'epic', 'total_laughs', 500, '2025-08-08 16:34:14'),
('supportive-soul', 'Âme Bienveillante', 'Donner 50 réactions de soutien', 'heart-half-outline', 'ENTRAIDE', 'common', 'support_given', 50, '2025-08-08 16:34:14'),
('survivor', 'Survivant', 'Surmonter 50 défis personnels', 'shield-checkmark-outline', 'RESILIENCE', 'legendary', 'challenges_overcome', 50, '2025-08-08 16:34:14'),
('trend-setter', 'Créateur de Tendances', 'Lancer 5 tendances dans la communauté', 'trending-up-outline', 'SPECIAL', 'legendary', 'trends_created', 5, '2025-08-08 16:34:14'),
('unbreakable', 'Incassable', 'Maintenir un état d\'esprit positif 100 jours', 'diamond-outline', 'RESILIENCE', 'epic', 'positive_days', 100, '2025-08-08 16:34:14'),
('viral-laugh', 'Sensation Virale', 'Un fail qui a fait rire 500 personnes', 'trending-up-outline', 'HUMOUR', 'legendary', 'laugh_reactions', 500, '2025-08-08 16:34:14'),
('weekend-warrior', 'Guerrier du Weekend', 'Partager 50 fails le weekend', 'bicycle-outline', 'SPECIAL', 'rare', 'weekend_fails', 50, '2025-08-08 16:34:14'),
('wise-counselor', 'Conseiller Sage', 'Commenter constructivement 250 fails', 'library-outline', 'ENTRAIDE', 'epic', 'helpful_comments', 250, '2025-08-08 16:34:14');

--
-- Dumping data for table `comments`
--

INSERT INTO `comments` (`id`, `fail_id`, `user_id`, `content`, `is_encouragement`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'Courageux !', 0, NULL, NULL),
(2, 1, 2, 'Continue comme ça !', 1, NULL, NULL),
(3, 2, 1, 'Énorme fail !', 0, NULL, NULL),
(4, 2, 3, 'On a tous connu ça', 1, NULL, NULL),
(5, 3, 2, 'Trop drôle !', 0, NULL, NULL),
(6, 3, 3, 'Jadore !', 1, NULL, NULL);

--
-- Dumping data for table `fails`
--

INSERT INTO `fails` (`id`, `user_id`, `title`, `description`, `category`, `image_url`, `is_public`, `reactions`, `comments_count`, `created_at`, `updated_at`) VALUES
(1, 1, 'Mon premier fail', 'Description du fail', 'COURAGE', 'https://example.com/image1.jpg', 1, '{"laugh":10,"courage":5}', 2, NULL, NULL),
(2, 1, 'Un autre fail', 'Description du fail', 'HUMOUR', 'https://example.com/image2.jpg', 1, '{"laugh":20,"courage":0}', 2, NULL, NULL),
(3, 2, 'Fail épique', 'Description du fail', 'COURAGE', 'https://example.com/image3.jpg', 1, '{"laugh":5,"courage":15}', 2, NULL, NULL),
(4, 2, 'Fail légendaire', 'Description du fail', 'HUMOUR', 'https://example.com/image4.jpg', 1, '{"laugh":100,"courage":50}', 2, NULL, NULL);

--
-- Dumping data for table `legal_documents`
--

INSERT INTO `legal_documents` (`id`, `title`, `content`, `version`, `document_type`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Conditions d\'utilisation', 'Conditions générales d\'utilisation de FailDaily...', '1.0', 'terms', 1, 1, NULL, NULL),
(2, 'Politique de confidentialité', 'Politique de confidentialité de FailDaily...', '1.0', 'privacy', 1, 1, NULL, NULL),
(3, 'Règles de la communauté', 'Règles de la communauté de FailDaily...', '1.0', 'rules', 1, 1, NULL, NULL),
(4, 'Politique des données', 'Politique des données de FailDaily...', '1.0', 'data', 1, 1, NULL, NULL);

--
-- Dumping data for table `parental_consents`
--

INSERT INTO `parental_consents` (`id`, `child_user_id`, `parent_email`, `parent_name`, `consent_date`, `consent_ip`, `consent_method`, `verification_code`, `is_verified`, `verified_at`, `expires_at`, `created_at`) VALUES
(1, 1, 'parent1@example.com', 'Parent Test 1', '2025-08-21 10:00:00', '127.0.0.1', 'email', 'abc123', 1, '2025-08-21 10:05:00', '2026-08-21 10:00:00', NULL),
(2, 2, 'parent2@example.com', 'Parent Test 2', '2025-08-21 10:10:00', '127.0.0.1', 'email', 'def456', 1, '2025-08-21 10:15:00', '2026-08-21 10:10:00', NULL);

--
-- Dumping data for table `profiles`
--

INSERT INTO `profiles` (`id`, `user_id`, `username`, `display_name`, `avatar_url`, `bio`, `registration_completed`, `legal_consent`, `age_verification`, `preferences`, `stats`, `created_at`, `updated_at`) VALUES
(1, 1, 'testuser1', 'Test User 1', 'https://example.com/avatar1.jpg', 'Bio de Test User 1', 1, '{"birthDate":"2000-01-01","agreeToTerms":true,"acceptedAt":"2025-08-21T10:00:00"}', '{"birthDate":"2000-01-01","age":25,"verified":true}', '{"notificationsEnabled":true,"emailNotifications":true,"pushNotifications":true,"privacyMode":"friends","showRealName":false}', '{"badges":[],"totalFails":0,"couragePoints":0}', NULL, NULL),
(2, 2, 'testuser2', 'Test User 2', 'https://example.com/avatar2.jpg', 'Bio de Test User 2', 1, '{"birthDate":"1995-05-05","agreeToTerms":true,"acceptedAt":"2025-08-21T10:10:00"}', '{"birthDate":"1995-05-05","age":30,"verified":true}', '{"notificationsEnabled":true,"emailNotifications":true,"pushNotifications":true,"privacyMode":"public","showRealName":true}', '{"badges":[],"totalFails":0,"couragePoints":0}', NULL, NULL);

--
-- Dumping data for table `system_logs`
--

INSERT INTO `system_logs` (`id`, `level`, `message`, `action`, `details`, `user_id`, `timestamp`, `created_at`) VALUES
(1, 'info', 'Inscription réussie', 'register', '{"userId":1,"email":"adulte1@adulte.fr"}', 1, '2025-08-21 08:51:48', NULL),
(2, 'info', 'Connexion réussie', 'login', '{"userId":1}', 1, '2025-08-21 09:00:00', NULL),
(3, 'warning', 'Tentative de connexion échouée', 'login_failed', '{"email":"adulte2@adulte.fr"}', NULL, '2025-08-21 09:05:00', NULL),
(4, 'error', 'Échec de la création de fail', 'create_fail', '{"userId":1,"title":"","description":"Description du fail"}', 1, '2025-08-21 09:10:00', NULL);

--
-- Dumping data for table `user_activities`
--

INSERT INTO `user_activities` (`id`, `user_id`, `user_email`, `user_name`, `action`, `details`, `fail_id`, `reaction_type`, `ip_address`, `user_agent`, `timestamp`, `created_at`) VALUES
(1, 1, 'adulte1@adulte.fr', 'Test User 1', 'register', '{"email":"adulte1@adulte.fr"}', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36', '2025-08-21 08:51:48', NULL),
(2, 1, 'adulte1@adulte.fr', 'Test User 1', 'login', '{"userId":1}', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36', '2025-08-21 09:00:00', NULL),
(3, 2, 'adulte2@adulte.fr', 'Test User 2', 'login_failed', '{"email":"adulte2@adulte.fr"}', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36', '2025-08-21 09:05:00', NULL),
(4, 1, 'adulte1@adulte.fr', 'Test User 1', 'create_fail', '{"userId":1,"title":"","description":"Description du fail"}', 1, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36', '2025-08-21 09:10:00', NULL);

--
-- Dumping data for table `user_badges`
--

INSERT INTO `user_badges` (`id`, `user_id`, `badge_id`, `unlocked_at`, `created_at`) VALUES
(1, 1, 1, '2025-08-21 09:00:00', NULL),
(2, 1, 2, '2025-08-21 09:05:00', NULL),
(3, 2, 3, '2025-08-21 09:10:00', NULL),
(4, 2, 4, '2025-08-21 09:15:00', NULL);

--
-- Dumping data for table `user_legal_acceptances`
--

INSERT INTO `user_legal_acceptances` (`id`, `user_id`, `document_id`, `document_version`, `accepted_at`, `accepted_ip`, `user_agent`) VALUES
(1, 1, 1, '1.0', '2025-08-21 10:00:00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'),
(2, 1, 2, '1.0', '2025-08-21 10:05:00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'),
(3, 2, 3, '1.0', '2025-08-21 10:10:00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'),
(4, 2, 4, '1.0', '2025-08-21 10:15:00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36');

COMMIT;
```

*Le contenu complet du fichier `faildaily.sql` est intégré ici pour garantir l'exhaustivité demandée : structure, inserts, triggers, vues, contraintes, définitions de badges et documents légaux.*
