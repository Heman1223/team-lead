const FollowUp = require('../models/FollowUp');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Team = require('../models/Team');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { sendFollowUpCreatedEmail } = require('../services/emailService');

// @desc    Get all follow-ups (role-based filtering)
// @route   GET /api/follow-ups
// @access  Private
const getFollowUps = async (req, res) => {
    try {
        let query = {};
        const { status, leadId, startDate, endDate } = req.query;

        // Role-based filtering
        if (req.user.role === 'team_lead') {
            // Team leads see follow-ups for their team
            const team = await Team.findOne({ leadId: req.user._id });
            if (team) {
                const teamMemberIds = [...team.members, req.user._id];
                query.assignedTo = { $in: teamMemberIds };
            } else {
                query.assignedTo = req.user._id;
            }
        } else if (req.user.role === 'team_member') {
            // Team members see only their follow-ups
            query.assignedTo = req.user._id;
        }
        // Admins see all

        // Apply filters
        if (status) query.status = status;
        if (leadId) query.leadId = leadId;
        if (startDate || endDate) {
            query.scheduledDate = {};
            if (startDate) query.scheduledDate.$gte = new Date(startDate);
            if (endDate) query.scheduledDate.$lte = new Date(endDate);
        }

        const followUps = await FollowUp.find(query)
            .populate('leadId', 'clientName email phone status')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name')
            .sort({ scheduledDate: 1 });

        res.json({
            success: true,
            count: followUps.length,
            data: followUps
        });
    } catch (error) {
        console.error('Get follow-ups error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Create follow-up
// @route   POST /api/follow-ups
// @access  Private
const createFollowUp = async (req, res) => {
    try {
        console.log('=== CREATE FOLLOW-UP REQUEST ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('User:', req.user._id, req.user.role);

        const { leadId, assignedTo, scheduledDate, title, notes, priority, scheduledTime } = req.body;

        // Validate required fields
        if (!leadId) {
            console.log('Validation failed: Missing leadId');
            return res.status(400).json({ success: false, message: 'Lead ID is required' });
        }
        if (!scheduledDate) {
            console.log('Validation failed: Missing scheduledDate');
            return res.status(400).json({ success: false, message: 'Scheduled date is required' });
        }
        if (!title) {
            console.log('Validation failed: Missing title');
            return res.status(400).json({ success: false, message: 'Title is required' });
        }

        console.log('Basic validation passed');

        // Verify lead exists
        const lead = await Lead.findById(leadId);
        if (!lead) {
            console.log('Lead not found:', leadId);
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        console.log('Lead found:', lead.clientName);

        // Check permissions
        if (req.user.role === 'team_member') {
            // Team members can only create for their assigned leads
            if (lead.assignedTo?.toString() !== req.user._id.toString()) {
                console.log('Permission denied: Lead not assigned to user');
                return res.status(403).json({ success: false, message: 'Not authorized to create follow-up for this lead' });
            }
        }
        console.log('Permission check passed');

        // Default assignedTo to current user if not provided
        const finalAssignedTo = assignedTo || req.user._id;

        // Verify assignedTo user exists
        const assignedUser = await User.findById(finalAssignedTo);
        if (!assignedUser) {
            console.log('Assigned user not found:', finalAssignedTo);
            return res.status(404).json({ success: false, message: 'Assigned user not found' });
        }
        console.log('Assigned user found:', assignedUser.name);

        // Create follow-up with all fields
        const followUpData = {
            leadId,
            assignedTo: finalAssignedTo,
            scheduledDate,
            title,
            priority: priority || 'medium',
            createdBy: req.user._id
        };

        // Add optional fields if provided
        if (notes) followUpData.notes = notes;
        if (scheduledTime) followUpData.scheduledTime = scheduledTime;

        console.log('Creating follow-up with data:', JSON.stringify(followUpData, null, 2));

        const followUp = await FollowUp.create(followUpData);
        console.log('Follow-up created successfully:', followUp._id);

        // Update lead's followUpDate
        lead.followUpDate = scheduledDate;

        // Add note to lead (with error handling)
        try {
            if (typeof lead.addNote === 'function') {
                lead.addNote(`Follow-up scheduled for ${new Date(scheduledDate).toLocaleDateString()}`, req.user._id, 'follow_up_scheduled');
            }
        } catch (noteError) {
            console.error('Error adding note to lead:', noteError);
            // Continue even if note fails
        }

        await lead.save();
        console.log('Lead updated with follow-up date');

        // Log activity
        try {
            await ActivityLog.create({
                action: 'follow_up_scheduled',
                userId: req.user._id,
                leadId: lead._id,
                details: `Follow-up scheduled for ${new Date(scheduledDate).toLocaleDateString()}`
            });
        } catch (activityError) {
            console.error('Error logging activity:', activityError);
            // Continue even if activity log fails
        }

        // Create notification for assigned user
        try {
            if (finalAssignedTo.toString() !== req.user._id.toString()) {
                await Notification.create({
                    userId: finalAssignedTo,
                    type: 'follow_up_assigned',
                    title: 'New Follow-up Scheduled',
                    message: `A follow-up has been scheduled for ${lead.clientName}`,
                    relatedTo: leadId,
                    relatedToModel: 'Lead'
                });
            }
        } catch (notificationError) {
            console.error('Error creating notification:', notificationError);
            // Continue even if notification fails
        }

        const populatedFollowUp = await FollowUp.findById(followUp._id)
            .populate('leadId', 'clientName email phone')
            .populate('assignedTo', 'name email');

        // Send email notification for follow-up creation
        try {
            await sendFollowUpCreatedEmail(populatedFollowUp, lead, req.user);
        } catch (emailError) {
            console.error('Email notification failed:', emailError);
            // Continue even if email fails
        }

        console.log('=== FOLLOW-UP CREATED SUCCESSFULLY ===');
        res.status(201).json({
            success: true,
            data: populatedFollowUp,
            message: 'Follow-up scheduled successfully'
        });
    } catch (error) {
        console.error('=== CREATE FOLLOW-UP ERROR ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            console.error('Validation errors:', messages);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }

        // Handle cast errors (invalid ObjectId)
        if (error.name === 'CastError') {
            console.error('Cast error - Invalid ID format');
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while creating follow-up',
            error: error.message
        });
    }
};

// @desc    Update follow-up
// @route   PUT /api/follow-ups/:id
// @access  Private
const updateFollowUp = async (req, res) => {
    try {
        let followUp = await FollowUp.findById(req.params.id);
        if (!followUp) {
            return res.status(404).json({ success: false, message: 'Follow-up not found' });
        }

        // Check permissions
        if (req.user.role === 'team_member' && followUp.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        followUp = await FollowUp.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('leadId', 'clientName email phone')
            .populate('assignedTo', 'name email');

        res.json({
            success: true,
            data: followUp
        });
    } catch (error) {
        console.error('Update follow-up error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Mark follow-up as complete
// @route   PUT /api/follow-ups/:id/complete
// @access  Private
const markFollowUpComplete = async (req, res) => {
    try {
        const { notes } = req.body;
        let followUp = await FollowUp.findById(req.params.id);

        if (!followUp) {
            return res.status(404).json({ success: false, message: 'Follow-up not found' });
        }

        // Check permissions
        if (req.user.role === 'team_member' && followUp.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        followUp.markComplete(req.user._id, notes);
        await followUp.save();

        // Log activity
        await ActivityLog.create({
            action: 'follow_up_completed',
            userId: req.user._id,
            leadId: followUp.leadId,
            details: `Follow-up completed`
        });

        const populatedFollowUp = await FollowUp.findById(followUp._id)
            .populate('leadId', 'clientName email phone')
            .populate('assignedTo', 'name email');

        res.json({
            success: true,
            data: populatedFollowUp
        });
    } catch (error) {
        console.error('Complete follow-up error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Reschedule follow-up
// @route   PUT /api/follow-ups/:id/reschedule
// @access  Private
const rescheduleFollowUp = async (req, res) => {
    try {
        const { newDate, notes } = req.body;
        let followUp = await FollowUp.findById(req.params.id);

        if (!followUp) {
            return res.status(404).json({ success: false, message: 'Follow-up not found' });
        }

        // Check permissions
        if (req.user.role === 'team_member' && followUp.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        followUp.reschedule(newDate, notes);
        await followUp.save();

        // Update lead's followUpDate
        const lead = await Lead.findById(followUp.leadId);
        if (lead) {
            lead.followUpDate = newDate;
            await lead.save();
        }

        const populatedFollowUp = await FollowUp.findById(followUp._id)
            .populate('leadId', 'clientName email phone')
            .populate('assignedTo', 'name email');

        res.json({
            success: true,
            data: populatedFollowUp
        });
    } catch (error) {
        console.error('Reschedule follow-up error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Cancel follow-up
// @route   DELETE /api/follow-ups/:id
// @access  Private
const cancelFollowUp = async (req, res) => {
    try {
        const followUp = await FollowUp.findById(req.params.id);
        if (!followUp) {
            return res.status(404).json({ success: false, message: 'Follow-up not found' });
        }

        // Check permissions
        if (req.user.role === 'team_member' && followUp.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        followUp.status = 'cancelled';
        followUp.isActive = false;
        await followUp.save();

        res.json({
            success: true,
            message: 'Follow-up cancelled successfully'
        });
    } catch (error) {
        console.error('Cancel follow-up error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get overdue follow-ups
// @route   GET /api/follow-ups/overdue
// @access  Private
const getOverdueFollowUps = async (req, res) => {
    try {
        let query = {
            status: 'pending',
            scheduledDate: { $lt: new Date() }
        };

        // Role-based filtering
        if (req.user.role === 'team_lead') {
            const team = await Team.findOne({ leadId: req.user._id });
            if (team) {
                const teamMemberIds = [...team.members, req.user._id];
                query.assignedTo = { $in: teamMemberIds };
            } else {
                query.assignedTo = req.user._id;
            }
        } else if (req.user.role === 'team_member') {
            query.assignedTo = req.user._id;
        }

        const overdueFollowUps = await FollowUp.find(query)
            .populate('leadId', 'clientName email phone status isDeleted isActive')
            .populate('assignedTo', 'name email isActive')
            .sort({ scheduledDate: 1 });

        // Filter out follow-ups with deleted/inactive leads or users
        const validFollowUps = overdueFollowUps.filter(followUp => {
            // Check if lead exists
            const hasValidLead = !!followUp.leadId;

            // Check if assigned user exists
            const hasValidUser = !!followUp.assignedTo;

            return hasValidLead && hasValidUser;
        });

        res.json({
            success: true,
            count: validFollowUps.length,
            data: validFollowUps
        });
    } catch (error) {
        console.error('Get overdue follow-ups error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get upcoming follow-ups (next 7 days)
// @route   GET /api/follow-ups/upcoming
// @access  Private
const getUpcomingFollowUps = async (req, res) => {
    try {
        const now = new Date();
        const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        let query = {
            status: 'pending',
            scheduledDate: { $gte: now, $lte: sevenDaysLater }
        };

        // Role-based filtering
        if (req.user.role === 'team_lead') {
            const team = await Team.findOne({ leadId: req.user._id });
            if (team) {
                const teamMemberIds = [...team.members, req.user._id];
                query.assignedTo = { $in: teamMemberIds };
            } else {
                query.assignedTo = req.user._id;
            }
        } else if (req.user.role === 'team_member') {
            query.assignedTo = req.user._id;
        }

        const upcomingFollowUps = await FollowUp.find(query)
            .populate('leadId', 'clientName email phone status isDeleted isActive')
            .populate('assignedTo', 'name email isActive')
            .sort({ scheduledDate: 1 });

        // Filter out follow-ups with deleted/inactive leads or users
        const validFollowUps = upcomingFollowUps.filter(followUp => {
            // Check if lead exists
            const hasValidLead = !!followUp.leadId;

            // Check if assigned user exists
            const hasValidUser = !!followUp.assignedTo;

            return hasValidLead && hasValidUser;
        });

        res.json({
            success: true,
            count: validFollowUps.length,
            data: validFollowUps
        });
    } catch (error) {
        console.error('Get upcoming follow-ups error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    getFollowUps,
    createFollowUp,
    updateFollowUp,
    markFollowUpComplete,
    rescheduleFollowUp,
    cancelFollowUp,
    getOverdueFollowUps,
    getUpcomingFollowUps
};
