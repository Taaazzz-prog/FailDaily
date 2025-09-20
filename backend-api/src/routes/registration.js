const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { executeQuery, executeTransaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const secureLogger = require('../utils/secureLogger');

const router = express.Router();

async function ensureEmailVerificationTable() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
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
}

async function ensureParentConsentTable() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS parent_consent_tokens (
      id CHAR(36) NOT NULL,
      child_user_id CHAR(36) NOT NULL,
      parent_email VARCHAR(255) NOT NULL,
      token VARCHAR(128) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_token (token),
      KEY idx_child (child_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

/**
 * Route pour vérifier la disponibilité d'un email
 */
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }

    const users = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    res.json({
      success: true,
      exists: users.length > 0
    });

  } catch (error) {
    console.error('❌ Erreur vérification email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'email'
    });
  }
});

/**
 * Route pour vérifier la disponibilité d'un nom d'affichage
 */
router.get('/check-display-name', async (req, res) => {
  try {
    const { displayName } = req.query;

    if (!displayName) {
      return res.status(400).json({
        success: false,
        message: 'Nom d\'affichage requis'
      });
    }

    const users = await executeQuery(
      'SELECT id FROM profiles WHERE display_name = ?',
      [displayName]
    );

    res.json({
      success: true,
      available: users.length === 0,
      exists: users.length > 0
    });

  } catch (error) {
    console.error('❌ Erreur vérification nom d\'affichage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du nom d\'affichage'
    });
  }
});

/**
 * Route pour générer un nom d'affichage unique
 */
router.post('/generate-display-name', async (req, res) => {
  try {
    const { baseDisplayName } = req.body;

    if (!baseDisplayName) {
      return res.status(400).json({
        success: false,
        message: 'Nom de base requis'
      });
    }

    let displayName = baseDisplayName.trim();
    let counter = 1;
    let isUnique = false;

    // Vérifier la disponibilité du nom de base
    const existingUsers = await executeQuery(
      'SELECT id FROM profiles WHERE display_name = ?',
      [displayName]
    );

    if (existingUsers.length === 0) {
      isUnique = true;
    } else {
      // Générer un nom unique en ajoutant un numéro
      while (!isUnique && counter < 1000) {
        const candidateName = `${baseDisplayName} ${counter}`;
        const users = await executeQuery(
          'SELECT id FROM profiles WHERE display_name = ?',
          [candidateName]
        );
        
        if (users.length === 0) {
          displayName = candidateName;
          isUnique = true;
        }
        counter++;
      }
    }

    if (!isUnique) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de générer un nom unique'
      });
    }

    res.json({
      success: true,
      displayName: displayName
    });

  } catch (error) {
    console.error('❌ Erreur génération nom d\'affichage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du nom d\'affichage'
    });
  }
});

/**
 * Route pour valider un code de parrainage
 */
router.get('/validate-referral', async (req, res) => {
  try {
    const { code } = req.query;

    // Pour l'instant, les codes de parrainage ne sont pas implémentés
    // Log du code pour debug futur
    console.log('Code de parrainage reçu:', code);
    
    res.json({
      success: true,
      valid: false,
      message: 'Codes de parrainage non disponibles pour le moment'
    });

  } catch (error) {
    console.error('❌ Erreur validation code parrainage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du code de parrainage'
    });
  }
});

