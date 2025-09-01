const request = require('supertest');
const app = require('../../server');

const DB_DISABLED = String(process.env.DB_DISABLED || '').toLowerCase() === 'true';
const describeMaybe = DB_DISABLED ? describe.skip : describe;

describeMaybe('COPPA profile creation rules', () => {
  it('rejects registration for under 13', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `u13.${Date.now()}@test.local`,
        password: 'Passw0rd!',
        displayName: 'U13',
        birthDate: '2015-01-01',
        agreeToTerms: true
      });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('code', 'AGE_RESTRICTION');
  });

  it('creates pending profile for 13-16', async () => {
    const email = `u15.${Date.now()}@test.local`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email,
        password: 'Passw0rd!',
        displayName: 'U15',
        birthDate: '2010-01-01',
        agreeToTerms: true
      });
    expect([200,201]).toContain(res.status);
    expect(res.body).toHaveProperty('token');
    const token = res.body.token;

    const profile = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(profile.status).toBe(200);
    expect(profile.body?.data?.accountStatus).toBe('pending');
    const av = profile.body?.data?.ageVerification;
    expect(av?.needsParentalConsent).toBe(true);
  });

  it('creates active profile for 17+', async () => {
    const email = `adult.${Date.now()}@test.local`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email,
        password: 'Passw0rd!',
        displayName: 'Adult',
        birthDate: '1990-01-01',
        agreeToTerms: true
      });
    expect([200,201]).toContain(res.status);
    const token = res.body.token;
    const profile = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(profile.status).toBe(200);
    expect(profile.body?.data?.accountStatus).toBe('active');
    expect(profile.body?.data?.registrationCompleted).toBe(1);
  });
});

