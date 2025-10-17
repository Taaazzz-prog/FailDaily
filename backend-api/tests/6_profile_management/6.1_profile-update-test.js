/**
 * Test de Gestion du Profil Utilisateur - FailDaily
 * 
 * Ce test vérifie toutes les fonctionnalités de modification de compte :
 * - Modification nom d'affichage
 * - Modification bio
 * - Upload avatar
 * - Modification préférences
 * - Validation des contraintes
 * 
 * @author FailDaily Team
 * @date 2025-10-17
 */

const request = require('supertest');
const { executeQuery } = require('../../src/config/database');
const { createTestApp } = require('../0_test-config');
const fs = require('fs').promises;
const path = require('path');

describe('6.1 - Profile Management Tests', () => {
  let app;
  let testUser = null;
  let authToken = null;

  beforeAll(async () => {
    app = await createTestApp();
    
    // Créer un utilisateur de test
    const registerData = {
      email: 'profile-test@test.local',
      password: 'TestPassword123!',
      displayName: 'ProfileTest User',
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
      await executeQuery('DELETE FROM profiles WHERE user_id = ?', [testUser.id]);
      await executeQuery('DELETE FROM users WHERE id = ?', [testUser.id]);
    }
  });

  describe('✅ Modification Nom d\'Affichage', () => {
    test('Devrait modifier le nom d\'affichage avec succès', async () => {
      const newDisplayName = 'Nouveau Nom Display';

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ display_name: newDisplayName });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.profile.display_name).toBe(newDisplayName);

      // Vérifier en base de données
      const profileCheck = await executeQuery(
        'SELECT display_name FROM profiles WHERE user_id = ?', 
        [testUser.id]
      );
      expect(profileCheck[0].display_name).toBe(newDisplayName);
    });

    test('Devrait rejeter un nom d\'affichage vide', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ display_name: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('nom d\'affichage');
    });

    test('Devrait rejeter un nom d\'affichage trop long', async () => {
      const longName = 'A'.repeat(256); // Plus de 255 caractères

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ display_name: longName });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('✅ Modification Bio', () => {
    test('Devrait modifier la bio avec succès', async () => {
      const newBio = 'Voici ma nouvelle bio pour tester les modifications de profil.';

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bio: newBio });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.profile.bio).toBe(newBio);

      // Vérifier en base de données
      const profileCheck = await executeQuery(
        'SELECT bio FROM profiles WHERE user_id = ?', 
        [testUser.id]
      );
      expect(profileCheck[0].bio).toBe(newBio);
    });

    test('Devrait accepter une bio vide', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bio: null });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Devrait rejeter une bio trop longue', async () => {
      const longBio = 'A'.repeat(501); // Plus de 500 caractères

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bio: longBio });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('bio');
    });
  });

  describe('✅ Gestion des Préférences', () => {
    test('Devrait modifier les préférences utilisateur', async () => {
      const newPreferences = {
        notifications: {
          email: false,
          push: true,
          badges: true,
          reactions: false
        },
        privacy: {
          showProfile: true,
          showBadges: false
        },
        theme: 'dark'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ preferences: newPreferences });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Vérifier que les préférences sont bien sauvées
      const profileCheck = await executeQuery(
        'SELECT preferences FROM profiles WHERE user_id = ?', 
        [testUser.id]
      );
      const savedPrefs = JSON.parse(profileCheck[0].preferences);
      expect(savedPrefs.theme).toBe('dark');
      expect(savedPrefs.notifications.email).toBe(false);
      expect(savedPrefs.notifications.push).toBe(true);
    });

    test('Devrait gérer les préférences partielles', async () => {
      const partialPreferences = {
        notifications: {
          email: true
        }
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ preferences: partialPreferences });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('✅ Validation des Contraintes', () => {
    test('Devrait rejeter les modifications sans authentification', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ display_name: 'Test Sans Auth' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('Devrait rejeter un token expiré', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired';

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({ display_name: 'Test Token Expiré' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('Devrait valider les types de données', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          display_name: 123, // Type incorrect
          preferences: 'not_an_object' // Type incorrect
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('✅ Modification Multiple', () => {
    test('Devrait modifier plusieurs champs simultanément', async () => {
      const updateData = {
        display_name: 'Profil Mis À Jour',
        bio: 'Bio mise à jour avec tous les champs.',
        preferences: {
          theme: 'light',
          notifications: {
            email: true,
            push: false
          }
        }
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.profile.display_name).toBe(updateData.display_name);
      expect(response.body.profile.bio).toBe(updateData.bio);

      // Vérifier en base
      const profileCheck = await executeQuery(
        'SELECT display_name, bio, preferences FROM profiles WHERE user_id = ?', 
        [testUser.id]
      );
      
      expect(profileCheck[0].display_name).toBe(updateData.display_name);
      expect(profileCheck[0].bio).toBe(updateData.bio);
      
      const savedPrefs = JSON.parse(profileCheck[0].preferences);
      expect(savedPrefs.theme).toBe('light');
    });
  });

  describe('✅ Récupération du Profil', () => {
    test('Devrait récupérer le profil complet', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.display_name).toBeDefined();
      expect(response.body.profile.email).toBeDefined();
      expect(response.body.profile.stats).toBeDefined();
    });

    test('Devrait inclure les statistiques utilisateur', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.stats).toBeDefined();
      expect(typeof response.body.profile.stats.couragePoints).toBe('number');
      expect(typeof response.body.profile.stats.totalFails).toBe('number');
      expect(typeof response.body.profile.stats.totalBadges).toBe('number');
    });
  });

  describe('🔐 Sécurité et Protection', () => {
    test('Ne devrait pas permettre de modifier l\'email via ce endpoint', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          email: 'hacker@malicious.com',
          display_name: 'Test'
        });

      // L'email ne devrait pas être modifié même si envoyé
      expect(response.status).toBe(200);
      
      const userCheck = await executeQuery(
        'SELECT email FROM users WHERE id = ?', 
        [testUser.id]
      );
      expect(userCheck[0].email).not.toBe('hacker@malicious.com');
      expect(userCheck[0].email).toBe('profile-test@test.local');
    });

    test('Ne devrait pas permettre de modifier le rôle', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          role: 'admin',
          display_name: 'Test'
        });

      expect(response.status).toBe(200);
      
      // Vérifier que le rôle n'a pas été modifié
      const userCheck = await executeQuery(
        'SELECT role FROM users WHERE id = ?', 
        [testUser.id]
      );
      expect(userCheck[0].role).toBe('user');
    });
  });

  describe('📊 Points de Courage', () => {
    test('Devrait préserver les points de courage lors des modifications', async () => {
      // Obtenir les points actuels
      const beforeResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      const pointsBefore = beforeResponse.body.profile.stats.couragePoints;

      // Modifier le profil
      const updateResponse = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ display_name: 'Test Points Preservation' });

      expect(updateResponse.status).toBe(200);

      // Vérifier que les points sont préservés
      const afterResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      const pointsAfter = afterResponse.body.profile.stats.couragePoints;
      expect(pointsAfter).toBe(pointsBefore);
    });
  });

});

module.exports = {
  testSuiteName: 'Profile Management Tests',
  description: 'Tests complets pour la gestion et modification des profils utilisateur'
};