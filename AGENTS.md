# 🤖 AGENTS.md - Guide pour Agents IA de Développement

## 📋 **GUIDE DE RÉFÉRENCE FAILDAILY POUR AGENTS IA**

Ce document sert de référence complète pour les agents IA travaillant sur le projet FailDaily. Il contient toutes les informations essentielles sur l'architecture, les fonctionnalités et les bonnes pratiques.

---

## 🎯 **CONCEPT & VISION**

FailDaily est une **plateforme de partage d'échecs constructifs** qui transforme la vulnérabilité en force. Contrairement aux réseaux sociaux traditionnels, FailDaily encourage l'imperfection et l'apprentissage par l'échec.

### **Pr---

## 🔧 **CONFIGURATION ET IMPLÉMENTATION COMPLÈTES**

### **🔐 Configuration Docker (docker-compose.yaml)**
```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    container_name: faildaily_traefik_local
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
    ports:
      - "8000:80"      # Port 8000 pour éviter conflit WAMP
      - "8080:8080"    # Dashboard Traefik
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - app-network

  frontend:
    build:
      context: ../
      dockerfile: docker/frontend.Dockerfile
    container_name: faildaily_frontend
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`localhost`)"
      - "traefik.http.routers.frontend.entrypoints=web"
      - "traefik.http.services.frontend.loadbalancer.server.port=80"

  backend:
    build:
      context: ../backend-api
      dockerfile: ../docker/backend.Dockerfile
    container_name: faildaily_backend
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`localhost`) && PathPrefix(`/api`)"
      - "traefik.http.services.backend.loadbalancer.server.port=3000"
    env_file:
      - .env
```

### **🎯 Routes Angular Complètes (app.routes.ts)**
```typescript
export const routes: Routes = [
  { path: '', redirectTo: '/tabs/home', pathMatch: 'full' },
  { path: 'reset-password', loadComponent: () => import('./pages/reset-password/reset-password.page') },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    children: [
      { path: 'home', loadComponent: () => import('./home/home.page') }, // Accessible à tous
      { path: 'post-fail', loadComponent: () => import('./pages/post-fail/post-fail.page'), canActivate: [AuthGuard] },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile.page'), canActivate: [AuthGuard] },
      { path: 'badges', loadComponent: () => import('./pages/badges/badges.page'), canActivate: [AuthGuard] },
      { path: 'admin', loadComponent: () => import('./pages/admin/admin.page'), canActivate: [AuthGuard, AdminGuard] },
      { path: 'moderation', loadComponent: () => import('./pages/moderation/moderation.page'), canActivate: [AuthGuard, ModerationGuard] }
    ]
  },
  {
    path: 'auth',
    children: [
      { path: 'login', loadComponent: () => import('./auth/login/login.page'), canActivate: [NoAuthGuard] },
      { path: 'register', loadComponent: () => import('./auth/register/register.page'), canActivate: [NoAuthGuard] },
      { path: 'forgot-password', loadComponent: () => import('./auth/forgot-password/forgot-password.page') }
    ]
  },
  { path: 'user-profile/:userId', loadComponent: () => import('./pages/user-profile/user-profile.page'), canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/tabs/home' }
];
```

### **🏗️ Structure Contrôleur Fails (failsController.js)**
```javascript
class FailsController {
  
  // Mapping database → API
  static mapFailRow(fail) {
    return {
      id: fail.id,
      title: fail.title,
      description: fail.description,
      category: fail.category,
      imageUrl: fail.image_url,
      authorId: fail.user_id,
      authorName: fail.display_name,
      authorAvatar: fail.avatar_url,
      reactions: {
        courage: Number(fail.courage_count || 0),
        empathy: Number(fail.empathy_count || 0),
        laugh: Number(fail.laugh_count || 0),
        support: Number(fail.support_count || 0)
      },
      commentsCount: fail.comments_count,
      is_anonyme: !!fail.is_anonyme,
      createdAt: new Date(fail.created_at).toISOString(),
      updatedAt: new Date(fail.updated_at).toISOString(),
      userReaction: fail.user_reaction,
      moderationStatus: fail.moderation_status
    };
  }

  // Création fail avec validation
  static async createFail(req, res) {
    const { title, description, category = 'Général', is_anonyme = false, imageUrl = null } = req.body;
    const userId = req.user.id;

    // Validations
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Le titre est obligatoire' });
    }
    if (title.length > 200) {
      return res.status(400).json({ success: false, message: 'Le titre ne peut pas dépasser 200 caractères' });
    }
    if (description && description.length > 2000) {
      return res.status(400).json({ success: false, message: 'La description ne peut pas dépasser 2000 caractères' });
    }

    const { v4: uuidv4 } = require('uuid');
    const failId = uuidv4();

    // Insertion en base
    const failQuery = `
      INSERT INTO fails (id, user_id, title, description, category, is_anonyme, image_url, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    await executeQuery(failQuery, [failId, userId, title.trim(), description?.trim(), category, is_anonyme, imageUrl]);

    // Création automatique entrée modération 'under_review'
    const moderationQuery = `INSERT INTO fail_moderation (fail_id, status) VALUES (?, 'under_review')`;
    await executeQuery(moderationQuery, [failId]);
  }
}
```

### **🏆 Système Badges Complet (badges.js)**
```javascript
// GET /api/badges/available - Récupérer tous les badges
router.get('/available', authenticateToken, async (req, res) => {
  const badges = await executeQuery(`
    SELECT id, name, description, icon, category, rarity, requirement_type, requirement_value, created_at
    FROM badge_definitions 
    ORDER BY 
      CASE rarity WHEN 'common' THEN 1 WHEN 'rare' THEN 2 WHEN 'epic' THEN 3 WHEN 'legendary' THEN 4 END,
      category, requirement_value
  `);
  
  const mappedBadges = badges.map(badge => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    category: badge.category,
    rarity: badge.rarity,
    requirements: {
      type: badge.requirement_type,
      value: badge.requirement_value
    },
    isUnlocked: false // Calculé côté frontend
  }));
  
  res.json({ success: true, badges: mappedBadges });
});

