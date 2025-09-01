const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../server');

const DB_DISABLED = String(process.env.DB_DISABLED || '').toLowerCase() === 'true';
const describeMaybe = DB_DISABLED ? describe.skip : describe;

// 1x1 px PNG (transparent)
function tinyPngBuffer() {
  const b64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
  return Buffer.from(b64, 'base64');
}

describeMaybe('User Journey E2E', () => {
  const now = Date.now();
  const email = `e2e.${now}@journey.local`;
  const password = 'Passw0rd!Test';
  const displayName = `User ${now}`;
  let token;
  let userId;
  let failId;
  let imageUrl;

  it('registers a new adult user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password, displayName, birthDate: '1990-01-01', agreeToTerms: true });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
    expect(res.body).toHaveProperty('user.id');
    userId = res.body.user.id;
  });

  it('logs in the user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
    userId = res.body.user.id;
  });

  it('verifies token and fetches profile', async () => {
    const verify = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${token}`);
    expect(verify.status).toBe(200);

    const profile = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(profile.status).toBe(200);
    expect(profile.body).toHaveProperty('data.email');
  });

  it('uploads a fail image', async () => {
    const res = await request(app)
      .post('/api/upload/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', tinyPngBuffer(), { filename: 'tiny.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data.imageUrl');
    imageUrl = res.body.data.imageUrl;
  });

  it('creates a fail with the uploaded image', async () => {
    const res = await request(app)
      .post('/api/fails')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Mon test de fail',
        description: 'Description e2e',
        category: 'Général',
        is_anonyme: false,
        imageUrl
      });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('fail.id');
    failId = res.body.fail.id;
  });

  it('lists public fails and fetches by id', async () => {
    const list = await request(app)
      .get('/api/fails/public')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveProperty('fails');

    const one = await request(app)
      .get(`/api/fails/${failId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(one.status).toBe(200);
    expect(one.body).toHaveProperty('fail.id', failId);
  });

  it('adds and removes a reaction', async () => {
    const add = await request(app)
      .post(`/api/fails/${failId}/reactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reactionType: 'courage' });
    expect([200, 201]).toContain(add.status);

    const get = await request(app)
      .get(`/api/fails/${failId}/reactions`)
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(200);

    const del = await request(app)
      .delete(`/api/fails/${failId}/reactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reactionType: 'courage' });
    expect([200, 204]).toContain(del.status);
  });

  it('posts and manages comments', async () => {
    const post = await request(app)
      .post(`/api/fails/${failId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Mon commentaire e2e' });
    expect([200, 201]).toContain(post.status);
    const commentId = post.body?.comment?.id || post.body?.data?.id;

    const list = await request(app)
      .get(`/api/fails/${failId}/comments`)
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);

    if (commentId) {
      const put = await request(app)
        .put(`/api/fails/${failId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Commentaire édité' });
      expect([200, 204]).toContain(put.status);

      const del = await request(app)
        .delete(`/api/fails/${failId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${token}`);
      expect([200, 204]).toContain(del.status);
    }
  });

  it('checks and unlocks badges', async () => {
    // available
    const available = await request(app)
      .get('/api/badges/available')
      .set('Authorization', `Bearer ${token}`);
    expect(available.status).toBe(200);

    // check unlock
    const unlock = await request(app)
      .post(`/api/badges/check-unlock/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(unlock.status).toBe(200);
  });

  it('updates profile (displayName, bio) and uploads avatar', async () => {
    const upd = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: `${displayName}-edit`, bio: 'Bio e2e' });
    expect([200, 204]).toContain(upd.status);

    const avatarRes = await request(app)
      .post('/api/upload/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', tinyPngBuffer(), { filename: 'avatar.png', contentType: 'image/png' });
    expect(avatarRes.status).toBe(200);
    expect(avatarRes.body).toHaveProperty('data.avatarUrl');
  });
});

