# 📋 GUIDE DE TEST COMPLET - FAILDAILY

> **Guide destiné aux développeurs testeurs pour valider l'application FailDaily de fond en comble**

---

## 🚀 **PHASE 1 : CONFIGURATION ENVIRONNEMENT**

### **1.1 Prérequis système**
Vérifiez que votre environnement dispose des versions suivantes :

```bash
# Vérifier les versions requises
node --version    # >= 18.x
npm --version     # >= 9.x
mysql --version   # >= 8.0
git --version     # >= 2.x
```

### **1.2 Configuration Docker actuelle du projet**

**🐳 ÉTAT DOCKER RÉEL - CONFIGURATION COMPLÈTE :**
Le projet FailDaily utilise maintenant **Docker COMPLET** avec tous les services containerisés :

#### **Services Docker actifs :**
```bash
# Vérifier les conteneurs FailDaily en cours
docker ps --filter "name=faildaily"

# Services actuellement déployés :
- faildaily_traefik_local : Proxy Traefik (ports 8000, 8090)
- faildaily_frontend     : Angular/Ionic + Nginx (port 80 interne)
- faildaily_backend      : Node.js Express (port 3000 interne)
- faildaily_db          : MySQL 8.0 (port 3308:3306)
```

#### **Architecture Docker Complete :**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Traefik       │    │    Frontend      │    │    Backend      │
│   Port 8000     │───▶│  Angular/Ionic   │───▶│   Express API   │
│   Port 8090     │    │     + Nginx      │    │   Port 3000     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                          │
                                                          ▼
                                               ┌─────────────────┐
                                               │   MySQL 8.0     │
                                               │   Port 3308     │
                                               └─────────────────┘
```

#### **URLs d'accès :**
```
🌐 Application FailDaily : http://localhost:8000
🔧 Dashboard Traefik    : http://localhost:8090/dashboard/
🔌 API Backend          : http://localhost:8000/api
🗄️ Base de données      : localhost:3308
```

### **1.3 Installation et démarrage (2 options)**

#### **Option A : Setup complet Docker (CONFIGURATION ACTUELLE - recommandé)**
```bash
# 1. Cloner le projet
git clone https://github.com/Taaazzz-prog/FailDaily.git
cd FailDaily

# 2. Démarrage complet avec Docker
cd docker
docker-compose up -d --build

# Accès direct :
# - Application complète : http://localhost:8000
# - Dashboard Traefik : http://localhost:8090/dashboard/
# - API Backend : http://localhost:8000/api
# - MySQL : localhost:3308

# Vérification fonctionnement :
curl http://localhost:8000                    # Frontend Angular/Ionic
curl http://localhost:8000/api/health         # API Backend  
curl http://localhost:8090/dashboard/         # Traefik Dashboard
```

#### **Option B : Setup entièrement local (développement)**
```bash
# 1. Cloner le projet
git clone https://github.com/Taaazzz-prog/FailDaily.git
cd FailDaily

# 2. Installation backend
cd backend-api
npm install
cp .env.example .env  # Configurer avec MySQL local

# 3. Installation frontend
cd ../frontend
npm install

# 4. Configuration base de données locale
mysql -u root -p
CREATE DATABASE faildaily CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
# Importer le fichier migrations/faildaily.sql

# 5. Démarrage des services
# Terminal 1 - Backend
cd backend-api && npm start     # Port 3000

# Terminal 2 - Frontend  
cd frontend && ionic serve      # Port 4200
```

### **1.4 Variables d'environnement et accès BDD**

#### **Configuration .env (backend-api/.env)**
```env
# Configuration Docker complète (configuration actuelle)
DB_HOST=faildaily_db      # Nom du conteneur MySQL
DB_PORT=3306              # Port MySQL interne au réseau Docker
DB_USER=root
DB_PASSWORD=@51008473@Alexia@
DB_NAME=faildaily
NODE_ENV=development
PORT=3000
JWT_SECRET=faildaily_super_secret_key_for_local_development_2025

# Configuration SMTP OVH (production)
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contact@faildaily.com
SMTP_FROM=FailDaily <contact@faildaily.com>
```

#### **🗄️ Accès base de données Docker**
```bash
# Via Docker (méthode recommandée)
docker exec -it faildaily_db mysql -u root -p@51008473@Alexia@ faildaily

# Via client MySQL externe (depuis l'hôte)
mysql -h 127.0.0.1 -P 3308 -u root -p@51008473@Alexia@ faildaily

# État actuel des données (vérifié) :
# - 👥 Utilisateurs : 60
# - 📝 Fails publiés : 21  
# - 🏆 Badges attribués : 5
```

#### **Validation connexion BDD**
```bash
# Test rapide de connexion et données
docker exec -it faildaily_db mysql -u root -p@51008473@Alexia@ faildaily -e "
SELECT COUNT(*) as total_users FROM users; 
SELECT COUNT(*) as total_fails FROM fails; 
SELECT COUNT(*) as total_badges FROM user_badges;
SELECT u.email, u.role, p.display_name 
FROM users u 
JOIN profiles p ON u.id = p.user_id 
WHERE u.email = 'bruno@taaazzz.be';
"