// Script attribution rétroactive (fix-missing-badges.js)
async function fixMissingBadges() {
  const users = await executeQuery(`
    SELECT u.id, u.email, COUNT(f.id) as fail_count 
    FROM users u LEFT JOIN fails f ON u.id = f.user_id 
    GROUP BY u.id HAVING fail_count > 0
  `);
  
  const badgestoCheck = [
    { requirement_type: 'fails_count', requirement_value: 1 },
    { requirement_type: 'fails_count', requirement_value: 5 },
    { requirement_type: 'fails_count', requirement_value: 10 },
    { requirement_type: 'fails_count', requirement_value: 25 },
    { requirement_type: 'fails_count', requirement_value: 50 }
  ];
  
  for (const user of users) {
    for (const badgeCheck of badgestoCheck) {
      if (user.fail_count >= badgeCheck.requirement_value) {
        await awardBadgeIfNotExists(user.id, badgeCheck.requirement_type, badgeCheck.requirement_value);
      }
    }
  }
}
```

### **⚡ Guards de Sécurité Angular**
```typescript
// AuthGuard - Protection authentification
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      map(user => {
        if (user) return true;
        this.router.navigate(['/auth/login']);
        return false;
      })
    );
  }
}

// AdminGuard - Protection administration
@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      map(user => {
        if (user?.role === 'admin' || user?.role === 'super_admin') return true;
        this.router.navigate(['/tabs/home']);
        return false;
      })
    );
  }
}

// NoAuthGuard - Redirection si déjà connecté
@Injectable({ providedIn: 'root' })
export class NoAuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      map(user => {
        if (!user) return true;
        this.router.navigate(['/tabs/home']);
        return false;
      })
    );
  }
}
```

---

## 🗄️ **STRUCTURE BASE DE DONNÉES RÉELLE**ipes Fondamentaux**
- ✅ **Bienveillance uniquement** : Pas de réactions négatives
- ✅ **Apprentissage collectif** : Échecs comme opportunités
- ✅ **Gamification positive** : Badges et points de courage
- ✅ **Protection des données** : Conformité RGPD stricte
- ✅ **Modération IA** : Détection automatique de toxicité

---

## 🏗️ **ARCHITECTURE TECHNIQUE**

### **Stack Technologique**
```
Frontend : Angular 20 + Ionic 8 (PWA/Mobile)
Backend  : Node.js 22 + Express + MySQL 9
Auth     : JWT + bcrypt
Upload   : Multer + compression automatique
Deploy   : Docker + Traefik + SSL Let's Encrypt
```

### **Structure Projet**
```
FailDaily/
├── frontend/           # Angular/Ionic app (port 4200)
├── backend-api/        # Node.js API (port 3000)
├── docker/            # Configuration Docker
├── docs/              # Documentation
├── scripts/           # Scripts utilitaires
└── *.md              # Documentation principale
```

### **URLs de Développement**
- **Frontend** : http://localhost:4200
- **Backend API** : http://localhost:3000/api
- **Base de données** : localhost:3306 (MySQL)

---

## 🔐 **SYSTÈME D'AUTHENTIFICATION**

### **Endpoints Clés**
```typescript
POST /api/auth/register     // Inscription avec validation âge
POST /api/auth/login        // Connexion JWT
GET  /api/auth/verify       // Vérification token
GET  /api/auth/profile      // Profil utilisateur
PUT  /api/auth/profile      // Modification profil
POST /api/auth/password-reset // Reset mot de passe
```

### **Gestion des Mineurs (< 13 ans)**
- **Âge minimum** : 13 ans pour s'inscrire, en dessous de 13 ans inscription interdite
- **Autorisation parentale** : Requise pour les 13-17 ans
- **Consentement parental obligatoire** via email pour mineurs
- **Restrictions spéciales** sur certaines fonctionnalités
- **Conformité COPPA** : Variables US_COPPA_COMPLIANCE
- **Modération renforcée** automatique

### **Validation d'Âge**
```typescript
// Endpoints spécifiques
POST /api/age-verification/verify
PUT  /api/age-verification/update-birth-date
GET  /api/age-verification/user-age
```

---

## 💥 **SYSTÈME DE FAILS**

### **Création et Publication**
```typescript
// API Endpoints
POST /api/fails              // Créer un fail
GET  /api/fails/anonymes     // Liste avec anonymisation
GET  /api/fails/public       // (DÉPRÉCIÉ) Redirige vers /anonymes
GET  /api/fails/:id          // Détail fail
PUT  /api/fails/:id          // Modifier fail
DELETE /api/fails/:id        // Supprimer fail
```

### **Structure d'un Fail**
```typescript
interface Fail {
  id: string;           // UUID (char 36)
  user_id: string;      // Auteur (UUID char 36)
  title: string;        // Titre (max 255 chars)
  description: string;  // Description complète (text)
  category: string;     // varchar 100: professional|personal|social|academic|sport|technologie|humour
  image_url?: string;   // URL image optionnelle (text)
  is_anonyme: boolean;  // Publication anonyme (tinyint 1)
  comments_count: number; // Compteur commentaires (int)
  created_at: Date;     // Date création (timestamp)
  updated_at: Date;     // Date modification (timestamp)
}
```

### **Upload d'Images**
```typescript
POST /api/upload/image   // Upload avec compression
// Retour: { success: true, url: string, data: { imageUrl } }
// Limite: 5MB, formats: jpg, png, gif, webp
```

---

## 🛡️ **SYSTÈME DE MODÉRATION**

### **États de Modération**
```typescript
enum ModerationStatus {
  APPROVED = 'approved',        // Publié
  UNDER_REVIEW = 'under_review', // En révision
  REJECTED = 'rejected',        // Rejeté (masqué)
  HIDDEN = 'hidden'            // Masqué temporaire
}
```

### **Actions Admin**
```typescript
POST /api/admin/fails/:id/moderate
// Body: { action: 'approve'|'hide'|'under_review'|'delete' }

