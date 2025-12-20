const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ deletedAt: null }).populate('teamId').select('-password');
        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get user details with activity
// @route   GET /api/admin/users/:id/details
// @access  Private/Admin
const getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('teamId').select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get user's tasks
        const tasks = await Task.find({ assignedTo: user._id })
            .populate('assignedBy', 'name email')
            .populate('teamId', 'name')
            .sort({ createdAt: -1 })
            .limit(20);

        // Get user's activity logs
        const activities = await ActivityLog.find({
            $or: [
                { userId: user._id },
                { targetUserId: user._id }
            ]
        })
            .populate('userId', 'name email')
            .populate('targetUserId', 'name email')
            .sort({ createdAt: -1 })
            .limit(50);

        // Calculate task statistics
        const taskStats = {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'completed').length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length,
            pending: tasks.filter(t => t.status === 'assigned' || t.status === 'pending').length,
            overdue: tasks.filter(t => t.status !== 'completed' && new Date(t.deadline) < new Date()).length
        };

        // Calculate activity level (based on recent activities)
        const recentActivities = await ActivityLog.countDocuments({
            userId: user._id,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        });

        let activityLevel = 'Low';
        if (recentActivities > 50) activityLevel = 'Very High';
        else if (recentActivities > 30) activityLevel = 'High';
        else if (recentActivities > 15) activityLevel = 'Medium';

        res.json({
            success: true,
            data: {
                user,
                tasks,
                activities,
                taskStats,
                activityLevel,
                recentActivityCount: recentActivities
            }
        });
    } catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Create a new user (Team Lead or Team Member)
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = async (req, res) => {
    try {
        console.log('=== CREATE USER REQUEST ===');
        console.log('Request body:', req.body);
        
        const { name, email, password, role, phone, designation, coreField, teamId } = req.body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            console.log('Validation failed: Missing required fields');
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide name, email, password, and role' 
            });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log('User already exists:', email);
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists with this email' 
            });
        }

        // Validate role
        if (!['team_lead', 'team_member'].includes(role)) {
            console.log('Invalid role:', role);
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid role. Must be team_lead or team_member' 
            });
        }

        console.log('Creating user...');
        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role,
            phone: phone || '',
            designation: designation || '',
            coreField: coreField || '',
            teamId: teamId || null
        });
        console.log('User created successfully:', user._id);

        // Note: Teams should be created explicitly via Team Management, not automatically

        // If team member and teamId provided, add to team
        if (role === 'team_member' && teamId) {
            console.log('Adding user to team:', teamId);
            const team = await Team.findById(teamId);
            if (team) {
                team.members.push(user._id);
                await team.save();
                console.log('User added to team successfully');
            }
        }

        console.log('Logging activity...');
        // Log activity
        await ActivityLog.create({
            action: 'user_created',
            userId: req.user._id,
            targetUserId: user._id,
            details: `Admin created new user: ${user.name} (${user.role})`
        });

        console.log('Fetching user response...');
        const userResponse = await User.findById(user._id).populate('teamId').select('-password');

        console.log('=== USER CREATED SUCCESSFULLY ===');
        res.status(201).json({
            success: true,
            data: userResponse
        });
    } catch (error) {
        console.error('=== CREATE USER ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update a user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const { name, email, role, phone, designation, coreField, teamId } = req.body;

        let user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent admin from changing their own role
        if (user._id.toString() === req.user._id.toString() && role && role !== 'admin') {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot change your own admin role' 
            });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (role && ['admin', 'team_lead', 'team_member'].includes(role)) user.role = role;
        if (phone !== undefined) user.phone = phone;
        if (designation !== undefined) user.designation = designation;
        if (coreField !== undefined) user.coreField = coreField;
        if (teamId !== undefined) user.teamId = teamId;

        await user.save();

        // Log activity
        await ActivityLog.create({
            action: 'user_updated',
            userId: req.user._id,
            targetUserId: user._id,
            details: `Admin updated user: ${user.name}`
        });

        const updatedUser = await User.findById(user._id).populate('teamId').select('-password');

        res.json({
            success: true,
            data: updatedUser
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Delete a user (soft delete recommended)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const { permanent } = req.query; // ?permanent=true for hard delete
        
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete your own account' 
            });
        }

        if (permanent === 'true') {
            // HARD DELETE - Permanent removal
            // Remove user from teams
            await Team.updateMany(
                { members: user._id },
                { $pull: { members: user._id } }
            );

            // If user is a team lead, handle teams
            const teamsLed = await Team.find({ leadId: user._id });
            for (const team of teamsLed) {
                // Reassign tasks from this team to admin or delete team
                await Task.updateMany(
                    { teamId: team._id },
                    { teamId: null, assignedTo: req.user._id }
                );
                await team.deleteOne();
            }

            // Reassign user's tasks to admin
            await Task.updateMany(
                { assignedTo: user._id },
                { assignedTo: req.user._id }
            );

            await user.deleteOne();

            // Log activity
            await ActivityLog.create({
                action: 'user_deleted',
                userId: req.user._id,
                details: `Admin permanently deleted user: ${user.name} (${user.email})`
            });

            res.json({
                success: true,
                message: 'User permanently deleted successfully'
            });
        } else {
            // SOFT DELETE - Mark as deleted but keep data
            user.deletedAt = new Date();
            user.isActive = false;
            user.status = 'offline';
            await user.save();

            // Log activity
            await ActivityLog.create({
                action: 'user_deleted',
                userId: req.user._id,
                targetUserId: user._id,
                details: `Admin soft deleted user: ${user.name} (${user.email})`
            });

            res.json({
                success: true,
                message: 'User deleted successfully (soft delete - can be restored)'
            });
        }
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Activate/Deactivate a user
// @route   PUT /api/admin/users/:id/toggle-active
// @access  Private/Admin
const toggleUserActive = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent admin from deactivating themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot deactivate your own account' 
            });
        }

        user.isActive = !user.isActive;
        await user.save();

        // Log activity
        await ActivityLog.create({
            action: 'user_updated',
            userId: req.user._id,
            targetUserId: user._id,
            details: `Admin ${user.isActive ? 'activated' : 'deactivated'} user: ${user.name}`
        });

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Toggle user active error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Reset user password
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private/Admin
const resetUserPassword = async (req, res) => {
    try {
        const { newPassword, forceChange } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a password with at least 6 characters' 
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.password = newPassword;
        user.forcePasswordChange = forceChange || false; // Force password change on next login
        await user.save();

        // Log activity
        await ActivityLog.create({
            action: 'user_updated',
            userId: req.user._id,
            targetUserId: user._id,
            details: `Admin reset password for user: ${user.name}${forceChange ? ' (force change on next login)' : ''}`
        });

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get all teams
// @route   GET /api/admin/teams
// @access  Private/Admin
const getAllTeams = async (req, res) => {
    try {
        const teams = await Team.find()
            .populate('leadId', 'name email coreField designation phone')
            .populate('members', 'name email role coreField designation phone');
        
        // Update statistics for each team to get current data
        const teamsWithStats = await Promise.all(
            teams.map(async (team) => {
                await team.updateStatistics();
                await team.save();
                return team;
            })
        );
        
        res.json({
            success: true,
            count: teamsWithStats.length,
            data: teamsWithStats
        });
    } catch (error) {
        console.error('Get all teams error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Create a team
// @route   POST /api/admin/teams
// @access  Private/Admin
const createTeam = async (req, res) => {
    try {
        const { 
            name, 
            description, 
            objective,
            leadId, 
            memberIds, 
            department, 
            coreField, 
            currentProject,
            status,
            priority,
            taskType,
            projectProgress
        } = req.body;

        if (!name || !leadId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide team name and lead ID' 
            });
        }

        // Verify team lead exists and has correct role
        const teamLead = await User.findById(leadId);
        if (!teamLead) {
            return res.status(404).json({ success: false, message: 'Team lead not found' });
        }

        if (teamLead.role !== 'team_lead') {
            return res.status(400).json({ 
                success: false, 
                message: 'Selected user is not a team lead' 
            });
        }

        // Create team with lead as first member
        const members = [leadId];
        if (memberIds && Array.isArray(memberIds)) {
            memberIds.forEach(id => {
                if (id !== leadId) members.push(id);
            });
        }

        const team = await Team.create({
            name,
            description: description || '',
            objective: objective || '',
            leadId,
            members,
            department: department || '',
            coreField: coreField || teamLead.coreField || '',
            currentProject: currentProject || '',
            projectProgress: projectProgress || 0,
            status: status || 'active',
            priority: priority || 'medium',
            taskType: taskType || 'project_based',
            createdBy: req.user._id,
            isActive: true
        });

        // Update team lead's teamId
        teamLead.teamId = team._id;
        await teamLead.save();

        // Update members' teamId
        if (memberIds && memberIds.length > 0) {
            await User.updateMany(
                { _id: { $in: memberIds } },
                { teamId: team._id }
            );
        }

        // Log activity
        await ActivityLog.create({
            action: 'team_created',
            userId: req.user._id,
            teamId: team._id,
            details: `Admin created team: ${team.name} with ${members.length} member(s). Status: ${status || 'active'}, Priority: ${priority || 'medium'}, Type: ${taskType || 'project_based'}`
        });

        const populatedTeam = await Team.findById(team._id)
            .populate('leadId', 'name email coreField designation')
            .populate('members', 'name email role coreField designation')
            .populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            data: populatedTeam
        });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Assign members to a team
// @route   PUT /api/admin/teams/:id/assign-members
// @access  Private/Admin
const assignMembersToTeam = async (req, res) => {
    try {
        const { memberIds } = req.body;

        if (!memberIds || !Array.isArray(memberIds)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide an array of member IDs' 
            });
        }

        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        // Add new members (avoid duplicates)
        memberIds.forEach(memberId => {
            if (!team.members.includes(memberId)) {
                team.members.push(memberId);
            }
        });

        await team.save();

        // Update users' teamId
        await User.updateMany(
            { _id: { $in: memberIds } },
            { teamId: team._id }
        );

        // Log activity
        await ActivityLog.create({
            action: 'member_added',
            userId: req.user._id,
            teamId: team._id,
            details: `Admin assigned ${memberIds.length} members to team: ${team.name}`
        });

        const updatedTeam = await Team.findById(team._id)
            .populate('leadId', 'name email')
            .populate('members', 'name email role');

        res.json({
            success: true,
            data: updatedTeam
        });
    } catch (error) {
        console.error('Assign members error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get all tasks
// @route   GET /api/admin/tasks
// @access  Private/Admin
const getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .populate('teamId', 'name');
        
        res.json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('Get all tasks error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get all activity logs
// @route   GET /api/admin/activities
// @access  Private/Admin
const getAllActivities = async (req, res) => {
    try {
        const activities = await ActivityLog.find()
            .populate('userId', 'name email')
            .populate('targetUserId', 'name email')
            .populate('teamId', 'name')
            .populate('taskId', 'title')
            .sort({ createdAt: -1 })
            .limit(100);
        
        res.json({
            success: true,
            count: activities.length,
            data: activities
        });
    } catch (error) {
        console.error('Get all activities error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const totalTeams = await Team.countDocuments();
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'completed' });
        
        const usersByRole = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        const tasksByStatus = await Task.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                totalUsers,
                activeUsers,
                totalTeams,
                totalTasks,
                completedTasks,
                usersByRole,
                tasksByStatus
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserActive,
    resetUserPassword,
    getAllTeams,
    createTeam,
    assignMembersToTeam,
    getAllTasks,
    getAllActivities,
    getDashboardStats
};


// @desc    Assign task to Team Lead
// @route   POST /api/admin/assign-task
// @access  Private/Admin
const assignTaskToTeamLead = async (req, res) => {
    try {
        const { 
            title, 
            description, 
            category,
            priority, 
            startDate,
            dueDate,
            estimatedEffort,
            estimatedEffortUnit,
            deadlineType,
            taskType,
            teamLeadId,
            notes
        } = req.body;

        // Validate required fields
        if (!title || !dueDate || !teamLeadId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide title, due date, and team lead' 
            });
        }

        // Verify team lead exists
        const teamLead = await User.findById(teamLeadId);
        if (!teamLead || teamLead.role !== 'team_lead') {
            return res.status(404).json({ success: false, message: 'Team lead not found' });
        }

        // Get team lead's team
        const team = await Team.findOne({ leadId: teamLeadId });

        // Create task with all professional fields
        const task = await Task.create({
            // Basic Info
            title,
            description: description || '',
            category: category || 'other',
            priority: priority || 'medium',
            
            // Ownership
            assignedTo: teamLeadId,
            assignedBy: req.user._id,
            teamId: team ? team._id : null,
            taskType: taskType || 'one_time',
            
            // Timeline
            startDate: startDate ? new Date(startDate) : new Date(),
            dueDate: new Date(dueDate),
            deadline: new Date(dueDate),
            estimatedEffort: estimatedEffort || 0,
            estimatedEffortUnit: estimatedEffortUnit || 'hours',
            deadlineType: deadlineType || 'soft',
            
            // Status
            status: 'not_started',
            progressPercentage: 0,
            isOverdue: false,
            
            // Hierarchy
            isParentTask: true,
            
            // Audit
            assignedAt: new Date(),
            
            // Additional
            notes: notes || ''
        });

        // Log activity
        await ActivityLog.create({
            action: 'task_created',
            userId: req.user._id,
            targetUserId: teamLeadId,
            taskId: task._id,
            details: `Admin assigned task "${title}" to ${teamLead.name}`
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email role')
            .populate('assignedBy', 'name email')
            .populate('teamId', 'name');

        res.status(201).json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        console.error('Assign task error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get all team leads for task assignment
// @route   GET /api/admin/team-leads
// @access  Private/Admin
const getAllTeamLeads = async (req, res) => {
    try {
        const teamLeads = await User.find({ role: 'team_lead', isActive: true })
            .populate('teamId', 'name')
            .select('-password');
        
        res.json({
            success: true,
            count: teamLeads.length,
            data: teamLeads
        });
    } catch (error) {
        console.error('Get team leads error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get team details with tasks and performance
// @route   GET /api/admin/teams/:id/details
// @access  Private/Admin
const getTeamDetails = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('leadId', 'name email phone designation coreField')
            .populate('members', 'name email phone designation coreField isActive lastActive');

        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        // Get team tasks
        const tasks = await Task.find({ teamId: team._id })
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .sort({ createdAt: -1 });

        // Calculate task statistics
        const taskStats = {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'completed').length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length,
            pending: tasks.filter(t => t.status === 'assigned' || t.status === 'pending').length,
            overdue: tasks.filter(t => t.status === 'overdue' || (t.status !== 'completed' && new Date(t.deadline) < new Date())).length
        };

        // Calculate completion rate
        const completionRate = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;

        // Calculate average task completion time
        const completedTasks = tasks.filter(t => t.status === 'completed' && t.completedAt && t.createdAt);
        const avgCompletionTime = completedTasks.length > 0
            ? completedTasks.reduce((sum, t) => sum + (new Date(t.completedAt) - new Date(t.createdAt)), 0) / completedTasks.length / (1000 * 60 * 60 * 24)
            : 0;

        // Get member activity
        const memberActivity = await Promise.all(
            team.members.map(async (member) => {
                const memberTasks = tasks.filter(t => t.assignedTo._id.toString() === member._id.toString());
                const completedCount = memberTasks.filter(t => t.status === 'completed').length;
                const recentActivity = await ActivityLog.countDocuments({
                    userId: member._id,
                    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                });

                return {
                    userId: member._id,
                    name: member.name,
                    email: member.email,
                    tasksAssigned: memberTasks.length,
                    tasksCompleted: completedCount,
                    completionRate: memberTasks.length > 0 ? Math.round((completedCount / memberTasks.length) * 100) : 0,
                    recentActivity,
                    isActive: member.isActive,
                    lastActive: member.lastActive
                };
            })
        );

        // Calculate team health score (0-100)
        const healthScore = Math.round(
            (completionRate * 0.4) + // 40% weight on completion rate
            (Math.min(100, (team.members.filter(m => m.isActive).length / team.members.length) * 100) * 0.3) + // 30% weight on active members
            (Math.max(0, 100 - (taskStats.overdue / Math.max(1, taskStats.total)) * 100) * 0.3) // 30% weight on overdue tasks (inverse)
        );

        // Determine team status
        let teamStatus = 'Excellent';
        if (healthScore < 40) teamStatus = 'Critical';
        else if (healthScore < 60) teamStatus = 'Needs Attention';
        else if (healthScore < 80) teamStatus = 'Good';

        res.json({
            success: true,
            data: {
                team,
                tasks,
                taskStats,
                completionRate,
                avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
                memberActivity,
                healthScore,
                teamStatus,
                activeMembers: team.members.filter(m => m.isActive).length,
                inactiveMembers: team.members.filter(m => !m.isActive).length
            }
        });
    } catch (error) {
        console.error('Get team details error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update team
// @route   PUT /api/admin/teams/:id
// @access  Private/Admin
const updateTeam = async (req, res) => {
    try {
        const { name, description, currentProject, projectProgress, department, coreField } = req.body;

        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        if (name) team.name = name;
        if (description !== undefined) team.description = description;
        if (currentProject !== undefined) team.currentProject = currentProject;
        if (projectProgress !== undefined) team.projectProgress = projectProgress;
        if (department !== undefined) team.department = department;
        if (coreField !== undefined) team.coreField = coreField;

        await team.save();

        // Log activity
        await ActivityLog.create({
            action: 'team_updated',
            userId: req.user._id,
            teamId: team._id,
            details: `Admin updated team: ${team.name}`
        });

        const updatedTeam = await Team.findById(team._id)
            .populate('leadId', 'name email')
            .populate('members', 'name email role');

        res.json({
            success: true,
            data: updatedTeam
        });
    } catch (error) {
        console.error('Update team error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Delete team
// @route   DELETE /api/admin/teams/:id
// @access  Private/Admin
const deleteTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        // Remove team reference from users
        await User.updateMany(
            { teamId: team._id },
            { teamId: null }
        );

        // Handle tasks - reassign to admin or mark as unassigned
        await Task.updateMany(
            { teamId: team._id },
            { teamId: null }
        );

        await team.deleteOne();

        // Log activity
        await ActivityLog.create({
            action: 'team_deleted',
            userId: req.user._id,
            details: `Admin deleted team: ${team.name}`
        });

        res.json({
            success: true,
            message: 'Team deleted successfully'
        });
    } catch (error) {
        console.error('Delete team error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Remove member from team
// @route   PUT /api/admin/teams/:id/remove-member
// @access  Private/Admin
const removeMemberFromTeam = async (req, res) => {
    try {
        const { memberId } = req.body;

        if (!memberId) {
            return res.status(400).json({ success: false, message: 'Please provide member ID' });
        }

        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        // Remove member from team
        team.members = team.members.filter(m => m.toString() !== memberId);
        await team.save();

        // Update user's teamId
        await User.findByIdAndUpdate(memberId, { teamId: null });

        // Get member info for logging
        const member = await User.findById(memberId);

        // Log activity
        await ActivityLog.create({
            action: 'member_removed',
            userId: req.user._id,
            teamId: team._id,
            targetUserId: memberId,
            details: `Admin removed ${member?.name} from team: ${team.name}`
        });

        const updatedTeam = await Team.findById(team._id)
            .populate('leadId', 'name email')
            .populate('members', 'name email role');

        res.json({
            success: true,
            data: updatedTeam
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get team performance metrics
// @route   GET /api/admin/teams/:id/performance
// @access  Private/Admin
const getTeamPerformance = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id).populate('members', 'name');
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        // Get tasks for last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const tasks = await Task.find({
            teamId: team._id,
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Calculate weekly performance
        const weeklyData = [];
        for (let i = 0; i < 4; i++) {
            const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
            
            const weekTasks = tasks.filter(t => 
                new Date(t.createdAt) >= weekStart && new Date(t.createdAt) < weekEnd
            );
            
            weeklyData.unshift({
                week: `Week ${4 - i}`,
                tasksCompleted: weekTasks.filter(t => t.status === 'completed').length,
                tasksAssigned: weekTasks.length
            });
        }

        // Task completion speed (average days to complete)
        const completedTasks = tasks.filter(t => t.status === 'completed' && t.completedAt);
        const avgSpeed = completedTasks.length > 0
            ? completedTasks.reduce((sum, t) => {
                const days = (new Date(t.completedAt) - new Date(t.createdAt)) / (1000 * 60 * 60 * 24);
                return sum + days;
            }, 0) / completedTasks.length
            : 0;

        res.json({
            success: true,
            data: {
                weeklyData,
                avgCompletionSpeed: Math.round(avgSpeed * 10) / 10,
                totalTasksLast30Days: tasks.length,
                completedLast30Days: tasks.filter(t => t.status === 'completed').length
            }
        });
    } catch (error) {
        console.error('Get team performance error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update task
// @route   PUT /api/admin/tasks/:id
// @access  Private/Admin
const updateTask = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            priority,
            startDate,
            dueDate,
            estimatedEffort,
            estimatedEffortUnit,
            deadlineType,
            taskType,
            notes
        } = req.body;

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Update fields
        if (title) task.title = title;
        if (description !== undefined) task.description = description;
        if (category) task.category = category;
        if (priority) task.priority = priority;
        if (startDate) task.startDate = new Date(startDate);
        if (dueDate) {
            task.dueDate = new Date(dueDate);
            task.deadline = new Date(dueDate);
        }
        if (estimatedEffort !== undefined) task.estimatedEffort = estimatedEffort;
        if (estimatedEffortUnit) task.estimatedEffortUnit = estimatedEffortUnit;
        if (deadlineType) task.deadlineType = deadlineType;
        if (taskType) task.taskType = taskType;
        if (notes !== undefined) task.notes = notes;

        task.lastUpdatedBy = req.user._id;
        await task.save();

        // Log activity
        await ActivityLog.create({
            action: 'task_updated',
            userId: req.user._id,
            taskId: task._id,
            details: `Admin updated task: ${task.title}`
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .populate('teamId', 'name');

        res.json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Reassign task to another team lead
// @route   PUT /api/admin/tasks/:id/reassign
// @access  Private/Admin
const reassignTask = async (req, res) => {
    try {
        const { newTeamLeadId } = req.body;

        if (!newTeamLeadId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide new team lead ID' 
            });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Verify new team lead exists
        const newTeamLead = await User.findById(newTeamLeadId);
        if (!newTeamLead || newTeamLead.role !== 'team_lead') {
            return res.status(404).json({ success: false, message: 'Team lead not found' });
        }

        const oldTeamLead = task.assignedTo;
        task.assignedTo = newTeamLeadId;
        
        // Update team if new team lead has different team
        if (newTeamLead.teamId) {
            task.teamId = newTeamLead.teamId;
        }

        task.lastUpdatedBy = req.user._id;
        await task.save();

        // Log activity
        await ActivityLog.create({
            action: 'task_reassigned',
            userId: req.user._id,
            taskId: task._id,
            details: `Admin reassigned task "${task.title}" from ${oldTeamLead?.name || 'Unknown'} to ${newTeamLead.name}`
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .populate('teamId', 'name');

        res.json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        console.error('Reassign task error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Cancel task
// @route   PUT /api/admin/tasks/:id/cancel
// @access  Private/Admin
const cancelTask = async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a reason for cancellation' 
            });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        task.status = 'cancelled';
        task.notes = task.notes 
            ? `${task.notes}\n\n[CANCELLED] Reason: ${reason}` 
            : `[CANCELLED] Reason: ${reason}`;
        task.lastUpdatedBy = req.user._id;
        await task.save();

        // Log activity
        await ActivityLog.create({
            action: 'task_cancelled',
            userId: req.user._id,
            taskId: task._id,
            details: `Admin cancelled task: ${task.title}. Reason: ${reason}`
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .populate('teamId', 'name');

        res.json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        console.error('Cancel task error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    getAllUsers,
    getUserDetails,
    createUser,
    updateUser,
    deleteUser,
    toggleUserActive,
    resetUserPassword,
    getAllTeams,
    getTeamDetails,
    createTeam,
    updateTeam,
    deleteTeam,
    assignMembersToTeam,
    removeMemberFromTeam,
    getTeamPerformance,
    getAllTasks,
    getAllActivities,
    getDashboardStats,
    assignTaskToTeamLead,
    getAllTeamLeads,
    updateTask,
    reassignTask,
    cancelTask
};
