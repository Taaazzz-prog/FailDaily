const request = require('supertest');
const app = require('../../server');
const { executeQuery } = require('../../src/config/database');

const DB_DISABLED = String(process.env.DB_DISABLED || '').toLowerCase() === 'true';
const describeMaybe = DB_DISABLED ? describe.skip : describe;

describeMaybe('Admin parental revoke/reject endpoints', () => {
  let adminToken;
  let teenUserId;

  beforeAll(async () => {
    // Admin
    const aEmail = `adm.${Date.now()}@test.local`;
    const aPass = 'Passw0rd!';
    const reg = await request(app).post('/api/auth/register').send({ email: aEmail, password: aPass, displayName: 'AdminTmp', birthDate: '1988-01-01', agreeToTerms: true });
    expect([200,201]).toContain(reg.status);
    const adminId = reg.body.user.id;
    await executeQuery('UPDATE users SET role = ? WHERE id = ?', ['admin', adminId]);
    const login = await request(app).post('/api/auth/login').send({ email: aEmail, password: aPass });
    expect(login.status).toBe(200);
    adminToken = login.body.token;

    // Teen
    const tEmail = `teen.${Date.now()}@test.local`;
    const tReg = await request(app).post('/api/auth/register').send({ email: tEmail, password: 'Passw0rd!', displayName: 'Teen', birthDate: '2010-01-01', agreeToTerms: true });
    expect([200,201]).toContain(tReg.status);
    teenUserId = tReg.body.user.id;
  });

  it('approve then revoke', async () => {
    const approve = await request(app)
      .put(`/api/admin/users/${teenUserId}/parental-approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();
    expect(approve.status).toBe(200);

    const revoke = await request(app)
      .put(`/api/admin/users/${teenUserId}/parental-revoke`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();
    expect(revoke.status).toBe(200);

    const rows = await executeQuery('SELECT u.account_status, p.registration_completed, p.age_verification FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = ? LIMIT 1', [teenUserId]);
    expect(rows.length).toBe(1);
    expect(rows[0].account_status).toBe('pending');
    expect(Number(rows[0].registration_completed)).toBe(0);
    const av = rows[0].age_verification ? JSON.parse(rows[0].age_verification) : {};
    expect(av.needsParentalConsent).toBe(true);
    expect(av.parentalConsentStatus).toBe('revoked');
  });

  it('reject keeps user pending and marks status', async () => {
    const rej = await request(app)
      .put(`/api/admin/users/${teenUserId}/parental-reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();
    expect(rej.status).toBe(200);

    const rows = await executeQuery('SELECT u.account_status, p.registration_completed, p.age_verification FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = ? LIMIT 1', [teenUserId]);
    const av = rows[0].age_verification ? JSON.parse(rows[0].age_verification) : {};
    expect(rows[0].account_status).toBe('pending');
    expect(Number(rows[0].registration_completed)).toBe(0);
    expect(av.parentalConsentStatus).toBe('rejected');
  });
});

