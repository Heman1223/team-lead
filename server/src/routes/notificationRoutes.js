const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createReminder,
    deleteNotification
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .get(getNotifications);

router.put('/read-all', markAllAsRead);
router.post('/reminder', authorize('team_lead'), createReminder);

router.route('/:id')
    .delete(deleteNotification);

router.put('/:id/read', markAsRead);

module.exports = router;
