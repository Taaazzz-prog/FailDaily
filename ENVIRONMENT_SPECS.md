# SPÉCIFICATIONS D'ENVIRONNEMENT FAILDAILY

## Environnements Supportés

### 🖥️ **Production (OVH)**
- **URL** : https://faildaily.com
- **API PowerPoint** : https://api.faildaily.com
- **Infrastructure** : Traefik + Docker + MySQL
- **Node.js** : 24.4.1
- **SSL** : Let's Encrypt automatique
- **Emails (SMTP OVH)** :
  - Hôte: `ssl0.ovh.net`
  - Ports: `465` (SSL) ou `587` (STARTTLS)
  - `SMTP_SECURE`: `true` si port `465`, `false` si `587`
  - Utilisateur: votre boîte (ex: `contact@faildaily.com`)
  - `SMTP_FROM`: `FailDaily <contact@faildaily.com>`
  - Variables mappées: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
  - Lien d’application dans les emails: `APP_WEB_URL=https://faildaily.com`

### 🛠️ **Développement (Local)**
- **Frontend** : localhost:8100 (Ionic serve)
- **Backend** : localhost:3000 (Node.js)
- **Base de données** : localhost:3306 (MySQL)

### 📋 **Configuration Requise**
- Node.js 24.4.1+
- Docker & Docker Compose
- Git
- MySQL 8.0+

### 🔧 **Variables d'Environnement**
- Backend : le serveur charge les variables depuis `backend-api/.env` (via `dotenv`). Les variables au niveau racine (`.env`) ne sont pas lues par le processus Node lancé dans `backend-api/`.
- Frontend : Angular utilise `src/environments/environment.ts` comme source de vérité; les `.env` avec `VITE_` ne sont pas pris en compte par Angular CLI.
- Exemple complet : voir `backend-api/.env.example`.

Clés importantes côté backend :
- `DB_HOST`, `DB_PORT` (3306 par défaut), `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET` (utilisé pour signer les tokens JWT)
- `APP_WEB_URL` (construit les liens dans les emails)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (envoi d’emails)
