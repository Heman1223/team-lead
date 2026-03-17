const Task = require('../models/Task');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Lead = require('../models/Lead');
const Team = require('../models/Team');
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

        // Only leads in this team, ignore deleted leads
        const performance = await Lead.aggregate([
            { $match: { assignedTeam: mongoose.Types.ObjectId(teamId), assignedTo: { $ne: null } } },
            {
                $group: {
                    _id: '$assignedTo',
                    totalLeads: { $sum: 1 },
                    convertedLeads: {
                        $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] }
                    },
                    totalPipelineValue: { $sum: '$estimatedValue' },
                    totalDials: { $sum: '$dialCount' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 1,
                    name: '$user.name',
                    totalLeads: 1,
                    convertedLeads: 1,
                    totalPipelineValue: 1,
                    totalDials: 1,
                    conversionRate: {
                        $cond: [
                            { $gt: ['$totalLeads', 0] },
                            { $multiply: [{ $divide: ['$convertedLeads', '$totalLeads'] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $sort: { conversionRate: -1 } }
        ]);

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
            data = await User.find({ teamId, deletedAt: null })
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

// @desc    Get lead generation stats (manual vs imported) per person
// @route   GET /api/reports/lead-generation
// @access  Private (Team Lead only)
const getLeadGenerationStats = async (req, res) => {
    try {
        const teamId = req.user.teamId;
        
        // Define timeframes (Today, Week, Month)
        const now = new Date();
        
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);

        let matchQuery = {};
        
        // Filter by team if not admin
        if (req.user.role !== 'admin' && teamId) {
            const team = await Team.findById(teamId);
            if (team) {
                const memberIds = [...team.members.map(m => mongoose.Types.ObjectId(m)), mongoose.Types.ObjectId(team.leadId)];
                matchQuery.createdBy = { $in: memberIds };
            }
        }

        const stats = await Lead.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$createdBy',
                    todayManual: {
                        $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', startOfDay] }, { $eq: ['$source', 'manual'] }] }, 1, 0] }
                    },
                    todayImported: {
                        $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', startOfDay] }, { $eq: ['$source', 'imported'] }] }, 1, 0] }
                    },
                    weekManual: {
                        $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', startOfWeek] }, { $eq: ['$source', 'manual'] }] }, 1, 0] }
                    },
                    weekImported: {
                        $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', startOfWeek] }, { $eq: ['$source', 'imported'] }] }, 1, 0] }
                    },
                    monthManual: {
                        $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', startOfMonth] }, { $eq: ['$source', 'manual'] }] }, 1, 0] }
                    },
                    monthImported: {
                        $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', startOfMonth] }, { $eq: ['$source', 'imported'] }] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    name: { $ifNull: ['$user.name', 'Unknown User'] },
                    today: { manual: '$todayManual', imported: '$todayImported' },
                    week: { manual: '$weekManual', imported: '$weekImported' },
                    month: { manual: '$monthManual', imported: '$monthImported' }
                }
            },
            { $sort: { name: 1 } }
        ]);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get lead generation stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get lead status distribution stats
// @route   GET /api/reports/lead-status
// @access  Private (Team Lead only)
const getLeadStatusStats = async (req, res) => {
    try {
        const teamId = req.user.teamId;
        const { period = 'week' } = req.query;

        let dateFilter = new Date();
        if (period === 'day') {
            dateFilter.setHours(0, 0, 0, 0);
        } else if (period === 'week') {
            dateFilter.setDate(dateFilter.getDate() - 7);
        } else if (period === 'month') {
            dateFilter.setMonth(dateFilter.getMonth() - 1);
        } else if (period === 'year') {
            dateFilter.setFullYear(dateFilter.getFullYear() - 1);
        }

        let matchQuery = { createdAt: { $gte: dateFilter } };
        
        // Role-based filtering (similar to getLeadStats)
        if (req.user.role === 'team_lead') {
            const team = await Team.findOne({ leadId: req.user._id });
            const teamFilter = team ? { assignedTeam: team._id } : {};
            matchQuery = {
                $and: [
                    matchQuery,
                    { 
                        $or: [
                            { assignedTo: req.user._id },
                            teamFilter, 
                            { createdBy: req.user._id }
                        ].filter(f => Object.keys(f).length > 0) 
                    }
                ]
            };
        } else if (req.user.role === 'team_member') {
            const teams = await Team.find({ members: req.user._id });
            const teamIds = teams.map(t => t._id);
            matchQuery = {
                $and: [
                    matchQuery,
                    { 
                        $or: [
                            { assignedTo: req.user._id }, 
                            { assignedTeam: { $in: teamIds } },
                            { createdBy: req.user._id }
                        ] 
                    }
                ]
            };
        }

        const stats = await Lead.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Format for frontend (ensure all statuses have at least 0)
        const allStatuses = ['new', 'contacted', 'interested', 'follow_up', 'converted', 'not_interested', 'dialed'];
        const result = allStatuses.reduce((acc, status) => {
            const found = stats.find(s => s._id === status);
            acc[status] = found ? found.count : 0;
            return acc;
        }, {});

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get lead status stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getSummary,
    getCompletionReport,
    getPerformanceReport,
    getTeamPerformance,
    getOverdueTrends,
    exportReport,
    getLeadGenerationStats,
    getLeadStatusStats
};
