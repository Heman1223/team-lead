const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: [
            'task_assigned', 
            'task_updated', 
            'deadline_reminder', 
            'overdue_alert', 
            'mention', 
            'system', 
            'manual_reminder',
            'lead_assigned',
            'lead_escalated',
            'follow_up_assigned',
            'follow_up_upcoming',
            'follow_up_overdue',
            'lead_status_changed'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead'
    },
    // Generic reference for flexibility
    relatedTo: {
        type: mongoose.Schema.Types.ObjectId
    },
    relatedToModel: {
        type: String,
        enum: ['Task', 'Lead', 'FollowUp', 'User', 'Team']
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
