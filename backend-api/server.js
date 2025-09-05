// backend-api/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const database = require('./src/config/database');
const rateLimitMonitor = require('./src/middleware/rateLimitMonitor');

// Routes (obligatoires)
const authRoutes = require('./src/routes/auth');
const registrationRoutes = require('./src/routes/registration');
const ageVerificationRoutes = require('./src/routes/ageVerification');
const uploadRoutes = require('./src/routes/upload');
const reactionsRoutes = require('./src/routes/reactions');
const commentsRoutes = require('./src/routes/comments');
const logsRoutes = require('./src/routes/logs');
const adminRoutes = require('./src/routes/admin');
const monitoringRoutes = require('./src/routes/monitoring');

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

/* ------------------------ Rate Limiting Multi-Niveaux ------------------------ */

// 🛡️ Protection DDoS - Rate limiting strict par IP
const ddosProtection = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'test' ? 1000 : 200, // 200 req/min par IP
  message: { 
    error: 'Trop de requêtes depuis cette IP. Protection DDoS activée.', 
    code: 'DDOS_PROTECTION',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip, // Explicitement par IP
  skip: (req) => req.path === '/api/health'
});

// 🔐 Protection authentification - Rate limiting par IP pour login/register
const authProtection = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 100 : 10, // 10 tentatives/15min par IP
  message: { 
    error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.', 
    code: 'AUTH_RATE_LIMIT',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  skipSuccessfulRequests: true // Ne compte que les échecs
});

// 📁 Protection upload - Rate limiting par IP pour uploads
const uploadProtection = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: process.env.NODE_ENV === 'test' ? 100 : 20, // 20 uploads/5min par IP
  message: { 
    error: 'Trop d\'uploads depuis cette IP. Réessayez dans 5 minutes.', 
    code: 'UPLOAD_RATE_LIMIT',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip
});

// 🌐 Rate limiting global - Plus permissif pour usage normal
const globalLimiter = rateLimit({
  windowMs: (Number(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: process.env.NODE_ENV === 'test'
    ? 10000
    : (Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 5000), // 5000 req/15min par IP
  message: { 
    error: 'Limite globale de requêtes atteinte. Réessayez plus tard.', 
    code: 'GLOBAL_RATE_LIMIT',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  skip: (req) => req.path === '/api/health'
});

// Application des limiters dans l'ordre (du plus strict au plus permissif)
app.use(rateLimitMonitor.middleware);  // Monitoring des requêtes suspectes
app.use(ddosProtection);        // Protection DDoS globale
app.use('/api/auth/login', authProtection);
app.use('/api/auth/register', authProtection);
app.use('/api/registration/register', authProtection);
app.use('/api/upload', uploadProtection);
app.use(globalLimiter);         // Limite globale

// 📊 Middleware de logging des rate limits (pour monitoring)
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    // Log si rate limit atteint
    if (res.statusCode === 429) {
      console.warn(`🚨 Rate limit exceeded:`, {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      // Signaler au monitoring system
      rateLimitMonitor.trackSuspiciousIP(req.ip, 'rate_limit_exceeded', {
        path: req.path,
        userAgent: req.get('User-Agent')
      });
    }
    originalSend.call(this, data);
  };
  next();
});

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
app.use('/api/monitoring', monitoringRoutes);

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
