# ✅ FailDaily Docker Setup - COMPLET !
# ====================================

**Date de configuration :** 8 septembre 2025
**Status :** ✅ OPÉRATIONNEL

## 🎯 Résumé de l'installation

### Services configurés et fonctionnels :

#### 🗄️ Base de données MySQL 8.0
- **Conteneur :** `faildaily_db`
- **Port :** localhost:3308
- **Utilisateur :** root / faildaily_root_password_local
- **Base :** faildaily
- **Tables :** 27 tables (structure complète de production OVH)
- **Source :** Synchronisé depuis le serveur OVH (51.75.55.185)

#### 🔧 Backend API Node.js
- **Conteneur :** `faildaily_backend`
- **Port :** localhost:3001
- **Endpoint de santé :** http://localhost:3001/api/health
- **Status :** ✅ Opérationnel

#### 🌐 Frontend Angular/Ionic
- **Conteneur :** `faildaily_frontend`
- **Port :** localhost:8081
- **URL :** http://localhost:8081
- **Status :** ✅ Opérationnel

## 📊 Structure de base de données (27 tables)

### Tables principales :
- `users` - Utilisateurs
- `fails` - Publications d'échecs
- `comments` - Commentaires
- `badges` - Badges obtenus
- `reactions` - Réactions aux publications

### Tables de modération :
- `comment_moderation` - Modération des commentaires
- `fail_moderation` - Modération des fails
- `comment_reports` - Signalements de commentaires
- `fail_reports` - Signalements de fails

### Tables de métadonnées :
- `badge_definitions` - Définitions des badges
- `user_badges` - Attribution des badges
- `user_points` - Système de points
- `user_point_events` - Événements de points

### Tables système :
- `activity_logs` - Logs d'activité
- `system_logs` - Logs système
- `app_config` - Configuration de l'application
- `user_management_logs` - Logs de gestion utilisateur

### Tables légales :
- `legal_documents` - Documents légaux
- `user_legal_acceptances` - Acceptations légales
- `parental_consents` - Consentements parentaux

### Tables de profil :
- `profiles` - Profils utilisateur
- `user_profiles_complete` - Profils complets
- `user_preferences` - Préférences utilisateur
- `user_activities` - Activités utilisateur

### Tables de réactions :
- `reactions` - Réactions
- `comment_reactions` - Réactions aux commentaires
- `reaction_logs` - Logs de réactions
- `fail_reactions_archive` - Archive des réactions aux fails

## 🔧 Commandes utiles

### Status complet
```powershell
cd "d:\Web API\FailDaily\docker"
.\status.ps1
```

### Accès aux services
- **Frontend :** [http://localhost:8081](http://localhost:8081)
- **API :** [http://localhost:3001/api/health](http://localhost:3001/api/health)
- **Base de données :** localhost:3308

### Gestion des conteneurs
```bash
# Voir les conteneurs actifs
docker ps --filter "name=faildaily"

# Arrêter tous les services
docker-compose down

# Redémarrer avec reconstruction
docker-compose up -d --build

# Voir les logs d'un service
docker logs faildaily_backend
docker logs faildaily_frontend
docker logs faildaily_db
```

### Accès à la base de données
```bash
# Connexion MySQL
docker exec -it faildaily_db mysql -u root -pfaildaily_root_password_local faildaily

# Compter les tables
docker exec faildaily_db mysql -u root -pfaildaily_root_password_local -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='faildaily';"

# Lister toutes les tables
docker exec faildaily_db mysql -u root -pfaildaily_root_password_local faildaily -e "SHOW TABLES;"
```

## 🔄 Synchronisation OVH

### Mettre à jour depuis le serveur OVH
```powershell
cd "d:\Web API\FailDaily\docker"
.\sync-from-ovh.ps1 -ServerIP "51.75.55.185" -Username "taaazzz" -FullData
```

### Informations du serveur OVH
- **IP :** 51.75.55.185
- **Utilisateur :** taaazzz
- **Conteneur MySQL :** faildaily-db-ssl
- **Base :** faildaily

## 🎉 Environnement prêt !

Votre environnement de développement FailDaily est maintenant **identique** à la production OVH :
- ✅ Base de données complète (27 tables)
- ✅ Structure identique au serveur OVH
- ✅ Services tous opérationnels
- ✅ Configuration optimisée pour le développement

Vous pouvez maintenant développer en local avec la certitude d'avoir le même environnement qu'en production !
