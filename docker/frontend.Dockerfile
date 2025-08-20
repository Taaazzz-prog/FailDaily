# Build Angular/Ionic
FROM node:20-alpine AS build
WORKDIR /app

# Copier les fichiers de package
COPY package*.json ./
COPY ionic.config.json ./
COPY angular.json ./
COPY tsconfig*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY src/ ./src/
COPY .browserslistrc ./
COPY .editorconfig ./
COPY .eslintrc.json ./

# Build de production
RUN npm run build --prod

# Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/www/ /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
