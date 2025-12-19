const CallLog = require('../models/CallLog');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get call history
// @route   GET /api/calls
// @access  Private
const getCallHistory = async (req, res) => {
    try {
        const { limit = 20, status } = req.query;

        let query = {
            $or: [
                { callerId: req.user._id },
                { receiverId: req.user._id }
            ]
        };

        if (status) query.status = status;

        const calls = await CallLog.find(query)
            .populate('callerId', 'name avatar email')
            .populate('receiverId', 'name avatar email status')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: calls.length,
            data: calls
        });
    } catch (error) {
        console.error('Get call history error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Initiate a call
// @route   POST /api/calls
// @access  Private
const initiateCall = async (req, res) => {
    try {
        const { receiverId, notes } = req.body;

        // Check receiver availability
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let callStatus = 'initiated';
        if (receiver.status === 'offline') {
            callStatus = 'offline';
        } else if (receiver.status === 'busy') {
            callStatus = 'busy';
        }

        const call = await CallLog.create({
            callerId: req.user._id,
            receiverId,
            status: callStatus,
            notes,
            teamId: req.user.teamId
        });

        await ActivityLog.create({
            action: 'call_initiated',
            userId: req.user._id,
            targetUserId: receiverId,
            teamId: req.user.teamId,
            details: `Call initiated to ${receiver.name} - Status: ${callStatus}`
        });

        const populatedCall = await CallLog.findById(call._id)
            .populate('callerId', 'name avatar')
            .populate('receiverId', 'name avatar status');

        res.status(201).json({
            success: true,
            data: populatedCall
        });
    } catch (error) {
        console.error('Initiate call error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update call status
// @route   PUT /api/calls/:id
// @access  Private
const updateCall = async (req, res) => {
    try {
        const { status, notes } = req.body;

        let call = await CallLog.findById(req.params.id);
        if (!call) {
            return res.status(404).json({ success: false, message: 'Call not found' });
        }

        if (status) {
            call.status = status;
            if (status === 'answered') {
                // Call continues, no end time yet
            } else if (['missed', 'busy', 'offline'].includes(status)) {
                call.endTime = new Date();
            }
        }

        if (notes) call.notes = notes;

        await call.save();

        const populatedCall = await CallLog.findById(call._id)
            .populate('callerId', 'name avatar')
            .populate('receiverId', 'name avatar status');

        res.json({
            success: true,
            data: populatedCall
        });
    } catch (error) {
        console.error('Update call error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    End a call
// @route   PUT /api/calls/:id/end
// @access  Private
const endCall = async (req, res) => {
    try {
        let call = await CallLog.findById(req.params.id);
        if (!call) {
            return res.status(404).json({ success: false, message: 'Call not found' });
        }

        call.endTime = new Date();
        await call.save();

        await ActivityLog.create({
            action: 'call_ended',
            userId: req.user._id,
            teamId: call.teamId,
            details: `Call ended - Duration: ${call.duration} seconds`
        });

        const populatedCall = await CallLog.findById(call._id)
            .populate('callerId', 'name avatar')
            .populate('receiverId', 'name avatar status');

        res.json({
            success: true,
            data: populatedCall
        });
    } catch (error) {
        console.error('End call error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Check user availability
// @route   GET /api/calls/availability/:userId
// @access  Private
const checkAvailability = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('name status lastActive');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: {
                userId: user._id,
                name: user.name,
                status: user.status,
                lastActive: user.lastActive,
                canCall: user.status === 'online'
            }
        });
    } catch (error) {
        console.error('Check availability error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getCallHistory,
    initiateCall,
    updateCall,
    endCall,
    checkAvailability
};