/**
 * Route d'inscription complète
 */
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      displayName,
      birthDate,
      agreeToTerms,
      // _agreeToNewsletter = false, // Non implémenté pour le moment
      referralCode = null,
      parentEmail = null // ✅ Ajout de l'email parent optionnel
    } = req.body;

    // Validation des données
    if (!email || !password || !displayName || !birthDate || !agreeToTerms) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Validation mot de passe
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    // Logique registration_completed selon l'âge (validation faite côté front)
    // Calculer l'âge pour déterminer le statut d'inscription
    const birthDateObj = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }

    // Bloquer < 13 ans
    if (age < 13) {
      // ✅ Log sécurisé
      secureLogger.emailLog('Inscription bloquée - Âge insuffisant', email, `${age} ans`);
      return res.status(400).json({
        success: false,
        message: 'Âge minimum requis: 13 ans',
        code: 'AGE_RESTRICTION'
      });
    }

    // 13-16 ans : besoin autorisation parentale (0)
    // 17+ ans : inscription complète directement (1)
    const registrationCompleted = age >= 17 ? 1 : 0;
    
    console.log(`ℹ️ Inscription - Âge: ${age} ans, registrationCompleted: ${registrationCompleted}`);

    // Vérifier que l'email n'existe pas déjà
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Vérifier que le nom d'affichage n'existe pas déjà
    const existingDisplayNames = await executeQuery(
      'SELECT id FROM profiles WHERE display_name = ?',
      [displayName]
    );

    if (existingDisplayNames.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ce nom d\'affichage est déjà utilisé'
      });
    }

    // Validation du code de parrainage si fourni
    if (referralCode) {
      // Pour l'instant, on ignore les codes de parrainage car la table n'existe pas
      console.log('⚠️ Code de parrainage ignoré (non implémenté):', referralCode);
    }

    // Transaction pour créer l'utilisateur ET son profil
    const userId = uuidv4();
    
    // Hacher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Utiliser executeTransaction avec un array de requêtes
    try {
      // Préparer toutes les requêtes pour la transaction
      const queries = [
        // Insérer l'utilisateur (déclenchera le trigger users_after_insert qui crée un profil)
        {
          query: `INSERT INTO users (
            id, email, password_hash, role, account_status, registration_step, created_at
          ) VALUES (?, ?, ?, 'user', 'active', 'basic', NOW())`,
          params: [userId, email.toLowerCase(), hashedPassword]
        },
        // Mettre à jour le profil créé par le trigger avec les bonnes données
        {
          query: `UPDATE profiles 
                  SET display_name = ?, 
                      registration_completed = ?,
                      legal_consent = ?,
                      age_verification = ?,
                      updated_at = NOW()
                  WHERE user_id = ?`,
          params: [
            displayName,
            registrationCompleted,
            JSON.stringify({ birthDate, agreeToTerms, acceptedAt: new Date() }),
            JSON.stringify({ birthDate, age, verified: true }),
            userId
          ]
        }
      ];

      // Les codes de parrainage ne sont pas implémentés pour l'instant
      // (table referral_codes inexistante)

  // Attribution de badge/XP désactivée: colonnes et données non garanties dans le schéma actuel

      // Exécuter toutes les requêtes dans une transaction
      await executeTransaction(queries);

      // ✅ Log sécurisé
      secureLogger.emailLog('Utilisateur inscrit', email, `(ID: ${userId})`);

      // Pour les mineurs (13-16 ans), ne pas créer de token et envoyer email parental
      if (registrationCompleted === 0) {
        // ✅ Log sécurisé
        secureLogger.emailLog('Envoi email autorisation parentale', email, `(${age} ans)`);
        
        // TODO: Implémenter l'envoi d'email parental
        // if (parentEmail) {
        //   await sendParentalConsentEmail(parentEmail, displayName, userId);
        // }
        
        return res.status(201).json({
          success: true,
          message: 'Inscription en attente - Autorisation parentale requise',
          requiresParentalConsent: true,
          user: {
            id: userId,
            email: email.toLowerCase(),
            displayName: displayName,
            age: age,
            status: 'pending_parental_consent',
            parentEmail: parentEmail // ✅ Retourner l'email parent si fourni
          }
        });
      }

      // Générer le token JWT SEULEMENT pour les adultes (17+)
      const token = jwt.sign(
        { 
          userId: userId,
          email: email.toLowerCase(),
          displayName: displayName
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      // Récupérer les données utilisateur complètes
      const userQuery = `
        SELECT 
          u.id, u.email,
          u.account_status, u.created_at,
          p.display_name
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = ?
      `;

      const userData = await executeQuery(userQuery, [userId]);
      const user = userData[0];

      // Retourner la réponse de succès POUR LES ADULTES UNIQUEMENT
      res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          accountStatus: user.account_status,
          createdAt: user.created_at
        }
      });

    } catch (error) {
      console.error('❌ Erreur inscription:', error);

      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'Email ou nom d\'affichage déjà utilisé'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'inscription',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (outerError) {
    console.error('❌ Erreur générale inscription:', outerError);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription'
    });
  }
});

/**
 * Route pour renvoyer l'email de vérification
 */
router.post('/resend-verification', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Vérifier si l'utilisateur existe et n'est pas déjà vérifié
    const users = await executeQuery(
      'SELECT email, email_confirmed FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];

    if (user.email_confirmed) {
      return res.status(400).json({
        success: false,
        message: 'Email déjà vérifié'
      });
    }

    // Ici on pourrait implémenter l'envoi d'email
    // Pour l'instant, on simule
    // ✅ Log sécurisé
    secureLogger.emailLog('Email de vérification envoyé', user.email);

    res.json({
      success: true,
      message: 'Email de vérification renvoyé'
    });

  } catch (error) {
    console.error('❌ Erreur renvoi vérification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du renvoi de l\'email de vérification'
    });
  }
});

