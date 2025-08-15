const express = require('express');
const router = express.Router();
const { register, login, verifyToken, logout } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// POST /api/auth/register - Inscription
router.post('/register', register);

// POST /api/auth/login - Connexion
router.post('/login', login);

// GET /api/auth/verify - Vérification du token
router.get('/verify', authenticateToken, verifyToken);

// POST /api/auth/logout - Déconnexion
router.post('/logout', authenticateToken, logout);

module.exports = router;
