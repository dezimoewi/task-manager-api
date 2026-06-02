const request = require('supertest');
const app = require('../src/app');

describe('Health Check', () => {
  it('GET /health should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should reject invalid registration body', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'ab', email: 'bad', password: '12' });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject invalid login body', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: '' });
      expect(res.statusCode).toBe(400);
    });
  });
});

describe('Task Endpoints', () => {
  it('should reject unauthenticated access', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(401);
  });

  it('should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
  });
});

describe('404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Route not found');
  });
});
