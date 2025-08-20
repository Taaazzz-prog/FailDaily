# TECHNICAL-GUIDE.md

# FailDaily - Guide Technique & Architecture

## 📋 **TABLE DES MATIÈRES**
1. [Architecture Globale](#architecture-globale)
2. [Services Angular](#services-angular)
3. [Base de Données MySQL](#base-de-données-mysql)
4. [API Backend](#api-backend)
5. [Configuration & Déploiement](#configuration--déploiement)
6. [Développement & Debug](#développement--debug)

---

## 🏗️ **ARCHITECTURE GLOBALE**

### **Diagramme de l'Architecture**
```
┌─────────────────────────┐    ┌─────────────────────────┐
│    Frontend Ionic       │    │    Backend Express      │
│  ┌─────────────────────┐│    │  ┌─────────────────────┐│
│  │   Angular Services  ││◄──►││   REST API Routes   ││
│  │   - HttpAuthService ││    ││   - /auth/*         ││
│  │   - MysqlService    ││    ││   - /users/*        ││
│  │   - BadgeService    ││    ││   - /badges/*       ││
│  │   - AdminService    ││    ││   - /admin/*        ││
│  └─────────────────────┘│    │  └─────────────────────┘│
│  ┌─────────────────────┐│    │  ┌─────────────────────┐│
│  │      Pages          ││    ││   Middleware         ││
│  │   - Auth/Register   ││    ││   - JWT Validation  ││
│  │   - Profile         ││    ││   - CORS Handler    ││
│  │   - Admin Dashboard ││    ││   - Error Handler   ││
│  └─────────────────────┘│    │  └─────────────────────┘│
└─────────────────────────┘    └─────────────────────────┘
             │                              │
             └──────────────┬───────────────┘
                           │
              ┌─────────────────────────┐
              │    MySQL Database       │
              │  ┌─────────────────────┐│
              │  │      Tables         ││
              │  │   - users           ││
              │  │   - badge_definitions││
              │  │   - user_badges     ││
              │  │   - fails           ││
              │  │   - reactions       ││
              │  │   - system_logs     ││
              │  └─────────────────────┘│
              └─────────────────────────┘
```

### **Flux de Données**
1. **User Interface** → Angular/Ionic Components
2. **State Management** → Angular Services (RxJS)
3. **HTTP Communication** → Express.js API
4. **Data Persistence** → MySQL Database
5. **Real-time Updates** → Event-driven architecture

---

## 🔧 **SERVICES ANGULAR**

### **Service d'Authentification** (`HttpAuthService`)
```typescript
// Responsabilités :
✅ Inscription/Connexion utilisateur
✅ Gestion des tokens JWT
✅ Refresh automatique des tokens
✅ Validation des sessions
✅ Logout sécurisé

// Méthodes principales :
- register(email, password, displayName)
- login(email, password)
- logout()
- getCurrentUser()
- refreshToken()
- isAuthenticated()
```

### **Service MySQL** (`MysqlService`)
```typescript
// Responsabilités :
✅ Communication avec l'API backend
✅ Gestion des profils utilisateur
✅ CRUD operations pour tous les modèles
✅ Gestion des badges utilisateur
✅ Système de courage points

// Endpoints principaux :
- signUp() / signIn() / signOut()
- getProfile() / updateProfile()
- getUserBadges() / unlockBadge()
- getUserStats() / testAddCouragePoints()
- getAllUsers() / updateUserRole()
```

### **Service de Badges** (`BadgeService`)
```typescript
// Responsabilités :
✅ Gestion du système de badges
✅ Déblocage automatique des badges
✅ Event-driven badge checking
✅ Cache local des badges utilisateur
✅ Statistiques de progression

// Fonctionnalités clés :
- checkAndUnlockBadges(userId)
- getAllAvailableBadges()
- getNextChallengesStats()
- forceCheckBadges()
- Badge checking avec cooldown (2s)
```

### **Service d'Administration** (`AdminMysqlService`)
```typescript
// Responsabilités :
✅ Interface d'administration complète
✅ Gestion des utilisateurs et rôles
✅ Modération de contenu
✅ Système de logs centralisé
✅ Métriques et analytics

// Capacités admin :
- getDashboardStats()
- getAllUsers() / banUser() / updateUserRole()
- getAllBadges() / createBadge() / awardBadgeToUser()
- getSystemLogs() / logSystemEvent()
- analyzeDatabaseIntegrity()
```

### **Services de Support**
```typescript
✅ ComprehensiveLoggerService  // Logging avancé
✅ DebugService               // Debug & monitoring
✅ ConsentService             // Gestion RGPD
✅ EventBusService            // Communication inter-services
✅ PushService                // Notifications push
✅ ModerationService          // Modération automatique
```

---

## 🗄️ **BASE DE DONNÉES MYSQL**

### **Schéma Principal**
```sql
-- Table des utilisateurs
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    displayName VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    couragePoints INT DEFAULT 0,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Définitions des badges
CREATE TABLE badge_definitions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(50),
    xpReward INT DEFAULT 0,
    requirements JSON,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attribution des badges aux utilisateurs
CREATE TABLE user_badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    badgeId VARCHAR(50) NOT NULL,
    unlockedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (badgeId) REFERENCES badge_definitions(id),
    UNIQUE KEY unique_user_badge (userId, badgeId)
);

-- Posts de fails
CREATE TABLE fails (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    isPublic BOOLEAN DEFAULT TRUE,
    imageUrl VARCHAR(500),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Réactions aux fails
CREATE TABLE reactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    failId INT NOT NULL,
    reactionType VARCHAR(50) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (failId) REFERENCES fails(id),
    UNIQUE KEY unique_user_reaction (userId, failId, reactionType)
);

-- Logs système
CREATE TABLE system_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    level ENUM('info', 'warning', 'error', 'debug') NOT NULL,
    service VARCHAR(100),
    message TEXT NOT NULL,
    userId INT NULL,
    metadata JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);
```

### **Index de Performance**
```sql
-- Index pour les requêtes fréquentes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_badges_userId ON user_badges(userId);
CREATE INDEX idx_fails_userId ON fails(userId);
CREATE INDEX idx_reactions_failId ON reactions(failId);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created ON system_logs(createdAt);
```

### **Triggers Automatisés**
```sql
-- Trigger pour mettre à jour les courage points
DELIMITER $$
CREATE TRIGGER update_courage_points_after_reaction
AFTER INSERT ON reactions
FOR EACH ROW
BEGIN
    UPDATE users 
    SET couragePoints = couragePoints + 2 
    WHERE id = (SELECT userId FROM fails WHERE id = NEW.failId);
END$$
DELIMITER ;
```

---

## 🌐 **API BACKEND**

### **Structure des Routes**
```javascript
// Routes d'authentification
POST   /api/auth/register     // Inscription
POST   /api/auth/login        // Connexion
POST   /api/auth/logout       // Déconnexion
POST   /api/auth/refresh      // Refresh token
POST   /api/auth/reset-password // Reset mot de passe

// Routes utilisateurs
GET    /api/users/profile     // Profil utilisateur
PUT    /api/users/profile     // Mise à jour profil
GET    /api/users/:id/stats   // Statistiques utilisateur
GET    /api/users/:id/badges  // Badges utilisateur
POST   /api/users/:id/badges/:badgeId/unlock // Débloquer badge

// Routes badges
GET    /api/badges/available  // Tous les badges disponibles
GET    /api/badges/definitions // Définitions badges (admin)
POST   /api/badges/definitions // Créer badge (admin)

// Routes fails
GET    /api/fails             // Liste des fails
POST   /api/fails             // Créer un fail
GET    /api/fails/:id         // Détail d'un fail
POST   /api/fails/:id/reactions // Réagir à un fail

// Routes administration
GET    /api/admin/dashboard   // Métriques admin
GET    /api/admin/users       // Gestion utilisateurs
POST   /api/admin/users/:id/ban // Bannir utilisateur
GET    /api/admin/logs        // Logs système
```

### **Middleware de Sécurité**
```javascript
// JWT Authentication
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Token requis' });
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Token invalide' });
        req.user = user;
        next();
    });
};

// Admin Authorization
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Accès administrateur requis' });
    }
    next();
};

// CORS Configuration
app.use(cors({
    origin: ['http://localhost:8100', 'http://localhost:4200'],
    credentials: true
}));
```

### **Gestion d'Erreurs**
```javascript
// Error Handler Global
app.use((error, req, res, next) => {
    console.error('❌ Erreur API:', error);
    
    // Log l'erreur en base
    logSystemError(error, req.user?.id);
    
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Erreur serveur interne',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});
```

---

## ⚙️ **CONFIGURATION & DÉPLOIEMENT**

### **Variables d'Environnement**
```bash
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=faildaily_dev
DB_USER=root
DB_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# API
API_PORT=3001
CORS_ORIGIN=http://localhost:8100

# Services externes
OPENAI_API_KEY=sk-proj-your-key
FIREBASE_SERVER_KEY=your-firebase-key

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### **Scripts de Déploiement**
```bash
# Installation des dépendances
npm install

# Build production
npm run build

# Démarrage serveur
npm start

# Tests
npm test

# Base de données
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed-data.sql
```

### **Déploiement Local**
```bash
# Backend (Express.js)
cd backend-api
npm install
npm start  # Lance sur localhost:3001

# Frontend (Angular/Ionic)
cd ../
npm install
npx ng build --prod  # Build de production dans www/
npx ng serve         # Dev server sur localhost:8100
```

---

## 🐛 **DÉVELOPPEMENT & DEBUG**

### **Outils de Debug Intégrés**
```typescript
// Service de Debug
✅ Console logs détaillés avec émojis
✅ Monitoring des performances
✅ Tracking des erreurs automatique
✅ Export des logs en JSON
✅ Interface de debug (/debug)

// Commandes de debug
console.log('🔐 Auth:', user);  // Authentification
console.log('🏆 Badge:', badge); // Système de badges  
console.log('📊 Stats:', stats); // Statistiques
console.log('❌ Error:', error); // Erreurs
```

### **Tests & Validation**
```bash
# Tests unitaires
ng test

# Tests end-to-end
ng e2e

# Linting
ng lint

# Audit sécurité
npm audit

# Performance
ng build --prod --source-map
```

### **Monitoring Production**
```javascript
// Health Check Endpoint
GET /api/health
{
    "status": "healthy",
    "database": "connected", 
    "uptime": "2h 34m",
    "version": "2.1.0",
    "environment": "production"
}

// Métriques temps réel
GET /api/metrics
{
    "activeUsers": 45,
    "apiCalls": 1247,
    "errorRate": "0.2%",
    "responseTime": "156ms"
}
```

---

## 📚 **RESSOURCES & DOCUMENTATION**

### **Documentation API**
- **Swagger UI** : `http://localhost:3001/api-docs`
- **Postman Collection** : `docs/FailDaily-API.postman_collection.json`

### **Guides de Développement**
- **Setup Local** : `docs/setup-guide.md`
- **Contribution** : `docs/contributing.md`
- **Conventions Code** : `docs/coding-standards.md`

### **Liens Utiles**
- **Angular Docs** : https://angular.io/docs
- **Ionic Docs** : https://ionicframework.com/docs
- **MySQL Docs** : https://dev.mysql.com/doc/

---

*Guide technique FailDaily - Version 2.1.0* 🛠️
