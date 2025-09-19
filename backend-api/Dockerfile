# Dockerfile pour backend-api (Node.js/Express)
FROM node:22-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier le reste du code source
COPY . .

# Exposer le port de l’API
EXPOSE 3000

# Variables d’environnement (à surcharger via docker-compose)
ENV NODE_ENV=production

# Commande de démarrage
CMD ["node", "server.js"]
