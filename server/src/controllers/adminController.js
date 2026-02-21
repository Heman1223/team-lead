const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
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
            .populate('subtasks.assignedTo', 'name email avatar role')
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
        
        const { name, email, password, role, phone, designation, department, coreField, teamId } = req.body;

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
        console.log('👤 Admin creating user:', { name, email, role, hasPassword: !!password });
        const user = await User.create({
            name,
            email,
            password,
            role,
            phone: phone || '',
            designation: designation || '',
            department: department || '',
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
        const { name, email, role, phone, designation, department, coreField, teamId } = req.body;

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

        // Check if email is being changed and if it's already taken
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email: email.toLowerCase() });
            if (emailExists) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email already in use' 
                });
            }
            user.email = email;
        }

        // Update fields
        if (name) user.name = name;
        if (role && ['admin', 'team_lead', 'team_member'].includes(role)) user.role = role;
        if (phone !== undefined) user.phone = phone;
        if (designation !== undefined) user.designation = designation;
        if (department !== undefined) user.department = department;
        if (coreField !== undefined) user.coreField = coreField;
        
        // Handle teamId - convert empty string to null
        if (teamId !== undefined) {
            user.teamId = teamId === '' || teamId === null ? null : teamId;
        }

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
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already exists' 
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                message: messages.join(', ') 
            });
        }
        
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
            .populate('leadId', 'name email avatar coreField designation phone')
            .populate('members', 'name email avatar role coreField designation phone');
        
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

        // Handle members with roles
        const members = [leadId];
        const memberDetails = [{
            userId: leadId,
            role: 'lead',
            joinedAt: new Date()
        }];

        if (memberIds && Array.isArray(memberIds)) {
            memberIds.forEach(m => {
                const id = typeof m === 'object' ? m.userId : m;
                const role = typeof m === 'object' ? m.role : 'member';
                
                if (id !== leadId) {
                    if (!members.includes(id)) {
                        members.push(id);
                        memberDetails.push({
                            userId: id,
                            role: role || 'member',
                            joinedAt: new Date()
                        });
                    }
                }
            });
        }

        const team = await Team.create({
            name,
            description: description || '',
            objective: objective || '',
            leadId,
            members,
            memberDetails,
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
            const memberUserIds = memberIds.map(m => typeof m === 'object' ? m.userId : m);
            await User.updateMany(
                { _id: { $in: memberUserIds } },
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

        // Send notification to team lead
        await Notification.create({
            type: 'system',
            title: 'New Team Created',
            message: `You have been assigned as the lead of team: ${team.name}`,
            userId: leadId,
            senderId: req.user._id
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
        // Handle duplicate key error (11000)
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Team with this name already exists' 
            });
        }
        // Return actual error message for debugging
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error during team creation',
            error: error.message 
        });
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
            const idStr = memberId.toString();
            if (!team.members.some(m => m.toString() === idStr)) {
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

        // Send notifications to new members
        for (const memberId of memberIds) {
            await Notification.create({
                type: 'system',
                title: 'Added to Team',
                message: `You have been added to team: ${team.name}`,
                userId: memberId,
                senderId: req.user._id
            });
        }

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
        const tasks = await Task.find({ isDeleted: { $ne: true } })
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .populate('teamId', 'name')
            .populate('subtasks.assignedTo', 'name email avatar')
            .populate('relatedLead', 'clientName email');
        
        // Calculate progress for each task before returning WITHOUT saving in loop
        const tasksWithProgress = tasks.map((task) => {
            const taskObj = task.toObject();
            if (taskObj.subtasks && taskObj.subtasks.length > 0) {
                const totalSubtasks = taskObj.subtasks.length;
                const totalProgress = taskObj.subtasks.reduce((sum, st) => sum + (st.progressPercentage || 0), 0);
                taskObj.progressPercentage = Math.round(totalProgress / totalSubtasks) || 0;
            }
            return taskObj;
        });
        
        res.json({
            success: true,
            count: tasksWithProgress.length,
            data: tasksWithProgress
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
        const activeUsersCount = await User.countDocuments(); // Count all as active
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
                activeUsers: activeUsersCount,
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


// @desc    Assign task to Team Lead
// @route   POST /api/admin/assign-task
// @access  Private/Admin
const assignTaskToTeamLead = async (req, res) => {
    try {
        const { 
            title, 
            description,
            detailedDescription,
            clientRequirements,
            projectScope,
            category,
            priority, 
            startDate,
            dueDate,
            estimatedEffort,
            estimatedEffortUnit,
            deadlineType,
            taskType,
            teamLeadId,
            notes,
            relatedProject,
            relatedLead,
            reminder,
            checklist
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
            detailedDescription: detailedDescription || '',
            clientRequirements: clientRequirements || '',
            projectScope: projectScope || '',
            category: category || 'other',
            priority: priority || 'medium',
            
            // Ownership
            assignedTo: teamLeadId,
            assignedBy: req.user._id,
            teamId: team ? team._id : null,
            taskType: taskType || 'one_time',
            relatedProject: relatedProject || '',
            relatedLead: relatedLead || null,
            
            // Timeline
            startDate: startDate ? new Date(startDate) : new Date(),
            dueDate: new Date(dueDate),
            deadline: new Date(dueDate),
            estimatedEffort: estimatedEffort || 0,
            estimatedEffortUnit: estimatedEffortUnit || 'hours',
            deadlineType: deadlineType || 'soft',
            reminder: reminder ? new Date(reminder) : null,
            
            // Status
            status: 'pending',
            progressPercentage: 0,
            isOverdue: false,
            
            // Hierarchy
            isParentTask: true,
            
            // Audit
            assignedAt: new Date(),
            
            // Additional
            notes: notes || '',
            checklist: checklist || []
        });

        // Log activity
        await ActivityLog.create({
            action: 'task_created',
            userId: req.user._id,
            targetUserId: teamLeadId,
            taskId: task._id,
            details: `Admin assigned task "${title}" to ${teamLead.name}`
        });

        // Send notification to team lead
        await Notification.create({
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: `Admin assigned you a new task: ${title}`,
            userId: teamLeadId,
            taskId: task._id,
            senderId: req.user._id,
            priority: priority || 'medium'
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
        const teamLeads = await User.find({ role: 'team_lead' })
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
            .populate('subtasks.assignedTo', 'name email avatar role')
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
                    _id: member._id,
                    userId: member._id,
                    name: member.name,
                    email: member.email,
                    designation: member.designation,
                    tasksAssigned: memberTasks.length,
                    tasksCompleted: completedCount,
                    completionRate: memberTasks.length > 0 ? Math.round((completedCount / memberTasks.length) * 100) : 0,
                    recentActivity,
                    isActive: member.isActive,
                    lastActive: member.lastActive
                };
            })
        );

        // Update statistics to get latest health score and status
        await team.updateStatistics();
        await team.save();

        res.json({
            success: true,
            data: {
                team,
                tasks,
                taskStats,
                completionRate,
                avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
                memberActivity,
                healthScore: team.healthScore,
                teamStatus: team.healthStatus,
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
        const { name, description, objective, currentProject, projectProgress, department, coreField, leadId, memberIds } = req.body;

        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        // Basic Info Updates
        if (name) team.name = name;
        if (description !== undefined) team.description = description;
        if (objective !== undefined) team.objective = objective;
        if (currentProject !== undefined) team.currentProject = currentProject;
        if (projectProgress !== undefined) team.projectProgress = projectProgress;
        if (department !== undefined) team.department = department;
        if (coreField !== undefined) team.coreField = coreField;

        // Handle Leadership Change
        if (leadId && leadId.toString() !== team.leadId?.toString()) {
            const oldLeadId = team.leadId;
            const newLead = await User.findById(leadId);
            
            if (!newLead || newLead.role !== 'team_lead') {
                return res.status(400).json({ success: false, message: 'Invalid lead ID or role' });
            }

            team.leadId = leadId;
            
            // Ensure new lead is in members
            if (!team.members.includes(leadId)) {
                team.members.push(leadId);
            }

            // Update Users
            if (oldLeadId) {
                await User.findByIdAndUpdate(oldLeadId, { teamId: null });
            }
            await User.findByIdAndUpdate(leadId, { teamId: team._id });
        }

        // Handle Members Change
        if (memberIds && Array.isArray(memberIds)) {
            // Include lead in members if not already there
            const finalMembers = [...new Set([...memberIds, team.leadId.toString()])];
            
            // Sync memberDetails structure
            const newMemberDetails = finalMembers.map(mId => {
                const existing = team.memberDetails.find(md => md.userId.toString() === mId);
                return {
                    userId: mId,
                    role: mId === team.leadId.toString() ? 'lead' : 'member',
                    joinedAt: existing ? existing.joinedAt : new Date()
                };
            });

            // Sync User models teamId
            // 1. Clear old members
            await User.updateMany(
                { teamId: team._id },
                { teamId: null }
            );

            // 2. Set new members
            await User.updateMany(
                { _id: { $in: finalMembers } },
                { teamId: team._id }
            );

            team.members = finalMembers;
            team.memberDetails = newMemberDetails;
        }

        await team.save();

        // Log activity
        await ActivityLog.create({
            action: 'team_updated',
            userId: req.user._id,
            teamId: team._id,
            details: `Admin updated team: ${team.name}. Fields: ${Object.keys(req.body).join(', ')}`
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
            detailedDescription,
            clientRequirements,
            projectScope,
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
        if (detailedDescription !== undefined) task.detailedDescription = detailedDescription;
        if (clientRequirements !== undefined) task.clientRequirements = clientRequirements;
        if (projectScope !== undefined) task.projectScope = projectScope;
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

        // Send notification to assigned user
        await Notification.create({
            type: 'task_updated',
            title: 'Task Updated',
            message: `Admin updated your task: ${task.title}`,
            userId: task.assignedTo,
            taskId: task._id,
            senderId: req.user._id
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .populate('teamId', 'name')
            .populate('attachments.uploadedBy', 'name');

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

        // Send notification to new team lead
        await Notification.create({
            type: 'task_assigned',
            title: 'Task Reassigned to You',
            message: `Admin reassigned task to you: ${task.title}`,
            userId: newTeamLeadId,
            taskId: task._id,
            senderId: req.user._id,
            priority: task.priority || 'medium'
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
            .populate('teamId', 'name')
            .populate('subtasks.assignedTo', 'name email avatar role');

        res.json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        console.error('Cancel task error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/admin/tasks/:id
// @access  Private/Admin
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const taskTitle = task.title;
        
        // Soft delete
        task.isDeleted = true;
        task.deletedAt = new Date();
        await task.save();

        // Log activity
        await ActivityLog.create({
            action: 'task_deleted',
            userId: req.user._id,
            details: `Admin deleted task: ${taskTitle}`
        });

        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Upload attachment to task
// @route   POST /api/admin/tasks/:id/attachments
// @access  Private/Admin
const uploadTaskAttachment = async (req, res) => {
    try {
        const { fileName, fileUrl, fileType, fileSize, originalName } = req.body;

        if (!fileName || !fileUrl) {
            return res.status(400).json({
                success: false,
                message: 'Please provide fileName and fileUrl'
            });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const attachment = {
            name: fileName,
            originalName: originalName || fileName,
            url: fileUrl,
            fileType: fileType || 'unknown',
            fileSize: fileSize || 0,
            uploadedBy: req.user._id,
            uploadedAt: new Date()
        };

        task.attachments.push(attachment);
        await task.save();

        await ActivityLog.create({
            action: 'task_updated',
            userId: req.user._id,
            taskId: task._id,
            details: `Admin attached file to task: ${task.title} - ${fileName}`
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .populate('teamId', 'name')
            .populate('subtasks.assignedTo', 'name email avatar role')
            .populate('attachments.uploadedBy', 'name');

        res.json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        console.error('Upload attachment error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Delete attachment from task
// @route   DELETE /api/admin/tasks/:id/attachments/:attachmentId
// @access  Private/Admin
const deleteTaskAttachment = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const attachment = task.attachments.id(req.params.attachmentId);
        if (!attachment) {
            return res.status(404).json({ success: false, message: 'Attachment not found' });
        }

        const attachmentName = attachment.name;
        task.attachments.pull(req.params.attachmentId);
        await task.save();

        await ActivityLog.create({
            action: 'task_updated',
            userId: req.user._id,
            taskId: task._id,
            details: `Admin removed file from task: ${task.title} - ${attachmentName}`
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .populate('teamId', 'name')
            .populate('subtasks.assignedTo', 'name email avatar role')
            .populate('attachments.uploadedBy', 'name');

        res.json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        console.error('Delete attachment error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Send manual admin message/notification to user
// @route   POST /api/admin/users/:id/message
// @access  Private/Admin
const sendAdminMessage = async (req, res) => {
    try {
        const { title, message, priority } = req.body;
        const targetUser = await User.findById(req.params.id);

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Create Notification
        const notification = await Notification.create({
            type: 'manual_reminder',
            title: title || 'Message from Administrator',
            message: message,
            userId: targetUser._id,
            senderId: req.user._id,
            priority: priority || 'medium',
            relatedToModel: 'User',
            relatedTo: targetUser._id
        });

        // Log this activity
        await ActivityLog.create({
            userId: req.user._id,
            type: 'USER_MEMBER_NOTIFIED',
            description: `Sent admin message to ${targetUser.name}: ${title}`,
            relatedId: targetUser._id,
            relatedModel: 'User'
        });

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: notification
        });
    } catch (error) {
        console.error('Send Admin Message Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllUsers,
    getUserDetails,
    createUser,
    updateUser,
    deleteUser,
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
    deleteTask,
    reassignTask,
    cancelTask,
    uploadTaskAttachment,
    deleteTaskAttachment,
    sendAdminMessage
};
