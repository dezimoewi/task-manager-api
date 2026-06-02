const db = require('../src/config/db');
const { hashPassword } = require('../src/utils/auth');

const seed = async () => {
  try {
    console.log('Dropping existing tables...');
    await db.query('DROP TABLE IF EXISTS tasks CASCADE');
    await db.query('DROP TABLE IF EXISTS users CASCADE');

    console.log('Creating schema...');

    await db.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await db.query(`
      CREATE TABLE tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'todo' NOT NULL
          CHECK (status IN ('todo', 'in-progress', 'done')),
        due_date TIMESTAMP WITH TIME ZONE,
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await db.query('CREATE INDEX idx_tasks_created_by ON tasks(created_by)');
    await db.query('CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to)');
    await db.query('CREATE INDEX idx_tasks_status ON tasks(status)');
    await db.query('CREATE INDEX idx_tasks_due_date ON tasks(due_date)');

    console.log('Schema created successfully.');
    console.log('Seeding users (bcrypt 10 salt rounds)...');

    const password = await hashPassword('password123');

    const users = [
      { username: 'alice', email: 'alice@example.com' },
      { username: 'bob', email: 'bob@example.com' },
      { username: 'charlie', email: 'charlie@example.com' },
    ];

    const userIds = [];
    for (const user of users) {
      const result = await db.query(
        `INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [user.username, user.email, password]
      );
      userIds.push(result.rows[0].id);
    }

    console.log(`Inserted ${userIds.length} users.`);
    console.log('Seeding tasks (10 tasks, mixed statuses)...');

    const tasks = [
      { title: 'Set up project structure', description: 'Initialize the Node.js project with Express', status: 'done', due_date: '2026-06-01T00:00:00Z', created_by: userIds[0], assigned_to: userIds[0] },
      { title: 'Design database schema', description: 'Create users and tasks tables with proper constraints', status: 'done', due_date: '2026-06-02T00:00:00Z', created_by: userIds[0], assigned_to: userIds[1] },
      { title: 'Implement authentication', description: 'Build register and login endpoints with JWT', status: 'in-progress', due_date: '2026-06-05T00:00:00Z', created_by: userIds[1], assigned_to: userIds[0] },
      { title: 'Write task CRUD endpoints', description: 'POST, GET, PUT, PATCH for tasks', status: 'todo', due_date: '2026-06-10T00:00:00Z', created_by: userIds[1], assigned_to: userIds[2] },
      { title: 'Add input validation', description: 'Use Joi for request body validation', status: 'todo', due_date: '2026-06-12T00:00:00Z', created_by: userIds[0], assigned_to: userIds[1] },
      { title: 'Implement rate limiting', description: 'Add express-rate-limit to protect endpoints', status: 'todo', due_date: '2026-06-15T00:00:00Z', created_by: userIds[2], assigned_to: userIds[0] },
      { title: 'Write unit tests', description: 'Test auth and task services with Jest', status: 'todo', due_date: '2026-06-20T00:00:00Z', created_by: userIds[2], assigned_to: userIds[2] },
      { title: 'Add Swagger documentation', description: 'Document all API endpoints with JSDoc', status: 'in-progress', due_date: '2026-06-18T00:00:00Z', created_by: userIds[0], assigned_to: userIds[2] },
      { title: 'Deploy to production', description: 'Set up CI/CD and deploy', status: 'todo', due_date: '2026-07-01T00:00:00Z', created_by: userIds[1], assigned_to: userIds[1] },
      { title: 'Fix overdue bug report', description: 'This task is intentionally overdue for testing', status: 'in-progress', due_date: '2026-05-01T00:00:00Z', created_by: userIds[2], assigned_to: userIds[0] },
    ];

    for (const task of tasks) {
      await db.query(
        `INSERT INTO tasks (title, description, status, due_date, created_by, assigned_to)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [task.title, task.description, task.status, task.due_date, task.created_by, task.assigned_to]
      );
    }

    console.log(`Inserted ${tasks.length} tasks.`);
    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
};

seed();
