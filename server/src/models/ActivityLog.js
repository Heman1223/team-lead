const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            'user_login',
            'user_logout',
            'user_created',
            'user_updated',
            'user_deleted',
            'task_created',
            'task_updated',
            'task_assigned',
            'task_status_changed',
            'task_completed',
            'task_deleted',
            'comment_added',
            'team_created',
            'team_updated',
            'team_deleted',
            'member_added',
            'member_removed',
            'notification_sent',
            'call_initiated',
            'call_ended',
            'subtask_created',
            'subtask_updated',
            'subtask_deleted',
            'profile_updated',
            'password_changed',
            'settings_updated',
            'availability_updated',
            'system_settings_updated',
            'audit_settings_updated',
            'access_settings_updated',
            'lead_created',
            'lead_updated',
            'lead_assigned',
            'lead_status_changed',
            'lead_converted',
            'lead_deleted'
        ]
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead'
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    details: {
        type: String,
        maxlength: [500, 'Details cannot be more than 500 characters']
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
        type: String
    }
}, {
    timestamps: true
});

// Index for faster queries
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ teamId: 1, createdAt: -1 });
activityLogSchema.index({ taskId: 1, createdAt: -1 });
activityLogSchema.index({ leadId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
