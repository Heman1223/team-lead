const express = require('express');
const router = express.Router();
const {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    getTaskStats,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    getMyTasks
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getTaskStats);
router.get('/my-tasks', getMyTasks);
router.route('/')
    .get(getTasks)
    .post(authorize('team_lead'), createTask);

router.route('/:id')
    .get(getTask)
    .put(updateTask)
    .delete(authorize('team_lead'), deleteTask);

router.post('/:id/comments', addComment);

// Subtask routes
router.post('/:id/subtasks', authorize('team_lead'), addSubtask);
router.put('/:id/subtasks/:subtaskId', updateSubtask);
router.delete('/:id/subtasks/:subtaskId', authorize('team_lead'), deleteSubtask);

module.exports = router;
