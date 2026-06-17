const db = require('./db');

const migrate = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
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

    await db.query(`CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)`);

    console.log('Database migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    throw err;
  }
};

module.exports = migrate;
