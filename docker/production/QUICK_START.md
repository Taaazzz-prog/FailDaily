# 🚀 DÉPLOIEMENT FAILDAILY EN UNE COMMANDE

## Option 1: Déploiement Ultra-Rapide (Recommandé)

```bash
# Copiez-collez cette commande unique sur votre serveur OVH :
curl -fsSL https://raw.githubusercontent.com/VotreRepo/FailDaily/main/docker/production/quick-deploy.sh | bash
```

## Option 2: Déploiement Manuel

```bash
# 1. Installation des dépendances
sudo apt update && sudo apt install -y docker.io docker-compose git

# 2. Clone du projet
git clone https://github.com/VotreRepo/FailDaily.git faildaily
cd faildaily/docker/production

# 3. Configuration
cp .env.example .env
nano .env  # Modifiez JWT_SECRET, DB_PASSWORD, CORS_ORIGIN

# 4. Déploiement
chmod +x deploy.sh && ./deploy.sh
```

## ✅ Après déploiement

Votre application sera accessible sur :
- **Frontend** : http://VOTRE_IP_SERVEUR/
- **API** : http://VOTRE_IP_SERVEUR/api/
- **Health** : http://VOTRE_IP_SERVEUR/health

## 🔧 Gestion après déploiement

```bash
cd faildaily/docker/production

# Voir l'état
./deploy.sh status

# Voir les logs
./deploy.sh logs

# Sauvegarder
./deploy.sh backup

# Redémarrer
./deploy.sh restart

# Mettre à jour
./deploy.sh update
```

## 🆘 En cas de problème

```bash
# Vérifier les logs
./deploy.sh logs

# Reconstruire tout
docker-compose -f docker-compose.prod.yml down
docker system prune -af
./deploy.sh deploy
```
