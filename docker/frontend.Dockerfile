# Build Angular/Ionic
FROM node:20-alpine AS build
WORKDIR /app

# Copier les fichiers de package depuis le contexte racine
COPY frontend/package*.json ./
COPY frontend/ionic.config.json ./
COPY frontend/angular.json ./
COPY frontend/tsconfig*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY frontend/src/ ./src/
COPY frontend/.browserslistrc ./
COPY frontend/.editorconfig ./
COPY frontend/.eslintrc.json ./

# Build pour Docker (production sans optimisations CSS agressives)
ENV NODE_OPTIONS="--max_old_space_size=4096"
RUN npm run build:docker

# Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/www/ /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
