const ActivityLog = require('../models/ActivityLog');

// @desc    Get activity logs
// @route   GET /api/activities
// @access  Private
const getActivities = async (req, res) => {
    try {
        const { userId, taskId, action, limit = 50 } = req.query;

        let query = {};

        // Filter by team
        if (req.user.teamId) {
            query.teamId = req.user.teamId;
        }

        if (userId) query.userId = userId;
        if (taskId) query.taskId = taskId;
        if (action) query.action = action;

        const activities = await ActivityLog.find(query)
            .populate('userId', 'name avatar')
            .populate('targetUserId', 'name avatar')
            .populate('taskId', 'title')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: activities.length,
            data: activities
        });
    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get task activity log
// @route   GET /api/activities/task/:taskId
// @access  Private
const getTaskActivities = async (req, res) => {
    try {
        const activities = await ActivityLog.find({ taskId: req.params.taskId })
            .populate('userId', 'name avatar')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: activities.length,
            data: activities
        });
    } catch (error) {
        console.error('Get task activities error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get user activity log
// @route   GET /api/activities/user/:userId
// @access  Private
const getUserActivities = async (req, res) => {
    try {
        const activities = await ActivityLog.find({
            $or: [
                { userId: req.params.userId },
                { targetUserId: req.params.userId }
            ]
        })
            .populate('userId', 'name avatar')
            .populate('taskId', 'title')
            .sort({ createdAt: -1 })
            .limit(30);

        res.json({
            success: true,
            count: activities.length,
            data: activities
        });
    } catch (error) {
        console.error('Get user activities error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getActivities,
    getTaskActivities,
    getUserActivities
};
