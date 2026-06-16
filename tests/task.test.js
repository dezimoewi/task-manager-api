const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

let authToken;
let userId;
let taskId;

beforeAll(async () => {
  const migrate = require('../src/config/migrate');
  await migrate();
  await db.query('DELETE FROM tasks');
  await db.query('DELETE FROM users');

  // Register and login a test user
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      username: 'taskuser',
      email: 'taskuser@example.com',
      password: 'password123',
    });

  authToken = registerRes.body.data.token;
  userId = registerRes.body.data.user.id;
});

afterAll(async () => {
  await db.query('DELETE FROM tasks');
  await db.query('DELETE FROM users');
  await db.pool.end();
});

describe('Task CRUD', () => {
  it('should create a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Task',
        description: 'A test task description',
        status: 'todo',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test Task');
    expect(res.body.data.status).toBe('todo');
    expect(res.body.data.created_by).toBe(userId);
    taskId = res.body.data.id;
  });

  it('should create a task with minimal fields', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Minimal Task' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.title).toBe('Minimal Task');
    expect(res.body.data.status).toBe('todo');
  });

  it('should reject task creation without title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ description: 'No title' });

    expect(res.statusCode).toBe(400);
  });

  it('should reject task creation without auth', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Unauthorized' });

    expect(res.statusCode).toBe(401);
  });

  it('should get all tasks for the user', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tasks).toBeInstanceOf(Array);
    expect(res.body.data.tasks.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.pagination).toBeDefined();
  });

  it('should filter tasks by status', async () => {
    const res = await request(app)
      .get('/api/tasks?status=todo')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    res.body.data.tasks.forEach((task) => {
      expect(task.status).toBe('todo');
    });
  });

  it('should get a task by ID', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(taskId);
    expect(res.body.data.title).toBe('Test Task');
  });

  it('should return 404 for non-existent task', async () => {
    const res = await request(app)
      .get('/api/tasks/99999')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(404);
  });

  it('should update a task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Updated Task', status: 'in-progress' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Task');
    expect(res.body.data.status).toBe('in-progress');
  });

  it('should reject invalid status value on update', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'invalid-status' });

    expect(res.statusCode).toBe(400);
  });

  it('should complete a task', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/complete`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('done');
  });

  it('should reject transitioning from done to todo', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'todo' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Cannot transition from done to todo');
  });
});

describe('Task Ownership', () => {
  let otherToken;

  beforeAll(async () => {
    // Register another user
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123',
      });
    otherToken = res.body.data.token;
  });

  it('should deny access to tasks owned by another user', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Access denied');
  });

  it('should deny update to tasks owned by another user', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Hijacked' });

    expect(res.statusCode).toBe(403);
  });
});

describe('Task Pagination', () => {
  it('should respect limit and page parameters', async () => {
    const res = await request(app)
      .get('/api/tasks?page=1&limit=1')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.tasks.length).toBeLessThanOrEqual(1);
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.limit).toBe(1);
  });
});
