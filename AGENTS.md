# FailDaily - Guide de Développement pour ChatGPT Codex

## 🎯 Mission et Contexte

**FailDaily** est une application de partage d'échecs personnels pour encourager la résilience et l'entraide communautaire.

### Architecture Technique
- **Frontend**: Angular 20 + Ionic 8 (TypeScript, architecture standalone)
- **Backend**: Node.js + Express + MySQL (authentification JWT)
- **Base de données**: MySQL avec structure complète de logging et gamification

## 📋 Objectifs Principaux

1. **Cohérence Frontend ↔ Backend**: Vérifier que chaque action UI invoque le bon endpoint
2. **Contrats de données**: Les JSON retournés matchent les modèles TypeScript
3. **Règles métier**: Anonymat et validation d'âge strictement appliqués
4. **Sécurité**: Authentification JWT sur toutes les routes sensibles

## 🗄️ Structure de Base de Données

### Tables Principales
```sql
-- Utilisateurs et profils
users (id, email, password_hash, role, account_status, registration_step, created_at)
profiles (user_id, username, display_name, avatar_url, bio, registration_completed, legal_consent, age_verification)

-- Contenu principal
fails (id, user_id, title, description, category, image_url, is_public TINYINT(1), reactions JSON, comments_count, created_at)
comments (id, fail_id, user_id, content, is_encouragement TINYINT(1), created_at)
reactions (id, user_id, fail_id, reaction_type, created_at)

-- Gamification et logs
badges, user_badges, badge_definitions
activity_logs, user_activities, system_logs
```

### Règles de Visibilité (is_public)
- **Base de données**: `TINYINT(1)` avec valeurs `0` (privé) et `1` (public/anonyme)
- **Backend API**: Convertit `0`/`1` vers `boolean` avec `!!fail.is_public`
- **Frontend**: Manipule des `boolean` (`true`/`false`)
- **IMPORTANT**: Même les fails `is_public = true` nécessitent une authentification

## 🔗 Contrats de Données

### Mapping Obligatoire (snake_case ↔ camelCase)
```javascript
// Backend doit mapper:
users.display_name → displayName
fails.image_url → imageUrl
fails.comments_count → commentsCount
fails.is_public (0/1) → boolean
```

### Structures JSON de Référence

**User Response:**
```json
{
  "id": "uuid",
  "email": "string",
  "displayName": "string",
  "avatar": "string",
  "role": "user|admin",
  "totalFails": 0,
  "couragePoints": 0,
  "badges": [],
  "emailConfirmed": boolean,
  "registrationCompleted": boolean
}
```

