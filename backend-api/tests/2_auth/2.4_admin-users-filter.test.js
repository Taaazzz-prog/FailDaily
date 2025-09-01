const request = require('supertest');
const app = require('../../server');
const { executeQuery } = require('../../src/config/database');

const DB_DISABLED = String(process.env.DB_DISABLED || '').toLowerCase() === 'true';
const describeMaybe = DB_DISABLED ? describe.skip : describe;

describeMaybe('Admin users filter by status', () => {
  let adminToken;
  let teenUserId;

  beforeAll(async () => {
    // Create admin
    const email = `adm.${Date.now()}@test.local`;
    const password = 'Passw0rd!';
    const reg = await request(app).post('/api/auth/register').send({ email, password, displayName: 'AdminF', birthDate: '1987-01-01', agreeToTerms: true });
    expect([200,201]).toContain(reg.status);
    const adminId = reg.body.user.id;
    await executeQuery('UPDATE users SET role = ? WHERE id = ?', ['admin', adminId]);
    const login = await request(app).post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    adminToken = login.body.token;

    // Create teen (pending)
    const tEmail = `teen.${Date.now()}@test.local`;
    const teenReg = await request(app).post('/api/auth/register').send({ email: tEmail, password: 'Passw0rd!', displayName: 'TeenF', birthDate: '2010-01-01', agreeToTerms: true });
    expect([200,201]).toContain(teenReg.status);
    teenUserId = teenReg.body.user.id;
  });

  it('returns only pending when status=pending', async () => {
    const res = await request(app)
      .get('/api/admin/users?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    // All returned should be pending
    for (const u of res.body.users) {
      expect(u.account_status).toBe('pending');
    }
    // Our teen should be present
    const found = res.body.users.some(u => u.id === teenUserId);
    expect(found).toBe(true);
  });
});

