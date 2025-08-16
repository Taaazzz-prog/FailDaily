# Guide d'Intégration - Système de Gestion Unifiée FailDaily

## Vue d'Ensemble
Ce guide décrit l'intégration complète du système FailDaily avec la migration de Supabase vers MySQL et l'unification des services d'authentification.

## Architecture du Système

### Backend API (Port 3001)
- **Framework**: Node.js + Express
- **Base de données**: MySQL via WampServer
- **Authentification**: JWT + bcrypt

### Frontend Angular/Ionic
- **Framework**: Angular 15+ avec Ionic
- **Services**: Architecture modulaire avec services spécialisés
- **Migration**: Support Supabase → MySQL transparent

## Services Principaux

### 1. RegistrationTransitionService
```typescript
// Gestion de la migration Supabase → MySQL
await this.registrationTransitionService.migrateFromSupabase(userData);
```

### 2. IntegratedRegistrationService  
```typescript
// Flux d'inscription unifié
const result = await this.integratedService.processRegistration(formData);
```

### 3. RegistrationAdapterService
```typescript
// Adaptation des formats de données
const adaptedData = this.adapter.adaptToMysqlFormat(supabaseData);
```

## Endpoints API

### Authentication
- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Renouvellement token

### User Management
- `GET /api/users/profile` - Profil utilisateur
- `PUT /api/users/profile` - Mise à jour profil
- `DELETE /api/users/:id` - Suppression utilisateur

### Migration
- `POST /api/migration/from-supabase` - Migration automatique
- `GET /api/migration/status` - Statut migration

## Configuration Requise

### Variables d'Environnement
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=faildaily
JWT_SECRET=your_jwt_secret
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

### Structure Base de Données
```sql
-- Tables principales
users, profiles, badges, tasks, notifications
-- Vues et procédures pour migration
migration_status, user_migration_view
```

## Tests et Validation

### Tests API
```bash
# Démarrer le serveur
cd backend-api && npm start

# Tests endpoints
curl http://localhost:3001/api/auth/register
curl http://localhost:3001/api/users/profile
```

### Tests Frontend
```bash
# Compilation et test
ng build --prod
ionic capacitor run browser
```

## Troubleshooting

### Problèmes Courants
1. **Connexion DB**: Vérifier WampServer actif
2. **Migration**: Vérifier clés Supabase valides  
3. **JWT**: Vérifier secret configuré

### Logs Debug
- Backend: `console.log` dans controllers
- Frontend: `ionic serve --lab` pour debug
- Base de données: PhpMyAdmin pour vérification

## Maintenance

### Sauvegarde
```sql
-- Export structure et données
mysqldump faildaily > backup_$(date +%Y%m%d).sql
```

### Mise à jour
```bash
# Dependencies backend
cd backend-api && npm update

# Dependencies frontend  
cd .. && npm update
```

## Support
Pour toute question technique, consulter :
- Documentation API: `/api/docs`
- Logs système: `backend-api/logs/`
- Status migration: Interface admin