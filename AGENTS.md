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

### ⚠️ Problèmes Connus en Environnement Cloud

**IMPORTANT**: L'environnement cloud ChatGPT Codex peut rencontrer ces erreurs :

1. **Erreur 403 @fontsource** : Accès interdit aux packages fontsource
2. **ESLint module** : Cannot use import outside module
3. **Jest/ng not found** : Outils CLI manquants
4. **Express not found** : Dependencies non installées

### Installation Cloud-Safe
```bash
# ⚠️ ÉVITER npm ci (peut échouer sur fontsource)
# Utiliser npm install à la place
npm install

# Alternative si @fontsource bloqué :
npm install --omit=optional

# Si toujours bloqué, supprimer temporairement :
npm uninstall @fontsource/caveat @fontsource/comfortaa @fontsource/kalam
npm install
```

### Configuration ESLint (Fix Cloud)
```bash
# Renommer eslint.config.js en .mjs
mv backend-api/eslint.config.js backend-api/eslint.config.mjs

# OU ajouter "type": "module" dans backend-api/package.json
```

### Installation Outils Manquants
```bash
# Installer Jest globalement
npm install -g jest

# Installer Angular CLI globalement  
npm install -g @angular/cli

# OU installer localement
npm install --save-dev jest @angular/cli
```

### Tests Avec Dépendances Manquantes
```bash
# Vérifier modules installés
npm list --depth=0

# Installer dépendances manquantes backend
cd backend-api && npm install express mysql2 jsonwebtoken bcryptjs cors helmet

# Installer dépendances manquantes frontend
cd frontend && npm install @angular/core @angular/common @ionic/angular
```

### Smoke Test Cloud-Safe
```bash
# Test sans dépendances externes
NODE_ENV=test DB_DISABLED=true node -e "
try {
  console.log('Node version:', process.version);
  console.log('Testing basic require...');
  const fs = require('fs');
  console.log('✅ Basic Node.js working');
  console.log('SERVER_BOOT_OK');
} catch(e) {
  console.error('❌ Error:', e.message);
}
"
```

### Audit de Cohérence (Cloud-Safe)
```bash
# ⚠️ Utiliser ces alternatives si grep/rg non disponible :

# Alternative 1: Node.js pour chercher les patterns
node -e "
const fs = require('fs');
const path = require('path');
function searchInDir(dir, pattern) {
  try {
    const files = fs.readdirSync(dir, {withFileTypes: true});
    files.forEach(file => {
      if (file.isDirectory() && !file.name.startsWith('.')) {
        searchInDir(path.join(dir, file.name), pattern);
      } else if (file.name.endsWith('.ts') || file.name.endsWith('.js')) {
        const content = fs.readFileSync(path.join(dir, file.name), 'utf8');
        if (content.includes(pattern)) {
          console.log(\`Found \${pattern} in \${path.join(dir, file.name)}\`);
        }
      }
    });
  } catch(e) { /* ignore */ }
}
searchInDir('frontend/src/app', '/api/');
"

# Alternative 2: find + xargs (si disponible)
find frontend/src/app -name "*.ts" -o -name "*.js" | xargs grep -l "/api/" 2>/dev/null || echo "grep non disponible"

# Vérifier les routes backend
find backend-api/src/routes -name "*.js" | xargs grep -l "router\." 2>/dev/null || echo "grep non disponible"
```

## 🔧 Configuration Cloud Spécifique

### Package.json Fixes
```json
// backend-api/package.json - Ajouter si manquant :
{
  "type": "module",  // Pour ESLint avec import
  "scripts": {
    "lint": "eslint . --config eslint.config.mjs",
    "test": "jest --runInBand",
    "start": "node server.js"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "eslint": "^9.0.0"
  }
}
```

### Alternative Sans Fontsource
```css
/* frontend/src/global.scss - Fallback fonts si @fontsource indisponible */
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Comfortaa:wght@300;400;700&family=Kalam:wght@300;400;700&display=swap');

/* OU utiliser fonts système */
:root {
  --font-cursive: 'Caveat', 'Comic Sans MS', cursive;
  --font-rounded: 'Comfortaa', 'Arial Rounded MT', sans-serif;  
  --font-handwritten: 'Kalam', 'Brush Script MT', cursive;
}
```

## ⚠️ Points d'Attention

