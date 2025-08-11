/*
 * CONFIGURATION DE L'ENVIRONNEMENT FAILDAILY - DÉVELOPPEMENT LOCAL
 * =================================================================
 * 
 * Ce fichier configure tous les paramètres pour votre environnement de développement local.
 * Les valeurs sensibles (clés API, tokens) sont chargées depuis le fichier .env
 * 
 * Structure:
 * - Supabase: Base de données et authentification (local)
 * - Firebase: Notifications push (optionnel) 
 * - APIs: Modération de contenu et services externes
 * - Notifications: Configuration des notifications push et in-app
 * - App: Comportement général de l'application
 * - Badges: Système de points et récompenses
 * - Features: Fonctionnalités activées/désactivées
 */
export const environment = {
  production: false, // Local development environment

  /*
   * CONFIGURATION SUPABASE (BASE DE DONNÉES)
   * ========================================
   * 
   * Supabase est votre backend principal qui gère:
   * - Base de données PostgreSQL (users, fails, reactions, etc.)
   * - Authentification des utilisateurs
   * - Storage pour les images/fichiers
   * - APIs auto-générées
   * 
   * url: URL de votre instance Supabase (local = 127.0.0.1:54321)
   * anonKey: Clé publique pour les requêtes non-authentifiées
   */
  supabase: {
    url: process.env['SUPABASE_URL'] || 'http://127.0.0.1:54321',
    anonKey: process.env['SUPABASE_ANON_KEY'] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IjEyNy4wLjAuMSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQxMzQ4NjAyLCJleHAiOjE5NTY5MjQ2MDJ9.L4Ejx8F_yYR1UiVlppL7cNW_Jn-SvpGLSPxgTz6a1VU'
  },

  /*
   * CONFIGURATION FIREBASE (NOTIFICATIONS PUSH)
   * ============================================
   * 
   * Firebase est utilisé uniquement pour les notifications push.
   * Supabase gère la base de données, Firebase gère les notifications.
   * 
   * Ces paramètres connectent votre app au service Firebase Cloud Messaging (FCM)
   * qui permet d'envoyer des notifications même quand l'app est fermée.
   * 
   * Note: Firebase et Supabase coexistent - ils ont des rôles différents.
   */
  firebase: {
    apiKey: process.env['FIREBASE_API_KEY'] || "AIzaSyB5dGWJ3tZcUm5kO8rN6vX2pL4qR9wA3sE",
    authDomain: process.env['FIREBASE_AUTH_DOMAIN'] || "faildaily-dev.firebaseapp.com",
    projectId: process.env['FIREBASE_PROJECT_ID'] || "faildaily-dev",
    storageBucket: process.env['FIREBASE_STORAGE_BUCKET'] || "faildaily-dev.appspot.com",
    messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID'] || "123456789012",
    appId: process.env['FIREBASE_APP_ID'] || "1:123456789012:web:abcd1234efgh5678ijklmn"
  },

  /*
   * CONFIGURATION DES APIs EXTERNES
   * ===============================
   * 
   * Cette section configure les services externes utilisés par FailDaily:
   * 
   * baseUrl: URL de base pour vos APIs (même que Supabase en local)
   * moderationUrl: Service de modération de contenu (OpenAI)
   * moderationKey: Clé API pour la modération (filtre les contenus inappropriés)
   * uploadMaxSize: Taille max des fichiers uploadés (5MB en dev, 3MB en prod)
   * imageQuality: Qualité de compression des images (85% en dev, 75% en prod)
   */
  api: {
    baseUrl: process.env['SUPABASE_URL'] || 'http://127.0.0.1:54321',
    moderationUrl: process.env['OPENAI_API_URL'] || 'https://api.openai.com/v1',
    moderationKey: process.env['OPENAI_API_KEY'] || 'sk-proj-placeholder',
    uploadMaxSize: 5 * 1024 * 1024, // 5MB max en dev local
    imageQuality: 85 // Qualité plus élevée pour le dev
  },

  /*
   * CONFIGURATION DES NOTIFICATIONS
   * ===============================
   * 
   * Gère tous les types de notifications dans FailDaily:
   * 
   * vapidKey: Clé publique VAPID pour l'authentification des notifications push
   * enablePush: Active les notifications push (quand l'app est fermée)
   * enableInApp: Active les notifications dans l'app (toasts, alertes)
   * debugMode: Mode debug pour voir les logs détaillés des notifications
   * retryAttempts: Nombre de tentatives si l'envoi échoue
   * retryDelay: Délai entre les tentatives (2 sec en dev, 5 sec en prod)
   */
  notifications: {
    vapidKey: process.env['VAPID_PUBLIC_KEY'] || 'BGL5gTu-oa7S2smCb362qdg1h1o0JJGGP1LPCZE6A7mtwecEftMqWGt_TPrqNBSYp4Li09FiUjo_1WHtpLIelng',
    enablePush: true,
    enableInApp: true,
    debugMode: true, // Mode debug activé pour le dev local
    retryAttempts: 3,
    retryDelay: 2000
  },

  /*
   * CONFIGURATION DE L'APPLICATION
   * ==============================
   * 
   * Paramètres généraux qui contrôlent le comportement de FailDaily:
   * 
   * name: Nom affiché dans l'app ('FailDaily Dev' pour différencier du prod)
   * version: Version de l'app pour le suivi et debug
   * debugMode: Active les logs détaillés et outils de développement
   * maxFailsPerDay: Limite quotidienne de posts (10 en dev, 3 en prod)
   * courageHeartCooldown: Délai entre les réactions cœur (1 sec en dev, 5 sec en prod)
   * anonymousMode: Permet aux users de poster anonymement
   * locationEnabled: Active/désactive la géolocalisation (off en dev pour éviter les popups)
   */
  app: {
    name: 'FailDaily Dev',
    version: '1.0.0-local',
    debugMode: true, // Debug activé pour le dev local
    maxFailsPerDay: 10, // Limite plus élevée pour les tests
    courageHeartCooldown: 1000, // 1 seconde pour les tests
    anonymousMode: true,
    locationEnabled: false // Désactivé en dev local
  },

  /*
   * SYSTÈME DE BADGES ET POINTS
   * ===========================
   * 
   * Configure le système de gamification de FailDaily:
   * Chaque action donne des points qui débloquent des badges.
   * 
   * firstFailPoints: Points pour le premier fail posté (encourager à commencer)
   * dailyStreakPoints: Points pour poster tous les jours (habitude)
   * courageHeartPoints: Points pour donner du courage aux autres (entraide)
   * communityHelpPoints: Points pour aider la communauté (modération, support)
   * 
   * Ces points motivent les utilisateurs et créent de l'engagement.
   */
  badges: {
    firstFailPoints: 10,
    dailyStreakPoints: 5,
    courageHeartPoints: 2,
    communityHelpPoints: 15
  },

  /*
   * FONCTIONNALITÉS EXPÉRIMENTALES
   * ==============================
   * 
   * Active/désactive les fonctionnalités avancées de FailDaily.
   * En développement, tout est activé pour pouvoir tester.
   * En production, certaines features peuvent être désactivées.
   * 
   * voiceNotes: Messages vocaux dans les fails (nécessite micro)
   * groupChallenges: Défis en groupe entre utilisateurs
   * aiCounselor: Conseiller IA qui analyse les fails et donne des conseils
   * darkModeAuto: Mode sombre automatique selon l'heure
   * hapticFeedback: Vibrations sur les interactions (mobile)
   * 
   * Ces features ajoutent de la valeur mais peuvent être désactivées 
   * si elles consomment trop de ressources ou ne sont pas prêtes.
   */
  features: {
    voiceNotes: true, // Activées pour les tests
    groupChallenges: true, // Activées pour les tests
    aiCounselor: true, // Activées pour les tests
    darkModeAuto: true,
    hapticFeedback: true
  }
};
