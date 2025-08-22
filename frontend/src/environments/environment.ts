// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  // Configuration MySQL Database (développement local)
  database: {
    host: 'localhost',
    port: 3306,
    name: 'faildaily_dev',
    charset: 'utf8mb4'
  },

  // Configuration Firebase (notifications push uniquement)
  firebase: {
    apiKey: 'your-dev-api-key',
    authDomain: 'faildaily-dev.firebaseapp.com',
    projectId: 'faildaily-dev',
    storageBucket: 'faildaily-dev.appspot.com',
    messagingSenderId: '123456789',
    appId: 'your-dev-app-id',
    measurementId: 'G-XXXXXXXXXX'
  },

  // APIs backend MySQL et externes
  api: {
    baseUrl: 'http://localhost:3000/api', // API MySQL backend Node.js
    moderationUrl: 'https://api.openai.com/v1',
    moderationKey: 'your-openai-dev-key',
    uploadMaxSize: 5 * 1024 * 1024, // 5MB max
    imageQuality: 80, // Qualité des images compressées
    timeout: 30000, // 30 secondes timeout
    retryAttempts: 3 // Retry API calls
  },

  // Configuration authentification JWT
  auth: {
    tokenKey: 'faildaily_token',
    userKey: 'current_user',
    expiresIn: '24h',
    refreshThreshold: 300 // Refresh 5 minutes avant expiration
  },

  // Configuration du storage local (système moderne)
  storage: {
    baseUrl: 'http://localhost:3000/storage',
    uploadsPath: '/uploads',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    compressionQuality: 0.8
  },

  // Configuration des notifications
  notifications: {
    vapidKey: 'your-vapid-dev-key',
    reminderTimes: {
      min: 18, // 18h minimum
      max: 22, // 22h maximum
      default: 19 // 19h par défaut
    },
    enablePush: true,
    enableInApp: true,
    retryAttempts: 3
  },

  // Configuration de l'app
  app: {
    name: 'FailDaily (Dev MySQL)',
    version: '2.0.0-dev-mysql',
    debugMode: true,
    maxFailsPerDay: 10, // Limite en dev pour éviter le spam
    courageHeartCooldown: 1000, // 1 seconde entre réactions en dev
    anonymousMode: true,
    locationEnabled: false, // Désactivé en dev pour la vie privée
    cacheEnabled: true,
    offlineMode: false // Mode hors ligne désactivé en dev
  },

  // Configuration des badges et points
  badges: {
    firstFailPoints: 10,
    dailyStreakPoints: 5,
    courageHeartPoints: 2,
    communityHelpPoints: 15,
    maxDailyPoints: 100,
    pointsMultiplier: 1.0 // Dev = pas de bonus
  },

  // Configuration MySQL-spécifique
  mysql: {
    connectionPoolSize: 10,
    queryTimeout: 15000,
    reconnectAttempts: 3,
    enableQueryLogging: true // Pour debug en dev
  },

  // Fonctionnalités expérimentales (dev seulement)
  features: {
    voiceNotes: false, // En développement
    groupChallenges: false, // Futur feature
    aiCounselor: false, // IA de conseil
    darkModeAuto: true,
    hapticFeedback: true,
    realTimeUpdates: true, // WebSocket pour updates temps réel
    advancedAnalytics: true, // Analytics détaillées
    betaFeatures: true // Features beta en dev
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