// Effets:
// approve -> Visible dans /api/fails/anonymes
// hide -> Masqué mais conservé
// under_review -> En attente validation
// delete -> Suppression définitive + anonymisation
```

### **Modération IA (OpenAI)**
- **Détection automatique** de contenu toxique
- **Analyse pré-publication** pour tous les fails (a mettre en place mais pas activer en mode dev)
- **Scores de confiance** pour aide à la décision
- **Escalade automatique** vers modération humaine

---

## 🏆 **SYSTÈME DE BADGES**

### **Architecture Badges**
```typescript
// 65+ badges dans 6 catégories
enum BadgeCategory {
  COURAGE = 'courage',           // Partage fails
  ENTRAIDE = 'entraide',         // Soutien communauté
  REGULARITE = 'regularite',     // Constance
  CREATIVITE = 'creativite',     // Innovation
  DEFIS = 'defis',              // Accomplissements
  PRESTIGE = 'prestige'         // Badges légendaires
}

enum BadgeRarity {
  COMMON = 'common',     // 19 badges
  RARE = 'rare',         // 16 badges  
  EPIC = 'epic',         // 16 badges
  LEGENDARY = 'legendary' // 14 badges
}
```

### **API Badges**
```typescript
GET  /api/badges/available           // Tous les badges
GET  /api/badges/definitions         // Définitions + critères
POST /api/badges/check-unlock/:userId // Vérifier déblocages
GET  /api/users/:id/badges          // Badges utilisateur

// Structure Badge Definition (table badge_definitions)
interface BadgeDefinition {
  id: string;              // VARCHAR 100 (ex: 'first-fail')
  name: string;            // VARCHAR 255 (ex: 'Premier Pas')
  description: string;     // TEXT
  icon: string;            // VARCHAR 100 (ex: 'footsteps-outline')
  category: string;        // VARCHAR 50 (ex: 'COURAGE')
  rarity: string;          // VARCHAR 50 (ex: 'common')
  requirement_type: string;// VARCHAR 50 (ex: 'fail_count')
  requirement_value: number;// INT (ex: 1)
  created_at: Date;        // TIMESTAMP
}

// Structure Badge Utilisateur (table badges)
interface UserBadge {
  id: string;              // CHAR 36 (UUID)
  user_id: string;         // CHAR 36 (UUID)
  name: string;            // VARCHAR 255
  description: string;     // TEXT
  icon: string;            // VARCHAR 100
  category: string;        // VARCHAR 50
  rarity: string;          // VARCHAR 50
  badge_type: string;      // VARCHAR 50
  unlocked_at: Date;       // TIMESTAMP
  created_at: Date;        // TIMESTAMP
}
```

### **Attribution Automatique**
- **Triggers MySQL** : Calcul en temps réel
- **Script rattrapage** : fix-missing-badges.js
- **Critères JSON** : Conditions configurables
- **Notifications push** : Alerte déblocage

---

## 💖 **INTERACTIONS POSITIVES**

### **Système de Réactions**
```typescript
// Types de réactions disponibles
enum ReactionType {
  COURAGE = 'courage',           // Cœur principal
  SUPPORT = 'support',           // Soutien
  INSPIRATION = 'inspiration',   // Inspirant
  SOLIDARITY = 'solidarity'      // Solidarité
}

