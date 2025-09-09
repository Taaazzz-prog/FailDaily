# Guide Technique FailDaily API

## 📋 Vue d'ensemble

FailDaily est une API de gestion d'échecs quotidiens utilisant une architecture moderne :
- **Frontend** : Angular 20 + Ionic 8
- **Backend** : Node.js 22 + Express
- **Base de données** : MySQL 9.1
- **Déploiement** : Docker + Docker Compose

## 🏗️ Architecture du projet

```
FailDaily/
├── frontend/           # Application Angular + Ionic
├── backend-api/        # API Node.js + Express
├── docker/            # Configuration Docker
├── devops/            # Scripts CI/CD
├── docs/              # Documentation
└── scripts/           # Scripts utilitaires
```

## 🔧 Configuration de l'environnement

### Variables d'environnement (.env)
```bash
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=faildaily
DB_USER=faildaily_user
DB_PASSWORD=secure_password

# API
API_PORT=3000
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:4200

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5MB
```

### Commandes essentielles
```bash
# Démarrage local
docker-compose up -d

# Tests
npm run test

# Build production
docker-compose -f docker-compose.ssl-production.yml up -d
```

## 🗄️ Structure de la base de données

### Tables principales

#### users
- `id` (UUID, PRIMARY KEY)
- `username` (VARCHAR(50), UNIQUE)
- `email` (VARCHAR(255), UNIQUE)
- `password_hash` (VARCHAR(255))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### fails
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY)
- `title` (VARCHAR(255))
- `description` (TEXT)
- `fail_date` (DATE)
- `category` (ENUM)
- `severity` (ENUM)
- `created_at` (TIMESTAMP)

#### badges
- `id` (UUID, PRIMARY KEY)
- `name` (VARCHAR(100))
- `description` (TEXT)
- `icon` (VARCHAR(255))
- `criteria` (JSON)
- `points` (INT)

#### user_badges
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY)
- `badge_id` (UUID, FOREIGN KEY)
- `earned_at` (TIMESTAMP)

## 🔍 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/profile` - Profil utilisateur

### Gestion des échecs
- `GET /api/fails` - Liste des échecs
- `POST /api/fails` - Créer un échec
- `GET /api/fails/:id` - Détail d'un échec
- `PUT /api/fails/:id` - Modifier un échec
- `DELETE /api/fails/:id` - Supprimer un échec

### Système de badges
- `GET /api/badges` - Liste des badges
- `GET /api/badges/user/:userId` - Badges d'un utilisateur
- `POST /api/badges/check/:userId` - Vérifier nouveaux badges

### Statistiques
- `GET /api/stats/user/:userId` - Statistiques utilisateur
- `GET /api/stats/global` - Statistiques globales

## 🚀 Déploiement

### Environnement local
```bash
# Cloner le projet
git clone [repo-url]
cd FailDaily

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Démarrer avec Docker
docker-compose up -d

# Vérifier le statut
docker ps
```

### Production (OVH)
```bash
# Build et déploiement
./docker/deploy.ps1

# Vérification
./docker/status.ps1
```

## 🧪 Tests

### Structure des tests
```
backend-api/tests/
├── auth/              # Tests d'authentification
├── database/          # Tests base de données
├── fails/             # Tests gestion échecs
├── badges/            # Tests système badges
├── integration/       # Tests d'intégration
└── utils/             # Utilitaires de test
```

### Exécution des tests
```bash
# Tous les tests
npm test

# Tests spécifiques
npm run test:auth
npm run test:database
npm run test:badges
```

## 🔒 Sécurité

### JWT Tokens
- Expiration : 24h
- Refresh automatique
- Blacklist des tokens révoqués

### Rate Limiting
- API : 100 req/min par IP
- Auth : 5 tentatives/15min
- Upload : 10 fichiers/jour

### Validation des données
- Joi pour validation côté serveur
- Sanitisation des entrées
- Protection XSS/CSRF

## 📊 Monitoring

### Logs
```bash
# Logs Docker
docker-compose logs -f

# Logs spécifiques
docker-compose logs backend
docker-compose logs frontend
```

### Métriques
- Performance API : `/api/health`
- Status base de données : `/api/db/status`
- Utilisation ressources : Docker stats

## 🛠️ Maintenance

### Sauvegardes
```bash
# Base de données
./scripts/backup-database.sh

# Fichiers utilisateur
./scripts/backup-uploads.sh
```

### Mises à jour
```bash
# Dépendances
npm audit fix

# Images Docker
docker-compose pull
docker-compose up -d --force-recreate
```

## 📈 Performance

### Optimisations base de données
- Index sur colonnes fréquemment requêtées
- Pagination des résultats
- Cache Redis pour sessions

### Optimisations API
- Compression gzip
- Cache headers appropriés
- Lazy loading des relations

## 🐛 Dépannage

### Problèmes courants

#### Base de données inaccessible
```bash
# Vérifier le conteneur
docker ps
docker logs faildaily_db

# Redémarrer si nécessaire
docker-compose restart db
```

#### API ne répond pas
```bash
# Vérifier les logs
docker-compose logs backend

# Test connectivité
curl http://localhost:3000/api/health
```

#### Frontend ne charge pas
```bash
# Vérifier le build
docker-compose logs frontend

# Rebuilder si nécessaire
docker-compose build frontend --no-cache
```

## 📚 Ressources supplémentaires

- [Guide de démarrage](GETTING_STARTED.md)
- [Guide de dépannage](TROUBLESHOOTING.md)
- [Documentation API](API_ENDPOINTS.md)
- [Guide des badges](BADGES_GUIDE.md)

---

*Dernière mise à jour : Janvier 2025*
