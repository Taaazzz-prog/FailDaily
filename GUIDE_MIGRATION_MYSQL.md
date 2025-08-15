# Guide de Migration FailDaily : De Supabase/PostgreSQL vers MySQL

## 📋 Sommaire

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture actuelle](#architecture-actuelle)
3. [Modifications requises](#modifications-requises)
4. [Services à adapter](#services-à-adapter)
5. [Configuration](#configuration)
6. [Base de données](#base-de-données)
7. [Plan de migration étape par étape](#plan-de-migration-étape-par-étape)

---

## 🎯 Vue d'ensemble

Votre application FailDaily utilise actuellement **Supabase** comme backend avec PostgreSQL. Cette migration vers MySQL nécessite des modifications importantes dans :

- **26 services TypeScript** utilisant SupabaseService
- **15 tables PostgreSQL** avec fonctionnalités spécifiques
- **Authentification** complètement intégrée à Supabase Auth
- **API PostgREST** auto-générée remplacée par une API custom
- **RPC functions** PostgreSQL à réécrire
- **JSONB queries** à convertir en JSON MySQL

---

## 🏗️ Architecture actuelle

### Services Supabase identifiés
```
src/app/services/supabase.service.ts         (2400+ lignes - SERVICE PRINCIPAL)
src/app/services/auth.service.ts             (754 lignes)
src/app/services/fail.service.ts             (271 lignes)
src/app/services/admin.service.ts            (472 lignes)
src/app/services/badge.service.ts
src/app/services/follow.service.ts
src/app/services/comprehensive-logger.service.ts
src/app/services/logging-setup.service.ts
```

### Fonctionnalités PostgreSQL utilisées
- **RPC Functions** : `log_user_login`, `log_comprehensive_activity`, `log_user_management_action`
- **JSONB** : Stockage et requêtes JSON complexes
- **UUID** : Génération automatique d'identifiants
- **PostgREST** : API REST auto-générée
- **Supabase Auth** : Authentification complète
- **Real-time subscriptions** : Mises à jour en temps réel
- **Row Level Security (RLS)** : Sécurité au niveau des lignes

---

## 🔧 Modifications requises

### 1. Remplacement du client Supabase

#### ❌ Code actuel (supabase.service.ts)
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

private supabase: SupabaseClient;

this.supabase = createClient(
  environment.supabase.url,
  environment.supabase.anonKey
);
```

#### ✅ Nouveau code nécessaire
```typescript
import { HttpClient } from '@angular/common/http';
import mysql from 'mysql2/promise'; // Pour Node.js backend

private httpClient: HttpClient;
private apiBaseUrl: string = environment.api.baseUrl;

// Toutes les méthodes Supabase devront être remplacées par des appels HTTP
```

### 2. Authentification

#### ❌ Méthodes Supabase actuelles
```typescript
// auth.service.ts - À REMPLACER ENTIÈREMENT
async signUp(email: string, password: string) {
  const { data, error } = await this.supabase.auth.signUp({
    email,
    password
  });
}

async signIn(email: string, password: string) {
  const { data, error } = await this.supabase.auth.signInWithPassword({
    email,
    password
  });
}

// Session management automatique avec Supabase
this.supabase.auth.onAuthStateChange((event, session) => {
  // ...
});
```

#### ✅ Nouvelle implémentation requise
```typescript
// Créer un nouveau AuthService avec JWT custom
async signUp(email: string, password: string) {
  return this.httpClient.post(`${this.apiBaseUrl}/auth/register`, {
    email,
    password
  }).toPromise();
}

async signIn(email: string, password: string) {
  const response = await this.httpClient.post(`${this.apiBaseUrl}/auth/login`, {
    email,
    password
  }).toPromise();
  
  // Gérer JWT token manuellement
  localStorage.setItem('token', response.token);
  return response;
}
```

### 3. Base de données - Requêtes

#### ❌ Requêtes PostgreSQL/Supabase actuelles
```typescript
// RPC Functions (à remplacer)
await this.supabase.rpc('log_user_login', {
  p_user_id: userId,
  p_ip_address: ipAddress
});

// JSONB queries (à convertir)
const { data } = await this.supabase
  .from('profiles')
  .select('*')
  .contains('badges', { type: 'first_fail' });

// UUID generation automatique (à gérer manuellement)
const { data } = await this.supabase
  .from('fails')
  .insert({
    title: 'Mon fail',
    user_id: 'auto-generated-uuid'
  });
```

#### ✅ Nouvelles requêtes MySQL requises
```typescript
// Remplacer RPC par endpoints REST
await this.httpClient.post(`${this.apiBaseUrl}/logs/user-login`, {
  userId: userId,
  ipAddress: ipAddress
}).toPromise();

// JSON MySQL (syntax différente)
await this.httpClient.get(`${this.apiBaseUrl}/profiles`, {
  params: {
    badges: JSON.stringify({ type: 'first_fail' })
  }
}).toPromise();

// UUID generation manuelle
import { v4 as uuidv4 } from 'uuid';
const failId = uuidv4();

await this.httpClient.post(`${this.apiBaseUrl}/fails`, {
  id: failId,
  title: 'Mon fail',
  user_id: currentUserId
}).toPromise();
```

### 4. Upload de fichiers

#### ❌ Supabase Storage actuel
```typescript
async uploadFile(bucket: string, path: string, file: File): Promise<string> {
  const { data, error } = await this.supabase.storage
    .from(bucket)
    .upload(path, file);
    
  return this.supabase.storage
    .from(bucket)
    .getPublicUrl(path).data.publicUrl;
}
```

#### ✅ Upload HTTP requis
```typescript
async uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await this.httpClient.post(
    `${this.apiBaseUrl}/upload`,
    formData
  ).toPromise();
  
  return response.url;
}
```

---

## 🗄️ Services à adapter

### 1. SupabaseService (2400+ lignes) - **REFACTORING COMPLET**

**Méthodes critiques à réécrire :**
- `getCurrentUser()` → Authentication JWT custom
- `createFail()` → POST `/api/fails`
- `getFails()` → GET `/api/fails`
- `updateProfile()` → PUT `/api/profiles/:id`
- `uploadFile()` → POST `/api/upload`
- Toutes les méthodes RPC → Endpoints REST custom

### 2. AuthService (754 lignes) - **REFACTORING MAJEUR**

**Fonctionnalités à recréer :**
- Session management avec JWT
- State management manuel (BehaviorSubject)
- Token refresh automatique
- Logout complet
- Password reset par email

### 3. FailService (271 lignes) - **ADAPTATION MODÉRÉE**

**Modifications requises :**
- Remplacer `supabaseService.createFail()` par HTTP calls
- Adapter les filtres et tri
- Gérer pagination manuellement

### 4. AdminService (472 lignes) - **ADAPTATION MODÉRÉE**

**Modifications requises :**
- Dashboard stats → GET `/api/admin/stats`
- User management → CRUD endpoints
- System logs → GET `/api/admin/logs`

### 5. Services secondaires - **ADAPTATION LÉGÈRE**

Tous utilisent SupabaseService, donc adaptation par effet de ricochet :
- BadgeService
- FollowService
- ComprehensiveLoggerService
- LoggingSetupService

---

## ⚙️ Configuration

### Environment files à modifier

#### ❌ Configuration Supabase actuelle
```typescript
// environment.ts & environment.prod.ts
export const environment = {
  supabase: {
    url: 'http://127.0.0.1:54321',
    anonKey: 'eyJhbGciOiJIUzI1NiIs...'
  },
  api: {
    baseUrl: 'http://localhost:3000/api',
    moderationUrl: 'https://api.openai.com/v1'
  }
};
```

#### ✅ Nouvelle configuration MySQL
```typescript
export const environment = {
  // Supprimer section supabase
  api: {
    baseUrl: 'http://localhost:3000/api', // Votre API custom
    authEndpoint: '/auth',
    uploadEndpoint: '/upload',
    moderationUrl: 'https://api.openai.com/v1'
  },
  database: {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    database: 'faildaily',
    // Credentials en variables d'environnement
  }
};
```

---

## 🗃️ Base de données

### Migration MySQL complète

**Votre script `MIGRATION_MySQL_FailDaily_COMPLETE.sql` est prêt !**

**Différences importantes :**
- **JSONB → JSON** : Syntax des requêtes différente
- **UUID → VARCHAR(36)** : Génération manuelle requise  
- **RLS supprimé** : Sécurité dans l'API
- **Triggers ajoutés** : Pour badges et logs automatiques

**Tables créées :**
```sql
- users (15 columns) → Authentification
- profiles (24 columns) → Données utilisateur  
- fails (15 columns) → Posts des échecs
- badges (6 columns) → 70 badges préchargés
- user_badges (5 columns) → Attribution badges
- reactions (7 columns) → Cœurs de courage
- follows (5 columns) → Système de suivi
- system_logs (8 columns) → Logs système
- user_activities (9 columns) → Activités utilisateur
- points_configuration (5 columns) → Config points
- fail_reports (10 columns) → Signalements
- user_preferences (8 columns) → Préférences
- notifications (12 columns) → Système notifications
- user_sessions (7 columns) → Sessions utilisateur
- comprehensive_logs (10 columns) → Logs détaillés
```

---

## 🚀 Plan de migration étape par étape

### Phase 1: Préparation (1-2 jours)
1. **Sauvegarde complète** de la DB PostgreSQL
2. **Installation MySQL** et import du script de migration
3. **Test de la base** avec quelques requêtes manuelles
4. **Création API backend** (Node.js/Express + MySQL)

### Phase 2: Backend API (3-4 jours)
1. **Endpoints d'authentification** (register, login, logout)
2. **CRUD fails** (create, read, update, delete)
3. **Gestion des profils** (get, update)
4. **Upload de fichiers** (images)
5. **Système de badges** (attribution automatique)

### Phase 3: Frontend - Services core (2-3 jours)  
1. **SupabaseService** → **ApiService** (refactoring complet)
2. **AuthService** → Authentification JWT custom
3. **FailService** → Appels HTTP
4. **Tests unitaires** des services modifiés

### Phase 4: Frontend - Services secondaires (1-2 jours)
1. **AdminService** → Endpoints admin
2. **BadgeService** → API badges
3. **Services utilitaires** → Adaptations
4. **Components** → Vérification compatibilité

### Phase 5: Tests & Validation (1-2 jours)
1. **Tests end-to-end** complets
2. **Performance testing** 
3. **Sécurité** (injection SQL, XSS)
4. **Migration des données** de production

### Phase 6: Déploiement (1 jour)
1. **Database prod** MySQL setup
2. **API deployment** 
3. **Frontend build** et déploiement
4. **Monitoring** et logs

---

## ⚠️ Points d'attention critiques

### 1. **Sécurité**
- **Pas de RLS MySQL** → Sécurité dans l'API obligatoire
- **JWT tokens** → Gestion expiration et refresh
- **SQL injection** → Prepared statements obligatoires
- **CORS** → Configuration correcte pour Angular

### 2. **Fonctionnalités perdues**
- **Real-time subscriptions** → WebSockets ou polling manuel
- **Supabase Auth** → Système complet à recréer
- **PostgREST** → API REST manuelle
- **Auto-generated API** → Tous les endpoints manuels

### 3. **Performance**
- **N+1 queries** → Optimisation requêtes MySQL
- **Caching** → Redis recommandé  
- **Indexing** → Indexes MySQL optimaux
- **Connection pooling** → Pool de connexions

### 4. **Données**
- **JSONB → JSON** → Validation structure données
- **UUID** → Génération côté application
- **Timestamps** → Format datetime MySQL
- **Relations** → Foreign keys strictes MySQL

---

## 📦 Dépendances NPM à ajouter/supprimer

### ❌ À supprimer
```json
{
  "@supabase/supabase-js": "^2.x.x"
}
```

### ✅ À ajouter  
```json
{
  "uuid": "^9.0.0",
  "@types/uuid": "^9.0.0",
  "jsonwebtoken": "^9.0.0",
  "@types/jsonwebtoken": "^9.0.0"
}
```

---

## 📝 Estimation du travail

| Phase | Complexité | Durée estimée |
|-------|------------|---------------|
| Base de données | ✅ **Fait** | **0 jour** |
| Backend API | 🔴 **Haute** | **3-4 jours** |
| SupabaseService | 🔴 **Critique** | **2-3 jours** |
| AuthService | 🔴 **Critique** | **1-2 jours** |
| Services secondaires | 🟡 **Modérée** | **1-2 jours** |
| Tests & validation | 🟡 **Modérée** | **1-2 jours** |
| **TOTAL** | | **8-13 jours** |

---

## ✅ Prochaines étapes recommandées

1. **Décision finale** : Confirmer la migration MySQL
2. **Backend d'abord** : Créer l'API avant de toucher le frontend
3. **Migration progressive** : Tester chaque service modifié
4. **Données de test** : Utiliser des données factices au début
5. **Rollback plan** : Garder Supabase opérationnel jusqu'à validation complète

---

**🎯 Conclusion :** La migration est techniquement faisable mais représente un refactoring majeur. Votre base MySQL est prête, l'effort principal se concentre sur la création de l'API backend et l'adaptation des services Angular.
