# PROMPT CHATGPT-5 CODEX - CORRECTION FAILDAILY

## CONTEXTE & MISSION

Tu es ChatGPT-5 Codex, expert en développement fullstack. Tu dois corriger les bugs critiques du projet **FailDaily** (app Ionic/Angular + API Node.js/MySQL) en respectant rigoureusement le fichier `AGENTS.md`.

## ÉTAT ACTUEL DU PROJET

### ✅ FONCTIONNEL
- **Backend API** : Démarre correctement (localhost:3000), MySQL connecté, 1 utilisateur en base
- **Infrastructure** : Dependencies npm à jour, lockfiles synchronisés, git repository clean
- **Configuration** : Jest/ESLint configurés, .npmrc optimisé
- **API Publique** : Route `/api/fails/public` CORRIGÉE - tests passent ✅
- **Build Frontend** : angular.json CORRIGÉ - propriété inlineFonts supprimée ✅

### ❌ PROBLÈMES CRITIQUES À RÉSOUDRE

1. **ESLint: 144 Problèmes** ⚠️
   - Erreurs critiques : `no-dupe-class-members`, `no-prototype-builtins`
   - **Action requise** : Corriger au minimum les erreurs (pas forcément warnings)

2. **Intégration Frontend-Backend** 🚨
   - Frontend doit être configuré pour communiquer avec l'API backend
   - Routes Angular/Ionic à synchroniser avec endpoints API
   - **Action requise** : Vérifier/corriger les services Angular et la configuration API

## INFORMATIONS CRITIQUES DÉCOUVERTES

### 🔐 LOGIQUE D'ANONYMAT (`is_public`)
**IMPORTANT** : Le champ `is_public` ne concerne PAS l'accès public/privé mais l'ANONYMAT des utilisateurs :

- **`is_public = 1`** → Fail affiché **ANONYMEMENT** (identité auteur cachée)
- **`is_public = 0`** → Fail affiché **AVEC IDENTITÉ** de l'auteur visible

**Conséquences pour l'API :**
- Route `/api/fails/public` = récupère les fails anonymes (nécessite authentification)
- Tous les utilisateurs doivent être connectés pour accéder aux contenus
- Pas d'accès public sans authentification dans cette application

### 📊 STRUCTURE BASE DE DONNÉES
Localisation : `backend-api/migrations/faildaily.sql`

Table `fails` :
```sql
CREATE TABLE `fails` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(100) NOT NULL,
  `image_url` text,
  `is_public` tinyint(1) DEFAULT '1',  -- ANONYMAT, pas accès public
  `reactions` longtext COMMENT 'JSON data',
  `comments_count` int DEFAULT '0',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 🔧 CORRECTIONS DÉJÀ APPLIQUÉES

1. **Route `/api/fails/public` corrigée** ✅
   - Erreur SQL `ER_WRONG_ARGUMENTS` avec `LIMIT ?` résolue
   - Solution : interpolation directe `LIMIT ${limitNum} OFFSET ${offset}`
   - Authentification requise (`authenticateToken`)
   - Anonymisation : `user_id` omis de la réponse

2. **Test `fails.public.test.js` mis à jour** ✅
   - Authentification automatique ajoutée
   - Vérification de l'anonymat (pas de `user_id` exposé)
   - Test passe maintenant

## INSTRUCTIONS SPÉCIFIQUES

### RESPECT STRICT DU CONTRAT AGENTS.MD

1. **Branches** : Travaille uniquement sur `main`, pas de PR
2. **Commits** : Messages en français, format Conventional Commits
3. **API Contract** : Respecter snake_case backend (`is_public`) vs camelCase frontend (`isPublic`)
4. **DB Pattern** : Utiliser `executeQuery(query, params)` - PAS `executeQuery(connection, ...)`
5. **Tests minimaux** : Au moins un smoke test pour chaque correction

### PRIORITÉS D'EXÉCUTION

1. **IMPORTANT** - Nettoyer ESLint
   - Se concentrer sur les erreurs (pas warnings)
   - Corriger `no-dupe-class-members` dans `failsController.js`
   - Tester : `cd backend-api && npm run lint`

2. **CRITIQUE** - Intégration Frontend-Backend
   - Vérifier les services Angular dans `frontend/src/app/`
   - Configurer l'URL de base API (probablement `http://localhost:3000`)
   - Mapper correctement `is_public` (backend) ↔ `isPublic` (frontend)
   - Gérer l'authentification dans les services Angular
   - Tester : Communication réelle entre frontend et backend

