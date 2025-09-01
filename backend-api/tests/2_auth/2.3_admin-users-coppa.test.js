const request = require('supertest');
const app = require('../../server');
const { executeQuery } = require('../../src/config/database');

const DB_DISABLED = String(process.env.DB_DISABLED || '').toLowerCase() === 'true';
const describeMaybe = DB_DISABLED ? describe.skip : describe;

describeMaybe('Admin users list includes COPPA fields', () => {
  let adminToken;
  let teenUserId;

  beforeAll(async () => {
    // Create admin
    const email = `adm.${Date.now()}@test.local`;
    const password = 'Passw0rd!';
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email, password, displayName: 'AdminUser', birthDate: '1988-01-01', agreeToTerms: true });
    expect([200,201]).toContain(reg.status);
    const adminId = reg.body.user.id;
    await executeQuery('UPDATE users SET role = ? WHERE id = ?', ['admin', adminId]);
    const login = await request(app).post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    adminToken = login.body.token;

    // Create teen user (pending)
    const teenEmail = `teen.${Date.now()}@test.local`;
    const teenReg = await request(app)
      .post('/api/auth/register')
      .send({ email: teenEmail, password: 'Passw0rd!', displayName: 'TeenUser', birthDate: '2010-01-01', agreeToTerms: true });
    expect([200,201]).toContain(teenReg.status);
    teenUserId = teenReg.body.user.id;
  });

  it('returns registration_completed and age_verification in /admin/users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    const teen = res.body.users.find(u => u.id === teenUserId);
    expect(teen).toBeTruthy();
    // Fields should be present
    expect(teen).toHaveProperty('registration_completed');
    expect(teen).toHaveProperty('age_verification');
    if (teen.age_verification) {
      const av = typeof teen.age_verification === 'string' ? JSON.parse(teen.age_verification) : teen.age_verification;
      expect(av.needsParentalConsent).toBe(true);
    }
  });
});

