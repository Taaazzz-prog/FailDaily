/**
 * Test Fonctionnel Complet Application FailDaily
 * 
 * Ce test vérifie le workflow complet de l'application :
 * - Inscription et connexion
 * - Création et consultation de fails
 * - Système de réactions et points
 * - Badges et progression
 * - Modification de profil
 * 
 * @author FailDaily Team
 * @date 2025-10-17
 */

const request = require('supertest');
const { executeQuery } = require('../../src/config/database');
const { createTestApp } = require('../0_test-config');

describe('7.1 - Application Complete Workflow Tests', () => {
  let app;
  let primaryUser = null;
  let primaryToken = null;
  let secondaryUser = null;
  let secondaryToken = null;
  let testFailId = null;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    // Nettoyer tous les utilisateurs de test et leurs données
    const usersToClean = [primaryUser?.id, secondaryUser?.id].filter(Boolean);
    
    for (const userId of usersToClean) {
      // Nettoyer fails, réactions, badges, etc.
      await executeQuery('DELETE FROM fail_reactions WHERE user_id = ?', [userId]);
      await executeQuery('DELETE FROM comments WHERE user_id = ?', [userId]);
      await executeQuery('DELETE FROM badges WHERE user_id = ?', [userId]);
      await executeQuery('DELETE FROM fails WHERE user_id = ?', [userId]);
      await executeQuery('DELETE FROM profiles WHERE user_id = ?', [userId]);
      await executeQuery('DELETE FROM users WHERE id = ?', [userId]);
    }
  });

  describe('📝 Phase 1: Inscription et Authentification', () => {
    test('1.1 - Inscription utilisateur principal', async () => {
      const registerData = {
        email: 'primary-user@workflow.test',
        password: 'SecurePass123!',
        displayName: 'Utilisateur Principal',
        birthDate: '1990-01-15',
        legalConsent: true,
        parentalConsent: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();

      primaryUser = response.body.user;
      primaryToken = response.body.token;

      // Vérifier les points de départ
      expect(primaryUser.stats.couragePoints).toBe(0);
    });

    test('1.2 - Inscription utilisateur secondaire', async () => {
      const registerData = {
        email: 'secondary-user@workflow.test',
        password: 'SecurePass456!',
        displayName: 'Utilisateur Secondaire',
        birthDate: '1992-03-20',
        legalConsent: true,
        parentalConsent: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData);

      expect(response.status).toBe(200);
      secondaryUser = response.body.user;
      secondaryToken = response.body.token;
    });

    test('1.3 - Connexion utilisateur', async () => {
      const loginData = {
        email: 'primary-user@workflow.test',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    test('1.4 - Vérification profil après inscription', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${primaryToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.display_name).toBe('Utilisateur Principal');
      expect(response.body.profile.stats).toBeDefined();
      expect(response.body.profile.stats.couragePoints).toBe(0);
      expect(response.body.profile.stats.totalFails).toBe(0);
    });
  });

  describe('💥 Phase 2: Création et Gestion des Fails', () => {
    test('2.1 - Création premier fail (gain badge + points)', async () => {
      const failData = {
        title: 'Mon Premier Échec de Test',
        description: 'Description détaillée de cet échec pour tester le système de points et badges.',
        category: 'professional',
        is_anonyme: false
      };

      const response = await request(app)
        .post('/api/fails')
        .set('Authorization', `Bearer ${primaryToken}`)
        .send(failData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.fail).toBeDefined();
      
      testFailId = response.body.fail.id;

      // Vérifier les points gagnés (+10 pour création fail)
      const profileCheck = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${primaryToken}`);

      expect(profileCheck.body.profile.stats.couragePoints).toBe(10);
      expect(profileCheck.body.profile.stats.totalFails).toBe(1);
    });

    test('2.2 - Vérification badge "Premier Pas" attribué', async () => {
      // Attendre que le trigger MySQL ait le temps de s'exécuter
      await new Promise(resolve => setTimeout(resolve, 100));

      const badgesResponse = await request(app)
        .get(`/api/users/${primaryUser.id}/badges`)
        .set('Authorization', `Bearer ${primaryToken}`);

      expect(badgesResponse.status).toBe(200);
      expect(badgesResponse.body.badges.length).toBeGreaterThan(0);

      const firstFailBadge = badgesResponse.body.badges.find(
        badge => badge.name === 'Premier Pas' || badge.badge_type === 'first-fail'
      );
      expect(firstFailBadge).toBeDefined();
    });

    test('2.3 - Consultation des fails anonymisés', async () => {
      const response = await request(app)
        .get('/api/fails/anonymes')
        .set('Authorization', `Bearer ${secondaryToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.fails).toBeDefined();
      expect(response.body.fails.length).toBeGreaterThan(0);

      const ourFail = response.body.fails.find(fail => fail.id === testFailId);
      expect(ourFail).toBeDefined();
      expect(ourFail.title).toBe('Mon Premier Échec de Test');
      expect(ourFail.authorName).toBeDefined(); // Nom d'auteur présent (non anonyme)
    });

    test('2.4 - Création fail anonyme', async () => {
      const anonFailData = {
        title: 'Échec Anonyme Test',
        description: 'Cet échec est publié de manière anonyme.',
        category: 'personal',
        is_anonyme: true
      };

      const response = await request(app)
        .post('/api/fails')
        .set('Authorization', `Bearer ${primaryToken}`)
        .send(anonFailData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Vérifier les points supplémentaires
      const profileCheck = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${primaryToken}`);

      expect(profileCheck.body.profile.stats.couragePoints).toBe(20); // +10 pour le 2e fail
      expect(profileCheck.body.profile.stats.totalFails).toBe(2);
    });

    test('2.5 - Détail d\'un fail spécifique', async () => {
      const response = await request(app)
        .get(`/api/fails/${testFailId}`)
        .set('Authorization', `Bearer ${secondaryToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.fail.id).toBe(testFailId);
      expect(response.body.fail.reactions).toBeDefined();
      expect(response.body.fail.reactions.courage).toBe(0);
    });
  });

  describe('❤️ Phase 3: Système de Réactions et Points', () => {
    test('3.1 - Ajout réaction courage (+2 points pour réacteur)', async () => {
      const response = await request(app)
        .post(`/api/fails/${testFailId}/reactions`)
        .set('Authorization', `Bearer ${secondaryToken}`)
        .send({ type: 'courage' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Vérifier que l'utilisateur secondaire gagne des points pour la réaction
      const profileCheck = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${secondaryToken}`);

      expect(profileCheck.body.profile.stats.couragePoints).toBe(2);
    });

    test('3.2 - Vérification réaction ajoutée sur le fail', async () => {
      const response = await request(app)
        .get(`/api/fails/${testFailId}`)
        .set('Authorization', `Bearer ${secondaryToken}`);

      expect(response.status).toBe(200);
      expect(response.body.fail.reactions.courage).toBe(1);
      expect(response.body.fail.userReaction).toBe('courage');
    });

    test('3.3 - Suppression réaction', async () => {
      const response = await request(app)
        .delete(`/api/fails/${testFailId}/reactions`)
        .set('Authorization', `Bearer ${secondaryToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Vérifier que la réaction est supprimée
      const failCheck = await request(app)
        .get(`/api/fails/${testFailId}`)
        .set('Authorization', `Bearer ${secondaryToken}`);

      expect(failCheck.body.fail.reactions.courage).toBe(0);
      expect(failCheck.body.fail.userReaction).toBeNull();
    });

    test('3.4 - Test différents types de réactions', async () => {
      const reactionTypes = ['support', 'inspiration', 'solidarity'];

      for (const type of reactionTypes) {
        const addResponse = await request(app)
          .post(`/api/fails/${testFailId}/reactions`)
          .set('Authorization', `Bearer ${secondaryToken}`)
          .send({ type });

        expect(addResponse.status).toBe(200);

        const failCheck = await request(app)
          .get(`/api/fails/${testFailId}`)
          .set('Authorization', `Bearer ${secondaryToken}`);

        expect(failCheck.body.fail.reactions[type]).toBe(1);
        expect(failCheck.body.fail.userReaction).toBe(type);

        // Supprimer pour tester le suivant
        await request(app)
          .delete(`/api/fails/${testFailId}/reactions`)
          .set('Authorization', `Bearer ${secondaryToken}`);
      }
    });
  });

  describe('💬 Phase 4: Système de Commentaires', () => {
    let testCommentId = null;

    test('4.1 - Ajout commentaire encourageant', async () => {
      const commentData = {
        content: 'Merci pour ce partage ! Cela m\'aide beaucoup.',
        is_encouragement: true
      };

      const response = await request(app)
        .post(`/api/fails/${testFailId}/comments`)
        .set('Authorization', `Bearer ${secondaryToken}`)
        .send(commentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comment).toBeDefined();

      testCommentId = response.body.comment.id;
    });

    test('4.2 - Récupération commentaires d\'un fail', async () => {
      const response = await request(app)
        .get(`/api/fails/${testFailId}/comments`)
        .set('Authorization', `Bearer ${secondaryToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comments.length).toBe(1);
      expect(response.body.comments[0].content).toContain('Merci pour ce partage');
    });

    test('4.3 - Modification commentaire par son auteur', async () => {
      const updateData = {
        content: 'Commentaire modifié - Merci pour ce partage enrichissant !',
        is_encouragement: true
      };

      const response = await request(app)
        .put(`/api/fails/${testFailId}/comments/${testCommentId}`)
        .set('Authorization', `Bearer ${secondaryToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comment.content).toContain('modifié');
    });
  });

  describe('📊 Phase 5: Modification de Profil et Persistance', () => {
    test('5.1 - Modification profil utilisateur', async () => {
      const updateData = {
        display_name: 'Utilisateur Principal Mis À Jour',
        bio: 'Bio complète avec description de mes objectifs FailDaily.',
        preferences: {
          theme: 'dark',
          notifications: {
            email: true,
            push: false,
            badges: true
          },
          privacy: {
            showProfile: true,
            showBadges: true
          }
        }
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${primaryToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.profile.display_name).toBe(updateData.display_name);
      expect(response.body.profile.bio).toBe(updateData.bio);
    });

    test('5.2 - Vérification persistance des points et badges', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${primaryToken}`);

      expect(response.status).toBe(200);
      
      // Les points doivent être préservés
      expect(response.body.profile.stats.couragePoints).toBe(20);
      expect(response.body.profile.stats.totalFails).toBe(2);
      
      // Le nom doit être mis à jour
      expect(response.body.profile.display_name).toBe('Utilisateur Principal Mis À Jour');
    });

    test('5.3 - Vérification préférences sauvegardées', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${primaryToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.preferences).toBeDefined();
      expect(response.body.profile.preferences.theme).toBe('dark');
      expect(response.body.profile.preferences.notifications.email).toBe(true);
      expect(response.body.profile.preferences.notifications.push).toBe(false);
    });
  });

  describe('🏆 Phase 6: Progression et Badges', () => {
    test('6.1 - Vérification badges obtenus', async () => {
      const response = await request(app)
        .get(`/api/users/${primaryUser.id}/badges`)
        .set('Authorization', `Bearer ${primaryToken}`);

      expect(response.status).toBe(200);
      expect(response.body.badges.length).toBeGreaterThan(0);
      
      // Vérifier le badge "Premier Pas"
      const firstBadge = response.body.badges.find(
        badge => badge.name === 'Premier Pas'
      );
      expect(firstBadge).toBeDefined();
      expect(firstBadge.category).toBe('COURAGE');
    });

    test('6.2 - Consultation badges disponibles', async () => {
      const response = await request(app)
        .get('/api/badges/available')
        .set('Authorization', `Bearer ${primaryToken}`);

      expect(response.status).toBe(200);
      expect(response.body.badges).toBeDefined();
      expect(response.body.badges.length).toBeGreaterThan(0);
      
      // Vérifier structure des badges
      const sampleBadge = response.body.badges[0];
      expect(sampleBadge.name).toBeDefined();
      expect(sampleBadge.description).toBeDefined();
      expect(sampleBadge.requirements).toBeDefined();
    });
  });

  describe('🔍 Phase 7: Recherche et Filtres', () => {
    test('7.1 - Consultation fails avec filtres de catégorie', async () => {
      const response = await request(app)
        .get('/api/fails/anonymes?category=professional')
        .set('Authorization', `Bearer ${secondaryToken}`);

      expect(response.status).toBe(200);
      expect(response.body.fails).toBeDefined();
      
      // Tous les fails retournés doivent être de la catégorie demandée
      response.body.fails.forEach(fail => {
        expect(fail.category).toBe('professional');
      });
    });

    test('7.2 - Pagination des fails', async () => {
      const response = await request(app)
        .get('/api/fails/anonymes?limit=1&offset=0')
        .set('Authorization', `Bearer ${secondaryToken}`);

      expect(response.status).toBe(200);
      expect(response.body.fails.length).toBeLessThanOrEqual(1);
    });
  });

  describe('📈 Phase 8: Statistiques Utilisateur', () => {
    test('8.1 - Statistiques complètes utilisateur', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${primaryToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profile.stats).toBeDefined();
      
      const stats = response.body.profile.stats;
      expect(typeof stats.couragePoints).toBe('number');
      expect(typeof stats.totalFails).toBe('number');
      expect(typeof stats.totalReactionsGiven).toBe('number');
      expect(typeof stats.totalReactionsReceived).toBe('number');
      expect(typeof stats.totalBadges).toBe('number');

      // Vérifier cohérence des données
      expect(stats.totalFails).toBe(2);
      expect(stats.couragePoints).toBe(20);
    });
  });

  describe('🔒 Phase 9: Sécurité et Protection', () => {
    test('9.1 - Protection fails privés (JWT requis)', async () => {
      const response = await request(app)
        .get('/api/fails/anonymes');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('9.2 - Protection modification fail par autre utilisateur', async () => {
      const updateData = {
        title: 'Tentative de hack',
        description: 'Ne devrait pas fonctionner'
      };

      const response = await request(app)
        .put(`/api/fails/${testFailId}`)
        .set('Authorization', `Bearer ${secondaryToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('9.3 - Protection modification profil autre utilisateur', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${secondaryToken}`)
        .send({ 
          // Tenter de modifier avec le token de l'utilisateur secondaire
          user_id: primaryUser.id,
          display_name: 'Hack Attempt'
        });

      // Même si ça réussit, ça ne devrait modifier que le profil du secondaire
      const profileCheck = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${primaryToken}`);

      expect(profileCheck.body.profile.display_name).toBe('Utilisateur Principal Mis À Jour');
    });
  });

});

module.exports = {
  testSuiteName: 'Application Complete Workflow Tests',
  description: 'Tests fonctionnels complets couvrant tout le cycle de vie utilisateur'
};