// API Réactions
POST   /api/fails/:id/reactions  // Ajouter réaction
DELETE /api/fails/:id/reactions  // Supprimer réaction
GET    /api/fails/:id/reactions  // Lister réactions
```

### **Commentaires Bienveillants**
```typescript
POST   /api/fails/:id/comments           // Nouveau commentaire
GET    /api/fails/:id/comments           // Lister commentaires
PUT    /api/fails/:id/comments/:commentId // Modifier
DELETE /api/fails/:id/comments/:commentId // Supprimer
POST   /api/fails/:id/comments/:commentId/report // Signaler
```

---

## 👤 **GESTION DES PROFILS**

### **Données Utilisateur**
```typescript
// Table users (authentification)
interface User {
  id: string;              // CHAR 36 (UUID)
  email: string;           // VARCHAR 255 (unique)
  password_hash: string;   // VARCHAR 255 (bcrypt)
  role: UserRole;          // ENUM: user|moderator|admin|super_admin
  created_at: Date;        // TIMESTAMP
  updated_at: Date;        // TIMESTAMP
}

// Table profiles (données publiques)
interface Profile {
  id: string;              // CHAR 36 (UUID)
  user_id: string;         // CHAR 36 (UUID) - FK vers users
  display_name: string;    // VARCHAR 255 - Nom affiché
  username?: string;       // VARCHAR 100 - Nom d'utilisateur unique
  bio?: string;           // TEXT - Biographie
  avatar_url?: string;    // TEXT - Avatar personnalisé
  registration_completed: boolean; // TINYINT 1
  legal_consent: boolean;  // TINYINT 1 - Consentement RGPD
  age_verification: JSON;  // JSON - Données vérification âge
  preferences: JSON;       // JSON - Préférences utilisateur
  stats: JSON;            // JSON - Statistiques utilisateur
  created_at: Date;        // TIMESTAMP
  updated_at: Date;        // TIMESTAMP
}
```

### **Statistiques Utilisateur**
```typescript
// Stockées dans profiles.stats (JSON)
interface UserStats {
  failsCount: number;         // Fails publiés
  failsAnonymousCount: number; // Fails anonymes
  reactionsReceived: number;   // Réactions reçues
  reactionsGiven: number;     // Réactions données
  commentsCount: number;      // Commentaires postés
  badgesCount: number;        // Badges débloqués
  couragePoints: number;      // Points de courage
  loginDays: number;          // Jours de connexion
  streakDays: number;         // Série de jours consécutifs
}

// Stockées dans profiles.age_verification (JSON)
interface AgeVerification {
  isVerified: boolean;        // Âge vérifié
  ageCategory: string;        // child|teen|adult|senior
  isEligible: boolean;        // Éligible pour l'app
  isMinor: boolean;          // < 18 ans
  parentalConsent?: boolean;  // Consentement parental (13-17 ans)
  verifiedAt?: Date;         // Date vérification
}
```

---

## 👑 **INTERFACE D'ADMINISTRATION**

### **Rôles et Permissions**
```typescript
enum UserRole {
  USER = 'user',               // Utilisateur standard
  MODERATOR = 'moderator',     // Modérateur contenu
  ADMIN = 'admin',             // Admin complet
  SUPER_ADMIN = 'super_admin'  // Super admin système
}
```

### **Dashboard Admin**
```typescript
GET /api/admin/dashboard     // Métriques globales
GET /api/admin/users         // Gestion utilisateurs
GET /api/admin/moderation    // Queue modération
POST /api/admin/badges       // Gestion badges
GET /api/logs/system         // Logs système
```

### **Actions Administratives**
- **Gestion utilisateurs** : Modification profils, rôles, sanctions
- **Modération contenu** : Validation, masquage, suppression
- **Configuration badges** : Création, modification critères
- **Monitoring système** : Logs, métriques, alertes

---

## 🔔 **SYSTÈME DE NOTIFICATIONS**

### **Types de Notifications**
```typescript
enum NotificationType {
  BADGE_UNLOCKED = 'badge_unlocked',     // Badge débloqué
  REACTION_RECEIVED = 'reaction_received', // Réaction reçue
  COMMENT_RECEIVED = 'comment_received',  // Nouveau commentaire
  DAILY_REMINDER = 'daily_reminder',     // Rappel quotidien
  MODERATION_ACTION = 'moderation_action' // Action modération
}
```

### **Configuration Push**
- **Horaires personnalisables** : 18h-22h par défaut
- **Firebase integration** : Pour notifications mobile
- **Préférences utilisateur** : Activation/désactivation par type
- **Rate limiting** : Éviter spam notifications

---

## 📧 **SYSTÈME D'EMAILS**

### **Configuration SMTP OVH**
```env
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contact@faildaily.com
SMTP_PASS=********
SMTP_FROM=FailDaily <contact@faildaily.com>
APP_WEB_URL=https://faildaily.com
```

### **Types d'Emails**
- **Vérification inscription** : Token unique avec expiration
- **Consentement parental** : Pour mineurs 13-17 ans
- **Reset mot de passe** : Token sécurisé temporaire
- **Digest hebdomadaire** : Résumé d'activité
- **Alertes modération** : Notifications admins

---

## 🛠️ **DÉVELOPPEMENT ET DÉPLOIEMENT**

### **Commandes Essentielles**
```bash
# Développement local
cd backend-api && npm start     # Backend (port 3000)
cd frontend && ionic serve      # Frontend (port 4200)

