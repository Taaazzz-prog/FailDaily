# SPÉCIFICATIONS D'ENVIRONNEMENT FAILDAILY

## Environnements Supportés

### 🖥️ **Production (OVH)**
- **URL** : https://faildaily.com
- **API PowerPoint** : https://api.faildaily.com
- **Infrastructure** : Traefik + Docker + MySQL
- **Node.js** : 24.4.1
- **SSL** : Let's Encrypt automatique

### 🛠️ **Développement (Local)**
- **Frontend** : localhost:8100 (Ionic serve)
- **Backend** : localhost:3000 (Node.js)
- **Base de données** : localhost:3307 (MySQL Docker)

### 📋 **Configuration Requise**
- Node.js 24.4.1+
- Docker & Docker Compose
- Git
- MySQL 8.0+

### 🔧 **Variables d'Environnement**
Voir `.env.example` pour la configuration complète.
