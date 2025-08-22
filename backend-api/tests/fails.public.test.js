const request = require('supertest');
const app = require('../server'); // importe l'app Express exportée

describe('GET /api/fails/public', () => {
  let authToken;

  beforeAll(async () => {
    // Créer un utilisateur et obtenir un token pour les tests
    const testEmail = `test.public.${Date.now()}@example.com`;
    const testPassword = 'password123';
    
    // Inscription
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        displayName: 'Test Public User',
        birthDate: '1990-01-01',
        agreeToTerms: true
      });

    // Connexion pour obtenir le token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword
      });

    authToken = loginResponse.body.token;
  });

  it('renvoie 200 (ou 204) et un booléen is_public quand des données existent', async () => {
    const res = await request(app)
      .get('/api/fails/public')
      .set('Authorization', `Bearer ${authToken}`);
      
    expect([200, 204]).toContain(res.status);

    if (res.status === 200) {
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length) {
        const sample = res.body[0];
        // doit être un booléen selon le schéma et la sélection SQL
        expect(typeof sample.is_public).toBe('boolean');
        // Pour les fails anonymes, user_id ne doit pas être exposé
        expect(sample.user_id).toBeUndefined();
      }
    }
  });
});
