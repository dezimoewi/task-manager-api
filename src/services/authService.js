const db = require('../config/db');
const { hashPassword, comparePassword, signToken } = require('../utils/auth');

const register = async ({ username, email, password }) => {
  // Check if user already exists
  const existingUser = await db.query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );

  if (existingUser.rows.length > 0) {
    const error = new Error('User with this email or username already exists');
    error.statusCode = 409;
    throw error;
  }

  const password_hash = await hashPassword(password);

  const result = await db.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, username, email, created_at`,
    [username, email, password_hash]
  );

  const user = result.rows[0];
  const token = signToken({ id: user.id, username: user.username });

  return { user, token };
};

const login = async ({ email, password }) => {
  const result = await db.query(
    'SELECT id, username, email, password_hash FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const user = result.rows[0];
  const isValid = await comparePassword(password, user.password_hash);

  if (!isValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = signToken({ id: user.id, username: user.username });

  return {
    user: { id: user.id, username: user.username, email: user.email },
    token,
  };
};

module.exports = { register, login };
