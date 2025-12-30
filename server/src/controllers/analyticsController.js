const Lead = require('../models/Lead');
const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');

// Helper to construct RBAC query
const getRoleBasedQuery = async (user) => {
    let query = { isActive: true };
    
    if (user.role === 'admin') {
        return query;
    }

    if (user.role === 'team_lead') {
        const team = await Team.findOne({ leadId: user._id });
        if (team) {
            query.$or = [
                { assignedTeam: team._id },
                { createdBy: user._id }
            ];
        } else {
            query.createdBy = user._id;
        }
    } else if (user.role === 'team_member') {
        query.assignedTo = user._id;
    }
    
    return query;
};

// @desc    Get lead inflow trends (daily/monthly)
// @route   GET /api/analytics/leads/inflow
// @access  Private
const getLeadInflow = async (req, res) => {
    try {
        const { range = '30d' } = req.query; // 7d, 30d, 90d, 1y
        const now = new Date();
        let startDate = new Date();

        switch (range) {
            case '7d': startDate.setDate(now.getDate() - 7); break;
            case '30d': startDate.setDate(now.getDate() - 30); break;
            case '90d': startDate.setDate(now.getDate() - 90); break;
            case '1y': startDate.setFullYear(now.getFullYear() - 1); break;
            default: startDate.setDate(now.getDate() - 30);
        }

        const baseQuery = await getRoleBasedQuery(req.user);
        const matchQuery = {
            ...baseQuery,
            createdAt: { $gte: startDate }
        };

        const data = await Lead.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                    value: { $sum: "$estimatedValue" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({ success: true, data });
    } catch (error) {
        console.error('Lead inflow error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get lead source distribution
// @route   GET /api/analytics/leads/sources
// @access  Private
const getSourceDistribution = async (req, res) => {
    try {
        const matchQuery = await getRoleBasedQuery(req.user);

        const data = await Lead.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: "$source",
                    count: { $sum: 1 },
                    totalValue: { $sum: "$estimatedValue" },
                    wonCount: {
                        $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({ success: true, data });
    } catch (error) {
        console.error('Source distribution error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get conversion metrics
// @route   GET /api/analytics/leads/conversion
// @access  Private
const getConversionMetrics = async (req, res) => {
    try {
        const matchQuery = await getRoleBasedQuery(req.user);

        const stats = await Lead.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    converted: { $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] } },
                    lost: { $sum: { $cond: [{ $eq: ["$status", "lost"] }, 1, 0] } },
                    active: { 
                        $sum: { 
                            $cond: [{ $in: ["$status", ["new", "contacted", "interested", "follow_up_required"]] }, 1, 0] 
                        } 
                    }
                }
            }
        ]);

        const funnel = await Lead.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                overview: stats[0] || { total: 0, converted: 0, lost: 0, active: 0 },
                funnel
            }
        });
    } catch (error) {
        console.error('Conversion metrics error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get team performance
// @route   GET /api/analytics/performance/team
// @access  Private (Admin/Team Lead)
const getTeamPerformance = async (req, res) => {
    try {
        // Only allow Admin and Team Lead
        if (req.user.role === 'team_member') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        let matchQuery = { role: 'team_member', isActive: true };

        // If Team Lead, only show their team members
        if (req.user.role === 'team_lead') {
            const team = await Team.findOne({ leadId: req.user._id });
            if (team) {
                // Get IDs of team members
                matchQuery._id = { $in: team.members };
            } else {
                // If no team, show empty
                matchQuery._id = { $in: [] };
            }
        }

        const performance = await User.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'leads',
                    localField: '_id',
                    foreignField: 'assignedTo',
                    as: 'leads'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    totalLeads: { $size: "$leads" },
                    convertedLeads: {
                        $size: {
                            $filter: {
                                input: "$leads",
                                as: "lead",
                                cond: { $eq: ["$$lead.status", "converted"] }
                            }
                        }
                    },
                    totalPipelineValue: { $sum: "$leads.estimatedValue" },
                    avgResponseTime: { $literal: 0 } // Placeholder for now
                }
            },
            { $sort: { convertedLeads: -1 } }
        ]);

        res.json({ success: true, data: performance });
    } catch (error) {
        console.error('Team performance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get best performing teams
// @route   GET /api/admin/analytics/best-teams
// @access  Private/Admin
const getBestPerformingTeams = async (req, res) => {
    try {
        const teams = await Team.find({ isActive: true })
            .populate('leadId', 'name email')
            .populate('members', 'name');

        const teamsWithStats = await Promise.all(
            teams.map(async (team) => {
                // Get team tasks
                const tasks = await Task.find({ teamId: team._id });
                const completedTasks = tasks.filter(t => t.status === 'completed').length;
                const totalTasks = tasks.length;
                const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                // Get team leads (if they exist)
                const leads = await Lead.find({ assignedTeam: team._id });
                const convertedLeads = leads.filter(l => l.status === 'converted').length;
                const leadConversionRate = leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0;

                return {
                    teamId: team._id,
                    teamName: team.name,
                    leadName: team.leadId?.name || 'No Lead',
                    memberCount: team.members.length,
                    tasksCompleted: completedTasks,
                    totalTasks,
                    completionRate: Math.round(completionRate),
                    leadsConverted: convertedLeads,
                    totalLeads: leads.length,
                    leadConversionRate: Math.round(leadConversionRate),
                    overallScore: Math.round((completionRate + leadConversionRate) / 2)
                };
            })
        );

        // Sort by overall score
        teamsWithStats.sort((a, b) => b.overallScore - a.overallScore);

        res.json({
            success: true,
            data: teamsWithStats.slice(0, 10) // Top 10 teams
        });
    } catch (error) {
        console.error('Get best performing teams error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get team lead effectiveness
// @route   GET /api/admin/analytics/team-lead-effectiveness/:leadId
// @access  Private/Admin
const getTeamLeadEffectiveness = async (req, res) => {
    try {
        const { leadId } = req.params;

        const teamLead = await User.findById(leadId);
        if (!teamLead || teamLead.role !== 'team_lead') {
            return res.status(404).json({ success: false, message: 'Team lead not found' });
        }

        const team = await Team.findOne({ leadId: leadId });
        
        // Get tasks assigned to this team lead
        const tasks = await Task.find({ assignedTo: leadId });
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const overdueTasks = tasks.filter(t => 
            t.status !== 'completed' && new Date(t.deadline) < new Date()
        ).length;

        // Get team member performance if team exists
        let teamMemberStats = [];
        if (team) {
            teamMemberStats = await Promise.all(
                team.members.map(async (memberId) => {
                    if (memberId.toString() === leadId) return null; // Skip the lead themselves
                    
                    const member = await User.findById(memberId).select('name email');
                    const memberTasks = await Task.find({ assignedTo: memberId });
                    const memberCompleted = memberTasks.filter(t => t.status === 'completed').length;
                    
                    return {
                        memberId,
                        memberName: member?.name || 'Unknown',
                        tasksAssigned: memberTasks.length,
                        tasksCompleted: memberCompleted,
                        completionRate: memberTasks.length > 0 ? 
                            Math.round((memberCompleted / memberTasks.length) * 100) : 0
                    };
                })
            );
            teamMemberStats = teamMemberStats.filter(s => s !== null);
        }

        // Calculate average team member completion rate
        const avgTeamCompletionRate = teamMemberStats.length > 0
            ? teamMemberStats.reduce((sum, s) => sum + s.completionRate, 0) / teamMemberStats.length
            : 0;

        // Calculate effectiveness score
        const taskCompletionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
        const overdueRate = tasks.length > 0 ? (overdueTasks / tasks.length) * 100 : 0;
        const effectivenessScore = Math.round(
            (taskCompletionRate * 0.4) + 
            (avgTeamCompletionRate * 0.4) + 
            ((100 - overdueRate) * 0.2)
        );

        res.json({
            success: true,
            data: {
                teamLead: {
                    id: teamLead._id,
                    name: teamLead.name,
                    email: teamLead.email
                },
                team: team ? {
                    id: team._id,
                    name: team.name,
                    memberCount: team.members.length
                } : null,
                personalStats: {
                    totalTasks: tasks.length,
                    completedTasks,
                    overdueTasks,
                    taskCompletionRate: Math.round(taskCompletionRate)
                },
                teamStats: {
                    members: teamMemberStats,
                    avgCompletionRate: Math.round(avgTeamCompletionRate)
                },
                effectivenessScore,
                rating: effectivenessScore >= 80 ? 'Excellent' :
                       effectivenessScore >= 60 ? 'Good' :
                       effectivenessScore >= 40 ? 'Average' : 'Needs Improvement'
            }
        });
    } catch (error) {
        console.error('Get team lead effectiveness error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get dashboard statistics for analytics
// @route   GET /api/admin/analytics/dashboard-stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        // Overview stats
        const totalUsers = await User.countDocuments({ isActive: true });
        const totalTeams = await Team.countDocuments({ isActive: true });
        const totalTasks = await Task.countDocuments();
        const totalLeads = await Lead.countDocuments({ isActive: true });

        // Task statistics
        const completedTasks = await Task.countDocuments({ status: 'completed' });
        const inProgressTasks = await Task.countDocuments({ status: 'in_progress' });
        const overdueTasks = await Task.countDocuments({
            status: { $ne: 'completed' },
            deadline: { $lt: new Date() }
        });

        // Lead statistics
        const convertedLeads = await Lead.countDocuments({ status: 'converted' });
        const activeLeads = await Lead.countDocuments({ 
            status: { $in: ['new', 'contacted', 'interested', 'follow_up_required'] }
        });

        // Calculate rates
        const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const leadConversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentTasks = await Task.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
        const recentLeads = await Lead.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

        // Team performance summary
        const teams = await Team.find({ isActive: true }).limit(5);
        const topTeams = await Promise.all(
            teams.map(async (team) => {
                const teamTasks = await Task.find({ teamId: team._id });
                const completed = teamTasks.filter(t => t.status === 'completed').length;
                return {
                    teamId: team._id,
                    teamName: team.name,
                    completionRate: teamTasks.length > 0 ? 
                        Math.round((completed / teamTasks.length) * 100) : 0
                };
            })
        );

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalTeams,
                    totalTasks,
                    totalLeads
                },
                tasks: {
                    total: totalTasks,
                    completed: completedTasks,
                    inProgress: inProgressTasks,
                    overdue: overdueTasks,
                    completionRate: taskCompletionRate
                },
                leads: {
                    total: totalLeads,
                    converted: convertedLeads,
                    active: activeLeads,
                    conversionRate: leadConversionRate
                },
                recentActivity: {
                    tasksCreated: recentTasks,
                    leadsCreated: recentLeads
                },
                topTeams: topTeams.sort((a, b) => b.completionRate - a.completionRate)
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    getLeadInflow,
    getSourceDistribution,
    getConversionMetrics,
    getTeamPerformance,
    getBestPerformingTeams,
    getTeamLeadEffectiveness,
    getDashboardStats
};