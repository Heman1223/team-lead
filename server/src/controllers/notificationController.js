const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const { isRead, limit = 20, filter } = req.query;

        let query = {};
        
        if (filter === 'sent') {
            query.senderId = req.user._id;
        } else {
            query.userId = req.user._id;
            if (isRead !== undefined) query.isRead = isRead === 'true';
        }

        const notifications = await Notification.find(query)
            .populate('senderId', 'name avatar') // For received: who sent it
            .populate('userId', 'name')          // For sent: who received it
            .populate('taskId', 'title')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

        res.json({
            success: true,
            count: notifications.length,
            unreadCount,
            data: notifications
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        if (notification.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, isRead: false },
            { isRead: true }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create manual reminder
// @route   POST /api/notifications/reminder
// @access  Private (Team Lead only)
const createReminder = async (req, res) => {
    try {
        const { userId, taskId, title, message, priority } = req.body;

        const notificationData = {
            type: 'manual_reminder',
            title: title || 'Reminder from Team Lead',
            message,
            userId,
            senderId: req.user._id,
            priority: priority || 'medium'
        };

        if (taskId) {
            notificationData.taskId = taskId;
        }

        const notification = await Notification.create(notificationData);

        const activityData = {
            action: 'notification_sent',
            userId: req.user._id,
            targetUserId: userId,
            teamId: req.user.teamId,
            details: `Manual reminder sent: ${message.substring(0, 50)}...`
        };

        if (taskId) {
            activityData.taskId = taskId;
        }

        await ActivityLog.create(activityData);

        res.status(201).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Create reminder error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        if (notification.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await notification.deleteOne();

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createReminder,
    deleteNotification
};
