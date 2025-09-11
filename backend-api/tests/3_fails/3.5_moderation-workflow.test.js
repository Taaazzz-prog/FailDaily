const request = require('supertest');
const app = require('../../server');

const DB_DISABLED = String(process.env.DB_DISABLED || '').toLowerCase() === 'true';
const describeMaybe = DB_DISABLED ? describe.skip : describe;

describeMaybe('Fails Moderation Workflow', () => {
  let token;
  let failId;

  it('registers and logs in user', async () => {
    const now = Date.now();
    const email = `mod.${now}@test.local`;
    const password = 'Passw0rd!Test';
    const displayName = `ModUser ${now}`;

    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email, password, displayName, birthDate: '1990-01-01', agreeToTerms: true });
    expect([200,201]).toContain(reg.status);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(login.status).toBe(200);
    token = login.body.token;
    expect(token).toBeTruthy();
  });

  it('creates a visible fail then gets hidden after report threshold', async () => {
    const create = await request(app)
      .post('/api/fails')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Fail for moderation', description: 'test', category: 'test', is_anonyme: false });
    expect([200,201]).toContain(create.status);
    failId = create.body.fail?.id;
    expect(failId).toBeTruthy();

    // Visible in list initially
    const list1 = await request(app)
      .get('/api/fails')
      .set('Authorization', `Bearer ${token}`);
    expect(list1.status).toBe(200);
    const ids1 = (list1.body.fails || []).map(f => f.id);
    expect(ids1).toContain(failId);

    // Report once (default threshold is 1 if not configured)
    const rep = await request(app)
      .post(`/api/fails/${failId}/report`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'test' });
    expect(rep.status).toBe(200);
    expect(rep.body).toHaveProperty('autoHidden');

    // Hidden from list now
    const list2 = await request(app)
      .get('/api/fails')
      .set('Authorization', `Bearer ${token}`);
    expect(list2.status).toBe(200);
    const ids2 = (list2.body.fails || []).map(f => f.id);
    expect(ids2).not.toContain(failId);

    // Owner can still fetch detail
    const detailHidden = await request(app)
      .get(`/api/fails/${failId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(detailHidden.status).toBe(200);
    expect(detailHidden.body.fail.id).toBe(failId);
  });

  it('approves then rejects via test/admin helpers', async () => {
    // Elevate to admin in test env
    const elev = await request(app)
      .post('/api/test/elevate')
      .set('Authorization', `Bearer ${token}`);
    // If test routes not loaded (not NODE_ENV=test), skip rest
    if (elev.status !== 200) return;

    // Approve -> should reappear
    const appr = await request(app)
      .post(`/api/admin/fails/${failId}/moderation`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'approved' });
    expect(appr.status).toBe(200);

    const list3 = await request(app)
      .get('/api/fails')
      .set('Authorization', `Bearer ${token}`);
    expect(list3.status).toBe(200);
    const ids3 = (list3.body.fails || []).map(f => f.id);
    expect(ids3).toContain(failId);

    // Reject -> should disappear again
    const rej = await request(app)
      .post(`/api/admin/fails/${failId}/moderation`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'rejected' });
    expect(rej.status).toBe(200);

    const list4 = await request(app)
      .get('/api/fails')
      .set('Authorization', `Bearer ${token}`);
    expect(list4.status).toBe(200);
    const ids4 = (list4.body.fails || []).map(f => f.id);
    expect(ids4).not.toContain(failId);
  });
});

