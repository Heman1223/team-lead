const Team = require('../models/Team');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all teams
// @route   GET /api/teams
// @access  Private
const getTeams = async (req, res) => {
    try {
        const teams = await Team.find()
            .populate('leadId', 'name email avatar')
            .populate('members', 'name email avatar status')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: teams.length,
            data: teams
        });
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Private
const getTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('leadId', 'name email avatar')
            .populate('members', 'name email avatar status designation');

        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        res.json({
            success: true,
            data: team
        });
    } catch (error) {
        console.error('Get team error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get current user's team (Member view)
// @route   GET /api/teams/my-team
// @access  Private
const getMyTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.user.teamId)
            .populate('leadId', 'name email avatar')
            .populate('members', 'name email avatar status designation phone skills');

        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        res.json({
            success: true,
            data: team
        });
    } catch (error) {
        console.error('Get my team error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all teams managed by current user (Team Lead view)
// @route   GET /api/teams/my-led-teams
// @access  Private (Team Lead)
const getLedTeams = async (req, res) => {
    try {
        const teams = await Team.find({ leadId: req.user._id })
            .populate('leadId', 'name email avatar')
            .populate('members', 'name email avatar status designation');

        // Calculate progress for each team dynamically if needed
        // For now, valid statistics are expected to be updated/stored on the team model
        // or we could aggregate active task stats here. 
        // Let's ensure strict project progress is available.
        
        // Populate specific mock "current project" if not strictly defined, 
        // or rely on fields 'currentProject' and 'projectProgress' from schema.

        res.json({
            success: true,
            count: teams.length,
            data: teams
        });
    } catch (error) {
        console.error('Get led teams error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create team
// @route   POST /api/teams
// @access  Private (Team Lead only)
const createTeam = async (req, res) => {
    try {
        const { name, description, department } = req.body;

        const team = await Team.create({
            name,
            description,
            department,
            leadId: req.user._id,
            members: [req.user._id]
        });

        // Update user's teamId
        await User.findByIdAndUpdate(req.user._id, { teamId: team._id });

        // Log activity
        await ActivityLog.create({
            action: 'team_created',
            userId: req.user._id,
            teamId: team._id,
            details: `Team created: ${team.name}`
        });

        res.status(201).json({
            success: true,
            data: team
        });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Team Lead only)
const updateTeam = async (req, res) => {
    try {
        const { name, description, department, isActive } = req.body;

        let team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        // Check if user is the team lead
        if (team.leadId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this team' });
        }

        team.name = name || team.name;
        team.description = description || team.description;
        team.department = department || team.department;
        if (typeof isActive === 'boolean') team.isActive = isActive;

        await team.save();

        // Log activity
        await ActivityLog.create({
            action: 'team_updated',
            userId: req.user._id,
            teamId: team._id,
            details: `Team updated: ${team.name}`
        });

        res.json({
            success: true,
            data: team
        });
    } catch (error) {
        console.error('Update team error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Add member to team
// @route   POST /api/teams/:id/members
// @access  Private (Team Lead only)
const addMember = async (req, res) => {
    try {
        const { userId } = req.body;

        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Add to team
        if (!team.members.includes(userId)) {
            team.members.push(userId);
            await team.save();

            // Update user's teamId
            user.teamId = team._id;
            await user.save();

            // Log activity
            await ActivityLog.create({
                action: 'member_added',
                userId: req.user._id,
                targetUserId: userId,
                teamId: team._id,
                details: `${user.name} added to team ${team.name}`
            });
        }

        res.json({
            success: true,
            data: team
        });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private (Team Lead only)
const removeMember = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Remove from team
        team.members = team.members.filter(m => m.toString() !== req.params.userId);
        await team.save();

        // Clear user's teamId
        user.teamId = null;
        await user.save();

        // Log activity
        await ActivityLog.create({
            action: 'member_removed',
            userId: req.user._id,
            targetUserId: req.params.userId,
            teamId: team._id,
            details: `${user.name} removed from team ${team.name}`
        });

        res.json({
            success: true,
            message: 'Member removed from team'
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getTeams,
    getTeam,
    getMyTeam,
    getLedTeams,
    createTeam,
    updateTeam,
    addMember,
    removeMember
};
