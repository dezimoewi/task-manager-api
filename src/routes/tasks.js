const { Router } = require('express');
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');
const { validate, validateQuery } = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema, taskQuerySchema } = require('../utils/validators');

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createTaskSchema), taskController.createTask);

router.get('/', validateQuery(taskQuerySchema), taskController.getTasks);

router.get('/overdue', taskController.getOverdueTasks);

router.get('/:id', taskController.getTaskById);

router.put('/:id', validate(updateTaskSchema), taskController.updateTask);

router.patch('/:id/complete', taskController.completeTask);

module.exports = router;
