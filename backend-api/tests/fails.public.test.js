jest.mock('../src/config/database', () => {
  const executeQuery = jest.fn(async (query, params) => {
    if (query.includes('COUNT(*)')) {
      return [{ total: 1 }];
    }
    return [{
      id: 1,
      user_id: 'user1',
      title: 'Fail public',
      description: 'test',
      category: 'Général',
      tags: '[]',
      is_public: 1,
      image_url: null,
      location: null,
      created_at: new Date(),
      updated_at: new Date(),
      display_name: 'Alice',
      avatar_url: null,
      reactions_count: 0,
      comments_count: 0,
      user_reaction: null
    }];
  });
  return { executeQuery, pool: {}, testConnection: jest.fn().mockResolvedValue(true) };
});

const { app } = require('../server');
const request = require('supertest');

describe('GET /api/fails/public', () => {
  it('retourne 200 avec is_public booléen', async () => {
    const res = await request(app).get('/api/fails/public');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.fails)).toBe(true);
    if (res.body.fails.length > 0) {
      expect(typeof res.body.fails[0].is_public).toBe('boolean');
    }
  });
});
