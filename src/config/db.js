const { Pool } = require('pg');
const config = require('./index');

const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Execute a parameterized SQL query against the pool.
 * All queries MUST use parameterized values ($1, $2, ...) to prevent SQL injection.
 */
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
