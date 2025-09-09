# 📖 Guide Technique Complet - FailDaily

## 🏗️ **Architecture Globale**

### 🎯 **Vue d'Ensemble**
FailDaily est une application de partage d'échecs constructifs basée sur une architecture moderne monorepo avec Angular 20, Node.js 22, et MySQL 9.

```
📱 Frontend (Angular 20 + Ionic 8)
    ↕️ API REST
🚀 Backend (Node.js 22 + Express)
    ↕️ SQL Queries  
🗄️ Base de Données (MySQL 9.1)
    ↕️ Triggers & Procedures
🏆 Système de Badges Automatisé
```

---

## 🛠️ **Stack Technique Détaillée**

### 📱 **Frontend - Angular 20 + Ionic 8**
```typescript
// Technologies Principales
- Angular 20 (standalone components)
- Ionic 8 + Capacitor 7 (iOS/Android)
- TypeScript 5.0+, SCSS
- RxJS 7.8.0, Zone.js 0.15

// Librairies Clés
- @angular/* (core, forms, router, common)
- @ionic/angular (components UI)
- @capacitor/* (camera, notifications, filesystem)
- Fontsource (Caveat, Comfortaa, Kalam, Inter)
- Ionicons, Lodash, Moment.js

// Tests & Qualité
- Jasmine, Karma
- ESLint 9 + @angular-eslint 20
```

### 🚀 **Backend - Node.js 22 + Express**
```javascript
// Framework & Core
- Node.js 22.x + Express 4.21
- Architecture MVC RESTful
- Middleware: Helmet, CORS, Morgan

// Base de Données
- MySQL 9.1.0 (utf8mb4)
- mysql2 (connection pool)
- Migrations automatisées

// Sécurité & Auth
- jsonwebtoken (JWT)
- bcryptjs (hash passwords)  
- express-rate-limit (protection DDoS)
- helmet (headers sécurité)

// Fonctionnalités
- multer (upload images/avatars)
- uuid (génération IDs)
- dotenv (configuration)
- nodemailer (emails)

// Tests & Qualité
- Jest + Supertest
- ESLint configuration moderne
```

### 🗄️ **Base de Données - MySQL 9.1**
```sql
-- Architecture Relationnelle
CREATE DATABASE faildaily CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tables Principales (8)
users              -- Utilisateurs et profils
fails              -- Publications d'échecs  
comments           -- Commentaires sur fails
reactions          -- Réactions (courage, empathie, etc.)
badges             -- Badges attribués aux utilisateurs
badge_definitions  -- Définitions des badges  
notifications      -- Système de notifications
user_stats         -- Statistiques utilisateurs

-- Triggers Automatisés
- Attribution automatique badges
- Mise à jour statistiques
- Calcul niveaux utilisateur
- Nettoyage données obsolètes
```

---

## 🔧 **Configuration et Environnements**

### 🌍 **Environnements Supportés**

#### 🏠 **Développement Local**
```bash
# URLs
Frontend: http://localhost:8100 (Ionic serve)
Backend:  http://localhost:3000 (Node.js)
MySQL:    localhost:3307 (Docker) ou 3306 (local)

# Configuration
NODE_ENV=development
DB_HOST=localhost
JWT_SECRET=dev_secret_key
UPLOAD_PATH=./uploads
```

#### 🐳 **Docker Local**
```bash
# URLs  
Frontend: http://localhost:8080
Backend:  http://localhost:3000
MySQL:    localhost:3306 (container)

# Services
- faildaily_frontend (Nginx + Angular build)
- faildaily_backend (Node.js API)
- faildaily_db (MySQL 9.1)
```

#### 🌐 **Production OVH**
```bash
# URLs
Site:     https://faildaily.com
API:      https://api.faildaily.com  
PowerPoint: https://faildaily.com/powerpoint

# Infrastructure
- Traefik (reverse proxy + SSL automatique)
- Docker Compose
- Let's Encrypt (certificats SSL)
- MySQL persistant avec volumes
```

---

## 📡 **API REST - Endpoints Principaux**

### 🔐 **Authentification**
```javascript
// Inscription & Connexion  
POST /api/auth/register        // Créer compte
POST /api/auth/login          // Se connecter
GET  /api/auth/verify         // Vérifier token JWT
POST /api/auth/logout         // Se déconnecter

// Gestion Profil
GET  /api/auth/profile        // Profil utilisateur
PUT  /api/auth/profile        // Modifier profil  
PUT  /api/auth/password       // Changer mot de passe
POST /api/auth/password-reset // Reset mot de passe
```

### 📝 **Gestion des Fails**
```javascript
// CRUD Fails
GET    /api/fails             // Liste fails publics
POST   /api/fails             // Créer nouveau fail
GET    /api/fails/:id         // Détails d'un fail
PUT    /api/fails/:id         // Modifier fail (owner)
DELETE /api/fails/:id         // Supprimer fail (owner/admin)

// Interactions
POST   /api/fails/:id/reactions    // Ajouter réaction
DELETE /api/fails/:id/reactions    // Supprimer réaction
GET    /api/fails/:id/comments     // Commentaires
POST   /api/fails/:id/comments     // Ajouter commentaire
```

### 🏆 **Système de Badges**
```javascript
// Badges Utilisateur
GET /api/badges                    // Badges disponibles
GET /api/badges/user/:userId       // Badges d'un utilisateur
GET /api/badges/definitions        // Définitions badges

// Attribution Automatique (triggers MySQL)
- Badges courage (nb fails partagés)
- Badges empathie (nb réactions données)  
- Badges communauté (nb commentaires)
- Badges progression (connexions quotidiennes)
```

