# 🔐 Guide de Sécurité - FailDaily

## ⚠️ Variables d'Environnement Sensibles

Ce projet utilise un système de configuration sécurisée pour protéger les clés API et autres informations sensibles.

### 🛡️ Fichiers de Sécurité

| Fichier                 | Statut Git   | Description                  |
| ----------------------- | ------------ | ---------------------------- |
| `.env`                  | ❌ **IGNORÉ** | Variables réelles (SENSIBLE) |
| `.env.example`          | ✅ Committé   | Template public              |
| `config.service.ts`     | ✅ Committé   | Service de configuration     |
| `environment.secure.ts` | ✅ Committé   | Environment sans clés        |

---

## 🚀 Setup Initial

### 1. Copier le template
```bash
cp .env.example .env
```

### 2. Compléter les variables dans `.env`
```bash
# Supabase (déjà configuré pour local)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...

# OpenAI (votre clé)
OPENAI_API_KEY=sk-proj-votre-cle-ici

# VAPID (déjà générées)
VAPID_PUBLIC_KEY=BGL5gTu-oa7S2smCb362q...
VAPID_PRIVATE_KEY=lbP15j3aPKsQJU1SLEI...
```

### 3. Vérifier que `.env` est ignoré par Git
```bash
git status
# .env ne doit PAS apparaître dans les fichiers à committer
```

---

## 🔧 Utilisation dans le Code

### ❌ Ancien système (NON SÉCURISÉ)
```typescript
import { environment } from '../environments/environment.prod';
// Problème: clés visibles dans le code
const apiKey = environment.api.moderationKey;
```

### ✅ Nouveau système (SÉCURISÉ)
```typescript
import { ConfigService } from './services/config.service';

@Component({...})
export class MyComponent {
  constructor(private config: ConfigService) {}

  async makeApiCall() {
    const apiKey = this.config.api.moderationKey; // Chargé depuis .env
    // ...
  }
}
```

---

## 🏗️ Build et Déploiement

### Développement Local
```bash
# Les variables sont chargées depuis .env automatiquement
npm start
```

### Production
```bash
# Les variables doivent être définies sur le serveur
export OPENAI_API_KEY="sk-proj-prod-key-here"
export VAPID_PRIVATE_KEY="production-vapid-key"
npm run build --prod
```

---

## 🔍 Debug et Validation

### Vérifier la configuration
```typescript
// Dans votre composant
ngOnInit() {
  this.config.debugConfiguration(); // Affiche la config (sans clés)
  
  const validation = this.config.validateConfiguration();
  if (!validation.valid) {
    console.error('Clés manquantes:', validation.missing);
  }
}
```

### Logs de debug
```bash
# Dans la console du navigateur
🔧 Configuration FailDaily
  Environment: development
  Supabase URL: http://127.0.0.1:54321
  Debug Mode: true
  Features: {voiceNotes: true, ...}
```

---

## ⚠️ Règles de Sécurité

### ✅ À FAIRE
- Utiliser `ConfigService` pour toutes les clés sensibles
- Vérifier que `.env` est dans `.gitignore`
- Documenter les nouvelles variables dans `.env.example`
- Utiliser des variables différentes pour dev/staging/prod

### ❌ À NE JAMAIS FAIRE
- Committer des clés dans Git
- Hard-coder des clés dans le code
- Partager le fichier `.env` par email/Slack
- Utiliser les mêmes clés en dev et prod

---

## 🔧 Variables Disponibles

### Obligatoires
```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
VAPID_PUBLIC_KEY=BGL5gTu-oa7S2smCb...
```

### Optionnelles
```bash
OPENAI_API_KEY=sk-proj-... # Pour la modération IA
FIREBASE_API_KEY=AIza... # Pour les notifications Firebase
GOOGLE_PERSPECTIVE_API_KEY=AIza... # Alternative de modération
```

---

## 🚨 En Cas de Compromission

Si une clé a été exposée :

1. **Révoquer immédiatement** la clé sur le service concerné
2. **Générer une nouvelle clé**
3. **Mettre à jour** `.env` avec la nouvelle clé
4. **Redéployer** si nécessaire
5. **Vérifier les logs** pour usage malveillant

---

## 📞 Support

En cas de problème avec la configuration :
1. Vérifier que `.env` existe et contient les bonnes valeurs
2. Contrôler que `.gitignore` inclut `.env`
3. Utiliser `config.validateConfiguration()` pour diagnostiquer
4. Consulter les logs de debug avec `config.debugConfiguration()`
