const Meeting = require('../models/Meeting');
const Lead = require('../models/Lead');
const ActivityLog = require('../models/ActivityLog');
const { sendMeetingInvitation } = require('../services/emailService');

console.log('✅ 📧 MEETING CONTROLLER LOADED WITH NEW EMAIL STATUS FEATURE - Emails will now be tracked and returned in API response!');

// @desc    Get all meetings with optional filtering by month and team member
// @route   GET /api/meetings?month=1&leadId=xxx
// @access  Private
// Note: 'leadId' parameter filters by team member who organized or participates in the meeting
//       (despite the parameter name, it filters by organizerId OR participants)
const getMeetings = async (req, res) => {
    try {
        let query = {};
        const { month, leadId } = req.query;

        // Build role-based filtering conditions
        let roleBasedQuery = {};
        let hasRoleBasedFilter = false;

        if (req.user.role === 'team_lead') {
            const Team = require('../models/Team');
            const User = require('../models/User');
            
            // Find all teams where this user is the lead
            const managedTeams = await Team.find({ leadId: req.user._id });
            const managedTeamIds = managedTeams.map(t => t._id);
            
            // Find all users in these teams
            const teamMembers = await User.find({ teamId: { $in: managedTeamIds } });
            const memberIds = teamMembers.map(m => m._id);
            memberIds.push(req.user._id); // include the lead themselves

            // Team leads see meetings they/their team organized OR are involved in
            roleBasedQuery = {
                $or: [
                    { organizerId: { $in: memberIds } },
                    { participants: { $in: memberIds } }
                ]
            };
            hasRoleBasedFilter = true;
        } else if (req.user.role === 'team_member') {
            // Team members ONLY see meetings they organized or are participants in
            const userId = req.user._id;
            roleBasedQuery = {
                $or: [
                    { organizerId: userId },
                    { participants: userId }
                ]
            };
            hasRoleBasedFilter = true;
        }
        // Admins see all meetings (no role-based filter)

        // Build additional filter conditions (month, memberId)
        let additionalFilters = [];

        // Apply month filter if provided (1-12)
        if (month && !isNaN(month) && month >= 1 && month <= 12) {
            const monthNum = parseInt(month);
            additionalFilters.push({
                $expr: {
                    $eq: [{ $month: "$startTime" }, monthNum]
                }
            });
        }

        // Apply member/organizer filter if provided
        // Filter by memberId as either organizer OR participant (not leadId)
        if (leadId && leadId !== 'null' && leadId !== '') {
            additionalFilters.push({
                $or: [
                    { organizerId: leadId },
                    { participants: leadId }
                ]
            });
        }

        // Combine role-based filtering with additional filters properly
        if (hasRoleBasedFilter && additionalFilters.length > 0) {
            // Use $and to combine $or (from role-based) with additional filters
            query = {
                $and: [roleBasedQuery, ...additionalFilters]
            };
        } else if (hasRoleBasedFilter) {
            // Only role-based filter
            query = roleBasedQuery;
        } else if (additionalFilters.length > 0) {
            // Only additional filters (admin user)
            if (additionalFilters.length === 1) {
                query = additionalFilters[0];
            } else {
                query = {
                    $and: additionalFilters
                };
            }
        }
        // If no filters at all (admin with no month/lead params), query stays empty {}

        const meetings = await Meeting.find(query)
            .populate('leadId', 'clientName email')
            .populate('organizerId', 'name email')
            .populate('participants', 'name email')
            .sort({ startTime: 1 });

        res.json({
            success: true,
            count: meetings.length,
            data: meetings
        });
    } catch (error) {
        console.error('Get meetings error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get meeting by ID
// @route   GET /api/meetings/:id
// @access  Private
const getMeetingById = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id)
            .populate('leadId', 'clientName email')
            .populate('organizerId', 'name email')
            .populate('participants', 'name email');

        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found' });
        }

        res.json({
            success: true,
            data: meeting
        });
    } catch (error) {
        console.error('Get meeting error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Create meeting
// @route   POST /api/meetings
// @access  Private
const createMeeting = async (req, res) => {
    try {
        let { leadId, projectId, participants, newLead, ...rest } = req.body;


        // Ensure IDs are null if they are empty strings
        if (leadId === '') leadId = null;
        if (projectId === '') projectId = null;
        
        // Sanitize participants array (filter out empty strings)
        if (Array.isArray(participants)) {
            participants = participants.filter(p => p && p !== '');
        }

        // On-the-fly Lead Creation
        if (!leadId && newLead && newLead.clientName && newLead.email) {
            const lead = await Lead.create({
                clientName: newLead.clientName,
                email: newLead.email,
                createdBy: req.user._id,
                status: 'new',
                source: 'meeting_scheduling'
            });
            leadId = lead._id;
        }

        // Role-based participant validation
        if (req.user.role === 'team_lead') {
            const Team = require('../models/Team');
            const managedTeams = await Team.find({ leadId: req.user._id });
            const managedTeamIds = managedTeams.map(t => t._id.toString());
            
            // Add their own teamId to the authorized list
            if (req.user.teamId) {
                managedTeamIds.push(req.user.teamId.toString());
            }

            // Get all members from these authorized teams
            const authorizedTeams = await Team.find({ _id: { $in: managedTeamIds } });
            const authorizedMemberIds = authorizedTeams.reduce((ids, team) => {
                return ids.concat(team.members.map(m => m.toString()));
            }, []);
            
            // Ensure all participants are in authorized teams
            const invalidParticipants = (participants || []).filter(p => !authorizedMemberIds.includes(p.toString()) && p.toString() !== req.user._id.toString());
            if (invalidParticipants.length > 0) {
                return res.status(403).json({ success: false, message: 'Cannot assign participants outside of your team scope' });
            }
        } else if (req.user.role === 'team_member') {
            // Team members can only assign themselves
            if (participants && participants.length > 0) {
                const unauthorized = participants.filter(p => p.toString() !== req.user._id.toString());
                if (unauthorized.length > 0) {
                    return res.status(403).json({ success: false, message: 'You can only assign yourself to a meeting' });
                }
            }
        }

        const meetingData = {
            ...rest,
            leadId: leadId || null,
            projectId: projectId || null,
            participants: participants || [],
            organizerId: req.user._id
        };

        const meeting = await Meeting.create(meetingData);

        // Populate lead info if present for email/logs
        const populatedMeeting = await Meeting.findById(meeting._id)
            .populate('leadId')
            .populate('organizerId', 'name email');

        // Log activity if linked to a lead
        if (meeting.leadId) {
            await ActivityLog.create({
                action: 'meeting_scheduled',
                userId: req.user._id,
                leadId: meeting.leadId,
                details: `Meeting scheduled: ${meeting.title}`
            });
        }

        // Send Email Invitation
        console.log('📋 Meeting created. Checking if email should be sent...');
        console.log('📋 populatedMeeting.leadId:', populatedMeeting.leadId?._id || 'NOT SET');
        console.log('📋 populatedMeeting.leadId.email:', populatedMeeting.leadId?.email || 'NO EMAIL');
        
        let emailStatus = { sent: false, reason: 'No lead or email' };
        
        if (populatedMeeting.leadId && populatedMeeting.leadId.email) {
            console.log('✅ Conditions met. Attempting to send email...');
            try {
                const emailResult = await sendMeetingInvitation(populatedMeeting);
                emailStatus = { sent: emailResult.success, result: emailResult };
                console.log('📧 Email result:', emailResult);
            } catch (emailErr) {
                console.error('❌ Failed to send meeting invitation email:', emailErr.message);
                console.error('Full error:', emailErr);
                emailStatus = { sent: false, error: emailErr.message };
            }
        } else {
            console.warn('⚠️ Email NOT sent - Missing lead or lead email. leadId:', populatedMeeting.leadId?._id, 'email:', populatedMeeting.leadId?.email);
            emailStatus = { 
                sent: false, 
                reason: 'Missing lead or lead email',
                leadId: populatedMeeting.leadId?._id,
                email: populatedMeeting.leadId?.email
            };
        }

        res.status(201).json({
            success: true,
            data: populatedMeeting,
            emailStatus: emailStatus
        });
    } catch (error) {
        console.error('Create meeting error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update meeting
// @route   PUT /api/meetings/:id
// @access  Private
const updateMeeting = async (req, res) => {
    try {
        let meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found' });
        }

        // Check permissions: Organizer, Admin, or Participant
        const isOrganizer = meeting.organizerId.toString() === req.user._id.toString();
        const isParticipant = meeting.participants.some(p => p.toString() === req.user._id.toString());
        const isAdmin = req.user.role === 'admin';

        if (!isOrganizer && !isParticipant && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this meeting' });
        }

        const { leadId, projectId, participants, ...rest } = req.body;
        
        // Update fields
        Object.keys(rest).forEach(key => {
            meeting[key] = rest[key];
        });

        if (leadId !== undefined) meeting.leadId = leadId === '' ? null : leadId;
        if (projectId !== undefined) meeting.projectId = projectId === '' ? null : projectId;
        if (participants !== undefined) {
            const participantsArray = Array.isArray(participants) ? participants.filter(p => p && p !== '') : [];
            
            // Role-based validation
            if (req.user.role === 'team_lead') {
                const Team = require('../models/Team');
                const managedTeams = await Team.find({ leadId: req.user._id });
                const managedTeamIds = managedTeams.map(t => t._id.toString());
                
                if (req.user.teamId) {
                    managedTeamIds.push(req.user.teamId.toString());
                }

                const authorizedTeams = await Team.find({ _id: { $in: managedTeamIds } });
                const authorizedMemberIds = authorizedTeams.reduce((ids, team) => {
                    return ids.concat(team.members.map(m => m.toString()));
                }, []);

                const invalid = participantsArray.filter(p => !authorizedMemberIds.includes(p.toString()) && p.toString() !== req.user._id.toString());
                if (invalid.length > 0) {
                    return res.status(403).json({ success: false, message: 'Cannot assign participants outside of your team scope' });
                }
            } else if (req.user.role === 'team_member') {
                const unauthorized = participantsArray.filter(p => p.toString() !== req.user._id.toString());
                if (unauthorized.length > 0) {
                    return res.status(403).json({ success: false, message: 'You can only assign yourself to a meeting' });
                }
            }
            
            meeting.participants = participantsArray;
        }

        // Use .save() to trigger pre-save hooks (like status color updates)
        await meeting.save();

        // Populate lead info for response
        const updatedMeeting = await Meeting.findById(meeting._id)
            .populate('leadId', 'clientName email')
            .populate('organizerId', 'name email');

        // Log activity
        await ActivityLog.create({
            action: 'meeting_updated',
            userId: req.user._id,
            leadId: meeting.leadId,
            details: `Meeting updated: ${meeting.title} (Status: ${meeting.status})`
        });

        res.json({
            success: true,
            data: updatedMeeting
        });
    } catch (error) {
        console.error('Update meeting error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Delete meeting
// @route   DELETE /api/meetings/:id
// @access  Private
const deleteMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({ success: false, message: 'Meeting not found' });
        }

        // Check permissions: Organizer or Admin
        if (meeting.organizerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this meeting' });
        }

        await Meeting.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Meeting deleted successfully'
        });
    } catch (error) {
        console.error('Delete meeting error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    getMeetings,
    getMeetingById,
    createMeeting,
    updateMeeting,
    deleteMeeting
};
