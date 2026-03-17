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
        const { period = 'week' } = req.query;

        // ── Resolve Team IDs and Member IDs ─────────────────
        let targetTeamIds = [];
        let memberIds = new Set();

        if (req.user.role === 'admin') {
            const allTeams = await Team.find({});
            allTeams.forEach(t => {
                t.members.forEach(m => memberIds.add(m.toString()));
                if (t.leadId) memberIds.add(t.leadId.toString());
                targetTeamIds.push(t._id);
            });
        } else if (req.user.role === 'team_lead') {
            const managedTeams = await Team.find({ leadId: req.user._id });
            managedTeams.forEach(t => {
                t.members.forEach(m => memberIds.add(m.toString()));
                if (t.leadId) memberIds.add(t.leadId.toString());
                targetTeamIds.push(t._id);
            });
            if (req.user.teamId && !targetTeamIds.some(id => id.toString() === req.user.teamId.toString())) {
                targetTeamIds.push(req.user.teamId);
                const t = await Team.findById(req.user.teamId);
                if (t) {
                    t.members.forEach(m => memberIds.add(m.toString()));
                    if (t.leadId) memberIds.add(t.leadId.toString());
                }
            }
        } else {
            if (req.user.teamId) {
                targetTeamIds.push(req.user.teamId);
                const t = await Team.findById(req.user.teamId);
                if (t) {
                    t.members.forEach(m => memberIds.add(m.toString()));
                    if (t.leadId) memberIds.add(t.leadId.toString());
                }
            } else {
                memberIds.add(req.user._id.toString());
            }
        }

        const uniqueMemberIds = Array.from(memberIds).map(id => new mongoose.Types.ObjectId(id));

        // ── Base Match Query ───────────────────────────────
        let baseMatch = {};
        if (req.user.role !== 'admin') {
            if (targetTeamIds.length > 0) {
                baseMatch.teamId = { $in: targetTeamIds.map(id => new mongoose.Types.ObjectId(id)) };
            } else {
                baseMatch.$or = [{ assignedTo: req.user._id }, { assignedBy: req.user._id }];
            }
        }

        // ── Task Stats (Global Totals) ────────────────────
        const globalStatsResults = await Task.aggregate([
            { $match: baseMatch },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const stats = { assigned: 0, in_progress: 0, blocked: 0, overdue: 0, completed: 0, total: 0 };
        globalStatsResults.forEach(item => {
            if (stats.hasOwnProperty(item._id)) stats[item._id] = item.count;
            stats.total += item.count;
        });

        // ── Period-specific Distribution (for Trends) ──────
        let dateFilter = new Date();
        if (period === 'day') dateFilter.setHours(0, 0, 0, 0);
        else if (period === 'week') dateFilter.setDate(dateFilter.getDate() - 7);
        else if (period === 'month') dateFilter.setMonth(dateFilter.getMonth() - 1);
        else if (period === 'year') dateFilter.setFullYear(dateFilter.getFullYear() - 1);

        const periodStatsResults = await Task.aggregate([
            { $match: { ...baseMatch, createdAt: { $gte: dateFilter } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const periodStats = { assigned: 0, in_progress: 0, blocked: 0, overdue: 0, completed: 0, total: 0 };
        periodStatsResults.forEach(item => {
            if (periodStats.hasOwnProperty(item._id)) periodStats[item._id] = item.count;
            periodStats.total += item.count;
        });

        // Use periodStats for the breakdown if any exist, otherwise fallback to global to not show "zero"
        const effectiveStats = periodStats.total > 0 ? periodStats : stats;

        // ── Team status (All-Time) ──────────────────────────
        const teamStats = await User.aggregate([
            { $match: { _id: { $in: uniqueMemberIds }, deletedAt: null } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const team = { online: 0, offline: 0, busy: 0, total: uniqueMemberIds.length };
        teamStats.forEach(item => {
            const s = (item._id || 'offline').toLowerCase();
            if (team.hasOwnProperty(s)) team[s] = item.count;
        });

        res.json({
            success: true,
            data: {
                tasks: effectiveStats, // This makes the bars/distribution dynamic
                summary: stats,         // Optional: provide both
                team,
                completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
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
        const { period = 'week' } = req.query;

        // Resolve all relevant Team IDs
        let targetTeamIds = [];
        if (req.user.role === 'admin') {
            const allTeams = await Team.find({});
            targetTeamIds = allTeams.map(t => t._id);
        } else {
            const managedTeams = await Team.find({ leadId: req.user._id });
            targetTeamIds = managedTeams.map(t => t._id);
            if (req.user.teamId && !targetTeamIds.some(id => id.toString() === req.user.teamId.toString())) {
                targetTeamIds.push(req.user.teamId);
            }
        }

        const teamObjectIds = targetTeamIds.map(id => new mongoose.Types.ObjectId(id));

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
                    teamId: { $in: teamObjectIds },
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
            { $match: { teamId: { $in: teamObjectIds } } },
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
        const { period = 'week' } = req.query;

        // Resolve all relevant Team IDs
        let targetTeamIds = [];
        if (req.user.role === 'admin') {
            const allTeams = await Team.find({});
            targetTeamIds = allTeams.map(t => t._id);
        } else if (req.user.role === 'team_lead') {
            const managedTeams = await Team.find({ leadId: req.user._id });
            targetTeamIds = managedTeams.map(t => t._id);
            if (req.user.teamId && !targetTeamIds.some(id => id.toString() === req.user.teamId.toString())) {
                targetTeamIds.push(req.user.teamId);
            }
        } else {
            if (req.user.teamId) targetTeamIds.push(req.user.teamId);
        }

        const teamObjectIds = targetTeamIds.map(id => new mongoose.Types.ObjectId(id));

        // Task-based performance calculation
        const performance = await Task.aggregate([
            { $match: { teamId: { $in: teamObjectIds }, assignedTo: { $ne: null } } },
            {
                $group: {
                    _id: '$assignedTo',
                    totalTasks: { $sum: 1 },
                    tasksCompleted: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'member'
                }
            },
            { $unwind: '$member' },
            {
                $project: {
                    _id: 1,
                    member: {
                        _id: '$member._id',
                        name: '$member.name',
                        avatar: '$member.avatar',
                        designation: '$member.designation',
                        role: '$member.role'
                    },
                    totalTasks: 1,
                    tasksCompleted: 1,
                    completionRate: {
                        $cond: [
                            { $gt: ['$totalTasks', 0] },
                            { $multiply: [{ $divide: ['$tasksCompleted', '$totalTasks'] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $sort: { completionRate: -1, totalTasks: -1 } }
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
        let targetTeamIds = [];
        if (req.user.role === 'admin') {
            const allTeams = await Team.find({});
            targetTeamIds = allTeams.map(t => t._id);
        } else {
            const managedTeams = await Team.find({ leadId: req.user._id });
            targetTeamIds = managedTeams.map(t => t._id);
            if (req.user.teamId && !targetTeamIds.some(id => id.toString() === req.user.teamId.toString())) {
                targetTeamIds.push(req.user.teamId);
            }
        }

        const teamObjectIds = targetTeamIds.map(id => new mongoose.Types.ObjectId(id));

        const overdueTasks = await Task.find({
            teamId: { $in: teamObjectIds },
            status: 'overdue'
        })
            .populate('assignedTo', 'name avatar')
            .sort({ deadline: 1 });

        const overdueByMember = await Task.aggregate([
            { $match: { teamId: { $in: teamObjectIds }, status: 'overdue' } },
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
        const { type = 'tasks' } = req.query;

        let targetTeamIds = [];
        if (req.user.role === 'admin') {
            const allTeams = await Team.find({});
            targetTeamIds = allTeams.map(t => t._id);
        } else {
            const managedTeams = await Team.find({ leadId: req.user._id });
            targetTeamIds = managedTeams.map(t => t._id);
            if (req.user.teamId && !targetTeamIds.some(id => id.toString() === req.user.teamId.toString())) {
                targetTeamIds.push(req.user.teamId);
            }
        }

        const teamObjectIds = targetTeamIds.map(id => new mongoose.Types.ObjectId(id));

        let data;
        if (type === 'tasks') {
            data = await Task.find({ teamId: { $in: teamObjectIds } })
                .populate('assignedTo', 'name email')
                .populate('createdBy', 'name email')
                .lean();
        } else if (type === 'members') {
            data = await User.find({ teamId: { $in: teamObjectIds }, deletedAt: null })
                .select('-password')
                .lean();
        } else {
            data = await ActivityLog.find({ teamId: { $in: teamObjectIds } })
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
        
        // Resolve Team IDs and Member IDs for scoping
        let targetTeamIds = [];
        let memberIds = new Set();

        if (req.user.role === 'admin') {
            const allUsers = await User.find({ deletedAt: null });
            const uniqueMemberObjectIds = allUsers.map(u => u._id);
            matchQuery.createdBy = { $in: uniqueMemberObjectIds };
        } else {
            if (req.user.role === 'team_lead') {
                const managedTeams = await Team.find({ leadId: req.user._id });
                managedTeams.forEach(t => {
                    t.members.forEach(m => memberIds.add(m.toString()));
                    memberIds.add(t.leadId.toString());
                });
            } else if (req.user.role === 'team_member') {
                const myTeam = await Team.findOne({ 
                    $or: [{ members: req.user._id }, { leadId: req.user._id }]
                });
                if (myTeam) {
                    myTeam.members.forEach(m => memberIds.add(m.toString()));
                    memberIds.add(myTeam.leadId.toString());
                } else {
                    memberIds.add(req.user._id.toString());
                }
            }

            if (memberIds.size > 0) {
                const uniqueMemberObjectIds = Array.from(memberIds).map(id => new mongoose.Types.ObjectId(id));
                matchQuery.createdBy = { $in: uniqueMemberObjectIds };
            } else {
                matchQuery.createdBy = req.user._id;
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
        const { period = 'week' } = req.query;

        // Resolve Team IDs
        let targetTeamIds = [];
        if (req.user.role === 'admin') {
            const allTeams = await Team.find({});
            targetTeamIds = allTeams.map(t => t._id);
        } else if (req.user.role === 'team_lead') {
            const managedTeams = await Team.find({ leadId: req.user._id });
            targetTeamIds = managedTeams.map(t => t._id);
        } else if (req.user.role === 'team_member') {
            if (req.user.teamId) targetTeamIds.push(req.user.teamId);
        }

        const teamObjectIds = targetTeamIds.map(id => new mongoose.Types.ObjectId(id));

        let matchQuery = {};
        
        // Scope optimization
        if (req.user.role !== 'admin') {
            matchQuery = {
                $or: [
                    { assignedTo: req.user._id },
                    { assignedTeam: { $in: teamObjectIds } }, 
                    { createdBy: req.user._id }
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
