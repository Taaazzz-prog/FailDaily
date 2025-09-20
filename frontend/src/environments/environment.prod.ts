// Configuration pour l'environnement de production
export const environment = {
  production: true,
  enableDebugLogs: false, // ✅ Logs de debug DÉSACTIVÉS en production

  // Configuration API pour production
  api: {
    baseUrl: '/api'  // URL relative pour Traefik/reverse proxy
  },

  // Configuration base de données production  
  database: {
    host: 'localhost',
    port: 3306,
    name: 'faildaily',
    charset: 'utf8mb4'
  },

  // Configuration Firebase pour notifications push
  firebase: {
    apiKey: "AIzaSyB5dGWJ3tZcUm5kO8rN6vX2pL4qR9wA3sE",
    authDomain: "faildaily-prod.firebaseapp.com", 
    projectId: "faildaily-prod",
    storageBucket: "faildaily-prod.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
  },

  // Configuration cache et performance
  cache: {
    enabled: true,
    ttl: 300000 // 5 minutes
  },

  // Configuration rate limiting
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limite de requêtes
  }
};