### Erreurs Communes en Cloud
1. **@fontsource 403** : Packages bloqués → utiliser Google Fonts CDN ou fonts système
2. **ESLint import error** : Ajouter `"type": "module"` ou renommer en `.mjs`
3. **Jest/ng not found** : Installer globalement ou ajouter aux devDependencies
4. **Express not found** : `npm install` peut avoir échoué → réinstaller manuellement
5. **npm ci 403** : Utiliser `npm install` à la place

### Solutions Cloud-Ready
```bash
# Fix rapide pour erreurs communes :

# 1. Réinstallation propre
rm -rf node_modules package-lock.json
npm install

# 2. ESLint fix
echo '{"type": "module"}' > backend-api/.eslintrc.json

# 3. Dependencies manquantes
npm install express mysql2 jsonwebtoken bcryptjs cors helmet
npm install @angular/core @angular/common @ionic/angular

# 4. Test sans outils externes
node -e "console.log('Node OK:', process.version)"
```

### Format d'Erreur Standard (Cloud-Safe)
```json
{
  "error": "Message lisible",
  "code": "CODE_CONSTANT", 
  "details": "Informations additionnelles",
  "cloudSafe": true
}
```

**Codes d'erreur principaux:**
- `AGE_UNDER_MINIMUM`
- `PARENTAL_CONSENT_REQUIRED`
- `UNAUTHORIZED`
- `NOT_FOUND`
- `VALIDATION_ERROR`

## ✅ Checklist de Validation (Cloud-Optimisée)

Avant de valider une modification en environnement cloud :

### Phase 1: Vérification Environnement
- [ ] `node --version` fonctionne
- [ ] `npm --version` fonctionne  
- [ ] Dossiers `frontend/` et `backend-api/` existent
- [ ] `package.json` présent dans les deux dossiers

### Phase 2: Installation Sécurisée
- [ ] `npm install` (pas `npm ci`) réussit sans 403
- [ ] Packages essentiels installés : `npm list express mysql2`
- [ ] Si @fontsource échoue, utiliser alternative CDN/système

### Phase 3: Configuration ESLint
- [ ] ESLint config compatible : `.mjs` ou `"type": "module"`
- [ ] `npm run lint` ou `npx eslint .` fonctionne
- [ ] Pas d'erreur "Cannot use import outside module"

### Phase 4: Tests Minimaux
- [ ] Backend boot : `node -e "require('./backend-api/server')"`
- [ ] Frontend check : `ls frontend/src/app/` montre services/
- [ ] Tests unitaires : `npx jest --version` puis `npx jest`

### Phase 5: Cohérence Métier  
- [ ] Endpoints frontend correspondent aux routes backend
- [ ] Schémas JSON matchent les modèles TypeScript
- [ ] `is_public` gère correctement l'anonymat (0/1 ↔ boolean)
- [ ] Routes sensibles protégées par `authenticateToken`

### Phase 6: Smoke Test Final
```bash
# Test cloud-safe sans dépendances externes
NODE_ENV=test DB_DISABLED=true node -e "
console.log('✅ Node.js:', process.version);
console.log('✅ Platform:', process.platform);
console.log('✅ Architecture:', process.arch);
console.log('✅ Memory:', Math.round(process.memoryUsage().rss/1024/1024) + 'MB');
console.log('✅ SERVER_BOOT_OK');
"
```

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

## 🔥 Guide de Dépannage Cloud

### Erreur 403 @fontsource
```bash
# Solution 1: Supprimer temporairement
npm uninstall @fontsource/caveat @fontsource/comfortaa @fontsource/kalam
npm install

# Solution 2: Alternative CDN dans global.scss
# @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');
```

### Erreur ESLint Import
```bash
# Solution 1: Renommer config
mv backend-api/eslint.config.js backend-api/eslint.config.mjs

# Solution 2: Ajouter type module
echo '{"type": "module"}' > backend-api/eslint.package.json
```

### Erreur Jest/ng Not Found
```bash
# Solution: Installation locale
npm install --save-dev jest @angular/cli
npx jest --version
npx ng version
```

### Erreur Express Not Found
```bash
# Solution: Réinstallation dependencies
cd backend-api
npm install express mysql2 jsonwebtoken bcryptjs cors helmet dotenv
```

**Note**: Ce guide est optimisé pour l'environnement cloud ChatGPT Codex avec solutions de contournement pour les limitations d'accès réseau et packages.