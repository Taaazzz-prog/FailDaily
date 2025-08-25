// backend-api/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const database = require('./src/config/database');

// Routes (obligatoires)
const authRoutes = require('./src/routes/auth');
const failRoutes = require('./src/routes/fails');
const registrationRoutes = require('./src/routes/registration');
const ageVerificationRoutes = require('./src/routes/ageVerification');
const uploadRoutes = require('./src/routes/upload');
const reactionsRoutes = require('./src/routes/reactions');
const commentsRoutes = require('./src/routes/comments');
const logsRoutes = require('./src/routes/logs');
const adminRoutes = require('./src/routes/admin');

// Routes (optionnelles)
let failsPublicRoutes = null;
try { failsPublicRoutes = require('./src/routes/failsNew'); } catch (_) {}

let badgesRoutes = null;
try { badgesRoutes = require('./src/routes/badges'); } catch (_) {}

let usersRoutes = null;
try { usersRoutes = require('./src/routes/users'); } catch (_) {}

// Auth middleware (pour les endpoints protégés)
const { authenticateToken } = require('./src/middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

/* ------------------------ Middlewares globaux ------------------------ */
app.use(helmet());

app.use(cors({
  origin: [
    'http://localhost:4200',  // Frontend dev server
    'http://localhost:8100',  // Ionic serve
    'http://localhost:8101',  // Ionic capacitor serve
    'http://localhost',       // Production
    process.env.CORS_ORIGIN || 'http://localhost:4200'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

const limiter = rateLimit({
  windowMs: (Number(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: process.env.NODE_ENV === 'test'
    ? 10000
    : (Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100),
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard', code: 'RATE_LIMIT_EXCEEDED' }
});
app.use(limiter);

app.use(process.env.NODE_ENV === 'development' ? morgan('dev') : morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ---------------------------- Health checks ---------------------------- */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});
app.get('/api/health', (req, res) => res.redirect(307, '/health'));
app.get('/api/info', (req, res) => {
  res.json({
    name: 'FailDaily API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

/* ------------------------------- Routes API ------------------------------- */
app.use('/api/auth', authRoutes);

// Montre en priorité les nouvelles routes Fails (JSON body) avant l'ancienne version multer
if (failsPublicRoutes) app.use('/api/fails', failsPublicRoutes);
app.use('/api/fails', failRoutes);
app.use('/api/fails', reactionsRoutes);
app.use('/api/fails', commentsRoutes);

if (badgesRoutes) app.use('/api/badges', badgesRoutes);
if (usersRoutes) app.use('/api/users', usersRoutes);

app.use('/api/upload', uploadRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/age-verification', ageVerificationRoutes);

app.use('/api/logs', logsRoutes);
app.use('/api/admin/logs', logsRoutes); // compat front
app.use('/api/admin', adminRoutes);

// Exemple d’endpoint protégé
app.get('/api/user/stats', authenticateToken, (req, res) => {
  res.json({
    stats: { totalFails: 0, totalReactions: 0, badges: 0 },
    message: 'Stats endpoint - implementation en cours'
  });
});

/* -------------------------------- Defaults -------------------------------- */
app.get('/', (req, res) => {
  res.json({
    message: 'FailDaily API Server',
    version: '1.0.0',
    status: 'Running',
    endpoints: { health: '/health', auth: '/api/auth', fails: '/api/fails' }
  });
});

/* ----------------------------- Error handling ----------------------------- */
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint non trouvé', code: 'NOT_FOUND', path: req.originalUrl });
});

app.use((error, req, res, next) => {
  console.error('Erreur globale:', error);
  if (error && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Fichier trop volumineux', code: 'FILE_TOO_LARGE' });
  }
  if (error && error.message === 'Seules les images sont autorisées') {
    return res.status(400).json({ error: 'Format de fichier non autorisé', code: 'INVALID_FILE_TYPE' });
  }
  res.status(500).json({ error: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' });
});

/* ------------------------------- Démarrage ------------------------------- */
async function startServer() {
  try {
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

// Gestion propre de l’arrêt
process.on('SIGINT', () => { console.log('\n🛑 Arrêt du serveur en cours...'); process.exit(0); });
process.on('SIGTERM', () => { console.log('\n🛑 Arrêt du serveur demandé...'); process.exit(0); });

// Lancer seulement si exécuté directement
if (require.main === module) {
  startServer();
}

// Export pour tests & smoke CI
module.exports = app;
module.exports.startServer = startServer;
