const express = require('express');
const router = express.Router();
const {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    getTaskStats
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getTaskStats);
router.route('/')
    .get(getTasks)
    .post(authorize('team_lead'), createTask);

router.route('/:id')
    .get(getTask)
    .put(updateTask)
    .delete(authorize('team_lead'), deleteTask);

router.post('/:id/comments', addComment);

module.exports = router;
