const request = require('supertest');
const app = require('../../server');
const { executeQuery } = require('../../src/config/database');

const DB_DISABLED = String(process.env.DB_DISABLED || '').toLowerCase() === 'true';
const describeMaybe = DB_DISABLED ? describe.skip : describe;

describeMaybe('Admin users infinite scroll', () => {
  let adminToken;

  beforeAll(async () => {
    // Ensure there are at least 2-3 users
    const email = `adm.${Date.now()}@test.local`;
    const pass = 'Passw0rd!';
    const reg = await request(app).post('/api/auth/register').send({ email, password: pass, displayName: 'AdminIS', birthDate: '1985-01-01', agreeToTerms: true });
    expect([200,201]).toContain(reg.status);
    const adminId = reg.body.user.id;
    await executeQuery('UPDATE users SET role = ? WHERE id = ?', ['admin', adminId]);
    const login = await request(app).post('/api/auth/login').send({ email, password: pass });
    adminToken = login.body.token;

    // extra users
    await request(app).post('/api/auth/register').send({ email: `u.${Date.now()}@test.local`, password: 'Passw0rd!', displayName: 'U1', birthDate: '1990-01-01', agreeToTerms: true });
    await request(app).post('/api/auth/register').send({ email: `u.${Date.now()+1}@test.local`, password: 'Passw0rd!', displayName: 'U2', birthDate: '1990-01-01', agreeToTerms: true });
  });

  it('returns pagination info and supports offset/limit', async () => {
    const res1 = await request(app)
      .get('/api/admin/users?limit=1&offset=0')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res1.status).toBe(200);
    expect(res1.body).toHaveProperty('pagination');
    expect(res1.body.users.length).toBeLessThanOrEqual(1);
    const { hasMore, nextOffset } = res1.body.pagination;
    expect(typeof hasMore).toBe('boolean');
    expect(nextOffset === null || Number.isInteger(nextOffset)).toBe(true);

    if (hasMore && nextOffset !== null) {
      const res2 = await request(app)
        .get(`/api/admin/users?limit=1&offset=${nextOffset}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res2.status).toBe(200);
      expect(res2.body).toHaveProperty('pagination');
      expect(res2.body.users.length).toBeLessThanOrEqual(1);
    }
  });
});