# Docker
docker-compose up -d            # Environnement complet
./docker/start-local.ps1        # Script Windows

# Tests
npm run test:backend            # Tests API
npm run test:frontend           # Tests Angular
```

### **Variables d'Environnement Critiques**
```env
# Backend (.env dans backend-api/) - DONNÉES RÉELLES
DB_HOST=localhost
DB_PORT=3306
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
SMTP_PASS=[mot_de_passe_smtp_ovh]
SMTP_FROM=FailDaily <contact@faildaily.com>
APP_WEB_URL=https://faildaily.com

# OpenAI Modération (à configurer)
OPENAI_API_KEY=[votre_clé_openai]
OPENAI_MODEL=gpt-3.5-turbo

# Upload Configuration
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,gif,webp
```

```typescript
// Frontend (environment.ts) - CONFIGURATION COMPLÈTE
export const environment = {
  production: true,
  
  // Base de données
  database: {
    host: 'localhost',
    port: 3306,
    name: 'faildaily',
    charset: 'utf8mb4'
  },

  // Firebase (notifications push)
  firebase: {
    apiKey: "AIzaSyB5dGWJ3tZcUm5kO8rN6vX2pL4qR9wA3sE",
    authDomain: "faildaily-prod.firebaseapp.com", 
    projectId: "faildaily-prod",
    storageBucket: "faildaily-prod.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcd1234efgh5678ijklmn"
  },

  // APIs
  api: {
    baseUrl: 'http://localhost:3000/api',
    moderationUrl: 'https://api.openai.com/v1',
    uploadMaxSize: 3 * 1024 * 1024, // 3MB
    imageQuality: 75,
    timeout: 30000,
    retryAttempts: 3
  },

  // Authentification JWT
  auth: {
    tokenKey: 'auth_token',
    userKey: 'current_user', 
    expiresIn: '7d',
    refreshThreshold: 3600
  },

  // Configuration app
  app: {
    name: 'FailDaily',
    version: '2.0.0-mysql',
    debugMode: false,
    maxFailsPerDay: 3,
    courageHeartCooldown: 5000,
    anonymousMode: false,
    locationEnabled: true,
    cacheEnabled: true,
    offlineMode: true
  },

  // Badges et points
  badges: {
    firstFailPoints: 10,
    dailyStreakPoints: 5, 
    courageHeartPoints: 2,
    communityHelpPoints: 15,
    maxDailyPoints: 50,
    pointsMultiplier: 1.5
  }
};
```

### **Rate Limiting Important**
```javascript
// server.js - Configuration réelle avec mots de passe
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,
  message: { 
    error: 'Trop de requêtes, veuillez réessayer plus tard', 
    code: 'RATE_LIMIT_EXCEEDED' 
  }
});

// Debouncing Frontend (fail.service.ts)
class FailService {
  private isLoading = false;
  private lastLoadTime = 0;
  private readonly LOAD_DEBOUNCE_MS = 2000; // 2 secondes entre chargements

  async loadFails() {
    const now = Date.now();
    if (this.isLoading || (now - this.lastLoadTime) < this.LOAD_DEBOUNCE_MS) {
      console.log('FailService: Chargement ignoré (debounce)');
      return;
    }
    
    this.isLoading = true;
    this.lastLoadTime = now;
    // ... logique de chargement
    this.isLoading = false;
  }
}
```

---

## 🔍 **DEBUGGING ET MAINTENANCE**

### **Services de Debug**
```typescript
// Frontend
DebugService              // Outils développement
ComprehensiveLoggerService // Logging avancé

// Backend
GET /api/health          // Health check
GET /api/info           // Infos système
```

### **Logs Importants**
- **Authentification** : Connexions, échecs, tokens
- **Modération** : Actions admin, IA, signalements
- **Uploads** : Fichiers, tailles, erreurs
- **Base de données** : Requêtes lentes, erreurs connexion

### **Flux de Modération (Fails)**
- Création d’un fail: visible par défaut (aucun enregistrement dans `fail_moderation`).
- Signalements utilisateurs: endpoint `POST /api/fails/:id/report` incrémente `fail_reports` (1 par user). Au-delà du seuil `moderation.failReportThreshold` (config `app_config`), le fail est auto‑masqué (`fail_moderation.status='hidden'`).
- Modération admin: `PUT /api/admin/fails/:id/moderation { status }` accepte `approved | hidden | under_review | rejected`.
  - `approved`: le fail redevient visible.
  - `hidden`: masqué (soit auto, soit manuel).
  - `under_review`: visible mais marqué en examen (optionnel).
  - `rejected`: refus final, masqué.
- Règle de visibilité backend (liste/détail): visibles si `status IS NULL` ou `status NOT IN ('hidden','rejected')`.

### **Nommage endpoints Fails**
- `GET /api/fails/anonymes` remplace l’ancien `.../public` (qui reste alias déprécié). L’anonymisation (pseudo/avatar) dépend de `is_anonyme`.

### **Scripts de Maintenance**
```bash
# Backend
fix-missing-badges.js         # Corriger badges manqués
cleanup-orphans.sql          # Nettoyer données orphelines
debug-badge-definitions.js   # Vérifier badges