# Résultat attendu :
# total_users: 60
# total_fails: 21
# total_badges: 5
# bruno@taaazzz.be | super_admin | Bruno Testeur
```

### **1.5 URLs et accès selon configuration**

#### **Setup complet Docker (CONFIGURATION ACTUELLE) :**
```
🌐 Application FailDaily : http://localhost:8000
🔧 Dashboard Traefik     : http://localhost:8090/dashboard/
🔌 API Backend           : http://localhost:8000/api
🗄️ MySQL Database        : localhost:3308 (externe) / faildaily_db:3306 (interne)

# Tests de fonctionnement :
curl http://localhost:8000                    # Page d'accueil FailDaily
curl http://localhost:8000/api/health         # {"status":"OK","environment":"development"}
curl http://localhost:8090/dashboard/         # Interface Traefik

# Tous les services communicent via le réseau Docker 'app-network'
```

#### **Setup local complet (développement alternatif) :**
```
Frontend :     http://localhost:4200          # ionic serve
Backend API :  http://localhost:3000/api      # npm start
MySQL :        localhost:3306                 # Installation locale
```

#### **Avantages Docker complet :**
- ✅ **Isolation complète** : Pas de conflits avec d'autres projets
- ✅ **Réplication production** : Environnement identique
- ✅ **Proxy Traefik** : Gestion automatique du routage
- ✅ **Réseau interne** : Communication sécurisée entre services
- ✅ **Build optimisé** : Frontend compilé en mode production
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contact@faildaily.com
SMTP_FROM=FailDaily <contact@faildaily.com>
```

---

## 🔐 **PHASE 2 : TESTS D'AUTHENTIFICATION**

### **2.1 Inscription utilisateur**
- [ ] **Email invalide** : Tester avec `email-invalide` (doit échouer)
- [ ] **Mot de passe faible** : Tester avec `123` (< 6 caractères, doit échouer)
- [ ] **Inscription valide** : Utiliser `bruno.test@example.com` / `password123`
- [ ] **Vérification BDD** : Confirmer création dans tables `users` et `profiles`
- [ ] **Token JWT** : Vérifier réception et validité du token
- [ ] **Nom d'affichage unique** : Tester doublon (doit échouer)

### **2.2 Connexion utilisateur**
- [ ] **Mauvais identifiants** : Tester avec email/password incorrect (doit échouer)
- [ ] **Connexion valide** : Se connecter avec les identifiants créés
- [ ] **Persistance session** : Recharger la page (doit rester connecté)
- [ ] **Déconnexion** : Tester le logout et vérifier suppression token

### **2.3 Gestion âge et conformité COPPA**
- [ ] **Utilisateur < 13 ans** : Inscription doit être bloquée
- [ ] **Utilisateur 13-17 ans** : Autorisation parentale requise
- [ ] **Utilisateur > 18 ans** : Accès libre à toutes les fonctionnalités

### **2.4 Endpoints d'authentification**
```bash
# Tests API avec curl ou Postman
POST /api/auth/register
POST /api/auth/login  
GET  /api/auth/verify
GET  /api/auth/profile
POST /api/auth/logout
```

---

## 📝 **PHASE 3 : TESTS SYSTÈME DE FAILS**

### **3.1 Création de fails**

#### **Données de test recommandées :**
```json
{
  "title": "Test fail #1",
  "description": "Description de test pour validation",
  "category": "professional",
  "is_anonyme": false
}
```

#### **Tests à effectuer :**
- [ ] **Titre uniquement** : Créer fail avec titre seul
- [ ] **Titre + description** : Fail complet
- [ ] **Upload image** : Tester avec image < 5MB (JPG, PNG, WebP)
- [ ] **Fail anonyme** : Créer avec `is_anonyme: true`
- [ ] **Toutes les catégories** :
  - [ ] `professional` - Échecs professionnels
  - [ ] `personal` - Échecs personnels  
  - [ ] `social` - Échecs sociaux
  - [ ] `academic` - Échecs académiques
  - [ ] `sport` - Échecs sportifs
  - [ ] `technologie` - Échecs tech
  - [ ] `humour` - Échecs drôles

#### **Limites à valider :**
- [ ] **Titre** : Maximum 200 caractères
- [ ] **Description** : Maximum 2000 caractères
- [ ] **Image** : Maximum 5MB

### **3.2 Affichage des fails**

#### **Endpoints à tester :**
```bash
GET /api/fails/anonymes?limit=20&offset=0    # Liste publique
GET /api/fails/:id                           # Détail fail
GET /api/users/:userId/fails                 # Fails par utilisateur
```

#### **Tests d'affichage :**
- [ ] **Liste publique** : Vérifier `/api/fails/anonymes` masque auteur si anonyme
- [ ] **Détail fail** : Accès à un fail spécifique avec toutes les données
- [ ] **Fails utilisateur** : Liste des fails d'un utilisateur donné
- [ ] **Pagination** : Tester avec différentes valeurs limit/offset
- [ ] **Anonymisation** : Auteur masqué pour fails anonymes

### **3.3 Upload d'images**

#### **Tests de validation :**
- [ ] **Formats valides** : JPG, PNG, WebP, GIF
- [ ] **Taille limite** : Fichier 5MB+ doit échouer
- [ ] **Format invalide** : PDF, TXT doivent échouer
- [ ] **Compression automatique** : Vérifier réduction taille
- [ ] **URL retournée** : Valide et accessible

