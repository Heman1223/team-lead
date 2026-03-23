const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all users (team members)
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
    try {
        const { teamId, status, role, roleFiltered } = req.query;

        let query = {}; // all users
                if (status) query.status = status;
                if (role) query.role = role;

        const users = await User.find(query)
            .select('-password')
            .populate('teamId', 'name')
            .sort({ name: 1 });

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('teamId', 'name');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new user (add team member)
// @route   POST /api/users
// @access  Private (Team Lead only)
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, designation, phone, skills } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        // Create new user with team lead's team
        const user = await User.create({
            name,
            email,
            password: password || 'password123', // Default password
            role: role || 'team_member',
            teamId: req.user.teamId,
            designation,
            phone,
            skills: skills || []
        });

        // Add user to team
        if (req.user.teamId) {
            await Team.findByIdAndUpdate(req.user.teamId, {
                $addToSet: { members: user._id }
            });
        }

        // Log activity
        await ActivityLog.create({
            action: 'user_created',
            userId: req.user._id,
            targetUserId: user._id,
            teamId: req.user.teamId,
            details: `Team member added: ${user.name}`
        });

        res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Create user error:', error);
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Team Lead only)
const updateUser = async (req, res) => {
    try {
        const { name, email, role, designation, phone, skills, status } = req.body;

        let user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (designation) user.designation = designation;
        if (phone) user.phone = phone;
        if (skills) user.skills = skills;
        if (status) user.status = status;

        // Handle isActive status
        if (req.body.isActive !== undefined) {
            // Safety Check: A Team Lead cannot deactivate an Admin or another Team Lead
            // (Assuming only admins can manage other high-level roles)
            if (req.user.role === 'team_lead') {
                if (user.role === 'admin' || user.role === 'team_lead') {
                    if (req.body.isActive === false) {
                        return res.status(403).json({
                            success: false,
                            message: 'As a Team Lead, you cannot deactivate other leaders or administrators'
                        });
                    }
                }
            }
            
            user.isActive = req.body.isActive;
        }

        await user.save();

        // Log activity
        await ActivityLog.create({
            action: 'user_updated',
            userId: req.user._id,
            targetUserId: user._id,
            teamId: req.user.teamId,
            details: `User updated: ${user.name}`
        });

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Team Lead only)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Cleanup before hard delete
        // Remove from team
        if (user.teamId) {
            await Team.findByIdAndUpdate(user.teamId, {
                $pull: { members: user._id }
            });

            // Also remove from memberDetails if it exists in those teams
            await Team.updateMany(
                { 'memberDetails.userId': user._id },
                { $pull: { memberDetails: { userId: user._id } } }
            );
        }

        // Reassign tasks to the person deleting (usually team lead)
        await Task.updateMany(
            { assignedTo: user._id },
            { assignedTo: req.user._id }
        );

        // Clear subtasks assignments
        await Task.updateMany(
            { 'subtasks.assignedTo': user._id },
            { $set: { 'subtasks.$.assignedTo': null } }
        );

        // Reassign leads
        const Lead = mongoose.model('Lead');
        await Lead.updateMany(
            { assignedTo: user._id },
            { assignedTo: null }
        );

        // Hard delete
        await user.deleteOne();

        // Log activity after deletion
        await ActivityLog.create({
            action: 'user_deleted',
            userId: req.user._id,
            teamId: req.user.teamId,
            details: `User removed: ${user.name}`
        });

        res.json({
            success: true,
            message: 'User removed successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get team members status summary
// @route   GET /api/users/status-summary
// @access  Private
const getStatusSummary = async (req, res) => {
    try {
        const teamId = req.user.teamId;

        const statusCounts = await User.aggregate([
            { $match: { teamId: teamId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const summary = {
            online: 0,
            offline: 0,
            busy: 0,
            total: 0
        };

        statusCounts.forEach(item => {
            summary[item._id] = item.count;
            summary.total += item.count;
        });

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get status summary error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getStatusSummary
};
