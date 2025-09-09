# Structure Backend FailDaily

## Architecture Générale
- **Framework** : Express.js (Node.js)
- **Base de données** : MySQL avec pool de connexions
- **Authentification** : JWT (JSON Web Tokens)
- **Sécurité** : Helmet, CORS, Rate Limiting
- **Logging** : Morgan + système de logs personnalisé

## Structure des Dossiers

```
backend-api/
├── server.js                          # Point d'entrée principal
├── package.json                       # Dépendances et scripts
├── .env                               # Configuration environnement
├── eslint.config.mjs                 # Configuration ESLint
├── jest.config.cjs                   # Configuration Jest (tests)
└── src/
    ├── config/
    │   └── database.js                # Configuration MySQL + pool
    ├── middleware/
    │   └── auth.js                    # Middleware d'authentification JWT
    ├── controllers/
    │   ├── authController.js          # Authentification/inscription
    │   ├── failsController.js         # Gestion des fails
    │   ├── commentsController.js      # Gestion des commentaires
    │   ├── reactionsController.js     # Gestion des réactions
    │   ├── uploadController.js        # Upload de fichiers
    │   ├── registrationController.js  # Processus d'inscription
    │   ├── ageVerificationController.js # Vérification d'âge
    │   └── debugController.js         # Fonctions de debug
    └── routes/
        ├── auth.js                    # Routes d'authentification
        ├── fails.js                   # Routes des fails (legacy)
        ├── failsNew.js                # Routes des fails (nouvelle version)
        ├── users.js                   # Routes utilisateurs
        ├── badges.js                  # Routes des badges
        ├── reactions.js               # Routes des réactions
        ├── comments.js                # Routes des commentaires
        ├── upload.js                  # Routes d'upload
        ├── registration.js            # Routes d'inscription
        ├── ageVerification.js         # Routes de vérification d'âge
        └── logs.js                    # Routes des logs système
```

## Dépendances

### Dépendances de Production
```json
{
  "bcryptjs": "^3.0.2",               // Hachage des mots de passe
  "cors": "^2.8.5",                   // Gestion CORS
  "dotenv": "^17.2.1",                // Variables d'environnement
  "express": "^4.21.0",               // Framework web
  "express-rate-limit": "^8.0.1",     // Rate limiting
  "helmet": "^8.1.0",                 // Sécurité headers HTTP
  "jsonwebtoken": "^9.0.2",           // JWT tokens
  "morgan": "^1.10.1",                // Logger HTTP
  "multer": "^2.0.2",                 // Upload de fichiers
  "mysql2": "^3.14.3",                // Driver MySQL
  "node-fetch": "^3.3.2",             // Client HTTP
  "nodemon": "^3.1.10",               // Auto-reload development
  "uuid": "^11.1.0"                   // Génération d'UUID
}
```

### Dépendances de Développement
```json
{
  "eslint": "^9.16.0",                // Linter JavaScript
  "globals": "^14.0.0",               // Variables globales ESLint
  "jest": "^29.7.0",                  // Framework de tests
  "jest-environment-node": "^29.7.0", // Environnement Jest
  "supertest": "^6.3.4"               // Tests d'API
}
```

## Configuration Serveur (server.js)

### Middlewares Globaux
- **Helmet** : Sécurisation des headers HTTP
- **CORS** : Configuration multi-origine pour frontend
- **Rate Limiting** : Protection contre le spam
- **Morgan** : Logging des requêtes HTTP
- **Express.json()** : Parsing JSON
- **Express.static()** : Fichiers statiques

### Configuration CORS
```javascript
cors({
  origin: [
    'http://localhost:4200',  // Frontend dev server
    'http://localhost:8100',  // Ionic serve
    'http://localhost:8101',  // Ionic capacitor serve
    'http://localhost',       // Production
    process.env.CORS_ORIGIN
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
})
```

## API Endpoints

### Routes d'Authentification (/api/auth)
- `POST /register` - Inscription utilisateur
- `POST /login` - Connexion utilisateur
- `GET /verify` - Vérification token JWT
- `POST /logout` - Déconnexion
- `GET /check-email` - Vérifier disponibilité email
- `GET /profile` - Récupérer profil utilisateur
- `PUT /profile` - Mettre à jour profil
- `PUT /password` - Changer mot de passe
- `POST /password-reset` - Demande de reset