#### **Endpoint upload :**
```bash
POST /api/upload/image
# Content-Type: multipart/form-data
# Field: image (file)
```

---

## 💖 **PHASE 4 : SYSTÈME DE RÉACTIONS**

### **4.1 Types de réactions disponibles**
- [ ] **courage** : Réaction cœur principal (orange)
- [ ] **support** : Réaction de soutien (vert)
- [ ] **empathy** : Réaction d'empathie (bleu)
- [ ] **laugh** : Réaction humour (jaune)

### **4.2 Gestion des réactions**

#### **Endpoints API :**
```bash
POST   /api/fails/:id/reactions  # Ajouter réaction
DELETE /api/fails/:id/reactions  # Supprimer réaction  
GET    /api/fails/:id/reactions  # Lister réactions
```

#### **Tests de comportement :**
- [ ] **Ajouter réaction** : Première réaction sur un fail
- [ ] **Changer de type** : Passer de `courage` à `support`
- [ ] **Supprimer réaction** : Annuler sa réaction
- [ ] **Une réaction par user** : Impossible d'avoir 2 réactions simultanées
- [ ] **Comptes temps réel** : Vérifier mise à jour immédiate des compteurs
- [ ] **Réaction propre fail** : Possible de réagir à ses propres fails

### **4.3 Affichage des réactions**
- [ ] **Compteurs visuels** : Nombre par type de réaction
- [ ] **État utilisateur** : Réaction active mise en surbrillance
- [ ] **Animation** : Feedback visuel lors du clic

---

## 🏆 **PHASE 5 : SYSTÈME DE BADGES**

### **5.1 Attribution automatique**

#### **Badges de base à valider :**
- [ ] **"Premier Pas"** : Attribué après le 1er fail publié
- [ ] **"Apprenti Courage"** : Attribué après 5 fails publiés  
- [ ] **"Régulier"** : Attribué après 3 jours de streak
- [ ] **"Supporteur"** : Attribué après 10 réactions données
- [ ] **"Courageux"** : Attribué après 10 fails publiés

#### **Mécanisme de déclenchement :**
- [ ] **Triggers automatiques** : Attribution immédiate après action
- [ ] **Pas de doublons** : Un badge ne peut être attribué qu'une fois
- [ ] **Historique** : Date de déblocage sauvegardée

### **5.2 API Badges**

#### **Endpoints principaux :**
```bash
GET /api/badges/available        # Liste complète des 65+ badges
GET /api/users/me/badges         # Badges de l'utilisateur connecté
GET /api/users/:userId/stats     # Statistiques pour calcul badges
```

#### **Structure réponse badges :**
```json
{
  "id": "first-fail",
  "name": "Premier Pas", 
  "description": "Félicitations pour votre premier fail partagé !",
  "icon": "footsteps-outline",
  "category": "COURAGE",
  "rarity": "common",
  "badge_type": "fail_count",
  "unlocked_at": "2025-09-22T09:04:39.000Z"
}
```

#### **Tests API :**
- [ ] **Liste disponible** : 65+ badges avec toutes les métadonnées
- [ ] **Badges utilisateur** : IDs corrects (ex: `first-fail`, pas UUID)
- [ ] **Statistiques** : Données exactes pour calcul progression

### **5.3 Interface badges**

#### **Page /tabs/badges :**
- [ ] **Badges débloqués** : Section avec badges obtenus + dates
- [ ] **Prochains défis** : EXCLUT badges déjà débloqués
- [ ] **Barres progression** : Calcul correct (ex: 4/5 fails)
- [ ] **Animations** : Feedback visuel pour nouveaux badges

#### **Section "Prochains défis" - Règles critiques :**
- [ ] **Badge "Premier Pas" ABSENT** si déjà débloqué (1/1 complété)
- [ ] **Affiche seulement** badges avec progression 0 < current < required
- [ ] **Badges proches** : Objectifs atteignables (écart raisonnable)

### **5.4 Statistiques utilisateur**

#### **Données attendues pour calculs :**
```json
{
  "courage_points": 20,
  "total_fails": 4,
  "total_badges": 5,
  "total_reactions_given": 1,
  "total_reactions_received": 1,
  "streak": 0,
  "join_date": "2025-08-26"
}
```

---

## 🛡️ **PHASE 6 : SYSTÈME DE MODÉRATION**

### **6.1 États de modération**

