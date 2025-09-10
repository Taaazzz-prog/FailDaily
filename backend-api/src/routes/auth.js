const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  verifyToken, 
  logout, 
  checkEmail,
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset
} = require('../controllers/authController');
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

// GET /api/auth/profile - Récupérer le profil utilisateur complet
router.get('/profile', authenticateToken, getProfile);

// PUT /api/auth/profile - Mettre à jour le profil utilisateur
router.put('/profile', authenticateToken, updateProfile);

// PUT /api/auth/password - Changer le mot de passe
router.put('/password', authenticateToken, changePassword);

// POST /api/auth/password-reset - Demande de réinitialisation de mot de passe
router.post('/password-reset', requestPasswordReset);
// POST /api/auth/password-reset/confirm - Confirmation avec token (nouveau)
router.post('/password-reset/confirm', require('../controllers/authController').confirmPasswordReset);

module.exports = router;
