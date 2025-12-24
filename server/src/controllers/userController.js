const User = require('../models/User');
const Team = require('../models/Team');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all users (team members)
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
    try {
        const { teamId, status, role } = req.query;

        let query = {};

        // Only filter by team if explicitly specified in query
        if (teamId) {
            query.teamId = teamId;
        }
        // Note: Removed automatic filtering by user's team to show all users across teams

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

        // Remove from team
        if (user.teamId) {
            await Team.findByIdAndUpdate(user.teamId, {
                $pull: { members: user._id }
            });
        }

        // Log activity before deletion
        await ActivityLog.create({
            action: 'user_deleted',
            userId: req.user._id,
            teamId: req.user.teamId,
            details: `User removed: ${user.name}`
        });

        await user.deleteOne();

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
