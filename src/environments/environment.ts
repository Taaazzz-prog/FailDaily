// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  // Configuration Supabase (développement local)
  supabase: {
    url: 'http://127.0.0.1:54321',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  },

  // Configuration Firebase (désactivée - utilise Supabase)
  firebase: {
    apiKey: 'your-dev-api-key',
    authDomain: 'faildaily-dev.firebaseapp.com',
    projectId: 'faildaily-dev',
    storageBucket: 'faildaily-dev.appspot.com',
    messagingSenderId: '123456789',
    appId: 'your-dev-app-id',
    measurementId: 'G-XXXXXXXXXX'
  },

  // APIs externes
  api: {
    baseUrl: 'http://localhost:3000/api', // API locale en dev
    moderationUrl: 'https://api.openai.com/v1',
    moderationKey: 'your-openai-dev-key',
    uploadMaxSize: 5 * 1024 * 1024, // 5MB max
    imageQuality: 80 // Qualité des images compressées
  },

  // Configuration des notifications
  notifications: {
    vapidKey: 'your-vapid-dev-key',
    reminderTimes: {
      min: 18, // 18h minimum
      max: 22, // 22h maximum
      default: 19 // 19h par défaut
    }
  },

  // Configuration de l'app
  app: {
    name: 'FailDaily (Dev)',
    version: '1.0.0-dev',
    debugMode: true,
    maxFailsPerDay: 10, // Limite en dev pour éviter le spam
    courageHeartCooldown: 1000, // 1 seconde entre réactions en dev
    anonymousMode: true,
    locationEnabled: false // Désactivé en dev pour la vie privée
  },

  // Configuration des badges
  badges: {
    firstFailPoints: 10,
    dailyStreakPoints: 5,
    courageHeartPoints: 2,
    communityHelpPoints: 15
  },

  // Fonctionnalités expérimentales (dev seulement)
  features: {
    voiceNotes: false, // En développement
    groupChallenges: false, // Futur feature
    aiCounselor: false, // IA de conseil
    darkModeAuto: true,
    hapticFeedback: true
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
