const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { executeQuery, executeTransaction } = require('../config/database');
const { logSystem } = require('../utils/logger');
const crypto = require('crypto');

// Fonction utilitaire pour obtenir les informations de l'utilisateur et de la requête
const getUserActivityData = (req, userId, userEmail, userName = null) => {
  const ip = req.headers['x-forwarded-for'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             (req.connection.socket ? req.connection.socket.remoteAddress : '');
  
  const userAgent = req.headers['user-agent'] || '';
  
  return {
    id: uuidv4(),
    user_id: userId,
    user_email: userEmail,
    user_name: userName,
    ip_address: ip,
    user_agent: userAgent,
    created_at: new Date()
  };
};

// Génération du token JWT
const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

async function ensureProfilesTable() {
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id CHAR(36) NOT NULL,
        display_name VARCHAR(100) DEFAULT NULL,
        avatar_url VARCHAR(255) DEFAULT NULL,
        bio TEXT DEFAULT NULL,
        registration_completed TINYINT(1) DEFAULT 0,
        legal_consent LONGTEXT DEFAULT NULL,
        age_verification LONGTEXT DEFAULT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (e) {
    console.warn('⚠️ ensureProfilesTable: impossible de créer la table profiles:', e?.message);
  }
}

async function ensurePasswordResetTable() {
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        token VARCHAR(128) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_token (token),
        KEY idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (e) {
    console.warn('⚠️ ensurePasswordResetTable: impossible de créer la table password_reset_tokens:', e?.message);
  }
}

// Inscription
const register = async (req, res) => {
  try {
    const { email, password, displayName, birthDate, agreeToTerms } = req.body;

    // Validation minimale des données (tests 3.2 utilisent /api/auth/register sans birthDate)
    if (!email || !password || !displayName) {
      return res.status(400).json({
        error: 'Email, mot de passe et nom d\'affichage sont requis',
        code: 'MISSING_FIELDS'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au moins 6 caractères',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Validation âge et logique d'autorisation parentale selon règles COPPA
    let computedAge = null;
    let registrationCompleted = 1; // défaut si aucune date fournie (tests hérités)
    let accountStatus = 'active';
    let ageVerificationMeta = { birthDate: birthDate || null, verified: !!birthDate };

    if (birthDate) {
      const birthDateObj = new Date(birthDate);
      const today = new Date();
      computedAge = today.getFullYear() - birthDateObj.getFullYear();
      const monthDiff = today.getMonth() - birthDateObj.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
        computedAge--;
      }

      // < 13 ans: inscription refusée (aucun profil créé)
      if (computedAge < 13) {
        return res.status(400).json({
          error: 'Âge minimum requis: 13 ans',
          code: 'AGE_RESTRICTION'
        });
      }

      // 13-16 ans: profil créé mais en attente de validation parentale
      if (computedAge >= 13 && computedAge <= 16) {
        registrationCompleted = 0;
        accountStatus = 'pending';
        ageVerificationMeta = {
          birthDate,
          age: computedAge,
          verified: true,
          needsParentalConsent: true,
          parentalConsentStatus: 'pending'
        };
      }

      // >= 17 ans: compte/profil actifs
      if (computedAge >= 17) {
        registrationCompleted = 1;
        accountStatus = 'active';
        ageVerificationMeta = { birthDate, age: computedAge, verified: true };
      }
    }

    // Vérifier si l'email existe déjà
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: 'Cet email est déjà utilisé',
        code: 'EMAIL_EXISTS'
      });
    }

    // S'assurer que la table profiles existe
    await ensureProfilesTable();

    // Vérifier si le nom d'affichage existe déjà
    const existingProfiles = await executeQuery(
      'SELECT user_id FROM profiles WHERE display_name = ?',
      [displayName]
    );

    if (existingProfiles.length > 0) {
      return res.status(409).json({
        error: 'Ce nom d\'utilisateur est déjà pris',
        code: 'DISPLAY_NAME_EXISTS'
      });
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Générer un UUID pour l'utilisateur
  const userId = uuidv4();

    // Transaction : créer utilisateur + profil
  const queries = [
      {
        query: `INSERT INTO users (id, email, password_hash, role, account_status, created_at) 
                VALUES (?, ?, ?, 'user', ?, NOW())`,
        params: [userId, email.toLowerCase(), hashedPassword, accountStatus]
      },
      // Crée ou met à jour le profil selon l'âge
      {
        query: `INSERT INTO profiles (id, user_id, display_name, registration_completed, legal_consent, age_verification, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE 
                  display_name = VALUES(display_name),
                  registration_completed = VALUES(registration_completed),
                  legal_consent = VALUES(legal_consent),
                  age_verification = VALUES(age_verification),
                  updated_at = NOW()`,
        params: [
          uuidv4(),
          userId,
          displayName,
          registrationCompleted,
          JSON.stringify({ birthDate: birthDate || null, agreeToTerms: agreeToTerms ?? true, acceptedAt: new Date() }),
          JSON.stringify(ageVerificationMeta)
        ]
      }
    ];

    await executeTransaction(queries);

    // Générer le token JWT
    const token = generateToken(userId, email);

    // Log de l'inscription avec toutes les données utilisateur
    const activityData = getUserActivityData(req, userId, email.toLowerCase(), displayName);
    await executeQuery(
      'INSERT INTO user_activities (id, user_id, user_email, user_name, action, details, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [activityData.id, activityData.user_id, activityData.user_email, activityData.user_name, 'register', JSON.stringify({ email: email.toLowerCase() }), activityData.ip_address, activityData.user_agent]
    );

    // Log system
    await logSystem({ level: 'info', action: 'user_register', message: 'User registered', details: { email: email.toLowerCase(), displayName }, userId });

    res.status(201).json({
      success: true,
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
      SELECT u.id, u.email, u.password_hash, u.role, u.account_status,
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

    if (user.account_status !== 'active') {
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

    // Log de la connexion avec toutes les données utilisateur
    const activityData = getUserActivityData(req, user.id, user.email, user.display_name);
    await executeQuery(
      'INSERT INTO user_activities (id, user_id, user_email, user_name, action, details, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [activityData.id, activityData.user_id, activityData.user_email, activityData.user_name, 'login', JSON.stringify({ email: user.email }), activityData.ip_address, activityData.user_agent]
    );

    const response = {
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        role: user.role
      },
      token
    };

    console.log('🔐 Réponse de connexion envoyée:', JSON.stringify(response, null, 2));
    await logSystem({ level: 'info', action: 'user_login', message: 'User login', details: { email: user.email }, userId: user.id });
    res.json(response);

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
      success: true,
      valid: true,
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
    // Log de la déconnexion avec toutes les données utilisateur
    const activityData = getUserActivityData(req, req.user.id, req.user.email, req.user.displayName);
    await executeQuery(
      'INSERT INTO user_activities (id, user_id, user_email, user_name, action, details, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [activityData.id, activityData.user_id, activityData.user_email, activityData.user_name, 'logout', JSON.stringify({ reason: 'user_logout' }), activityData.ip_address, activityData.user_agent]
    );

    await logSystem({ level: 'info', action: 'user_logout', message: 'User logout', userId: req.user.id });
    res.json({
      success: true,
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

// Récupérer le profil complet de l'utilisateur
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const userProfile = await executeQuery(`
      SELECT 
        u.id, u.email, u.role, u.account_status, u.created_at,
        p.display_name, p.avatar_url, p.bio,
        p.registration_completed, p.legal_consent, p.age_verification,
        COALESCE(up.points_total, 0) as points_total
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN user_points up ON up.user_id = u.id
      WHERE u.id = ?
    `, [userId]);

    if (userProfile.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profil utilisateur non trouvé',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    const profile = userProfile[0];

    await logSystem({ level: 'info', action: 'profile_get', message: 'Profile fetched', userId });
    const userObj = {
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        bio: profile.bio,
        role: profile.role,
        accountStatus: profile.account_status,
        registrationCompleted: profile.registration_completed,
        legalConsent: profile.legal_consent ? JSON.parse(profile.legal_consent) : null,
        ageVerification: profile.age_verification ? JSON.parse(profile.age_verification) : null,
        createdAt: profile.created_at,
        couragePoints: profile.points_total
      };
    res.json({ success: true, user: userObj, data: userObj });

  } catch (error) {
    console.error('❌ Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      code: 'PROFILE_FETCH_ERROR'
    });
  }
};

// Mettre à jour le profil utilisateur
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { displayName, bio, avatarUrl } = req.body;

    // Validation des données
    if (displayName && displayName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Le nom d\'affichage ne peut pas dépasser 50 caractères',
        code: 'DISPLAY_NAME_TOO_LONG'
      });
    }

    if (bio && bio.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'La bio ne peut pas dépasser 500 caractères',
        code: 'BIO_TOO_LONG'
      });
    }

    // Vérifier si le nom d'affichage est déjà pris (si fourni)
    if (displayName) {
      const existingProfiles = await executeQuery(
        'SELECT id FROM profiles WHERE display_name = ? AND user_id != ?',
        [displayName, userId]
      );

      if (existingProfiles.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Ce nom d\'utilisateur est déjà pris',
          code: 'DISPLAY_NAME_EXISTS'
        });
      }
    }

    // Construire la requête de mise à jour dynamiquement
    const updateFields = [];
    const updateValues = [];

    if (displayName !== undefined) {
      updateFields.push('display_name = ?');
      updateValues.push(displayName);
    }

    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }

    if (avatarUrl !== undefined) {
      updateFields.push('avatar_url = ?');
      updateValues.push(avatarUrl);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée à mettre à jour',
        code: 'NO_UPDATE_DATA'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(userId);

    const updateQuery = `
      UPDATE profiles 
      SET ${updateFields.join(', ')} 
      WHERE user_id = ?
    `;

    await executeQuery(updateQuery, updateValues);
    await logSystem({ level: 'info', action: 'profile_update', message: 'Profile updated', details: { displayName, hasBio: !!bio, hasAvatar: !!avatarUrl }, userId });

    // Récupérer le profil mis à jour
    const updatedProfile = await executeQuery(`
      SELECT 
        u.id, u.email, u.role,
        p.display_name, p.avatar_url, p.bio, p.updated_at
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = ?
    `, [userId]);

    const updated = {
      id: updatedProfile[0].id,
      email: updatedProfile[0].email,
      displayName: updatedProfile[0].display_name,
      avatarUrl: updatedProfile[0].avatar_url,
      bio: updatedProfile[0].bio,
      role: updatedProfile[0].role,
      updatedAt: updatedProfile[0].updated_at
    };
    res.json({ success: true, message: 'Profil mis à jour avec succès', user: updated, data: updated });

  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
};

