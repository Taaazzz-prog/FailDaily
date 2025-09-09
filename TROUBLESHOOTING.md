# 🔧 Guide de Dépannage - FailDaily

## 🚨 **Problèmes Fréquents et Solutions**

### 🐳 **Problèmes Docker**

#### ❌ **Conteneurs qui ne démarrent pas**
```bash
# Diagnostic
docker-compose ps
docker-compose logs

# Solutions
docker-compose down --remove-orphans
docker system prune -f
.\docker\start-local.ps1 --rebuild
```

#### ❌ **Port déjà utilisé**
```bash
# Vérifier les ports occupés
netstat -ano | findstr :3000
netstat -ano | findstr :8080

# Libérer les ports
npx kill-port 3000
npx kill-port 8080
```

#### ❌ **Base de données non accessible**
```bash  
# Vérifier MySQL
.\docker\status.ps1

# Redémarrer MySQL
docker-compose restart mysql

# Import manuel de la DB
.\docker\sync-from-ovh.ps1 -ServerHost "IP" -ServerUser "user" --with-data
```

---

### 🚀 **Problèmes Backend (API)**

#### ❌ **API non accessible (http://localhost:3000)**
```bash
# Vérifier le statut
curl http://localhost:3000/health

# Redémarrer le backend
npm run dev:backend

# Vérifier les logs
cat backend-api/logs/app.log
```

#### ❌ **Erreurs d'authentification**
```bash
# Vérifier la configuration JWT
grep JWT_SECRET backend-api/.env

# Tester l'authentification
node test-frontend-backend-communication.js

# Nettoyer les tokens
localStorage.clear() # Dans la console du navigateur
```

#### ❌ **Erreurs de base de données**
```bash
# Vérifier la connexion DB
node backend-api/tests/1_database/1.1_connection-test.js

# Vérifier la structure
node backend-api/tests/1_database/1.2_structure-test.js

# Réimporter la DB
mysql -u root -p faildaily < faildaily.sql
```

---

### 📱 **Problèmes Frontend (Angular/Ionic)**

#### ❌ **Frontend non accessible (http://localhost:8080)**
```bash
# Redémarrer Ionic
npm run dev:frontend

# Vérifier les dépendances  
cd frontend && npm install

# Clear cache
npx ionic build --clean
```

#### ❌ **Erreurs CORS**
```bash
# Vérifier la configuration CORS backend
grep CORS backend-api/src/middleware/cors.js

# Redémarrer backend avec CORS debug
DEBUG=cors npm run dev:backend
```

#### ❌ **Build qui échoue**
```bash
# Vérifier les erreurs TypeScript
cd frontend && npx ng build --verbose

# Corriger les erreurs ESLint
npm run lint:frontend -- --fix

# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

### 🏆 **Problèmes Système de Badges**

#### ❌ **Badges non attribués**
```bash
# Tester le système de badges
node test-badge-system.js

# Vérifier les triggers MySQL
mysql -u root -p faildaily -e "SHOW TRIGGERS;"

# Réinitialiser les badges
node test-badge-creation.js
```

#### ❌ **API badges non fonctionnelle**
```bash
# Tester l'endpoint badges
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/badges

# Vérifier les définitions de badges
node test-badges-endpoint.js
```

---

### 🧪 **Problèmes de Tests**

#### ❌ **Tests qui échouent**
```bash
# Lancer les tests avec détails
node backend-api/tests/run-all-tests.js --verbose

# Tests individuels
node backend-api/tests/2_auth/2.1_registration-test-simple.js
node backend-api/tests/3_fails/3.1_fail-creation-test.js

# Nettoyer les données de test
mysql -u root -p faildaily -e "DELETE FROM users WHERE email LIKE '%test%';"
```

#### ❌ **Tests d'intégration échouent**
```bash
# Vérifier la communication
node test-frontend-backend-communication.js
node test-docker-communication.js

# Vérifier les services  
.\docker\status.ps1
```

---

### 🔐 **Problèmes de Sécurité**

#### ❌ **Rate limiting trop strict**
```bash
# Tester les limites
node test-advanced-rate-limiting.js

# Ajuster la configuration
grep RATE_LIMIT backend-api/.env
```

#### ❌ **Problèmes de modération**
```bash
# Tester la modération
node test-moderation-api.js
node test-moderation-status.js

# Vérifier les statuts
mysql -u root -p faildaily -e "SELECT * FROM fails WHERE moderationStatus IS NOT NULL;"
```

---

## 🔍 **Outils de Diagnostic**

### 📊 **Scripts de Diagnostic**
```bash
# Status complet
.\docker\status.ps1

# Diagnostic API complet
node test-frontend-backend-communication.js

# Diagnostic Docker
node test-docker-communication.js

# Tests complets
node backend-api/tests/run-all-tests.js
```

### 📋 **Logs et Monitoring**
```bash
# Logs Docker
docker-compose logs -f

# Logs Backend
tail -f backend-api/logs/app.log

# Logs Frontend (console navigateur)
# F12 → Console → Rechercher erreurs
```

### 🧰 **Commandes de Maintenance**
```bash
# Nettoyage complet
docker system prune -a -f
npm run clean:all

# Réinstallation complète
rm -rf node_modules
npm install
.\docker\start-local.ps1 --rebuild --with-data

# Reset base de données
mysql -u root -p -e "DROP DATABASE faildaily; CREATE DATABASE faildaily;"
mysql -u root -p faildaily < faildaily.sql
```

---

## 📞 **Support et Ressources**

### 📚 **Documentation**
- [README Principal](README.md)
- [Guide de Démarrage](GETTING_STARTED.md)  
- [Scripts Guide](SCRIPTS_GUIDE.md)
- [API Reference](API_ENDPOINTS.md)

### 🔧 **Outils Utiles**
- **Postman** : Tester l'API
- **MySQL Workbench** : Gérer la base
- **Docker Desktop** : Monitoring conteneurs
- **VS Code** : Développement avec extensions

### 🆘 **En Cas de Blocage**
1. **Redémarrer** tous les services
2. **Nettoyer** le cache et rebuild
3. **Vérifier** les logs d'erreur
4. **Tester** la communication étape par étape
5. **Consulter** cette documentation

---

*Guide mis à jour - Septembre 2025*
