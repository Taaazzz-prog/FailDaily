# PROMPT CHATGPT-5 CODEX - CORRECTION FAILDAILY

## CONTEXTE & MISSION

Tu es ChatGPT-5 Codex, expert en développement fullstack. Tu dois corriger les bugs critiques du projet **FailDaily** (app Ionic/Angular + API Node.js/MySQL) en respectant rigoureusement le fichier `AGENTS.md`.

## ÉTAT ACTUEL DU PROJET

### ✅ FONCTIONNEL
- **Backend API** : Démarre correctement (localhost:3000), MySQL connecté, 1 utilisateur en base
- **Infrastructure** : Dependencies npm à jour, lockfiles synchronisés, git repository clean
- **Configuration** : Jest/ESLint configurés, .npmrc optimisé

### ❌ PROBLÈMES CRITIQUES À RÉSOUDRE

1. **Frontend Build Broken** 🚨
   ```
   Error: Schema validation failed with the following errors:
   Data path "" must NOT have additional properties(inlineFonts).
   ```
   - **Action requise** : Corriger `angular.json` en supprimant la propriété `inlineFonts` invalide
   - **Validation** : `npm run build` doit réussir

2. **Test d'API Public Échoue** 🚨
   ```
   GET /api/fails/public → 401 (attendu: 200)
   ```
   - **Action requise** : Corriger l'authentification pour les endpoints publics
   - **Validation** : `npm test` doit passer

3. **ESLint: 144 Problèmes** ⚠️
   - Erreurs critiques : `no-dupe-class-members`, `no-prototype-builtins`
   - **Action requise** : Corriger au minimum les erreurs (pas forcément warnings)

## INSTRUCTIONS SPÉCIFIQUES

### RESPECT STRICT DU CONTRAT AGENTS.MD

1. **Branches** : Travaille uniquement sur `main`, pas de PR
2. **Commits** : Messages en français, format Conventional Commits
3. **API Contract** : Respecter snake_case backend (`is_public`) vs camelCase frontend (`isPublic`)
4. **DB Pattern** : Utiliser `executeQuery(query, params)` - PAS `executeQuery(connection, ...)`
5. **Tests minimaux** : Au moins un smoke test pour chaque correction

### PRIORITÉS D'EXÉCUTION

1. **IMMÉDIAT** - Corriger le build frontend
   - Examiner `frontend/angular.json`
   - Supprimer/corriger `inlineFonts`
   - Tester : `cd frontend && npm run build`

2. **CRITIQUE** - Fixer les tests publics
   - Examiner `backend-api/tests/fails.public.test.js`
   - Vérifier la route `/api/fails/public` 
   - S'assurer qu'elle ne nécessite pas d'authentification
   - Tester : `cd backend-api && npm test`

3. **IMPORTANT** - Nettoyer ESLint
   - Se concentrer sur les erreurs (pas warnings)
   - Corriger `no-dupe-class-members` dans `failsController.js`
   - Tester : `cd backend-api && npm run lint`

### VALIDATION FINALE OBLIGATOIRE

Avant tout commit, valider que :
- [ ] `cd frontend && npm run build` → ✅ Success
- [ ] `cd backend-api && npm test` → ✅ All tests pass
- [ ] `cd backend-api && npm run lint` → ✅ No errors (warnings OK)
- [ ] Backend démarre : `node server.js` → ✅ MySQL connected
- [ ] Respect du contrat API (snake_case ↔ camelCase)

### COMMANDES DE TRAVAIL

```bash
# Structure de base
cd "d:\Web API\FailDaily"

# Frontend
cd frontend
npm ci
npm run build  # DOIT réussir après correction

# Backend  
cd ../backend-api
npm ci
npm test       # DOIT passer après correction
npm run lint   # DOIT être clean (erreurs)
node server.js # DOIT démarrer

# Docker (si modifié)
cd ../docker
docker compose up -d --build
```

### FICHIERS CLÉS À EXAMINER

- `frontend/angular.json` - Configuration build Angular
- `backend-api/tests/fails.public.test.js` - Test qui échoue
- `backend-api/src/controllers/failsController.js` - Erreurs ESLint
- `backend-api/src/routes/` - Routes publiques vs protégées

### STYLE & BONNES PRATIQUES

- **Préserver** : Commentaires français existants
- **Respecter** : Architecture existante (pas de refactoring majeur)
- **Documenter** : Changements significatifs dans le commit message
- **Tester** : Ajouter un smoke test pour chaque bug corrigé

## RÉSULTAT ATTENDU

Un projet FailDaily **entièrement fonctionnel** avec :
- Build frontend qui passe ✅
- Tests backend qui passent ✅  
- ESLint clean (erreurs corrigées) ✅
- API publique accessible sans auth ✅
- Contrat frontend ↔ backend respecté ✅

## COMMANDES DE VÉRIFICATION FINALE

```bash
cd "d:\Web API\FailDaily"

# Test complet
cd frontend && npm run build && echo "✅ Frontend build OK"
cd ../backend-api && npm test && echo "✅ Backend tests OK"  
cd ../backend-api && npm run lint && echo "✅ Lint clean"
cd ../backend-api && timeout 5 node server.js && echo "✅ Server starts"

# Si tout passe → commit et push
git add . && git commit -m "fix: corrige build frontend et tests API publique" && git push origin main
```

**Commence par le build frontend (priorité critique), puis les tests, puis ESLint. Respecte scrupuleusement AGENTS.md !**
