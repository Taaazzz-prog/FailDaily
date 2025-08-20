# FailDaily Frontend

Application mobile Ionic/Angular pour FailDaily.

## 🚀 Démarrage rapide

```bash
# Installation des dépendances
npm install

# Lancement en mode développement
ionic serve

# Build de production
ionic build
```

## 📱 Compilation Mobile

### Android
```bash
# Synchroniser avec Capacitor
ionic capacitor sync android

# Build Android
ionic capacitor build android

# Lancer sur appareil/émulateur
ionic capacitor run android
```

### iOS
```bash
# Synchroniser avec Capacitor
ionic capacitor sync ios

# Build iOS
ionic capacitor build ios

# Lancer sur appareil/simulateur
ionic capacitor run ios
```

## 🔧 Configuration

### Variables d'environnement
Copiez `.env.example` vers `.env` et configurez :

```bash
cp .env.example .env
```

### API Backend
L'application communique avec l'API backend via :
- **URL locale** : `http://localhost:3001`
- **API Base** : `http://localhost:3001/api`

## 📁 Structure

```
src/
├── app/                    # Code principal Angular
│   ├── components/        # Composants réutilisables
│   ├── pages/            # Pages de l'application
│   ├── services/         # Services Angular
│   └── models/           # Modèles TypeScript
├── assets/               # Assets statiques
├── theme/               # Styles SCSS
└── environments/        # Configuration par environnement
```

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests e2e
npm run e2e
```

## 📚 Documentation

- [Guide Ionic](https://ionicframework.com/docs)
- [Documentation Angular](https://angular.io/docs)
- [Capacitor](https://capacitorjs.com/docs)