# Base de données
check-fails-structure.js     # Vérifier intégrité fails
get-database-stats.js       # Statistiques BDD
```

---

## 🧪 **TESTS ET PATTERNS DE DÉVELOPPEMENT**

### **🔬 Structure Tests Backend (40+ fichiers)**
```javascript
// Structure des tests backend-api/tests/
├── 1_database/
│   ├── 1.1_connection-test.js       // Connexion MySQL
│   └── 1.2_structure-test.js        // Vérification schéma
├── 2_auth/
│   ├── 2.1_register-test.js         // Inscription
│   ├── 2.2_login-test.js            // Connexion
│   └── 2.3_profile-test.js          // Gestion profil
├── 3_fails/
│   ├── 3.1_create-fail-test.js      // Création fails
│   ├── 3.2_get-fails-test.js        // Récupération
│   ├── 3.3_reactions-test.js        // Réactions
│   └── 3.4_comments-like-report-test.js // Commentaires
├── 4_integration/
│   └── 4.1_complete-integration-test.js // Tests E2E
└── 5_user_journey.test.js            // Parcours utilisateur

// Pattern de test avec debouncing
describe('FailService Debouncing', () => {
  it('should prevent rapid successive calls', async () => {
    const service = new FailService();
    const promise1 = service.loadFails();
    const promise2 = service.loadFails(); // Immédiat (ignoré)
    
    expect(promise2).toBeUndefined();
    expect(service.isLoading).toBe(true);
  });
  
  it('should handle 429 rate limiting gracefully', async () => {
    spyOn(httpClient, 'get').and.returnValue(throwError({ status: 429 }));
    const result = await service.loadFails();
    expect(result).toEqual({ success: false, error: 'Rate limit exceeded' });
  });
});
```

### **🎨 Patterns Frontend Angular/Ionic**
```typescript
// Service Pattern avec RxJS et debouncing (fail.service.ts)
@Injectable({ providedIn: 'root' })
export class FailService {
  private failsSubject = new BehaviorSubject<Fail[]>([]);
  public fails$ = this.failsSubject.asObservable();
  private isLoading = false;
  private lastLoadTime = 0;
  private readonly LOAD_DEBOUNCE_MS = 2000;

  constructor(
    private mysqlService: MysqlService,
    private authService: AuthService,
    private eventBus: EventBusService,
    private logger: ComprehensiveLoggerService
  ) {
    // Auto-chargement sur authentification
    this.authService.currentUser$.subscribe(user => {
      if (user) this.loadFails();
      else this.failsSubject.next([]);
    });

    // Écoute événements réactions
    this.eventBus.on(AppEvents.REACTION_UPDATED).subscribe(payload => {
      this.updateFailReaction(payload.failId, payload.type, payload.count);
    });
  }

  async loadFails(): Promise<void> {
    const now = Date.now();
    if (this.isLoading || (now - this.lastLoadTime) < this.LOAD_DEBOUNCE_MS) {
      console.log('FailService: Chargement ignoré (debounce)');
      return;
    }

    this.isLoading = true;
    this.lastLoadTime = now;

    try {
      const fails = await this.mysqlService.getAnonymizedFails();
      this.failsSubject.next(fails);
    } catch (error) {
      this.logger.error('Erreur chargement fails:', error);
    } finally {
      this.isLoading = false;
    }
  }
}

// Component Pattern avec lifecycle Ionic (home.page.ts)
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class HomePage implements OnInit {
  fails: Fail[] = [];
  isAuthenticated = false;

  constructor(
    private failService: FailService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Éviter double chargement - observables seulement
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
    });

    this.failService.fails$.subscribe(fails => {
      this.fails = fails;
    });
  }

  ionViewWillEnter() {
    // Rechargement à l'entrée de page (avec debouncing)
    if (this.isAuthenticated) {
      this.failService.loadFails();
    }
  }

  navigateToPostFail() {
    if (this.isAuthenticated) {
      this.router.navigate(['/tabs/post-fail']);
    } else {
      this.router.navigate(['/auth/register']);
    }
  }
}
```

### **🔒 Patterns Sécurité et Validation**
```typescript
// Validation côté backend avec Joi
const Joi = require('joi');

const failValidationSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(2000).allow(''),
  category: Joi.string().valid('professional', 'personal', 'social', 'academic', 'sport', 'technologie', 'humour').required(),
  is_anonyme: Joi.boolean().default(false),
  imageUrl: Joi.string().uri().allow(null)
});

// Middleware validation
const validateFail = (req, res, next) => {
  const { error } = failValidationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      details: error.details[0].message
    });
  }
  next();
};

// Authentification JWT avec refresh
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token d\'accès requis' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token expiré',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(403).json({ 
        success: false, 
        message: 'Token invalide' 
      });
    }
    req.user = user;
    next();
  });
};
```

### **🏃‍♂️ Workflow de Développement**
```powershell
# Démarrage développement local
# 1. Backend
cd "d:/Web API/FailDaily/backend-api"
npm install
npm run dev                 # Nodemon sur port 3000

