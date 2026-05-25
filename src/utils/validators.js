const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(6).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const createTaskSchema = Joi.object({
  title: Joi.string().max(255).required(),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('todo', 'in-progress', 'done').default('todo'),
  due_date: Joi.date().iso().greater('now').allow(null),
  assigned_to: Joi.number().integer().positive().allow(null),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().max(255),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('todo', 'in-progress', 'done'),
  due_date: Joi.date().iso().allow(null),
  assigned_to: Joi.number().integer().positive().allow(null),
}).min(1);

const taskQuerySchema = Joi.object({
  status: Joi.string().valid('todo', 'in-progress', 'done'),
  due_before: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  registerSchema,
  loginSchema,
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
};