// Changer le mot de passe
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validation des données
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis',
        code: 'MISSING_PASSWORDS'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Récupérer l'utilisateur avec son mot de passe actuel
    const users = await executeQuery(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe
    await executeQuery(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, userId]
    );

    // Log de l'activité avec toutes les données utilisateur
    const activityData = getUserActivityData(req, userId, users[0].email, users[0].display_name);
    await executeQuery(
      'INSERT INTO user_activities (id, user_id, user_email, user_name, action, details, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [activityData.id, activityData.user_id, activityData.user_email, activityData.user_name, 'password_change', JSON.stringify({}), activityData.ip_address, activityData.user_agent]
    );

    await logSystem({ level: 'info', action: 'password_change', message: 'Password changed', userId });
    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur changement mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
};

// Demande de réinitialisation de mot de passe
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis',
        code: 'MISSING_EMAIL'
      });
    }

    // Vérifier si l'utilisateur existe
    const users = await executeQuery(
      'SELECT id, email FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    // Toujours retourner succès pour des raisons de sécurité
    res.json({
      success: true,
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
    });

    // Si l'utilisateur existe, générer un token et le stocker
    if (users.length > 0) {
      const userId = users[0].id;
      await ensurePasswordResetTable();
      const token = crypto.randomBytes(32).toString('hex');
      const id = uuidv4();
      // expiration dans 1h
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await executeQuery(
        'INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, NOW())',
        [id, userId, token, expiresAt]
      );
      console.log(`🔑 Token de reset généré pour ${email}: ${token} (exp: ${expiresAt.toISOString()})`);
      // Envoi de l'email (si SMTP configuré)
      try {
        const { sendPasswordResetEmail } = require('../utils/mailer');
        const ok = await sendPasswordResetEmail(email.toLowerCase(), token);
        console.log(ok ? '📨 Email de reset envoyé' : '⚠️ Email de reset non envoyé (SMTP non configuré)');
      } catch (e) {
        console.warn('⚠️ Erreur envoi email reset (continuation silencieuse):', e?.message);
      }

      const activityData = getUserActivityData(req, userId, email.toLowerCase(), null);
      await executeQuery(
        'INSERT INTO user_activities (id, user_id, user_email, user_name, action, details, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
        [activityData.id, activityData.user_id, activityData.user_email, activityData.user_name, 'password_reset_request', JSON.stringify({ email }), activityData.ip_address, activityData.user_agent]
      );
      await logSystem({ level: 'info', action: 'password_reset_request', message: 'Password reset requested', details: { email }, userId });
    }

  } catch (error) {
    console.error('❌ Erreur demande reset mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande de réinitialisation',
      code: 'PASSWORD_RESET_REQUEST_ERROR'
    });
  }
};

