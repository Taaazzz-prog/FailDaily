# Build Angular/Ionic
FROM node:24.4.1-alpine AS build
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

# Serve with lightweight HTTP server
FROM node:24.4.1-alpine
RUN npm install -g serve
COPY --from=build /app/www/ /app
WORKDIR /app
EXPOSE 80
CMD ["serve", "-s", ".", "-l", "80"]
