# 🧪 Suite de Tests Backend FailDaily

## 📋 Vue d'ensemble

Cette suite de tests complète vérifie tous les aspects de votre API backend MySQL FailDaily. Les tests sont organisés de manière logique et numérotée pour une exécution séquentielle.

## 🗂️ Structure des Tests

```
tests/
├── 0_test-config.js                    # Configuration globale
├── 1_database/                         # Tests base de données
│   ├── 1.1_connection-test.js         # Connexion MySQL
│   └── 1.2_structure-test.js          # Structure et intégrité
├── 2_auth/                             # Tests authentification
│   ├── 2.1_registration-test.js       # Inscription utilisateur
│   ├── 2.2_login-test.js             # Connexion utilisateur
│   └── 2.3_jwt-verification-test.js   # Vérification JWT
├── 3_fails/                            # Tests gestion des fails
│   ├── 3.1_fail-creation-test.js      # Création de fails
│   └── 3.2_fail-retrieval-test.js     # Récupération de fails
├── 4_integration/                      # Tests d'intégration
│   └── 4.1_complete-integration-test.js # Scénarios complets
└── run-all-tests.js                   # Lanceur principal
```

## 🚀 Exécution des Tests

### Prérequis
- Serveur MySQL démarré (WampServer)
- Base de données `faildaily` créée
- Backend API lancé sur `localhost:3001`

### Commandes

```bash
# Lancer tous les tests
node tests/run-all-tests.js

# Lancer un test spécifique
node tests/1_database/1.1_connection-test.js
node tests/2_auth/2.1_registration-test.js

# Lancer par catégorie
node tests/1_database/1.1_connection-test.js
node tests/1_database/1.2_structure-test.js
```

## 📊 Tests Inclus

### 1. Base de Données (1_database/)

#### 1.1 - Connexion Base de Données
- ✅ Connexion MySQL réussie
- ✅ Tables essentielles présentes
- ✅ Comptage des utilisateurs
- ✅ Validation de la structure

#### 1.2 - Structure et Intégrité
- ✅ Colonnes des tables principales
- ✅ Contraintes de clés étrangères
- ✅ Index de performance
- ✅ Types de données corrects

### 2. Authentification (2_auth/)

#### 2.1 - Inscription Utilisateur
- ✅ Inscription valide avec token JWT
- ✅ Validation email invalide
- ✅ Validation mot de passe trop court
- ✅ Détection email déjà utilisé
- ✅ Validation champs manquants

#### 2.2 - Connexion Utilisateur
- ✅ Connexion valide avec token
- ✅ Format token JWT correct
- ✅ Rejet mot de passe incorrect
- ✅ Rejet email inexistant
- ✅ Validation champs obligatoires

#### 2.3 - Vérification JWT
- ✅ Vérification token valide
- ✅ Rejet token invalide
- ✅ Rejet token manquant
- ✅ Middleware sur routes protégées
- ✅ Format Authorization header

### 3. Gestion des Fails (3_fails/)

#### 3.1 - Création de Fails
- ✅ Création fail valide
- ✅ Validation titre obligatoire
- ✅ Fails publics/privés
- ✅ Validation catégories
- ✅ Authentification requise

#### 3.2 - Récupération de Fails
- ✅ Récupération tous les fails
- ✅ Récupération par ID
- ✅ Filtre fails publics seulement
- ✅ Pagination fonctionnelle
- ✅ Filtre par catégorie
- ✅ Protection accès non autorisé

### 4. Intégration (4_integration/)

#### 4.1 - Tests d'Intégration Complets
- ✅ Scénario utilisateur complet
- ✅ Inscription → Connexion → Création → Récupération
- ✅ Cohérence des données
- ✅ Gestion des sessions
- ✅ Déconnexion et invalidation token

## 📈 Rapports de Tests

### Console Output
Chaque test affiche :
- 🔍 Étape en cours
- ✅ Succès / ❌ Échec
- ℹ️ Informations détaillées
- 📋 Résumé final

### Rapport JSON
`test-report.json` contient :
```json
{
  "timestamp": "2025-08-16T...",
  "duration": 15420,
  "summary": {
    "total": 8,
    "passed": 8,
    "failed": 0,
    "successRate": 100
  },
  "tests": [...]
}
```

## 🔧 Configuration

### Variables d'Environnement (.env)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=faildaily
JWT_SECRET=your-jwt-secret
```

### Configuration Tests (0_test-config.js)
- URLs d'API
- Utilisateurs de test
- Données de test
- Utilitaires communs

## 🐛 Débogage

### Logs Détaillés
Chaque test affiche des logs détaillés avec emojis :
- 🔍 Recherche/Investigation
- ⚡ Connexion/Action rapide
- ✅ Succès
- ❌ Échec
- ⚠️ Avertissement
- ℹ️ Information

### Erreurs Communes

1. **Connexion MySQL échoue**
   - Vérifiez WampServer démarré
   - Base `faildaily` existe
   - Credentials corrects

2. **API non accessible**
   - Backend lancé sur port 3001
   - Aucun firewall bloquant

3. **Tests auth échouent**
   - JWT_SECRET configuré
   - Endpoints auth fonctionnels

## 📝 Utilisation

### Test Rapide
```bash
# Vérification rapide
node tests/1_database/1.1_connection-test.js
```

### Test Complet
```bash
# Suite complète avec rapport
node tests/run-all-tests.js
```

### Test de Développement
```bash
# Test spécifique pendant le dev
node tests/2_auth/2.1_registration-test.js
```

## 🎯 Objectifs

Ces tests garantissent :
- 🔒 **Sécurité** : Authentication et autorisation
- 📊 **Fiabilité** : Toutes les fonctionnalités core
- 🚀 **Performance** : Temps de réponse acceptables
- 🛠️ **Maintenabilité** : Code robuste et testé

---

*Suite de tests FailDaily Backend v1.0* 🧪
