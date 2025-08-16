const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { executeQuery, executeTransaction } = require('../config/database');

// Génération du token JWT
const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Inscription
const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Validation des données
    if (!email || !password || !displayName) {
      return res.status(400).json({
        error: 'Email, mot de passe et nom d\'affichage requis',
        code: 'MISSING_FIELDS'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au moins 6 caractères',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Vérifier si l'email existe déjà
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        error: 'Cet email est déjà utilisé',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Générer un UUID pour l'utilisateur
    const userId = uuidv4();
    const profileId = uuidv4();

    // Transaction : créer utilisateur + profil
    const queries = [
      {
        query: `INSERT INTO users (id, email, password_hash, role, is_active, created_at) 
                VALUES (?, ?, ?, 'user', 1, NOW())`,
        params: [userId, email.toLowerCase(), hashedPassword]
      },
      {
        query: `INSERT INTO profiles (id, user_id, display_name, avatar_url, total_points, 
                total_fails, total_badges, settings, created_at) 
                VALUES (?, ?, ?, ?, 0, 0, 0, '{}', NOW())`,
        params: [profileId, userId, displayName, null]
      }
    ];

    await executeTransaction(queries);

    // Générer le token JWT
    const token = generateToken(userId, email);

    // Log de l'inscription
    await executeQuery(
      'INSERT INTO user_activities (id, user_id, activity_type, description, created_at) VALUES (?, ?, ?, ?, NOW())',
      [uuidv4(), userId, 'register', 'Inscription réussie']
    );

    res.status(201).json({
      message: 'Inscription réussie',
      user: {
        id: userId,
        email: email.toLowerCase(),
        displayName,
        role: 'user'
      },
      token
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Connexion
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email et mot de passe requis',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Récupérer l'utilisateur avec son profil
    const users = await executeQuery(`
      SELECT u.id, u.email, u.password_hash, u.role, u.is_active,
             p.display_name, p.avatar_url
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.email = ?
    `, [email.toLowerCase()]);

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Compte utilisateur désactivé',
        code: 'USER_INACTIVE'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Générer le token JWT
    const token = generateToken(user.id, user.email);

    // Log de la connexion
    await executeQuery(
      'INSERT INTO user_activities (id, user_id, activity_type, description, created_at) VALUES (?, ?, ?, ?, NOW())',
      [uuidv4(), user.id, 'login', 'Connexion réussie']
    );

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Vérification du token
const verifyToken = async (req, res) => {
  try {
    // L'utilisateur est déjà vérifié par le middleware auth
    const user = await executeQuery(`
      SELECT u.id, u.email, u.role, p.display_name, p.avatar_url
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = ?
    `, [req.user.id]);

    if (user.length === 0) {
      return res.status(404).json({
        error: 'Utilisateur introuvable',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      user: {
        id: user[0].id,
        email: user[0].email,
        displayName: user[0].display_name,
        avatarUrl: user[0].avatar_url,
        role: user[0].role
      }
    });

  } catch (error) {
    console.error('Erreur vérification token:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Déconnexion (côté client principalement)
const logout = async (req, res) => {
  try {
    // Log de la déconnexion
    await executeQuery(
      'INSERT INTO user_activities (id, user_id, activity_type, description, created_at) VALUES (?, ?, ?, ?, NOW())',
      [uuidv4(), req.user.id, 'logout', 'Déconnexion']
    );

    res.json({
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur déconnexion:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Vérifier si un email existe
const checkEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        error: 'Email requis',
        code: 'MISSING_EMAIL'
      });
    }

    // Vérifier si l'email existe
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    res.json({
      exists: existingUsers.length > 0,
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error('Erreur vérification email:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  register,
  login,
  verifyToken,
  logout,
  checkEmail
};