---

## 🏆 **Système de Badges Avancé**

### 📊 **Catégories et Progression**
```javascript
// 6 Catégories Principales
🎯 COURAGE      - Partage de fails (19 badges)
💝 EMPATHIE     - Réactions données (16 badges)  
💬 COMMUNAUTÉ   - Commentaires et interactions (16 badges)
🌟 PROGRESSION  - Activité et régularité (14 badges)
🏆 RÉUSSITES    - Objectifs atteints (rare)
🎁 ÉVÉNEMENTS   - Badges saisonniers/spéciaux

// Niveaux de Rareté
Common (bronze)    - 19 badges
Rare (argent)      - 16 badges
Epic (or)          - 16 badges  
Legendary (platine) - 14 badges
```

### 🔄 **Attribution Automatique**
```sql
-- Triggers MySQL pour attribution temps réel
DELIMITER //
CREATE TRIGGER update_badges_after_fail_insert
AFTER INSERT ON fails
FOR EACH ROW
BEGIN
    -- Attribution badges courage
    CALL assign_courage_badges(NEW.user_id);
    -- Mise à jour statistiques
    CALL update_user_stats(NEW.user_id);
END //
DELIMITER ;
```

---

## 🔒 **Sécurité et Protection**

### 🛡️ **Mesures de Sécurité Implémentées**
```javascript
// Protection DDoS et Rate Limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // 100 requêtes max
  message: 'Trop de requêtes, réessayez plus tard'
}));

// Headers de Sécurité (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// Authentification JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({error: 'Token manquant'});
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({error: 'Token invalide'});
    req.user = decoded;
    next();
  });
};
```

### 🔐 **Protection des Données**
```javascript
// Hashage Passwords (bcrypt)
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

// Validation Inputs (express-validator)
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({min: 8}).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('displayName').isLength({min: 2, max: 30}).trim().escape()
];

// Upload Sécurisé (multer)
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});
```

---

## 🧪 **Tests et Qualité**

### 📋 **Architecture des Tests**
```bash
backend-api/tests/
├── run-all-tests.js           # 🎯 Lanceur principal
├── 0_test-config.js           # Configuration globale
├── 1_database/                # Tests base de données
│   ├── 1.1_connection-test.js
│   └── 1.2_structure-test.js  
├── 2_auth/                    # Tests authentification
│   ├── 2.1_registration-test-simple.js
│   ├── 2.2_login-test.js
│   └── 2.3_jwt-verification-test.js
├── 3_fails/                   # Tests API fails
│   ├── 3.1_fail-creation-test.js
│   ├── 3.2_fail-retrieval-test.js
│   └── 3.3_comments-basic-test.js
└── 4_integration/             # Tests intégration
    └── 4.1_complete-integration-test.js
```

### 🎯 **Types de Tests**
```javascript
// Tests Unitaires (Jest)
describe('UserService', () => {
  test('should create user with valid data', async () => {
    const userData = { email: 'test@test.com', password: 'password123' };
    const user = await UserService.create(userData);
    expect(user).toHaveProperty('id');
    expect(user.email).toBe(userData.email);
  });
});

// Tests d'Intégration (Supertest)
describe('POST /api/auth/register', () => {
  test('should register new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@test.com', password: 'Password123!' })
      .expect(201);
    
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('token');
  });
});

// Tests E2E (Communication Frontend ↔ Backend)
// node test-frontend-backend-communication.js
```

---

## 🚀 **Déploiement et DevOps**

### 🐳 **Docker Multi-Stage**
```dockerfile
# Frontend Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80

# Backend Dockerfile  
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 📋 **Scripts de Déploiement**
```bash
# Développement Local
.\docker\start-local.ps1           # Lancement complet
.\docker\status.ps1                # Monitoring
.\docker\sync-from-ovh.ps1         # Sync données OVH

# Production OVH
./docker/production/install.sh     # Installation serveur
./docker/production/deploy.sh      # Déploiement standard  
./docker/production/deploy-traefik.sh  # Déploiement SSL

# Tests et Validation
node backend-api/tests/run-all-tests.js        # Tests backend
node test-frontend-backend-communication.js     # Tests intégration
```

---

## 📊 **Monitoring et Logs**

### 📈 **Métriques Applicatives**
```javascript
// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: require('./package.json').version,
    database: 'connected', // vérification DB
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// Logs Structurés (Morgan + Winston)
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});
```

---

## 🎯 **Bonnes Pratiques et Conventions**

### 📝 **Code Style**
- **TypeScript strict** : types obligatoires
- **ESLint** : configuration moderne
- **Prettier** : formatage automatique
- **Conventional Commits** : messages standardisés

### 🏗️ **Architecture**
- **Separation of Concerns** : services, controllers, models séparés
- **Dependency Injection** : Angular moderne avec `inject()`
- **Error Handling** : gestion d'erreurs centralisée
- **Configuration** : variables d'environnement

### 🔄 **Workflows**
- **Feature branches** : développement par feature
- **Pull Requests** : review obligatoire
- **Tests automatisés** : CI/CD avec GitHub Actions
- **Déploiement** : staging → production

---

*Guide technique mis à jour - Septembre 2025*
*Pour une application FailDaily moderne et sécurisée*
