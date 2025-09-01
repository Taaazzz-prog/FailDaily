const request = require('supertest');
const app = require('../server');

describe('SMOKE /health', () => {
  it('returns 200 OK and status OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });
});

