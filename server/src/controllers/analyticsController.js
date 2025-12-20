const Task = require('../models/Task');
const Team = require('../models/Team');
const User = require('../models/User');

// @desc    Get team performance overview
// @route   GET /api/admin/analytics/team-performance
// @access  Private/Admin
const getTeamPerformance = async (req, res) => {
    try {
        const teams = await Team.find({ isActive: true })
            .populate('leadId', 'name email')
            .populate('members', 'name email role');

        const performanceData = await Promise.all(teams.map(async (team) => {
            // Get all tasks assigned to team lead (parent tasks)
            const teamLeadTasks = await Task.find({
                assignedTo: team.leadId,
                isParentTask: true
            });

            // Get all subtasks for team members
            const memberTasks = await Task.find({
                teamId: team._id,
                isParentTask: false
            });

            const totalTasks = teamLeadTasks.length;
            const completedTasks = teamLeadTasks.filter(t => t.status === 'completed').length;
            const inProgressTasks = teamLeadTasks.filter(t => t.status === 'in_progress').length;
            const pendingTasks = teamLeadTasks.filter(t => t.status === 'pending' || t.status === 'assigned').length;
            const overdueTasks = teamLeadTasks.filter(t => t.status === 'overdue').length;

            // Calculate progress percentage
            const progressPercentage = totalTasks > 0 
                ? Math.round((completedTasks / totalTasks) * 100) 
                : 0;

            // Calculate member subtasks completion
            const totalSubtasks = memberTasks.length;
            const completedSubtasks = memberTasks.filter(t => t.status === 'completed').length;
            const subtaskProgress = totalSubtasks > 0
                ? Math.round((completedSubtasks / totalSubtasks) * 100)
                : 0;

            // Calculate average completion time
            const completedTasksWithTime = memberTasks.filter(t => 
                t.status === 'completed' && t.completedAt && t.startedAt
            );
            const avgCompletionTime = completedTasksWithTime.length > 0
                ? completedTasksWithTime.reduce((sum, task) => {
                    const hours = (task.completedAt - task.startedAt) / (1000 * 60 * 60);
                    return sum + hours;
                }, 0) / completedTasksWithTime.length
                : 0;

            // Determine performance status
            let performanceStatus = 'needs_attention';
            if (progressPercentage >= 80 && overdueTasks === 0) {
                performanceStatus = 'doing_great';
            } else if (progressPercentage >= 50 && overdueTasks <= 2) {
                performanceStatus = 'average';
            }

            // Calculate completion rate (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentCompletedTasks = memberTasks.filter(t => 
                t.status === 'completed' && t.completedAt >= sevenDaysAgo
            ).length;

            return {
                teamId: team._id,
                teamName: team.name,
                teamLead: {
                    id: team.leadId._id,
                    name: team.leadId.name,
                    email: team.leadId.email
                },
                memberCount: team.members.length,
                totalTasks,
                completedTasks,
                inProgressTasks,
                pendingTasks,
                overdueTasks,
                progressPercentage,
                subtaskProgress,
                avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
                performanceStatus,
                recentCompletionRate: recentCompletedTasks,
                lastUpdated: new Date()
            };
        }));

        // Sort by performance
        performanceData.sort((a, b) => {
            if (a.progressPercentage !== b.progressPercentage) {
                return b.progressPercentage - a.progressPercentage;
            }
            return a.overdueTasks - b.overdueTasks;
        });

        res.json({
            success: true,
            data: performanceData
        });
    } catch (error) {
        console.error('Get team performance error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get best performing teams
// @route   GET /api/admin/analytics/best-teams
// @access  Private/Admin
const getBestPerformingTeams = async (req, res) => {
    try {
        const teams = await Team.find({ isActive: true })
            .populate('leadId', 'name email');

        const teamScores = await Promise.all(teams.map(async (team) => {
            const teamLeadTasks = await Task.find({
                assignedTo: team.leadId,
                isParentTask: true
            });

            const memberTasks = await Task.find({
                teamId: team._id,
                isParentTask: false
            });

            const totalTasks = teamLeadTasks.length;
            const completedTasks = teamLeadTasks.filter(t => t.status === 'completed').length;
            const overdueTasks = teamLeadTasks.filter(t => t.status === 'overdue').length;

            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            const overdueRate = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0;

            // Calculate response time (time from assigned to in_progress)
            const tasksWithResponse = memberTasks.filter(t => t.startedAt && t.createdAt);
            const avgResponseTime = tasksWithResponse.length > 0
                ? tasksWithResponse.reduce((sum, task) => {
                    const hours = (task.startedAt - task.createdAt) / (1000 * 60 * 60);
                    return sum + hours;
                }, 0) / tasksWithResponse.length
                : 0;

            // Calculate score (higher is better)
            const score = completionRate - (overdueRate * 2) - (avgResponseTime * 0.5);

            return {
                teamId: team._id,
                teamName: team.name,
                teamLead: team.leadId.name,
                completionRate: Math.round(completionRate),
                overdueRate: Math.round(overdueRate),
                avgResponseTime: Math.round(avgResponseTime * 10) / 10,
                score: Math.round(score * 10) / 10
            };
        }));

        // Sort by score
        teamScores.sort((a, b) => b.score - a.score);

        res.json({
            success: true,
            data: teamScores.slice(0, 5) // Top 5 teams
        });
    } catch (error) {
        console.error('Get best teams error:', error);
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

        const team = await Team.findOne({ leadId });
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        // Tasks assigned to team lead by admin
        const parentTasks = await Task.find({
            assignedTo: leadId,
            isParentTask: true
        });

        // Tasks assigned by team lead to members
        const subtasks = await Task.find({
            assignedBy: leadId,
            isParentTask: false
        });

        // Calculate distribution efficiency
        const totalParentTasks = parentTasks.length;
        const totalSubtasks = subtasks.length;
        const distributionRatio = totalParentTasks > 0 
            ? (totalSubtasks / totalParentTasks).toFixed(2)
            : 0;

        // Member participation
        const activeMemberIds = [...new Set(subtasks.map(t => t.assignedTo.toString()))];
        const participationRate = team.members.length > 0
            ? Math.round((activeMemberIds.length / team.members.length) * 100)
            : 0;

        // Completion consistency (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentSubtasks = subtasks.filter(t => t.createdAt >= thirtyDaysAgo);
        const completedRecent = recentSubtasks.filter(t => t.status === 'completed').length;
        const consistencyRate = recentSubtasks.length > 0
            ? Math.round((completedRecent / recentSubtasks.length) * 100)
            : 0;

        // Daily/weekly trend (last 7 days)
        const trends = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const dayTasks = subtasks.filter(t => 
                t.completedAt >= date && t.completedAt < nextDate
            ).length;

            trends.push({
                date: date.toISOString().split('T')[0],
                completed: dayTasks
            });
        }

        res.json({
            success: true,
            data: {
                teamLeadName: teamLead.name,
                teamName: team.name,
                totalParentTasks,
                totalSubtasks,
                distributionRatio,
                participationRate,
                consistencyRate,
                activeMembersCount: activeMemberIds.length,
                totalMembersCount: team.members.length,
                weeklyTrend: trends
            }
        });
    } catch (error) {
        console.error('Get team lead effectiveness error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/analytics/dashboard-stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const totalTeams = await Team.countDocuments({ isActive: true });
        const totalUsers = await User.countDocuments({ isActive: true });
        const totalTeamLeads = await User.countDocuments({ role: 'team_lead', isActive: true });
        const totalMembers = await User.countDocuments({ role: 'team_member', isActive: true });

        const allTasks = await Task.find({ isParentTask: true });
        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(t => t.status === 'completed').length;
        const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
        const overdueTasks = allTasks.filter(t => t.status === 'overdue').length;
        const pendingTasks = allTasks.filter(t => t.status === 'pending' || t.status === 'assigned').length;

        const overallProgress = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

        // Task completion trend (last 7 days)
        const completionTrend = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const dayCompleted = allTasks.filter(t => 
                t.completedAt >= date && t.completedAt < nextDate
            ).length;

            completionTrend.push({
                date: date.toISOString().split('T')[0],
                completed: dayCompleted
            });
        }

        res.json({
            success: true,
            data: {
                totalTeams,
                totalUsers,
                totalTeamLeads,
                totalMembers,
                totalTasks,
                completedTasks,
                inProgressTasks,
                overdueTasks,
                pendingTasks,
                overallProgress,
                completionTrend
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    getTeamPerformance,
    getBestPerformingTeams,
    getTeamLeadEffectiveness,
    getDashboardStats
};
