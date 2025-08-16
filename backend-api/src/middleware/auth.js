const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

// Middleware d'authentification JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token d\'accès requis',
      code: 'NO_TOKEN' 
    });
  }

  try {
    // Vérifier le JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'utilisateur existe toujours en base
    const users = await executeQuery(
      'SELECT id, email, role, account_status FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Utilisateur introuvable',
        code: 'USER_NOT_FOUND' 
      });
    }

    const user = users[0];

    if (user.account_status !== 'active') {
      return res.status(401).json({ 
        error: 'Compte utilisateur désactivé',
        code: 'USER_INACTIVE' 
      });
    }

    // Ajouter les infos utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expiré',
        code: 'TOKEN_EXPIRED' 
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token invalide',
        code: 'INVALID_TOKEN' 
      });
    }

    console.error('Erreur d\'authentification:', error);
    return res.status(500).json({ 
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR' 
    });
  }
};

// Middleware pour vérifier le rôle admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Accès réservé aux administrateurs',
      code: 'ADMIN_REQUIRED' 
    });
  }
  next();
};

// Middleware optionnel (utilisateur connecté ou non)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const users = await executeQuery(
      'SELECT id, email, role FROM users WHERE id = ? AND account_status = "active"',
      [decoded.userId]
    );

    req.user = users.length > 0 ? users[0] : null;
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
};
