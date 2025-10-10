// Configuration d'environnement unique pour développement et production
// Utilise des URLs relatives (/api) qui fonctionnent avec Traefik en local et en production

export const environment = {
  production: false, // Mode développement (logs visibles)
  enableDebugLogs: true, // ✅ Logs de debug activés en développement

  // Configuration MySQL Database (local)
  database: {
    host: 'localhost',
    port: 3306,
    name: 'faildaily',
    charset: 'utf8mb4'
  },

  // Configuration Firebase (notifications push uniquement)
  firebase: {
    apiKey: "AIzaSyB5dGWJ3tZcUm5kO8rN6vX2pL4qR9wA3sE",
    authDomain: "faildaily-prod.firebaseapp.com",
    projectId: "faildaily-prod",
    storageBucket: "faildaily-prod.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcd1234efgh5678ijklmn"
  },

  // APIs backend MySQL et externes
  api: {
    baseUrl: 'http://localhost:3002/api', // URL directe vers le backend en développement (port 3002)
    moderationUrl: 'https://api.openai.com/v1',
    moderationKey: '', // À remplir avec votre clé OpenAI
    uploadMaxSize: 3 * 1024 * 1024, // 3MB max en production
    imageQuality: 75, // Qualité optimisée pour la production
    timeout: 30000, // 30 secondes timeout
    retryAttempts: 3 // Retry API calls
  },

  // Configuration authentification JWT
  auth: {
    tokenKey: 'auth_token',
    userKey: 'current_user',
    expiresIn: '7d', // 7 jours en production
    refreshThreshold: 3600 // Refresh 1 heure avant expiration
  },

  // Configuration du storage
  storage: {
    baseUrl: '/uploads', // Utilise le même domaine que le frontend
    uploadsPath: '',
    maxFileSize: 3 * 1024 * 1024, // 3MB en production
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    compressionQuality: 0.75 // Compression plus agressive en prod
  },

  // Configuration des notifications
  notifications: {
    vapidKey: '', // À remplir avec votre clé VAPID
    reminderTimes: {
      min: 18, // 18h minimum
      max: 22, // 22h maximum
      default: 19 // 19h par défaut
    },
    enablePush: true,
    enableInApp: true,
    debugMode: false, // Debug désactivé en production
    retryAttempts: 5,
    retryDelay: 5000
  },

  // Configuration de l'app
  app: {
    name: 'FailDaily',
    version: '2.0.0-mysql',
    debugMode: false, // Debug désactivé en production
    maxFailsPerDay: 3, // Limite plus stricte en production
    courageHeartCooldown: 5000, // 5 secondes entre réactions
    anonymousMode: false, // Mode anonyme désactivé en prod
    locationEnabled: true, // Géolocalisation activée en prod
    cacheEnabled: true,
    offlineMode: true // Mode hors ligne activé en prod
  },

  // Configuration des badges et points
  badges: {
    firstFailPoints: 10,
    dailyStreakPoints: 5,
    courageHeartPoints: 2,
    communityHelpPoints: 15,
    maxDailyPoints: 50, // Limite plus stricte en prod
    pointsMultiplier: 1.5 // Bonus en production
  },

  // Configuration MySQL optimisée pour la production
  mysql: {
    connectionPoolSize: 50, // Pool plus important en prod
    queryTimeout: 10000, // Timeout plus court en prod
    reconnectAttempts: 5,
    enableQueryLogging: false // Logs désactivés en prod pour performance
  },

  // Fonctionnalités (optimisées pour la production)
  features: {
    voiceNotes: false, // Désactivé en prod pour l'instant
    groupChallenges: false, // Pas encore prêt pour la prod
    aiCounselor: false, // En développement
    darkModeAuto: true,
    hapticFeedback: true,
    realTimeUpdates: true,
    advancedAnalytics: true,
    betaFeatures: false // Features beta désactivées en prod
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
