const Task = require('../models/Task');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

// @desc    Get dashboard summary
// @route   GET /api/reports/summary
// @access  Private
const getSummary = async (req, res) => {
    try {
        const teamId = req.user.teamId;

        // Task statistics
        const taskStats = await Task.aggregate([
            { $match: { teamId: teamId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const taskSummary = {
            assigned: 0,
            in_progress: 0,
            blocked: 0,
            overdue: 0,
            completed: 0,
            total: 0
        };

        taskStats.forEach(item => {
            taskSummary[item._id] = item.count;
            taskSummary.total += item.count;
        });

        // Team statistics
        const teamStats = await User.aggregate([
            { $match: { teamId: teamId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const teamSummary = { online: 0, offline: 0, busy: 0, total: 0 };
        teamStats.forEach(item => {
            teamSummary[item._id] = item.count;
            teamSummary.total += item.count;
        });

        // Completion rate
        const completionRate = taskSummary.total > 0
            ? Math.round((taskSummary.completed / taskSummary.total) * 100)
            : 0;

        res.json({
            success: true,
            data: {
                tasks: taskSummary,
                team: teamSummary,
                completionRate
            }
        });
    } catch (error) {
        console.error('Get summary error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get task completion report
// @route   GET /api/reports/completion
// @access  Private (Team Lead only)
const getCompletionReport = async (req, res) => {
    try {
        const teamId = req.user.teamId;
        const { period = 'week' } = req.query;

        let dateFilter = new Date();
        if (period === 'week') {
            dateFilter.setDate(dateFilter.getDate() - 7);
        } else if (period === 'month') {
            dateFilter.setMonth(dateFilter.getMonth() - 1);
        } else {
            dateFilter.setFullYear(dateFilter.getFullYear() - 1);
        }

        // Tasks completed over time
        const completedTasks = await Task.aggregate([
            {
                $match: {
                    teamId: teamId,
                    status: 'completed',
                    completedAt: { $gte: dateFilter }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Tasks by priority
        const tasksByPriority = await Task.aggregate([
            { $match: { teamId: teamId } },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                completedOverTime: completedTasks,
                byPriority: tasksByPriority
            }
        });
    } catch (error) {
        console.error('Get completion report error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get individual performance report
// @route   GET /api/reports/performance/:userId
// @access  Private
const getPerformanceReport = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);

        // Task completion stats
        const taskStats = await Task.aggregate([
            { $match: { assignedTo: userId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const stats = {
            assigned: 0,
            in_progress: 0,
            blocked: 0,
            overdue: 0,
            completed: 0,
            total: 0
        };

        taskStats.forEach(item => {
            stats[item._id] = item.count;
            stats.total += item.count;
        });

        // Average completion time
        const completedTasks = await Task.find({
            assignedTo: userId,
            status: 'completed',
            completedAt: { $exists: true }
        });

        let avgCompletionTime = 0;
        if (completedTasks.length > 0) {
            const totalTime = completedTasks.reduce((sum, task) => {
                return sum + (task.completedAt - task.createdAt);
            }, 0);
            avgCompletionTime = Math.round(totalTime / completedTasks.length / (1000 * 60 * 60)); // hours
        }

        // On-time completion rate
        const onTimeCompleted = completedTasks.filter(
            task => task.completedAt <= task.deadline
        ).length;

        const onTimeRate = completedTasks.length > 0
            ? Math.round((onTimeCompleted / completedTasks.length) * 100)
            : 0;

        res.json({
            success: true,
            data: {
                taskStats: stats,
                avgCompletionTimeHours: avgCompletionTime,
                onTimeCompletionRate: onTimeRate,
                completedTasksCount: completedTasks.length
            }
        });
    } catch (error) {
        console.error('Get performance report error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get team performance report
// @route   GET /api/reports/team-performance
// @access  Private (Team Lead only)
const getTeamPerformance = async (req, res) => {
    try {
        const teamId = req.user.teamId;

        // Get all team members
        const members = await User.find({ teamId }).select('name avatar');

        // Get performance for each member
        const performance = await Promise.all(members.map(async (member) => {
            const taskStats = await Task.aggregate([
                { $match: { assignedTo: member._id } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);

            let completed = 0, total = 0;
            taskStats.forEach(s => {
                if (s._id === 'completed') completed = s.count;
                total += s.count;
            });

            return {
                member: {
                    _id: member._id,
                    name: member.name,
                    avatar: member.avatar
                },
                tasksCompleted: completed,
                totalTasks: total,
                completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
            };
        }));

        // Sort by completion rate
        performance.sort((a, b) => b.completionRate - a.completionRate);

        res.json({
            success: true,
            data: performance
        });
    } catch (error) {
        console.error('Get team performance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get overdue task trends
// @route   GET /api/reports/overdue-trends
// @access  Private (Team Lead only)
const getOverdueTrends = async (req, res) => {
    try {
        const teamId = req.user.teamId;

        // Current overdue tasks
        const overdueTasks = await Task.find({
            teamId,
            status: 'overdue'
        })
            .populate('assignedTo', 'name avatar')
            .sort({ deadline: 1 });

        // Overdue by member
        const overdueByMember = await Task.aggregate([
            { $match: { teamId: teamId, status: 'overdue' } },
            { $group: { _id: '$assignedTo', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                overdueTasks,
                overdueByMember,
                totalOverdue: overdueTasks.length
            }
        });
    } catch (error) {
        console.error('Get overdue trends error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Export report data
// @route   GET /api/reports/export
// @access  Private (Team Lead only)
const exportReport = async (req, res) => {
    try {
        const teamId = req.user.teamId;
        const { type = 'tasks' } = req.query;

        let data;
        if (type === 'tasks') {
            data = await Task.find({ teamId })
                .populate('assignedTo', 'name email')
                .populate('createdBy', 'name email')
                .lean();
        } else if (type === 'members') {
            data = await User.find({ teamId })
                .select('-password')
                .lean();
        } else {
            data = await ActivityLog.find({ teamId })
                .populate('userId', 'name')
                .lean();
        }

        // Format for CSV
        const csvData = data.map(item => ({
            ...item,
            createdAt: new Date(item.createdAt).toISOString(),
            updatedAt: new Date(item.updatedAt).toISOString()
        }));

        res.json({
            success: true,
            data: csvData
        });
    } catch (error) {
        console.error('Export report error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getSummary,
    getCompletionReport,
    getPerformanceReport,
    getTeamPerformance,
    getOverdueTrends,
    exportReport
};
