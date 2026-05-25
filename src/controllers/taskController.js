const taskService = require('../services/taskService');

const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask({
      ...req.body,
      created_by: req.user.id,
    });
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (err) {
    next(err);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const { status, due_before, page, limit } = req.query;
    const offset = (page - 1) * limit;

    const { tasks, total } = await taskService.getTasks({
      user_id: req.user.id,
      status,
      due_before,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Only creator or assignee can view
    if (task.created_by !== req.user.id && task.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Only creator or assignee can update
    if (task.created_by !== req.user.id && task.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Prevent 'done' to 'todo' transition
    if (task.status === 'done' && req.body.status === 'todo') {
      return res.status(400).json({
        success: false,
        message: 'Cannot transition from done to todo',
      });
    }

    const updated = await taskService.updateTask(req.params.id, req.body);
    res.json({ success: true, message: 'Task updated', data: updated });
  } catch (err) {
    next(err);
  }
};

const completeTask = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.created_by !== req.user.id && task.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (task.status === 'done') {
      return res.status(400).json({ success: false, message: 'Task is already completed' });
    }

    const completed = await taskService.completeTask(req.params.id);
    res.json({ success: true, message: 'Task marked as done', data: completed });
  } catch (err) {
    next(err);
  }
};

const getOverdueTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getOverdueTasks(req.user.id);
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  completeTask,
  getOverdueTasks,
};
