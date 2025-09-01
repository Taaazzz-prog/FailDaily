const request = require('supertest');
const app = require('../../server');
const { executeQuery } = require('../../src/config/database');

const DB_DISABLED = String(process.env.DB_DISABLED || '').toLowerCase() === 'true';
const describeMaybe = DB_DISABLED ? describe.skip : describe;

describeMaybe('Admin parental approve endpoint', () => {
  let adminToken;
  let targetUserId;

  beforeAll(async () => {
    // Create an adult user, then promote to admin for testing
    const email = `adm.${Date.now()}@test.local`;
    const pass = 'Passw0rd!';
    const reg = await request(app).post('/api/auth/register').send({ email, password: pass, displayName: 'AdminTmp', birthDate: '1989-01-01', agreeToTerms: true });
    expect([200,201]).toContain(reg.status);
    // Promote
    const adminId = reg.body.user.id;
    await executeQuery('UPDATE users SET role = ? WHERE id = ?', ['admin', adminId]);
    const login = await request(app).post('/api/auth/login').send({ email, password: pass });
    expect(login.status).toBe(200);
    adminToken = login.body.token;

    // Create a 15yo user (pending)
    const uEmail = `u15.${Date.now()}@test.local`;
    const uReg = await request(app).post('/api/auth/register').send({ email: uEmail, password: 'Passw0rd!', displayName: 'Teen', birthDate: '2010-01-01', agreeToTerms: true });
    expect([200,201]).toContain(uReg.status);
    targetUserId = uReg.body.user.id;
  });

  it('approves a pending teen account and activates profile', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${targetUserId}/parental-approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);

    // Verify profile/account
    const loginTeen = await request(app).post('/api/auth/login').send({ email: expect.any(String), password: expect.any(String) });
    // We cannot re-login without the exact email, but we can read DB status instead
    const rows = await executeQuery('SELECT u.account_status, p.registration_completed, p.age_verification FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = ? LIMIT 1', [targetUserId]);
    expect(rows.length).toBe(1);
    expect(rows[0].account_status).toBe('active');
    expect(Number(rows[0].registration_completed)).toBe(1);
    const av = rows[0].age_verification ? JSON.parse(rows[0].age_verification) : {};
    expect(av.needsParentalConsent).toBe(false);
    expect(av.parentalConsentStatus).toBe('approved');
  });
});