// Confirmation de réinitialisation de mot de passe avec token
const confirmPasswordReset = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token et nouveau mot de passe requis', code: 'MISSING_FIELDS' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères', code: 'PASSWORD_TOO_SHORT' });
    }

    await ensurePasswordResetTable();
    const rows = await executeQuery(
      'SELECT user_id, expires_at, used_at FROM password_reset_tokens WHERE token = ? LIMIT 1',
      [token]
    );
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Token invalide', code: 'INVALID_TOKEN' });
    }
    const rec = rows[0];
    if (rec.used_at) {
      return res.status(400).json({ success: false, message: 'Token déjà utilisé', code: 'TOKEN_USED' });
    }
    const exp = new Date(rec.expires_at);
    if (Date.now() > exp.getTime()) {
      return res.status(400).json({ success: false, message: 'Token expiré', code: 'TOKEN_EXPIRED' });
    }

    const saltRounds = 12;
    const hashed = await bcrypt.hash(String(newPassword), saltRounds);
    await executeTransaction([
      { query: 'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', params: [hashed, rec.user_id] },
      { query: 'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ?', params: [token] }
    ]);

    await logSystem({ level: 'info', action: 'password_reset_confirm', message: 'Password reset confirmed', userId: rec.user_id });
    return res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('❌ Erreur confirmation reset mot de passe:', error);
    return res.status(500).json({ success: false, message: "Erreur lors de la confirmation de réinitialisation", code: 'PASSWORD_RESET_CONFIRM_ERROR' });
  }
};

module.exports = {
  register,
  login,
  verifyToken,
  logout,
  checkEmail,
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset
  ,confirmPasswordReset
};
