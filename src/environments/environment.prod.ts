export const environment = {
  production: true,

  // Configuration Firebase (production)
  firebase: {
    apiKey: 'your-prod-api-key',
    authDomain: 'faildaily.firebaseapp.com',
    projectId: 'faildaily',
    storageBucket: 'faildaily.appspot.com',
    messagingSenderId: '987654321',
    appId: 'your-prod-app-id',
    measurementId: 'G-YYYYYYYYYY'
  },

  // APIs externes
  api: {
    baseUrl: 'https://api.faildaily.com',
    moderationUrl: 'https://api.openai.com/v1',
    moderationKey: 'your-openai-prod-key',
    uploadMaxSize: 3 * 1024 * 1024, // 3MB max en prod
    imageQuality: 75 // Qualité optimisée pour la prod
  },

  // Configuration des notifications
  notifications: {
    vapidKey: 'your-vapid-prod-key',
    reminderTimes: {
      min: 18,
      max: 22,
      default: 19
    }
  },

  // Configuration de l'app
  app: {
    name: 'FailDaily',
    version: '1.0.0',
    debugMode: false,
    maxFailsPerDay: 3, // Limite raisonnable en prod
    courageHeartCooldown: 5000, // 5 secondes entre réactions
    anonymousMode: true,
    locationEnabled: true
  },

  // Configuration des badges
  badges: {
    firstFailPoints: 10,
    dailyStreakPoints: 5,
    courageHeartPoints: 2,
    communityHelpPoints: 15
  },

  // Fonctionnalités (prod)
  features: {
    voiceNotes: false,
    groupChallenges: false,
    aiCounselor: false,
    darkModeAuto: true,
    hapticFeedback: true
  }
};
