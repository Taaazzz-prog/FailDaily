const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const database = require('./src/config/database');

// Import des routes
const authRoutes = require('./src/routes/auth');
const failRoutes = require('./src/routes/fails');
const registrationRoutes = require('./src/routes/registration');
const ageVerificationRoutes = require('./src/routes/ageVerification');
const uploadRoutes = require('./src/routes/upload');
const reactionsRoutes = require('./src/routes/reactions');
const commentsRoutes = require('./src/routes/comments');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de sécurité
app.use(helmet());

// Configuration CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8100',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use(limiter);

// Logging des requêtes
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/fails', failRoutes);
app.use('/api/fails', reactionsRoutes);
app.use('/api/fails', commentsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/age-verification', ageVerificationRoutes);

// Route temporaire pour les stats utilisateur
app.get('/api/user/stats', require('./src/middleware/auth').authenticateToken, (req, res) => {
  res.json({
    stats: {
      totalFails: 0,
      totalReactions: 0,
      badges: 0
    },
    message: 'Stats endpoint - implementation en cours'
  });
});

// Route par défaut
app.get('/', (req, res) => {
  res.json({
    message: 'FailDaily API Server',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      fails: '/api/fails'
    }
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint non trouvé',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Gestion globale des erreurs
app.use((error, req, res, next) => {
  console.error('Erreur globale:', error);

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'Fichier trop volumineux',
      code: 'FILE_TOO_LARGE'
    });
  }

  if (error.message === 'Seules les images sont autorisées') {
    return res.status(400).json({
      error: 'Format de fichier non autorisé',
      code: 'INVALID_FILE_TYPE'
    });
  }

  res.status(500).json({
    error: 'Erreur interne du serveur',
    code: 'INTERNAL_ERROR'
  });
});

// Démarrage du serveur
async function startServer() {
  try {
    // Test de la connexion à la base de données
    const dbConnected = await database.testConnection();
    
    if (!dbConnected) {
      console.error('❌ Impossible de se connecter à la base de données');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log('🚀 FailDaily API Server démarré !');
      console.log(`📡 Serveur: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Base de données: ${process.env.DB_NAME || 'faildaily'}`);
      console.log(`📁 Uploads: ${path.join(__dirname, 'uploads')}`);
      console.log('✅ Prêt à recevoir des requêtes !');
    });

  } catch (error) {
    console.error('❌ Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
}

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur en cours...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur demandé...');
  process.exit(0);
});

startServer();