#### **Workflow de modération :**
1. **Fail créé** : Visible par défaut (pas d'entrée moderation)
2. **Signalements** : Auto-masquage si seuil atteint
3. **Modération manuelle** : Actions admin

#### **États possibles :**
- [ ] **`approved`** : Validé et visible
- [ ] **`hidden`** : Masqué temporairement  
- [ ] **`under_review`** : En cours d'examen
- [ ] **`rejected`** : Refusé définitivement

### **6.2 Interface modérateur**

#### **Page /tabs/moderation (rôle moderator+ requis) :**
- [ ] **Queue signalements** : Liste des contenus signalés
- [ ] **Actions rapides** : Approuver/Masquer/Rejeter
- [ ] **Historique** : Log des actions de modération
- [ ] **Statistiques** : Nombre de signalements par période

#### **Tests de permissions :**
- [ ] **Utilisateur standard** : Accès refusé à /tabs/moderation
- [ ] **Modérateur** : Accès complet aux outils modération
- [ ] **Admin** : Toutes les actions + configuration

---

## 👑 **PHASE 7 : ADMINISTRATION**

### **7.1 Dashboard admin**

#### **Page /tabs/admin (rôle admin requis) :**
- [ ] **Métriques globales** :
  - Nombre total utilisateurs
  - Nombre total fails
  - Badges distribués
  - Activité dernières 24h
- [ ] **Gestion utilisateurs** :
  - Changer rôles (user → moderator → admin)
  - Bannir/débannir utilisateurs
  - Voir détails complets profils
- [ ] **Configuration système** :
  - Seuils de modération automatique
  - Paramètres points de courage
  - Configuration badges

### **7.2 Tests de rôles et permissions**

#### **Matrice d'accès :**
| Fonctionnalité | user | moderator | admin | super_admin |
|----------------|------|-----------|-------|-------------|
| Créer fails | ✅ | ✅ | ✅ | ✅ |
| Réagir aux fails | ✅ | ✅ | ✅ | ✅ |
| Modération | ❌ | ✅ | ✅ | ✅ |
| Admin dashboard | ❌ | ❌ | ✅ | ✅ |
| Debug tools | ❌ | ❌ | ❌ | ✅ |

#### **Tests à effectuer :**
- [ ] **Guards d'accès** : Pages protégées redirigent correctement
- [ ] **Élévation privilèges** : Admin peut promouvoir un user
- [ ] **Actions restreintes** : User ne peut pas modérer

---

## 📱 **PHASE 8 : INTERFACE UTILISATEUR & THÈMES**

### **8.1 Vérification des thèmes et couleurs**

#### **🎨 Problème résolu : Collision couleurs VS Code**
Un problème de collision entre le thème sombre de VS Code et l'application a été identifié et corrigé :

```bash
# Symptôme : Fond noir au lieu de bleu clair (#dbeafe)
# Cause : Préférence système sombre qui surcharge les thèmes FailDaily
# Solution : Force le thème clair par défaut avec !important
```

#### **Tests couleurs obligatoires :**
```bash
# 1. Vérifier que l'application s'affiche en bleu clair
curl http://localhost:8000 # Doit afficher l'app en thème clair

# 2. Test manuel dans la console navigateur
# Ouvrir http://localhost:8000 → F12 → Console → Taper :
window.failDailyThemeTest.check()
# Résultat attendu : "✅ Thème clair correctement appliqué"

# 3. Si problème détecté, forcer le thème clair :
window.failDailyThemeTest.force()
```

#### **Couleurs attendues (thème clair) :**
- **Fond principal** : `#dbeafe` (rgb(219, 234, 254)) - Bleu pastel
- **Texte principal** : `#1e293b` (rgb(30, 41, 59)) - Gris très foncé
- **Surfaces** : `#ffffff` (blanc) - Cartes et éléments
- **Primary** : `#6366f1` (violet-bleu) - Boutons principaux

#### **Corrections appliquées :**
```css
/* Force le thème clair avec !important */
html, body {
  background-color: #dbeafe !important;
  color: #1e293b !important;
}

/* Annule les préférences système sombres */
@media (prefers-color-scheme: dark) {
  html, body {
    background-color: #dbeafe !important;
  }
}
```

### **8.2 Navigation principale

#### **Structure de l'app :**
```
/tabs/home        - Feed public des fails
/tabs/post-fail   - Formulaire création fail (auth requis)
/tabs/badges      - Collection badges (auth requis)  
/tabs/profile     - Profil utilisateur (auth requis)
/auth/login       - Connexion
/auth/register    - Inscription
```

#### **Tests navigation :**
- [ ] **Tabs visibles** : 4 onglets principaux
- [ ] **Guards auth** : Redirection vers login si non connecté
- [ ] **Back button** : Navigation cohérente
- [ ] **Deep linking** : URLs directes fonctionnent

### **8.3 Pages principales

#### **8.3.1 Page Home (/tabs/home)**
- [ ] **Liste fails** : Affichage des fails publics récents
- [ ] **Réactions** : Boutons cliquables avec feedback
- [ ] **Pagination** : Chargement progressif (scroll infini)
- [ ] **États vides** : Message si aucun fail
- [ ] **Fails anonymes** : Auteur affiché comme "Anonyme"

#### **8.3.2 Page Post Fail (/tabs/post-fail)**
- [ ] **Formulaire complet** : Titre, description, catégorie
- [ ] **Upload image** : Sélection et prévisualisation
- [ ] **Mode anonyme** : Toggle fonctionnel
- [ ] **Validation** : Messages d'erreur clairs
- [ ] **Succès** : Redirection après création

#### **8.3.3 Page Badges (/tabs/badges)**
- [ ] **Badges débloqués** : Grille avec détails
- [ ] **Prochains défis** : Maximum 3-4 badges en cours
- [ ] **Progression** : Barres avec pourcentages exacts
- [ ] **Statistiques** : Compteur total correct (ex: "5 badges débloqués")

#### **8.3.4 Page Profile (/tabs/profile)**
- [ ] **Informations utilisateur** : Avatar, nom, email
- [ ] **Statistiques** : Fails, réactions, badges
- [ ] **Mes fails** : Liste des fails de l'utilisateur
- [ ] **Paramètres** : Lien vers modification profil

### **8.4 Gestion profil utilisateur

#### **8.4.1 Modification profil :**
- [ ] **Nom d'affichage** : Changement avec validation unicité
- [ ] **Avatar** : Upload et redimensionnement automatique
- [ ] **Bio** : Texte libre (max 500 caractères)
- [ ] **Mot de passe** : Changement avec confirmation

#### **8.4.2 Paramètres confidentialité :**
- [ ] **Mode anonyme par défaut** : Toggle global
- [ ] **Visibilité profil** : Public/privé
- [ ] **Notifications** : Activation/désactivation

### **8.5 Responsive design

#### **Tests multi-supports :**
- [ ] **Mobile portrait** : < 768px
- [ ] **Mobile paysage** : 768-1024px
- [ ] **Tablette** : 1024-1200px
- [ ] **Desktop** : > 1200px
- [ ] **Navigation** : Tabs en bas mobile, en haut desktop

---

## 🔧 **PHASE 9 : TESTS TECHNIQUES**

### **9.1 Tests de performance**

#### **Métriques cibles :**
- **API Response Time** : < 200ms (95% des requêtes)
- **Frontend Load Time** : < 2s (premier chargement)
- **Database Queries** : < 100ms (moyenne)

#### **Tests de charge selon configuration :**
```bash
# Setup Docker complet (actuel) - Via Traefik
ab -n 100 -c 10 http://localhost:8000/api/fails/anonymes

# Test direct API backend (bypass Traefik)
docker exec faildaily_backend curl http://localhost:3000/api/health

# Tests BDD directement (Docker)
docker exec faildaily_db mysql -u root -p@51008473@Alexia@ faildaily -e "
SELECT BENCHMARK(1000000, (SELECT COUNT(*) FROM users));
"

# Artillery (si installé) - Test complet via Traefik
artillery quick --count 50 --num 5 http://localhost:8000/api/health

# Test performance frontend (Lighthouse dans navigateur)
# URL : http://localhost:8000
```
artillery quick --count 50 --num 5 http://localhost:3000/api/health
```

#### **Tests à effectuer :**
- [ ] **Charge normale** : 50 utilisateurs simultanés
- [ ] **Pics de trafic** : 100+ requêtes/minute
- [ ] **Mémoire** : Pas de fuites après tests prolongés
- [ ] **Rate limiting** : 100 req/15min par IP respecté

### **9.2 Tests de sécurité**

#### **Authentification et autorisation :**
- [ ] **JWT expiration** : Tokens expirés rejetés
- [ ] **Refresh automatique** : Renouvellement avant expiration
- [ ] **Permissions** : Actions restreintes par rôle
- [ ] **CORS** : Configuration restrictive en production

#### **Validation des entrées :**
- [ ] **SQL Injection** : Paramètres échappés
- [ ] **XSS** : Contenu utilisateur sanitisé
- [ ] **CSRF** : Protection sur endpoints sensibles
- [ ] **File upload** : Types et tailles validés

### **9.3 Tests base de données**

#### **Intégrité des données avec Docker :**
```sql
-- Exécution via Docker (recommandé)
docker exec -it faildaily_db mysql -u root -p@51008473@Alexia@ faildaily -e "
SELECT COUNT(*) as users FROM users;                    -- Utilisateurs (attendu: 60)
SELECT COUNT(*) as fails FROM fails;                    -- Fails publiés (attendu: 21)
SELECT COUNT(*) as user_badges FROM user_badges;        -- Badges attribués (attendu: 5)
SELECT COUNT(*) as badge_definitions FROM badge_definitions; -- Badges disponibles (65+)
"

-- Cohérence données critiques
docker exec -it faildaily_db mysql -u root -p@51008473@Alexia@ faildaily -e "
SELECT f.id, f.title, fm.status 
FROM fails f 
LEFT JOIN fail_moderation fm ON f.id = fm.fail_id
LIMIT 5;
"

-- Vérification badges Bruno (utilisateur de test)
docker exec -it faildaily_db mysql -u root -p@51008473@Alexia@ faildaily -e "
SELECT ub.badge_id, bd.name, ub.unlocked_at 
FROM user_badges ub 
JOIN badge_definitions bd ON ub.badge_id = bd.id 
JOIN users u ON ub.user_id = u.id 
WHERE u.email = 'bruno@taaazzz.be';
"

-- Badges orphelins (ne doit rien retourner)
docker exec -it faildaily_db mysql -u root -p@51008473@Alexia@ faildaily -e "
SELECT ub.* FROM user_badges ub 
LEFT JOIN badge_definitions bd ON ub.badge_id = bd.id 
WHERE bd.id IS NULL;
"
```

#### **Tests d'intégrité :**
- [ ] **Relations FK** : Pas de données orphelines
- [ ] **Triggers badges** : Attribution automatique fonctionnelle
- [ ] **Compteurs** : Cohérence réactions/commentaires
- [ ] **Index** : Performances requêtes optimales

---

## 🐛 **PHASE 10 : TESTS DE ROBUSTESSE**

### **10.1 Scénarios d'échec**

#### **Pannes système :**
- [ ] **Backend arrêté** : Messages d'erreur côté frontend
- [ ] **BDD inaccessible** : Fallback et retry automatique
- [ ] **Réseau lent** : Loading states et timeouts
- [ ] **Stockage plein** : Gestion upload failures

#### **Données corrompues :**
- [ ] **Token JWT malformé** : Déconnexion propre
- [ ] **Réponse API invalide** : Parsing sécurisé
- [ ] **Image corrompue** : Validation et fallback

### **10.2 Récupération d'erreurs**

#### **Interface utilisateur :**
- [ ] **Messages compréhensibles** : Pas de stack traces utilisateur
- [ ] **Actions de récupération** : Boutons "Réessayer"
- [ ] **États dégradés** : Fonctionnalités core maintenues
- [ ] **Logs détaillés** : Erreurs tracées côté serveur

#### **Monitoring en temps réel :**
- [ ] **Health checks** : Endpoint `/api/health` fonctionnel
- [ ] **Métriques** : CPU, mémoire, disk dans limits normales
- [ ] **Alertes** : Notifications en cas de problème critique

---

## 📊 **PHASE 11 : VALIDATION AVEC DONNÉES RÉELLES**

### **11.1 Utilisateur de test recommandé**

#### **Compte de référence :**
```json
{
  "email": "bruno@taaazzz.be",
  "password": "@51008473@",
  "displayName": "Bruno Testeur",
  "role": "super_admin"
}
```

#### **État attendu après tests (données de référence) :**
```json
{
  "stats_attendues": {
    "total_fails": 4,
    "total_badges": 5,
    "total_reactions_given": 1,
    "total_reactions_received": 1,
    "courage_points": 20,
    "badges_deverrouilles": [
      "first-fail",
      "daily-streak-3", 
      "daily-streak-7",
      "daily-streak-14",
      "early-adopter"
    ]
  }
}
```

### **11.2 Vérifications post-test critiques**

#### **API Endpoints - Tests avec configuration Docker complète :**
```bash
# Test critique badges (setup Docker complet)
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/users/me/badges
# DOIT retourner : {"id": "first-fail", "name": "Premier Pas", ...}
# PAS : {"id": "a1d22839-2b83-4cba-8068-1890f15d10d3", ...}

# Test statistiques utilisateur Bruno
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/users/9f92d99e-5f70-427e-aebd-68ca8b727bd4/stats
# DOIT inclure : "total_badges": 5, "total_fails": 4

# Vérification directe BDD Docker (méthode la plus fiable)
docker exec -it faildaily_db mysql -u root -p@51008473@Alexia@ faildaily -e "
SELECT 
    (SELECT COUNT(*) FROM user_badges WHERE user_id = (SELECT id FROM users WHERE email = 'bruno@taaazzz.be')) as badges_bruno,
    (SELECT COUNT(*) FROM fails WHERE user_id = (SELECT id FROM users WHERE email = 'bruno@taaazzz.be')) as fails_bruno,
    (SELECT display_name FROM profiles WHERE user_id = (SELECT id FROM users WHERE email = 'bruno@taaazzz.be')) as nom_bruno;
"

# Health check API via Traefik
curl http://localhost:8000/api/health
# DOIT retourner : {"status":"OK","environment":"development","version":"1.0.0"}

# Test frontend via Traefik
curl http://localhost:8000 | grep -i "faildaily"
# DOIT contenir : <title>FailDaily - Transforme tes échecs en victoires</title>
```

#### **Checklist validation finale Docker :**
- [ ] **Badges débloqués exclus** de "Prochains défis"
- [ ] **Statistiques exactes** : "5 badges débloqués" affiché
- [ ] **Progression cohérente** : Barres % correspondent aux données
- [ ] **Aucun badge UUID** dans les réponses API (bug corrigé)
- [ ] **Base données cohérente** : user_badges.badge_id = badge_definitions.id
- [ ] **Architecture Docker complète** : Traefik + Frontend + Backend + MySQL opérationnels
- [ ] **Accès BDD Docker** : Port 3308 accessible et données correctes (60 users, 21 fails, 5 badges)
- [ ] **Frontend Dockerisé** : Application accessible via http://localhost:8000
- [ ] **Proxy Traefik** : Routing automatique Frontend/API fonctionnel
- [ ] **Dashboard Traefik** : Interface accessible via http://localhost:8090/dashboard/

---

## 🔍 **PHASE 12 : TESTS SPÉCIFIQUES BUGS RÉSOLUS**

### **12.1 Bug "Prochains défis" - Badges déjà débloqués (CORRIGÉ)**

#### **Contexte du bug :**
- **Problème** : Badge "Premier Pas" apparaissait dans "Prochains défis" alors que déjà débloqué (1/1)
- **Cause** : API retournait UUID `ub.id` au lieu de `bd.id` 
- **Correction** : Endpoint `/users/me/badges` modifié pour retourner bons identifiants

#### **Tests de régression obligatoires :**
- [ ] **Badge "Premier Pas" ABSENT** de "Prochains défis" si déjà débloqué
- [ ] **API retourne IDs corrects** : `first-fail`, `daily-streak-3`, etc.
- [ ] **Statistiques correctes** : Affiche "5 badges débloqués" (pas "0")
- [ ] **Filtrage fonctionnel** : Seulement badges en progression affichés

#### **Commandes de validation :**
```bash
# 1. Vérifier structure API
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/users/me/badges | jq '.badges[0].id'
# ATTENDU: "first-fail" 
# ERREUR SI: "a1d22839-2b83-4cba-8068-1890f15d10d3"

# 2. Vérifier base de données
mysql -u root -p faildaily -e "
SELECT ub.badge_id, bd.name 
FROM user_badges ub 
JOIN badge_definitions bd ON ub.badge_id = bd.id 
WHERE ub.user_id = '9f92d99e-5f70-427e-aebd-68ca8b727bd4';"
# ATTENDU: badge_id = 'first-fail', name = 'Premier Pas'
```

### **12.2 Tests de non-régression**

#### **Scenarios à vérifier systématiquement :**
- [ ] **Nouveaux utilisateurs** : Badge "Premier Pas" attribué après 1er fail
- [ ] **Utilisateurs existants** : Badges historiques préservés
- [ ] **Interface cohérente** : Counts = réalité base de données
- [ ] **Performance maintenue** : Pas de régression temps réponse

---

## 📝 **RAPPORT DE TEST ATTENDU**

### **Structure du livrable final**

Votre testeur doit vous fournir un rapport comprenant :

#### **1. ✅ Executive Summary**
- [ ] Statut global : PASS/FAIL
- [ ] Nombre de tests exécutés vs réussis
- [ ] Bugs critiques identifiés
- [ ] Recommandation mise en production

#### **2. 📊 Métriques de performance**
```
- Temps de réponse API moyen : XX ms
- Temps de chargement frontend : XX s
- Taux d'erreur global : XX %
- Concurrent users supportés : XX
```

#### **3. 🐛 Bugs identifiés**
Pour chaque bug :
- **Sévérité** : Critique/Majeur/Mineur
- **Étapes reproduction** : Step-by-step
- **Comportement attendu vs observé**
- **Impact utilisateur**
- **Screenshots/logs**

#### **4. 💡 Suggestions d'amélioration**
- **UX/UI** : Améliorations interface
- **Performance** : Optimisations possibles  
- **Fonctionnalités** : Features manquantes
- **Sécurité** : Renforcements recommandés

#### **5. 🔒 Analyse sécurité**
- **Vulnérabilités détectées** : Avec niveau de risque
- **Tests de pénétration** : Résultats
- **Conformité** : RGPD, COPPA, etc.
- **Recommandations** : Actions prioritaires

#### **6. 📱 Compatibilité**
- **Navigateurs testés** : Chrome, Firefox, Safari, Edge
- **Devices** : Mobile iOS/Android, tablettes, desktop
- **Résolutions** : 320px à 1920px+
- **Performance** : Loading times par plateforme

#### **7. 🎯 Checklist de validation finale**
```
□ Toutes les fonctionnalités core opérationnelles
□ Système d'authentification sécurisé  
□ Badges et progressions cohérents
□ Performance dans les SLA
□ Sécurité validée
□ Compatible multi-navigateurs
□ Ready for production
```

---

## ⏱️ **PLANNING ET RESSOURCES**

### **Estimation temporelle**
- **Setup environnement** : 2-3 heures
- **Tests fonctionnels** : 8-10 heures  
- **Tests techniques** : 4-6 heures
- **Tests sécurité** : 2-3 heures
- **Rédaction rapport** : 2-3 heures
- **Total estimé** : **18-25 heures** pour un développeur expérimenté

### **Profil testeur recommandé**
- **Expérience** : 3+ ans développement web
- **Stack** : Node.js, Angular/Ionic, MySQL
- **Sécurité** : Notions OWASP, tests de pénétration
- **Methodologie** : TDD/BDD, outils de tests automatisés

### **Outils recommandés**
- **API Testing** : Postman, curl, Artillery
- **Frontend** : Chrome DevTools, Lighthouse
- **Database** : MySQL Workbench, phpMyAdmin
- **Security** : OWASP ZAP, Burp Suite (basic)
- **Performance** : Apache Bench, PageSpeed Insights

---

## 🐳 **ANNEXE : DOCKERISATION COMPLÈTE VALIDÉE**

### **Architecture Docker finale implémentée**

```
┌─────────────────────────────────────────────────────────────────┐
│                    RÉSEAU DOCKER: app-network                   │
├─────────────────┬───────────────────┬───────────────────────────┤
│   Traefik       │    Frontend       │         Backend           │
│   (Proxy)       │   Angular/Ionic   │      Express API          │
│                 │     + Nginx       │                           │
│ Port 8000 ────▶ │ Container:        │ Container:                │
│ Port 8090       │ faildaily_        │ faildaily_backend         │
│ (Dashboard)     │ frontend          │                           │
└─────────────────┴───────────────────┼───────────────────────────┤
                                      │        MySQL 8.0          │
                                      │    Container:             │
                                      │    faildaily_db           │
                                      │    Port 3308:3306         │
                                      └───────────────────────────┘
```

### **Images Docker créées et validées**

```bash
# Images construites avec succès :
docker images | grep docker
# docker-frontend    latest    7f3427280e47   (Angular + Nginx)
# docker-backend     latest    0b6b32e4a891   (Node.js Express)

# Bases MySQL et Traefik :
# mysql:8.0         d2fdd0af2893   (Base de données)
# traefik:v3.0      a208c74fd80a   (Proxy reverse)
```

### **Services opérationnels vérifiés**

```bash
# État des conteneurs (TOUS FONCTIONNELS) :
docker ps --filter "name=faildaily"

# CONTAINER ID   IMAGE             STATUS       PORTS                    NAMES
# 10118721ebb0   traefik:v3.0      Up          8000->80, 8090->8080    faildaily_traefik_local
# 932247f82cd0   docker-frontend   Up          80/tcp                   faildaily_frontend
# e4ec7fcbfc3b   docker-backend    Up          3000/tcp                 faildaily_backend
# 7cc7a41befb8   mysql:8.0         Up          3308->3306/tcp           faildaily_db
```

### **Tests de validation Docker effectués**

#### **✅ Frontend dockerisé validé :**
```bash
curl http://localhost:8000
# Retour : <!DOCTYPE html>...<title>FailDaily - Transforme tes échecs en victoires</title>
# Status : ✅ SUCCÈS - Frontend Angular servi par Nginx dans Docker
```

#### **✅ API Backend validée :**
```bash
curl http://localhost:8000/api/health
# Retour : {"status":"OK","timestamp":"2025-10-10T08:23:26.322Z","environment":"development"}
# Status : ✅ SUCCÈS - API accessible via Traefik
```

#### **✅ Dashboard Traefik validé :**
```bash
curl http://localhost:8090/dashboard/
# Retour : <!DOCTYPE html><html><head><title>Traefik</title>...
# Status : ✅ SUCCÈS - Interface Traefik accessible
```

#### **✅ Base de données Docker validée :**
```bash
docker exec -it faildaily_db mysql -u root -p@51008473@Alexia@ faildaily -e "SELECT COUNT(*) FROM users;"
# Retour : 60 utilisateurs
# Status : ✅ SUCCÈS - Données préservées et accessibles
```

### **Dockerfile Frontend optimisé**

```dockerfile
# Build Angular/Ionic
FROM node:20-alpine AS build
WORKDIR /app

# Copier les fichiers de package depuis le contexte racine
COPY frontend/package*.json ./
COPY frontend/ionic.config.json ./
COPY frontend/angular.json ./
COPY frontend/tsconfig*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY frontend/src/ ./src/
COPY frontend/.browserslistrc ./
COPY frontend/.editorconfig ./
COPY frontend/.eslintrc.json ./

# Build pour Docker (production sans optimisations CSS agressives)
ENV NODE_OPTIONS="--max_old_space_size=4096"
RUN npm run build:docker

# Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/www/ /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### **Configuration Nginx pour SPA Angular**

```nginx
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Configuration pour Angular SPA
    # Gérer les routes Angular (fallback vers index.html)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache pour les assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gestion spéciale pour les fichiers de service worker
    location /ngsw-worker.js {
        expires off;
        add_header Cache-Control "no-cache";
    }
    
    # Sécurité - masquer la version nginx
    server_tokens off;
    
    # Gestion des erreurs
    error_page 404 /index.html;
}
```

### **Avantages de la dockerisation complète**

#### **🔒 Sécurité et isolation :**
- ✅ **Isolation réseau** : Communication uniquement via le réseau Docker interne
- ✅ **Pas d'exposition directe** : Seuls les ports nécessaires exposés (8000, 8090, 3308)
- ✅ **Containers read-only** : Images immuables en production

#### **🚀 Performance et optimisation :**
- ✅ **Build optimisé** : Frontend compilé en mode production
- ✅ **Nginx performant** : Serveur web optimisé pour les assets statiques
- ✅ **Cache efficace** : Gestion automatique du cache des ressources

#### **🔧 Maintenance et déploiement :**
- ✅ **Reproductibilité** : Environnement identique partout
- ✅ **Scalabilité** : Possible d'ajouter plus d'instances facilement
- ✅ **Monitoring intégré** : Dashboard Traefik pour supervision

### **Instructions de déploiement finales**

```bash
# 1. Démarrage complet (commande unique)
cd FailDaily/docker && docker-compose up -d --build

# 2. Vérification santé des services
curl http://localhost:8000                    # Frontend
curl http://localhost:8000/api/health         # Backend API
curl http://localhost:8090/dashboard/         # Traefik

# 3. Monitoring conteneurs
docker ps --filter "name=faildaily"
docker-compose logs -f                        # Logs en temps réel

# 4. Arrêt propre
docker-compose down
```

---

## 🆘 **SUPPORT ET RESSOURCES**

### **Documentation technique**
- [`README.md`](./README.md) : Vue d'ensemble projet
- [`API_ENDPOINTS.md`](./API_ENDPOINTS.md) : Documentation API complète
- [`BADGES_GUIDE.md`](./BADGES_GUIDE.md) : Système badges détaillé
- [`AGENTS.md`](./AGENTS.md) : Guide développeur IA

### **Scripts utiles**
```bash
# Tests automatisés backend
cd backend-api && npm test

# Vérification base données
node scripts/checks/check-fails-structure.js

# Tests badges manqués  
node scripts/maintenance/fix-missing-badges.js

# Statistiques BDD
node scripts/stats/get-database-stats.js
```

### **Contacts support**
- **Issues GitHub** : [FailDaily Issues](https://github.com/Taaazzz-prog/FailDaily/issues)
- **Documentation** : Fichiers `/docs` du repository
- **Logs application** : `backend-api/logs/` et console navigateur

---

**📅 Date de création** : 10 octobre 2025  
**🔄 Version** : 1.0  
**👤 Auteur** : Équipe FailDaily

> **Note** : Ce guide doit être mis à jour à chaque version majeure de l'application.