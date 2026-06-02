const db = require('../config/db');

const createTask = async ({ title, description, status, due_date, assigned_to, created_by }) => {
  const result = await db.query(
    `INSERT INTO tasks (title, description, status, due_date, assigned_to, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [title, description || null, status || 'todo', due_date || null, assigned_to || null, created_by]
  );
  return result.rows[0];
};

const getTasks = async ({ user_id, status, due_before, limit, offset }) => {
  let query = `
    SELECT t.*, u1.username AS creator_name, u2.username AS assignee_name
    FROM tasks t
    LEFT JOIN users u1 ON t.created_by = u1.id
    LEFT JOIN users u2 ON t.assigned_to = u2.id
    WHERE (t.created_by = $1 OR t.assigned_to = $1)
  `;
  const params = [user_id];
  let paramIndex = 2;

  if (status) {
    query += ` AND t.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (due_before) {
    query += ` AND t.due_date <= $${paramIndex}`;
    params.push(due_before);
    paramIndex++;
  }

  query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await db.query(query, params);

  let countQuery = `
    SELECT COUNT(*) FROM tasks t
    WHERE (t.created_by = $1 OR t.assigned_to = $1)
  `;
  const countParams = [user_id];
  let countIndex = 2;

  if (status) {
    countQuery += ` AND t.status = $${countIndex}`;
    countParams.push(status);
    countIndex++;
  }

  if (due_before) {
    countQuery += ` AND t.due_date <= $${countIndex}`;
    countParams.push(due_before);
    countIndex++;
  }

  const countResult = await db.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count, 10);

  return { tasks: result.rows, total };
};

const getTaskById = async (taskId) => {
  const result = await db.query(
    `SELECT t.*, u1.username AS creator_name, u2.username AS assignee_name
     FROM tasks t
     LEFT JOIN users u1 ON t.created_by = u1.id
     LEFT JOIN users u2 ON t.assigned_to = u2.id
     WHERE t.id = $1`,
    [taskId]
  );
  return result.rows[0] || null;
};

const updateTask = async (taskId, updates) => {
  const fields = [];
  const params = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  fields.push(`updated_at = NOW()`);
  params.push(taskId);

  const result = await db.query(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );
  return result.rows[0];
};

const completeTask = async (taskId) => {
  const result = await db.query(
    `UPDATE tasks SET status = 'done', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [taskId]
  );
  return result.rows[0];
};

const getOverdueTasks = async (user_id) => {
  const result = await db.query(
    `SELECT t.*, u1.username AS creator_name, u2.username AS assignee_name
     FROM tasks t
     LEFT JOIN users u1 ON t.created_by = u1.id
     LEFT JOIN users u2 ON t.assigned_to = u2.id
     WHERE (t.created_by = $1 OR t.assigned_to = $1)
       AND t.due_date < NOW()
       AND t.status != 'done'
     ORDER BY t.due_date ASC`,
    [user_id]
  );
  return result.rows;
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  completeTask,
  getOverdueTasks,
};
