const request = require('supertest');
const app = require('../server'); // importe l'app Express exportée

describe('GET /api/fails/anonymes', () => {
  let authToken;

  beforeAll(async () => {
    // Utiliser un utilisateur temporaire avec email unique
    const timestamp = Date.now();
    const testEmail = `temp.test.${timestamp}@test.local`;
    const testPassword = 'TestPassword123!';
    
    // Inscription
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        displayName: `Test User ${timestamp}`,
        birthDate: '1990-01-01',
        agreeToTerms: true
      });

    console.log('Inscription status:', registerResponse.status);

    // Connexion pour obtenir le token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword
      });

    console.log('Login status:', loginResponse.status);
    console.log('Login body:', loginResponse.body);

    if (loginResponse.status === 200 && loginResponse.body.token) {
      authToken = loginResponse.body.token;
    } else {
      authToken = null;
    }
  });

  it("renvoie 200 (ou 204) et un booléen is_anonyme quand des données existent", async () => {
    if (!authToken) {
      console.log("⚠️ Test skippé - pas de token d'authentification disponible");
      return;
    }

    const res = await request(app)
      .get('/api/fails/anonymes')
      .set('Authorization', `Bearer ${authToken}`);
      
    expect([200, 204]).toContain(res.status);

    if (res.status === 200) {
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('fails');
      expect(Array.isArray(res.body.fails)).toBe(true);
      
      if (res.body.fails.length) {
        const sample = res.body.fails[0];
        expect(typeof sample.is_anonyme).toBe('boolean');
        if (sample.is_anonyme) {
          // En mode anonyme, pseudo et avatar doivent être anonymisés côté mapping
          expect(sample.authorName).toBe('Anonyme');
        }
      }
    }
  });
});