/**
 * Route pour vérifier l'email avec un token
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de vérification requis'
      });
    }

    // Décoder le token (implementation simplifiée)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      
      await executeQuery(
        'UPDATE users SET email_confirmed = 1, updated_at = NOW() WHERE id = ?',
        [decoded.userId]
      );

      console.log(`✅ Email vérifié pour l'utilisateur ${decoded.userId}`);

      res.json({
        success: true,
        message: 'Email vérifié avec succès'
      });

    } catch (jwtError) {
      console.log('❌ Token JWT invalide:', jwtError.message);
      return res.status(400).json({
        success: false,
        message: 'Token de vérification invalide ou expiré'
      });
    }

  } catch (error) {
    console.error('❌ Erreur vérification email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'email'
    });
  }
});

/**
 * Route pour obtenir les statistiques d'inscription
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await executeQuery(
      `SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN email_confirmed = 1 THEN 1 END) as verified_users,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as users_this_week,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as users_this_month
      FROM users`
    );

    res.json({
      success: true,
      stats: stats[0]
    });

  } catch (error) {
    console.error('❌ Erreur stats inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;

/**
 * Ré-envoi email de vérification
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ success: false, message: 'Email requis' });
    const rows = await executeQuery('SELECT id, email_confirmed FROM users WHERE email = ? LIMIT 1', [String(email).toLowerCase()]);
    // Toujours répondre succès
    res.json({ success: true, message: 'Si cet email existe, un message de vérification a été envoyé' });
    if (rows.length === 0) return;
    if (Number(rows[0].email_confirmed) === 1) return; // déjà confirmé
    const userId = rows[0].id;
    await ensureEmailVerificationTable();
    const token = require('crypto').randomBytes(32).toString('hex');
    const id = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await executeQuery('INSERT INTO email_verification_tokens (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, NOW())', [id, userId, token, expiresAt]);
    try {
      const { sendVerificationEmail } = require('../utils/mailer');
      await sendVerificationEmail(String(email).toLowerCase(), token);
    } catch (e) { console.warn('⚠️ Email verification send failed (ignored):', e?.message); }
  } catch (e) {
    console.error('❌ resend-verification error:', e);
    // réponse déjà envoyée en cas de succès; sinon, envoyer erreur générique
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Erreur envoi vérification' });
  }
});

/**
 * Confirmation de vérification email
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ success: false, message: 'Token requis' });
    await ensureEmailVerificationTable();
    const rows = await executeQuery('SELECT user_id, expires_at, used_at FROM email_verification_tokens WHERE token = ? LIMIT 1', [token]);
    if (rows.length === 0) return res.status(400).json({ success: false, message: 'Token invalide' });
    const rec = rows[0];
    if (rec.used_at) return res.status(400).json({ success: false, message: 'Token déjà utilisé' });
    if (Date.now() > new Date(rec.expires_at).getTime()) return res.status(400).json({ success: false, message: 'Token expiré' });
    await executeTransaction([
      { query: 'UPDATE users SET email_confirmed = 1, updated_at = NOW() WHERE id = ?', params: [rec.user_id] },
      { query: 'UPDATE email_verification_tokens SET used_at = NOW() WHERE token = ?', params: [token] }
    ]);
    res.json({ success: true, message: 'Email confirmé' });
  } catch (e) {
    console.error('❌ verify-email error:', e);
    res.status(500).json({ success: false, message: 'Erreur confirmation email' });
  }
});

/**
 * Demande de consentement parental
 */
router.post('/parent-consent/request', async (req, res) => {
  try {
    const { childEmail, parentEmail } = req.body || {};
    if (!childEmail || !parentEmail) return res.status(400).json({ success: false, message: 'childEmail et parentEmail requis' });
    const rows = await executeQuery('SELECT id FROM users WHERE email = ? LIMIT 1', [String(childEmail).toLowerCase()]);
    if (rows.length === 0) return res.json({ success: true, message: 'Demande acceptée (si utilisateur existe)' });
    const childId = rows[0].id;
    await ensureParentConsentTable();
    const token = require('crypto').randomBytes(32).toString('hex');
    const id = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await executeQuery('INSERT INTO parent_consent_tokens (id, child_user_id, parent_email, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?, NOW())', [id, childId, parentEmail.toLowerCase(), token, expiresAt]);
    try {
      const { sendParentConsentEmail } = require('../utils/mailer');
      await sendParentConsentEmail(parentEmail.toLowerCase(), childEmail.toLowerCase(), token);
    } catch (e) { console.warn('⚠️ Parent consent email failed (ignored):', e?.message); }
    res.json({ success: true, message: 'Demande de consentement envoyée' });
  } catch (e) {
    console.error('❌ parent-consent/request error:', e);
    res.status(500).json({ success: false, message: 'Erreur demande consentement' });
  }
});

/**
 * Confirmation de consentement parental
 */
router.post('/parent-consent/confirm', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ success: false, message: 'Token requis' });
    await ensureParentConsentTable();
    const rows = await executeQuery('SELECT child_user_id, expires_at, used_at FROM parent_consent_tokens WHERE token = ? LIMIT 1', [token]);
    if (rows.length === 0) return res.status(400).json({ success: false, message: 'Token invalide' });
    const rec = rows[0];
    if (rec.used_at) return res.status(400).json({ success: false, message: 'Token déjà utilisé' });
    if (Date.now() > new Date(rec.expires_at).getTime()) return res.status(400).json({ success: false, message: 'Token expiré' });
    await executeTransaction([
      { query: 'UPDATE users SET account_status = "active", updated_at = NOW() WHERE id = ?', params: [rec.child_user_id] },
      { query: 'UPDATE profiles SET registration_completed = 1, updated_at = NOW() WHERE user_id = ?', params: [rec.child_user_id] },
      { query: 'UPDATE parent_consent_tokens SET used_at = NOW() WHERE token = ?', params: [token] }
    ]);
    res.json({ success: true, message: 'Consentement parental confirmé' });
  } catch (e) {
    console.error('❌ parent-consent/confirm error:', e);
    res.status(500).json({ success: false, message: 'Erreur confirmation consentement' });
  }
});
