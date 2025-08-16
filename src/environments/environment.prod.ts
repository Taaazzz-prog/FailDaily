/*
 * CONFIGURATION DE L'ENVIRONNEMENT FAILDAILY - PRODUCTION MYSQL
 * ==============================================================
 * 
 * Ce fichier configure tous les paramètres pour votre environnement de production.
 * Les valeurs sensibles (clés API, tokens) sont chargées depuis les variables d'environnement
 * 
 * Structure:
 * - MySQL: Base de données et configuration de production
 * - Firebase: Notifications push uniquement
 * - APIs: Backend Node.js MySQL et services externes
 * - Authentification: JWT tokens et sécurité
 * - Storage: Stockage de fichiers local/cloud
 * - App: Comportement général optimisé pour la production
 * - Features: Fonctionnalités activées en production
 */
export const environment = {
  production: true, // Production environment

  /*
   * CONFIGURATION MYSQL (BASE DE DONNÉES PRODUCTION)
   * =================================================
   * 
   * MySQL est votre backend principal qui gère:
   * - Base de données MySQL (users, fails, reactions, etc.)
   * - Authentification JWT des utilisateurs
   * - Storage pour les images/fichiers
   * - APIs REST Node.js/Express
   */
  database: {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '3306'),
    name: process.env['DB_NAME'] || 'faildaily_prod',
    charset: 'utf8mb4'
  },

  /*
   * CONFIGURATION FIREBASE (NOTIFICATIONS PUSH UNIQUEMENT)
   * =======================================================
   * 
   * Firebase est utilisé uniquement pour les notifications push.
   * MySQL gère la base de données, Firebase gère les notifications.
   */
  firebase: {
    apiKey: process.env['FIREBASE_API_KEY'] || "AIzaSyB5dGWJ3tZcUm5kO8rN6vX2pL4qR9wA3sE",
    authDomain: process.env['FIREBASE_AUTH_DOMAIN'] || "faildaily-prod.firebaseapp.com",
    projectId: process.env['FIREBASE_PROJECT_ID'] || "faildaily-prod",
    storageBucket: process.env['FIREBASE_STORAGE_BUCKET'] || "faildaily-prod.appspot.com",
    messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID'] || "123456789012",
    appId: process.env['FIREBASE_APP_ID'] || "1:123456789012:web:abcd1234efgh5678ijklmn"
  },

  /*
   * CONFIGURATION DES APIs BACKEND MYSQL
   * ====================================
   * 
   * Configuration pour l'API Node.js/Express avec MySQL:
   */
  api: {
    baseUrl: process.env['API_BASE_URL'] || 'https://api.faildaily.com/api',
    moderationUrl: process.env['OPENAI_API_URL'] || 'https://api.openai.com/v1',
    moderationKey: process.env['OPENAI_API_KEY'] || '',
    uploadMaxSize: 3 * 1024 * 1024, // 3MB max en production
    imageQuality: 75, // Qualité optimisée pour la production
    timeout: 30000,
    retryAttempts: 3
  },

  /*
   * CONFIGURATION AUTHENTIFICATION JWT
   * ==================================
   */
  auth: {
    tokenKey: 'auth_token',
    userKey: 'current_user',
    expiresIn: '7d', // 7 jours en production
    refreshThreshold: 3600 // Refresh 1 heure avant expiration
  },

  /*
   * CONFIGURATION DU STORAGE (PRODUCTION)
   * =====================================
   */
  storage: {
    baseUrl: process.env['STORAGE_BASE_URL'] || 'https://storage.faildaily.com',
    uploadsPath: '/uploads',
    maxFileSize: 3 * 1024 * 1024, // 3MB en production
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    compressionQuality: 0.75 // Compression plus agressive en prod
  },

  /*
   * CONFIGURATION DES NOTIFICATIONS
   * ===============================
   */
  notifications: {
    vapidKey: process.env['VAPID_PUBLIC_KEY'] || '',
    enablePush: true,
    enableInApp: true,
    debugMode: false, // Debug désactivé en production
    retryAttempts: 5,
    retryDelay: 5000
  },

  /*
   * CONFIGURATION DE L'APPLICATION PRODUCTION
   * =========================================
   */
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

  /*
   * SYSTÈME DE BADGES ET POINTS (PRODUCTION)
   * ========================================
   */
  badges: {
    firstFailPoints: 10,
    dailyStreakPoints: 5,
    courageHeartPoints: 2,
    communityHelpPoints: 15,
    maxDailyPoints: 50, // Limite plus stricte en prod
    pointsMultiplier: 1.5 // Bonus en production
  },

  /*
   * CONFIGURATION MYSQL PRODUCTION
   * ==============================
   */
  mysql: {
    connectionPoolSize: 50, // Pool plus important en prod
    queryTimeout: 10000, // Timeout plus court en prod
    reconnectAttempts: 5,
    enableQueryLogging: false // Logs désactivés en prod pour performance
  },

  /*
   * FONCTIONNALITÉS PRODUCTION
   * ==========================
   */
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