# 2. Frontend  
cd "d:/Web API/FailDaily/frontend"
npm install
ionic serve                 # Port 8100

# 3. Tests complets
npm run test:all           # 40+ tests backend + frontend

# 4. Docker production
cd "d:/Web API/FailDaily/docker"
docker-compose up -d       # Traefik + MySQL + services

# Commandes utiles
node debug-badge-definitions.js  # Vérifier badges
node check-fails-structure.js    # Structure BDD
node get-real-stats.js           # Statistiques
```

---

## ⚠️ **BONNES PRATIQUES POUR AGENTS IA**

### **🚨 Règles de Sécurité**
1. **JAMAIS** exposer de tokens JWT en logs
2. **TOUJOURS** valider l'âge avant actions sensibles
3. **OBLIGATOIRE** vérifier rôles pour actions admin
4. **ESSENTIEL** respecter rate limiting en développement

### **📝 Standards de Code**
1. **TypeScript strict** : Types explicites partout
2. **Gestion d'erreurs** : try/catch avec logs détaillés
3. **Validation entrées** : Joi/class-validator obligatoire
4. **Tests unitaires** : Couverture minimum 80%

### **🔧 Maintenance Courante**
1. **Vérifier badges manqués** : Script fix-missing-badges.js
2. **Nettoyer uploads** : Supprimer fichiers orphelins
3. **Monitorer logs** : Erreurs récurrentes à corriger
4. **Tester modération IA** : Vérifier fonctionnement OpenAI

### **🚀 Déploiement**
1. **Tests complets** : Backend + Frontend + E2E
2. **Migration BDD** : Scripts SQL vérifiés
3. **Variables env** : Production vs développement
4. **Monitoring** : Logs et métriques activés

---

## 📊 **MÉTRIQUES ET OBJECTIFS**

### **KPIs Techniques**
- **API Response Time** : < 200ms (95% requests)
- **Frontend Load Time** : < 2s (first visit)
- **Database Queries** : < 100ms (average)
- **Error Rate** : < 1% (all endpoints)

### **KPIs Business**
- **User Engagement** : 80%+ badge interaction
- **Content Positivity** : 90%+ positive reactions
- **Moderation Accuracy** : 95%+ correct classifications
- **Community Growth** : 100+ active users (phase 1)

---

## �️ **STRUCTURE BASE DE DONNÉES RÉELLE**

### **Tables Principales (faildaily.sql)**
```sql
-- Table des utilisateurs (authentification)
users: id, email, password_hash, role, created_at, updated_at

-- Table des profils (données publiques)
profiles: id, user_id, display_name, username, bio, avatar_url, 
          registration_completed, legal_consent, age_verification (JSON),
          preferences (JSON), stats (JSON), created_at, updated_at

-- Table des fails
fails: id, user_id, title, description, category, image_url, 
       is_anonyme, comments_count, created_at, updated_at

-- Table des commentaires
comments: id, fail_id, user_id, content, is_encouragement, 
          created_at, updated_at

-- Table des réactions (vers fails)
fail_reactions: id, fail_id, user_id, type, created_at

-- Table des badges débloqués
badges: id, user_id, name, description, icon, category, rarity, 
        badge_type, unlocked_at, created_at

-- Table des définitions de badges
badge_definitions: id, name, description, icon, category, rarity,
                   requirement_type, requirement_value, created_at

-- Table de modération des fails
fail_moderation: fail_id, status (under_review|hidden|approved),
                 updated_at, created_at

-- Table de modération des commentaires  
comment_moderation: comment_id, status (under_review|hidden|approved),
                    updated_at, created_at

-- Table des logs d'activité
activity_logs: id, event_type, event_category, action, title, description,
               message, user_id, target_user_id, user_email, user_display_name,
               user_role, resource_type, resource_id, payload (JSON),
               details (JSON), old_values (JSON), new_values (JSON),
               ip_address, user_agent, session_id, correlation_id,
               success, error_code, error_message, created_at

-- Table de configuration de l'app
app_config: id, key, value (JSON), description, created_at, updated_at
```

### **Enums et Contraintes Importantes**
```sql
-- Status de modération
ENUM('under_review', 'hidden', 'approved')

-- Rôles utilisateur  
ENUM('user', 'moderator', 'admin', 'super_admin')

-- Types de réactions
VARCHAR(50): 'courage', 'support', 'inspiration', 'solidarity'

-- Catégories de badges
VARCHAR(50): 'COURAGE', 'ENTRAIDE', 'REGULARITE', 'CREATIVITE', 'DEFIS', 'PRESTIGE'

-- Rareté des badges
VARCHAR(50): 'common', 'rare', 'epic', 'legendary'