3. **FONCTIONNEL** - Validation complète
   - Build frontend + backend ensemble
   - Test de bout en bout (création compte → login → récupération fails)

### VALIDATION FINALE OBLIGATOIRE

Avant tout commit, valider que :
- [ ] `cd frontend && npm run build` → ✅ Success
- [ ] `cd backend-api && npm test` → ✅ All tests pass  
- [ ] `cd backend-api && npm run lint` → ✅ No errors (warnings OK)
- [ ] Backend démarre : `node server.js` → ✅ MySQL connected
- [ ] Frontend peut communiquer avec backend ✅
- [ ] Respect du contrat API (snake_case ↔ camelCase)

### COMMANDES DE TRAVAIL

```bash
# Structure de base
cd "d:\Web API\FailDaily"

# Frontend
cd frontend
npm ci
npm run build  # DOIT réussir après correction
npm start      # Tester l'interface

# Backend  
cd ../backend-api
npm ci
npm test       # DOIT passer (déjà OK)
npm run lint   # DOIT être clean (erreurs)
node server.js # DOIT démarrer (déjà OK)

# Test intégration
# Frontend (http://localhost:8100) + Backend (http://localhost:3000)
```

### FICHIERS CLÉS À EXAMINER

- `backend-api/src/controllers/failsController.js` - Erreurs ESLint à corriger
- `frontend/src/app/services/` - Services API Angular
- `frontend/src/environments/` - Configuration URL backend
- `frontend/src/app/` - Composants Angular pour fails
- `backend-api/migrations/faildaily.sql` - Structure BDD de référence

### ENDPOINTS API À INTÉGRER CÔTÉ FRONTEND

```typescript
// Configuration base dans environment.ts
export const environment = {
  apiUrl: 'http://localhost:3000/api'
};

// Services Angular à vérifier/créer
GET /api/auth/login           // Authentification
GET /api/auth/register        // Inscription  
GET /api/fails               // Tous les fails (auth requise)
GET /api/fails/public        // Fails anonymes (auth requise)
POST /api/fails              // Créer fail
PUT /api/fails/:id           // Modifier fail
DELETE /api/fails/:id        // Supprimer fail
```

### MAPPING DONNÉES CRITIQUE

```typescript
// Backend SQL (snake_case)
{
  id: "uuid",
  title: "string", 
  description: "string",
  category: "string",
  is_public: true,  // ANONYMAT
  created_at: "timestamp"
}

// Frontend Angular (camelCase)  
{
  id: "uuid",
  title: "string",
  description: "string", 
  category: "string",
  isPublic: true,   // ANONYMAT
  createdAt: "timestamp"
}
```

## RÉSULTAT ATTENDU

Un projet FailDaily **entièrement fonctionnel** avec :
- ESLint clean (erreurs corrigées) ✅
- Frontend-Backend intégration complète ✅
- Authentification fonctionnelle ✅
- Gestion anonymat des fails ✅
- Build & tests qui passent ✅

## COMMANDES DE VÉRIFICATION FINALE

```bash
cd "d:\Web API\FailDaily"

# Test complet
cd backend-api && npm run lint && echo "✅ Backend lint OK"
cd ../frontend && npm run build && echo "✅ Frontend build OK"
cd ../backend-api && npm test && echo "✅ Backend tests OK"  
cd ../backend-api && timeout 5 node server.js && echo "✅ Server starts"

# Test intégration (manuel)
cd ../frontend && npm start &  # Port 8100
cd ../backend-api && node server.js &  # Port 3000
# Tester dans navigateur : login + récupération fails

# Si tout passe → commit et push
git add . && git commit -m "fix: intégration frontend-backend et nettoyage ESLint" && git push origin main
```

**Commence par ESLint (critique), puis l'intégration frontend-backend. L'anonymat est maintenant bien compris et implémenté !**
