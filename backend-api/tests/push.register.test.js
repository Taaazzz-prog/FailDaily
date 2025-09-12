const request = require('supertest');
const app = require('../server');

const DB_DISABLED = String(process.env.DB_DISABLED || '').toLowerCase() === 'true';
const describeMaybe = DB_DISABLED ? describe.skip : describe;

describeMaybe('Push Notifications Registration', () => {
  let token;

  it('registers a user and logs in', async () => {
    const now = Date.now();
    const email = `push.${now}@test.local`;
    const password = 'Passw0rd!Test';
    const displayName = `PushUser ${now}`;

    const reg = await request(app).post('/api/auth/register').send({ email, password, displayName });
    expect([200,201]).toContain(reg.status);

    const login = await request(app).post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    token = login.body.token;
    expect(token).toBeTruthy();
  });

  it('registers a push token and test-sends (should be disabled)', async () => {
    const register = await request(app)
      .post('/api/push/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: 'demo_push_token_1234567890', platform: 'web' });
    expect(register.status).toBe(200);

    const test = await request(app)
      .post('/api/push/test')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test', body: 'Hello' });
    expect(test.status).toBe(200);
    expect(test.body).toHaveProperty('success', true);
    // expected disabled by default
    expect(test.body.sent).toBe(false);
  });
});