**Fail Response:**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "category": "humour|travail|social|personnel|autre",
  "imageUrl": "string|null",
  "authorId": "uuid",
  "authorName": "string", // Anonymisé si is_public = false
  "authorAvatar": "string",
  "reactions": {
    "courage": 0,
    "empathy": 0,
    "laugh": 0,
    "support": 0
  },
  "commentsCount": 0,
  "is_public": boolean,
  "createdAt": "ISO string"
}
```

## 🛡️ Règles d'Authentification et d'Âge

### Authentification
- Toutes les routes `/api/*` (sauf auth publiques) nécessitent le middleware `authenticateToken`
- JWT stocké côté frontend, envoyé dans l'header `Authorization: Bearer <token>`

### Validation d'Âge (inscription)
```javascript
// Règles strictes:
if (age < 13) return res.status(400).json({ code: 'AGE_UNDER_MINIMUM' });
if (age >= 13 && age <= 16 && !parentalConsent) {
  return res.status(400).json({ code: 'PARENTAL_CONSENT_REQUIRED' });
}
// age > 16: OK
```

## 🌐 Endpoints Principaux

### Authentification
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/register` - Inscription (avec validation d'âge)
- `GET /api/auth/verify` - Vérification token JWT
- `POST /api/auth/logout` - Déconnexion

### Fails
- `GET /api/fails` - Tous les fails de l'utilisateur connecté
- `POST /api/fails` - Créer un nouveau fail
- `GET /api/fails/public` - Fails anonymes (`is_public = true`, **auth requise**)
- `GET /api/fails/:id` - Détail d'un fail spécifique

### Reactions et Comments
- `POST /api/reactions` - Ajouter une réaction
- `DELETE /api/reactions/:id` - Supprimer une réaction
- `GET /api/comments/:failId` - Commentaires d'un fail
- `POST /api/comments` - Ajouter un commentaire

## 🧪 Tests Requis

### Backend (Jest + Supertest)
```javascript
// Tests de validation d'âge
describe('Age Validation', () => {
  test('Age < 13 should return AGE_UNDER_MINIMUM', async () => {
    // Test implementation
  });
  
  test('Age 13-16 without consent should return PARENTAL_CONSENT_REQUIRED', async () => {
    // Test implementation
  });
});

// Tests de visibilité
describe('Fail Visibility', () => {
  test('is_public=false should not appear in /api/fails/public', async () => {
    // Test implementation
  });
  
  test('is_public=true should appear anonymized in /api/fails/public', async () => {
    // Test implementation
  });
});
```

## 📁 Structure des Fichiers

### Backend (`backend-api/`)
```
server.js                 // Point d'entrée (export app)
src/config/database.js    // MySQL2/promise, executeQuery
src/controllers/          // Logique métier
src/routes/              // Définition endpoints
src/middleware/auth.js   // authenticateToken
tests/                   // Jest tests
```

### Frontend (`frontend/src/app/`)
```
services/                // auth.service, fail.service, mysql.service
models/                  // user.model, fail.model (interfaces TS)
pages/                   // auth/, home/, profile/, post-fail/
components/              // Composants réutilisables
guards/                  // Protection des routes
```

## 🚀 Commandes de Développement

### Installation et Tests
```bash
# Installation (workspace root)
npm ci --include=dev

# Tests backend
cd backend-api && npm test

# Build frontend
cd frontend && npm run build

# Démarrage local
cd backend-api && node server.js  # Port 3000
cd frontend && npm start          # Port 4200
```

### Audit de Cohérence
```bash
# Vérifier les appels API frontend
grep -r "/api/" frontend/src/app/

# Vérifier les routes backend
grep -r "router\." backend-api/src/routes/

# Vérifier mapping snake_case ↔ camelCase
grep -r "is_public\|isPublic" backend-api/ frontend/src/
```

## ⚠️ Points d'Attention

### Erreurs Communes
1. **is_public**: Ne pas confondre avec "public sans auth" - auth toujours requise
2. **Mapping**: Toujours convertir snake_case (DB) vers camelCase (Frontend)
3. **Types**: `TINYINT(1)` MySQL → `boolean` JavaScript
4. **Sécurité**: Vérifier que `authenticateToken` protège les routes sensibles

### Format d'Erreur Standard
```json
{
  "error": "Message lisible",
  "code": "CODE_CONSTANT",
  "details": "Informations additionnelles"
}
```

**Codes d'erreur principaux:**
- `AGE_UNDER_MINIMUM`
- `PARENTAL_CONSENT_REQUIRED`
- `UNAUTHORIZED`
- `NOT_FOUND`
- `VALIDATION_ERROR`

## ✅ Checklist de Validation

Avant de valider une modification:

- [ ] Endpoints frontend correspondent aux routes backend
- [ ] Schémas JSON matchent les modèles TypeScript
- [ ] `is_public` gère correctement l'anonymat (0/1 ↔ boolean)
- [ ] Règles d'âge appliquées et testées
- [ ] Routes sensibles protégées par `authenticateToken`
- [ ] Tests backend passent
- [ ] Build frontend réussit
- [ ] Pas de secrets dans le code

## 🔧 Variables d'Environnement

### Backend (.env)
```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=faildaily
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:4200
```

### Frontend (environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

---

**Note**: Ce guide est conçu pour maintenir la cohérence et la qualité du code FailDaily. Suivez ces conventions pour assurer une intégration fluide entre frontend et backend.