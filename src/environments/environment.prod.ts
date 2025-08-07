export const environment = {
  production: true,

  // Configuration Supabase (production)
  supabase: {
    url: 'https://wzvhqygjkdxqfgwakyjy.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dmhxeWdqa2R4cWZnd2FreWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzA2NjAsImV4cCI6MjA3MDE0NjY2MH0.zJ5wfeVqP2H-WsYkS1hbRCUawrSKS5P-sDs1rvCgUMo'
  },

  // Configuration Firebase (désactivée - utilise Supabase)
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
