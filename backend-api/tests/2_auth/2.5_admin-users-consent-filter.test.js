const request = require('supertest');
const app = require('../../server');
const { executeQuery } = require('../../src/config/database');

const DB_DISABLED = String(process.env.DB_DISABLED || '').toLowerCase() === 'true';
const describeMaybe = DB_DISABLED ? describe.skip : describe;

describeMaybe('Admin users filter by consent status', () => {
  let adminToken;
  let teenUserId;

  beforeAll(async () => {
    const email = `adm.${Date.now()}@test.local`;
    const pass = 'Passw0rd!';
    const reg = await request(app).post('/api/auth/register').send({ email, password: pass, displayName: 'AdminC', birthDate: '1986-01-01', agreeToTerms: true });
    expect([200,201]).toContain(reg.status);
    const adminId = reg.body.user.id;
    await executeQuery('UPDATE users SET role = ? WHERE id = ?', ['admin', adminId]);
    const login = await request(app).post('/api/auth/login').send({ email, password: pass });
    expect(login.status).toBe(200);
    adminToken = login.body.token;

    // Teen (pending, needs consent)
    const tEmail = `teen.${Date.now()}@test.local`;
    const teenReg = await request(app).post('/api/auth/register').send({ email: tEmail, password: 'Passw0rd!', displayName: 'TeenC', birthDate: '2010-01-01', agreeToTerms: true });
    expect([200,201]).toContain(teenReg.status);
    teenUserId = teenReg.body.user.id;
  });

  it('filters consent=needed', async () => {
    const res = await request(app)
      .get('/api/admin/users?status=pending&consent=needed')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    for (const u of res.body.users) {
      expect(u.account_status).toBe('pending');
      if (u.age_verification) {
        const av = typeof u.age_verification === 'string' ? JSON.parse(u.age_verification) : u.age_verification;
        expect(av.needsParentalConsent).toBe(true);
      }
    }
    const found = res.body.users.some(u => u.id === teenUserId);
    expect(found).toBe(true);
  });

  it('after approve, consent=approved returns the user', async () => {
    // Approve
    const approve = await request(app)
      .put(`/api/admin/users/${teenUserId}/parental-approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();
    expect(approve.status).toBe(200);

    const res = await request(app)
      .get('/api/admin/users?consent=approved')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const found = res.body.users.some(u => u.id === teenUserId);
    expect(found).toBe(true);
  });
});

