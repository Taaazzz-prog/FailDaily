const request = require('supertest');
const app = require('../server'); // importe l'app Express exportée

describe('GET /api/fails/public', () => {
  it('renvoie 200 (ou 204) et un booléen is_public quand des données existent', async () => {
    const res = await request(app).get('/api/fails/public');
    expect([200, 204]).toContain(res.status);

    if (res.status === 200) {
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length) {
        const sample = res.body[0];
        // doits être un booléen selon le schéma et la sélection SQL
        expect(typeof sample.is_public).toBe('boolean');
      }
    }
  });
});
