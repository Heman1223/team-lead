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
    getMyTasks,
    uploadAttachment,
    deleteAttachment,
    submitEODReport,
    submitParentTaskEOD,
    getAllEODReports,
    addSubtaskComment
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getTaskStats);
router.get('/my-tasks', getMyTasks);
router.get('/eod-reports/all', getAllEODReports);
router.route('/')
    .get(getTasks)
    .post(authorize('team_lead'), createTask);

router.route('/:id')
    .get(getTask)
    .put(updateTask)
    .delete(authorize('team_lead'), deleteTask);

router.post('/:id/comments', addComment);
router.post('/:id/parent-eod-report', submitParentTaskEOD);

// File attachment routes
router.post('/:id/attachments', authorize('team_lead'), uploadAttachment);
router.delete('/:id/attachments/:attachmentId', authorize('team_lead'), deleteAttachment);

// Subtask routes
router.post('/:id/subtasks', authorize('team_lead'), addSubtask);
router.put('/:id/subtasks/:subtaskId', updateSubtask);
router.delete('/:id/subtasks/:subtaskId', authorize('team_lead'), deleteSubtask);
router.post('/:id/subtasks/:subtaskId/eod-report', submitEODReport);
router.post('/:id/subtasks/:subtaskId/comments', addSubtaskComment);

module.exports = router;
