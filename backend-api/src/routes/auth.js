const express = require('express');
const router = express.Router();
const { register, login, verifyToken, logout, checkEmail } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// POST /api/auth/register - Inscription
router.post('/register', register);

// POST /api/auth/login - Connexion
router.post('/login', login);

// GET /api/auth/verify - Vérification du token
router.get('/verify', authenticateToken, verifyToken);

// POST /api/auth/logout - Déconnexion
router.post('/logout', authenticateToken, logout);

// GET /api/auth/check-email - Vérifier si un email existe
router.get('/check-email', checkEmail);

// GET /api/auth/profile - Récupérer le profil utilisateur (placeholder)
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    user: req.user,
    message: 'Profile endpoint - implementation en cours'
  });
});

// PUT /api/auth/profile - Mettre à jour le profil utilisateur (placeholder)
router.put('/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Profile update endpoint - implementation en cours'
  });
});

module.exports = router;
