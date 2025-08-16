const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { executeQuery, executeTransaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

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
 * Route pour valider un code de parrainage
 */
router.get('/validate-referral', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.json({
        success: true,
        valid: false,
        message: 'Code de parrainage optionnel'
      });
    }

    // Vérifier si le code existe et est actif
    const referrals = await executeQuery(
      
      `SELECT r.*, u.display_name 
       FROM referral_codes r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.code = ? AND r.is_active = 1 AND r.expires_at > NOW()`,
      [code]
    );

    if (referrals.length === 0) {
      return res.json({
        success: true,
        valid: false,
        message: 'Code de parrainage invalide ou expiré'
      });
    }

    const referral = referrals[0];

    res.json({
      success: true,
      valid: true,
      referral: {
        code: referral.code,
        referrer_name: referral.display_name,
        bonus_xp: referral.bonus_xp || 50
      }
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
      agreeToNewsletter = false,
      referralCode = null
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

    // Validation âge
    const birthDateObj = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }

    if (age < 13) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez avoir au moins 13 ans pour vous inscrire'
      });
    }

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
    let referralData = null;
    if (referralCode) {
      const referrals = await executeQuery(
        
        `SELECT r.*, u.id as referrer_id 
         FROM referral_codes r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.code = ? AND r.is_active = 1 AND r.expires_at > NOW()`,
        [referralCode]
      );

      if (referrals.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Code de parrainage invalide ou expiré'
        });
      }

      referralData = referrals[0];
    }

    // Transaction pour créer l'utilisateur ET son profil
    const { v4: uuidv4 } = require('uuid');
    const userId = uuidv4();
    const profileId = uuidv4();
    
    // Hacher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Exécuter les requêtes dans une transaction
    await connection.query('START TRANSACTION');
    
    try {
      // Insérer l'utilisateur
      const userResult = await executeQuery(
        connection,
        `INSERT INTO users (
          id, email, password_hash, role, account_status, registration_step, created_at
        ) VALUES (?, ?, ?, 'user', 'active', 'basic', NOW())`,
        [userId, email.toLowerCase(), hashedPassword]
      );

      // Créer le profil utilisateur
      await executeQuery(
        connection,
        `INSERT INTO profiles (
          id, user_id, display_name, avatar_url, registration_completed, 
          legal_consent, age_verification, created_at
        ) VALUES (?, ?, ?, NULL, 1, ?, ?, NOW())`,
        [
          profileId, 
          userId, 
          displayName, 
          JSON.stringify({ birthDate, agreeToTerms }), 
          JSON.stringify({ birthDate, verified: true })
        ]
      );

      // Traiter le parrainage si applicable
      if (referralData) {
        // Enregistrer la relation de parrainage
        await executeQuery(
          connection,
          `INSERT INTO user_referrals (
            referrer_id, referred_id, referral_code, bonus_xp, 
            created_at
          ) VALUES (?, ?, ?, ?, NOW())`,
          [referralData.referrer_id, userId, referralCode, referralData.bonus_xp || 50]
        );

        // Donner les XP de bonus au parrain
        await executeQuery(
          connection,
          'UPDATE users SET xp = xp + ? WHERE id = ?',
          [referralData.bonus_xp || 50, referralData.referrer_id]
        );

        // Donner les XP de bonus au nouveau membre
        await executeQuery(
          connection,
          'UPDATE users SET xp = xp + ? WHERE id = ?',
          [25, userId] // Moitié des XP pour le nouveau membre
        );

        // Incrémenter le compteur d'utilisations du code
        await executeQuery(
          connection,
          'UPDATE referral_codes SET used_count = used_count + 1 WHERE id = ?',
          [referralData.id]
        );
      }

      // Attribuer le badge "Bienvenue"
      const welcomeBadge = await executeQuery(
        connection,
        'SELECT id FROM badges WHERE name = "Bienvenue" AND is_active = 1',
        []
      );

      if (welcomeBadge.length > 0) {
        await executeQuery(
          connection,
          `INSERT INTO user_badges (
            user_id, badge_id, earned_at, xp_earned
          ) VALUES (?, ?, NOW(), ?)`,
          [userId, welcomeBadge[0].id, 5]
        );

        // Ajouter les XP du badge
        await executeQuery(
          connection,
          'UPDATE users SET xp = xp + 5 WHERE id = ?',
          [userId]
        );
      }

      // Valider la transaction
      await connection.query('COMMIT');
      
      console.log(`✅ Utilisateur inscrit: ${email} (ID: ${userId})`);

      // Générer le token JWT
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
          u.id, u.email, u.xp, u.level, u.avatar_url,
          u.account_status, u.created_at,
          p.display_name
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = ?
      `;

      const userData = await executeQuery(connection, userQuery, [userId]);
      const user = userData[0];

      console.log(`✅ Utilisateur inscrit: ${email} (ID: ${userId})`);

      // Retourner la réponse de succès
      res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          xp: user.xp,
          level: user.level,
          avatarUrl: user.avatar_url,
          accountStatus: user.account_status,
          createdAt: user.created_at
        }
      });

    } catch (error) {
      // En cas d'erreur, faire un rollback de la transaction
      try {
        await connection.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Erreur lors du rollback:', rollbackError);
      }
    
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
  } finally {
    // Libérer la connexion
    if (connection) {
      connection.release();
    }
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
      'SELECT email, is_verified FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];

    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email déjà vérifié'
      });
    }

    // Ici on pourrait implémenter l'envoi d'email
    // Pour l'instant, on simule
    console.log(`📧 Email de vérification envoyé à: ${user.email}`);

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
        
        'UPDATE users SET is_verified = 1, updated_at = NOW() WHERE id = ?',
        [decoded.userId]
      );

      console.log(`✅ Email vérifié pour l'utilisateur ${decoded.userId}`);

      res.json({
        success: true,
        message: 'Email vérifié avec succès'
      });

    } catch (jwtError) {
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
        COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verified_users,
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
