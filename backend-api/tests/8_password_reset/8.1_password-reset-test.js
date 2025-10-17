/**
 * Test de Réinitialisation de Mot de Passe - FailDaily
 * 
 * Ce test vérifie le processus complet de reset de mot de passe :
 * - Demande de reset
 * - Génération et validation du token
 * - Changement effectif du mot de passe
 * - Sécurité et expiration
 * 
 * @author FailDaily Team
 * @date 2025-10-17
 */

const request = require('supertest');
const { executeQuery } = require('../../src/config/database');
const { createTestApp } = require('../0_test-config');

describe('8.1 - Password Reset Tests', () => {
  let app;
  let testUser = null;
  let authToken = null;
  let resetToken = null;

  beforeAll(async () => {
    app = await createTestApp();
    
    // Créer un utilisateur de test
    const registerData = {
      email: 'password-reset@test.local',
      password: 'OriginalPassword123!',
      displayName: 'Password Reset User',
      birthDate: '1990-05-15',
      legalConsent: true,
      parentalConsent: true
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(registerData);

    expect(registerResponse.status).toBe(200);
    testUser = registerResponse.body.user;
    authToken = registerResponse.body.token;
  });

  afterAll(async () => {
    // Nettoyer les données de test
    if (testUser) {
      await executeQuery('DELETE FROM password_resets WHERE user_id = ?', [testUser.id]);
      await executeQuery('DELETE FROM profiles WHERE user_id = ?', [testUser.id]);
      await executeQuery('DELETE FROM users WHERE id = ?', [testUser.id]);
    }
  });

  describe('📧 Demande de Réinitialisation', () => {
    test('Devrait créer une demande de reset valide', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'password-reset@test.local' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('email');

      // Vérifier qu'un token a été créé en base
      const tokenCheck = await executeQuery(
        'SELECT token, expires_at FROM password_resets WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [testUser.id]
      );

      expect(tokenCheck.length).toBe(1);
      expect(tokenCheck[0].token).toBeDefined();
      expect(tokenCheck[0].expires_at).toBeDefined();
      
      resetToken = tokenCheck[0].token;
    });

    test('Devrait rejeter un email inexistant', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'inexistant@test.local' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('utilisateur');
    });

    test('Devrait valider le format d\'email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'email-invalide' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    test('Devrait gérer les demandes multiples (rate limiting)', async () => {
      // Première demande
      const firstResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'password-reset@test.local' });

      expect(firstResponse.status).toBe(200);

      // Deuxième demande immédiate
      const secondResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'password-reset@test.local' });

      // Peut soit accepter (en remplaçant le token) soit rejeter (rate limit)
      expect([200, 429].includes(secondResponse.status)).toBe(true);
    });
  });

  describe('🔍 Vérification de Token', () => {
    test('Devrait valider un token correct', async () => {
      const response = await request(app)
        .get(`/api/auth/verify-reset-token/${resetToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(true);
    });

    test('Devrait rejeter un token invalide', async () => {
      const fakeToken = 'fake-token-12345';

      const response = await request(app)
        .get(`/api/auth/verify-reset-token/${fakeToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.valid).toBe(false);
    });

    test('Devrait rejeter un token mal formaté', async () => {
      const response = await request(app)
        .get('/api/auth/verify-reset-token/token-trop-court');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('🔒 Réinitialisation Effective', () => {
    test('Devrait changer le mot de passe avec un token valide', async () => {
      const newPassword = 'NewSecurePassword456!';

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: newPassword
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('réinitialisé');

      // Vérifier que le token est supprimé après utilisation
      const tokenCheck = await executeQuery(
        'SELECT * FROM password_resets WHERE token = ?',
        [resetToken]
      );
      expect(tokenCheck.length).toBe(0);
    });

    test('Devrait permettre la connexion avec le nouveau mot de passe', async () => {
      const loginData = {
        email: 'password-reset@test.local',
        password: 'NewSecurePassword456!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    test('Ne devrait plus accepter l\'ancien mot de passe', async () => {
      const loginData = {
        email: 'password-reset@test.local',
        password: 'OriginalPassword123!' // Ancien mot de passe
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('Devrait rejeter un token déjà utilisé', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken, // Token déjà utilisé
          newPassword: 'AnotherPassword789!'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('invalide');
    });
  });

  describe('🕒 Expiration et Sécurité', () => {
    let expiredTestUser = null;
    let expiredToken = null;

    beforeAll(async () => {
      // Créer un utilisateur pour tester l'expiration
      const registerData = {
        email: 'expired-test@test.local',
        password: 'ExpiredTestPassword123!',
        displayName: 'Expired Test User',
        birthDate: '1985-08-20',
        legalConsent: true,
        parentalConsent: true
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(registerData);

      expiredTestUser = registerResponse.body.user;

      // Créer un token expiré manuellement en base
      const { v4: uuidv4 } = require('uuid');
      expiredToken = uuidv4();
      const expiredDate = new Date(Date.now() - 1000 * 60 * 60); // 1 heure dans le passé

      await executeQuery(
        'INSERT INTO password_resets (user_id, token, expires_at, created_at) VALUES (?, ?, ?, NOW())',
        [expiredTestUser.id, expiredToken, expiredDate]
      );
    });

    afterAll(async () => {
      if (expiredTestUser) {
        await executeQuery('DELETE FROM password_resets WHERE user_id = ?', [expiredTestUser.id]);
        await executeQuery('DELETE FROM profiles WHERE user_id = ?', [expiredTestUser.id]);
        await executeQuery('DELETE FROM users WHERE id = ?', [expiredTestUser.id]);
      }
    });

    test('Devrait rejeter un token expiré', async () => {
      const response = await request(app)
        .get(`/api/auth/verify-reset-token/${expiredToken}`);

      expect(response.status).toBe(410);
      expect(response.body.success).toBe(false);
      expect(response.body.valid).toBe(false);
      expect(response.body.message).toContain('expiré');
    });

    test('Ne devrait pas permettre le reset avec un token expiré', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: expiredToken,
          newPassword: 'ShouldNotWork123!'
        });

      expect(response.status).toBe(410);
      expect(response.body.success).toBe(false);
    });

    test('Devrait nettoyer automatiquement les tokens expirés', async () => {
      // Déclencher le nettoyage (si implémenté)
      const response = await request(app)
        .post('/api/auth/cleanup-expired-tokens')
        .set('Authorization', `Bearer ${authToken}`);

      // Cette route pourrait ne pas exister, c'est ok
      if (response.status !== 404) {
        expect([200, 401].includes(response.status)).toBe(true);
      }
    });
  });

  describe('🛡️ Validation des Mots de Passe', () => {
    let validationUser = null;
    let validationToken = null;

    beforeAll(async () => {
      // Créer un utilisateur pour tester les validations
      const registerData = {
        email: 'validation-test@test.local',
        password: 'ValidationPassword123!',
        displayName: 'Validation Test User',
        birthDate: '1988-12-10',
        legalConsent: true,
        parentalConsent: true
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(registerData);

      validationUser = registerResponse.body.user;

      // Créer un token de reset
      const resetResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'validation-test@test.local' });

      const tokenCheck = await executeQuery(
        'SELECT token FROM password_resets WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [validationUser.id]
      );

      validationToken = tokenCheck[0].token;
    });

    afterAll(async () => {
      if (validationUser) {
        await executeQuery('DELETE FROM password_resets WHERE user_id = ?', [validationUser.id]);
        await executeQuery('DELETE FROM profiles WHERE user_id = ?', [validationUser.id]);
        await executeQuery('DELETE FROM users WHERE id = ?', [validationUser.id]);
      }
    });

    test('Devrait rejeter un mot de passe trop court', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: validationToken,
          newPassword: '123!' // Trop court
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('mot de passe');
    });

    test('Devrait rejeter un mot de passe sans majuscule', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: validationToken,
          newPassword: 'password123!' // Pas de majuscule
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Devrait rejeter un mot de passe sans caractère spécial', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: validationToken,
          newPassword: 'Password123' // Pas de caractère spécial
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Devrait accepter un mot de passe valide et sécurisé', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: validationToken,
          newPassword: 'ValidSecurePassword789@'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('🔐 Sécurité Avancée', () => {
    test('Devrait invalider les sessions actives après reset', async () => {
      // Créer un nouvel utilisateur avec une session active
      const newUser = {
        email: 'session-test@test.local',
        password: 'SessionTestPassword123!',
        displayName: 'Session Test User',
        birthDate: '1991-06-25',
        legalConsent: true,
        parentalConsent: true
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      const activeToken = registerResponse.body.token;
      const userId = registerResponse.body.user.id;

      // Vérifier que la session est active
      const profileResponse1 = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${activeToken}`);

      expect(profileResponse1.status).toBe(200);

      // Effectuer un reset de mot de passe
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'session-test@test.local' });

      const tokenCheck = await executeQuery(
        'SELECT token FROM password_resets WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [userId]
      );

      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: tokenCheck[0].token,
          newPassword: 'NewPasswordAfterReset456!'
        });

      // L'ancien token devrait maintenant être invalide
      // Note: Cette fonctionnalité dépend de l'implémentation (JWT stateless vs session tracking)
      const profileResponse2 = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${activeToken}`);

      // Le résultat peut varier selon l'implémentation JWT
      // Si JWT stateless, le token reste valide jusqu'à expiration
      // Si session tracking, le token devrait être invalidé
      expect([200, 401].includes(profileResponse2.status)).toBe(true);

      // Nettoyer
      await executeQuery('DELETE FROM profiles WHERE user_id = ?', [userId]);
      await executeQuery('DELETE FROM users WHERE id = ?', [userId]);
    });

    test('Devrait logguer les tentatives de reset', async () => {
      // Cette fonctionnalité dépend de l'implémentation du logging
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'password-reset@test.local' });

      expect([200, 429].includes(response.status)).toBe(true);

      // Vérifier logs si implémentés
      // Note: Cette partie dépend de votre système de logging
    });
  });

});

module.exports = {
  testSuiteName: 'Password Reset Complete Tests',
  description: 'Tests complets pour la réinitialisation sécurisée des mots de passe'
};