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
        const users = await User.find().populate('teamId').select('-password');
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

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
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

        // Remove user from teams
        await Team.updateMany(
            { members: user._id },
            { $pull: { members: user._id } }
        );

        // If user is a team lead, reassign or delete teams
        const teamsLed = await Team.find({ leadId: user._id });
        for (const team of teamsLed) {
            // Option: Delete team or reassign to another lead
            await team.deleteOne();
        }

        await user.deleteOne();

        // Log activity
        await ActivityLog.create({
            action: 'user_deleted',
            userId: req.user._id,
            details: `Admin deleted user: ${user.name} (${user.email})`
        });

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
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
        const { newPassword } = req.body;

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
        await user.save();

        // Log activity
        await ActivityLog.create({
            action: 'user_updated',
            userId: req.user._id,
            targetUserId: user._id,
            details: `Admin reset password for user: ${user.name}`
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
        
        res.json({
            success: true,
            count: teams.length,
            data: teams
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
        const { name, description, leadId, memberIds, department, coreField, currentProject } = req.body;

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
            leadId,
            members,
            department: department || '',
            coreField: coreField || teamLead.coreField || '',
            currentProject: currentProject || '',
            projectProgress: 0
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
            details: `Admin created team: ${team.name}`
        });

        const populatedTeam = await Team.findById(team._id)
            .populate('leadId', 'name email coreField designation')
            .populate('members', 'name email role coreField designation');

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
        const { title, description, priority, deadline, teamLeadId, isRecurring, recurrenceType, recurrenceEndDate } = req.body;

        // Validate required fields
        if (!title || !deadline || !teamLeadId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide title, deadline, and team lead' 
            });
        }

        // Verify team lead exists
        const teamLead = await User.findById(teamLeadId);
        if (!teamLead || teamLead.role !== 'team_lead') {
            return res.status(404).json({ success: false, message: 'Team lead not found' });
        }

        // Get team lead's team
        const team = await Team.findOne({ leadId: teamLeadId });

        // Create task
        const task = await Task.create({
            title,
            description: description || '',
            priority: priority || 'medium',
            status: 'assigned',
            deadline: new Date(deadline),
            assignedTo: teamLeadId,
            assignedBy: req.user._id,
            teamId: team ? team._id : null,
            isParentTask: true,
            isRecurring: isRecurring || false,
            recurrenceType: recurrenceType || 'none',
            recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null
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
    getDashboardStats,
    assignTaskToTeamLead,
    getAllTeamLeads
};