-- Catégories de fails
VARCHAR(100): professional, personal, social, academic, sport, technologie, humour
```

### **Triggers et Automatisations MySQL**
```sql
-- Trigger attribution badges automatique
DELIMITER $$
CREATE TRIGGER badge_check_after_fail_insert
AFTER INSERT ON fails FOR EACH ROW
BEGIN
  DECLARE user_fail_count INT DEFAULT 0;
  
  -- Compter les fails de l'utilisateur
  SELECT COUNT(*) INTO user_fail_count FROM fails WHERE user_id = NEW.user_id;
  
  -- Vérifier et attribuer le badge "Premier Pas" (1 fail)
  IF user_fail_count = 1 THEN
    INSERT IGNORE INTO badges (id, user_id, name, description, icon, category, rarity, badge_type, unlocked_at)
    SELECT UUID(), NEW.user_id, 'Premier Pas', 'Félicitations pour votre premier fail partagé !', 
           'footsteps-outline', 'COURAGE', 'common', 'first-fail', NOW()
    FROM badge_definitions WHERE id = 'first-fail';
  END IF;
  
  -- Badge "Apprenti" (5 fails)
  IF user_fail_count = 5 THEN
    INSERT IGNORE INTO badges (id, user_id, name, description, icon, category, rarity, badge_type, unlocked_at)
    SELECT UUID(), NEW.user_id, name, description, icon, category, rarity, id, NOW()
    FROM badge_definitions WHERE id = 'fail-master-5';
  END IF;
  
  -- Badge "Collectionneur" (10 fails)
  IF user_fail_count = 10 THEN
    INSERT IGNORE INTO badges (id, user_id, name, description, icon, category, rarity, badge_type, unlocked_at)
    SELECT UUID(), NEW.user_id, name, description, icon, category, rarity, id, NOW()
    FROM badge_definitions WHERE id = 'fail-master-10';
  END IF;
  
  -- Et ainsi de suite pour 25, 50, 100...
END$$
DELIMITER ;

-- Trigger mise à jour compteur commentaires
DELIMITER $$
CREATE TRIGGER update_comments_count_after_insert
AFTER INSERT ON comments FOR EACH ROW
BEGIN
  UPDATE fails SET comments_count = comments_count + 1 WHERE id = NEW.fail_id;
END$$

CREATE TRIGGER update_comments_count_after_delete
AFTER DELETE ON comments FOR EACH ROW
BEGIN
  UPDATE fails SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.fail_id;
END$$
DELIMITER ;

-- Trigger logs automatiques
DELIMITER $$
CREATE TRIGGER log_fail_creation
AFTER INSERT ON fails FOR EACH ROW
BEGIN
  INSERT INTO activity_logs (
    id, event_type, action, message, user_id, resource_type, resource_id, 
    payload, created_at
  ) VALUES (
    UUID(), 'fail_creation', 'create', 'Nouveau fail créé', NEW.user_id, 
    'fail', NEW.id, JSON_OBJECT('title', NEW.title, 'category', NEW.category, 'is_anonyme', NEW.is_anonyme), 
    NOW()
  );
END$$
DELIMITER ;
```

### **🔄 Scripts de Maintenance Automatique**
```bash
# fix-missing-badges.js - Attribution rétroactive
node fix-missing-badges.js

# cleanup-orphans.sql - Nettoyage données orphelines  
mysql -u root -p@51008473@Alexia@ faildaily < cleanup-orphans.sql

# debug-badge-definitions.js - Vérification badges
node debug-badge-definitions.js

# get-database-stats.js - Statistiques complètes
node get-database-stats.js

# Migration automatique
node migrations/add-fails-count.js
```

### **🚀 Commandes de Déploiement Complètes**
```powershell
# Démarrage développement local
cd backend-api && npm start                    # Backend port 3000
cd frontend && ionic serve                     # Frontend port 4200

# Docker complet avec Traefik
cd docker && docker-compose up -d             # Traefik port 8000, Dashboard 8080
./docker/start-local.ps1                      # Script Windows automatisé

# Tests complets
cd backend-api && npm test                    # 40+ fichiers de test
cd frontend && ng test                        # Tests Angular/Ionic
npm run test:e2e                             # Tests end-to-end

# Production
docker-compose -f docker-compose.ssl-production.yml up -d
```

### **Index de Performance**
```sql
-- Index sur les tables critiques
idx_fails_user_id, idx_fails_created_at
idx_comments_fail_id, idx_comments_user_id  
idx_badges_user_id
idx_activity_user_id, idx_activity_created_at
idx_badge_definitions_category, idx_badge_definitions_rarity
```

---

## �🔗 **LIENS ET RÉFÉRENCES**

### **Documentation Complète**
- `README.md` : Vue d'ensemble et démarrage rapide
- `API_ENDPOINTS.md` : Documentation complète API
- `BADGES_GUIDE.md` : Système de badges détaillé
- `TECHNICAL_GUIDE.md` : Guide technique approfondi
- `ENVIRONMENT_SPECS.md` : Configuration environnements

### **Scripts et Outils**
- `SCRIPTS_GUIDE.md` : Guide des scripts disponibles
- `TEST_PLAN_MANUEL.md` : Plan de tests manuels
- `docs/OVH_EMAIL_SMTP.md` : Configuration emails

---

**🤖 Ce guide doit être mis à jour à chaque modification majeure de l'architecture ou des fonctionnalités. Les agents IA doivent s'y référer systématiquement avant toute intervention sur le code.**

---

*FailDaily - Transformons nos échecs en succès collectifs* 🌟