### Routes Fails (/api/fails)
- `GET /` - Liste des fails (pagination, filtres)
- `POST /` - Créer un nouveau fail
- `GET /:id` - Récupérer un fail spécifique
- `PUT /:id` - Modifier un fail
- `DELETE /:id` - Supprimer un fail
- `GET /search` - Rechercher des fails
- `GET /categories` - Catégories disponibles
- `GET /tags` - Tags populaires
- `GET /stats` - Statistiques des fails
- `GET /public` - Fails publics uniquement

### Routes Utilisateurs (/api/users)
- `GET /:userId/stats` - Statistiques utilisateur
- `GET /:userId/badges` - Badges de l'utilisateur
- `GET /:userId/badges/ids` - IDs des badges utilisateur

### Routes Badges (/api/badges)
- `GET /available` - Tous les badges disponibles
- `POST /check/:userId` - Vérifier et débloquer badges
- `GET /definitions` - Définitions des badges (admin)

### Routes Réactions (/api/fails)
- `POST /:id/reactions` - Ajouter/retirer réaction
- `GET /:id/reactions` - Récupérer réactions d'un fail

### Routes Commentaires (/api/fails)
- `GET /:id/comments` - Commentaires d'un fail
- `POST /:id/comments` - Ajouter commentaire
- `PUT /:id/comments/:commentId` - Modifier commentaire
- `DELETE /:id/comments/:commentId` - Supprimer commentaire

### Routes Upload (/api/upload)
- `POST /image` - Upload d'image

### Routes Inscription (/api/registration)
- `POST /complete` - Finaliser inscription
- `GET /status` - Statut inscription utilisateur

### Routes Vérification Âge (/api/age-verification)
- `POST /verify` - Vérifier âge utilisateur
- `PUT /update-birth-date` - Mettre à jour date naissance
- `GET /user-age` - Récupérer âge utilisateur
- `GET /statistics` - Statistiques d'âge
- `GET /coppa-compliance` - Vérification conformité COPPA

### Routes Logs (/api/logs)
- `GET /system` - Logs système
- `POST /` - Créer nouveau log
- `DELETE /cleanup` - Nettoyer anciens logs
- `POST /comprehensive` - Logs compréhensifs frontend
- `GET /user/:userId` - Logs d'un utilisateur
- `GET /errors` - Logs d'erreurs uniquement
- `GET /search` - Rechercher dans les logs

## Sécurité et Middleware

### Authentification JWT
```javascript
// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalide' });
    req.user = user;
    next();
  });
};
```

### Rate Limiting
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: 'Trop de requêtes, réessayez plus tard'
});
```

## Base de Données

### Configuration MySQL
```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  charset: 'utf8mb4'
});

const executeQuery = async (query, params = []) => {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(query, params);
    return results;
  } finally {
    connection.release();
  }
};
```

## Gestion d'Erreurs

### Middleware d'erreurs globales
```javascript
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  
  // Log l'erreur
  logSystemError(err, req);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erreur serveur interne' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

## Scripts Package.json
```json
{
  "start": "node server.js",           // Production
  "dev": "nodemon server.js",          // Développement
  "test": "jest --runInBand",          // Tests
  "lint": "eslint . --ext .js,.cjs,.mjs" // Linting
}
```

## Variables d'Environnement (.env)
```bash
# Serveur
PORT=3000
CORS_ORIGIN=http://localhost:8100

# JWT
JWT_SECRET=changeme-dev-secret-please-rotate
JWT_EXPIRES_IN=24h

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=faildaily

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Upload
UPLOAD_MAX_SIZE=5242880
```

## Tests (Jest)

### Configuration Jest
```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!src/**/*.test.js'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ]
};
```

## Fonctionnalités Clés

### Système de Badges
- 70 badges prédéfinis avec différentes raretés
- Vérification automatique des critères
- Déblocage automatique basé sur les actions utilisateur

### Gestion des Fails
- CRUD complet avec validation
- Système de réactions (laugh, courage, empathy, support)
- Commentaires avec modération
- Upload d'images

### Système de Logs
- Logs système complets
- Logs d'activité utilisateur
- Logs de réactions et commentaires
- Nettoyage automatique des anciens logs

### Sécurité
- Authentification JWT
- Rate limiting par IP
- Validation des données
- Protection CORS
- Headers de sécurité (Helmet)
