const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
    // Lead Reference
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: [true, 'Lead reference is required']
    },

    // Assignment
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Assigned user is required']
    },

    // Schedule
    scheduledDate: {
        type: Date,
        required: [true, 'Scheduled date is required']
    },
    scheduledTime: {
        type: String,
        default: ''
    },

    // Details
    title: {
        type: String,
        required: [true, 'Follow-up title is required'],
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    description: {
        type: String,
        default: '',
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    notes: {
        type: String,
        default: '',
        maxlength: [1000, 'Notes cannot be more than 1000 characters']
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
        required: true
    },
    type: {
        type: String,
        enum: ['call', 'email', 'meeting', 'demo', 'proposal', 'other'],
        default: 'call'
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'rescheduled'],
        default: 'pending'
    },
    completedAt: {
        type: Date,
        default: null
    },
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    completionNotes: {
        type: String,
        default: ''
    },

    // Notifications
    reminderSent: {
        type: Boolean,
        default: false
    },
    reminderSentAt: {
        type: Date,
        default: null
    },
    overdueNotificationSent: {
        type: Boolean,
        default: false
    },

    // System Fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for performance
followUpSchema.index({ leadId: 1 });
followUpSchema.index({ assignedTo: 1 });
followUpSchema.index({ scheduledDate: 1 });
followUpSchema.index({ status: 1 });
followUpSchema.index({ createdAt: -1 });

// Virtual to check if overdue
followUpSchema.virtual('isOverdue').get(function () {
    if (this.status !== 'pending') return false;
    return new Date() > this.scheduledDate;
});

// Method to mark as complete
followUpSchema.methods.markComplete = function (userId, notes = '') {
    this.status = 'completed';
    this.completedAt = new Date();
    this.completedBy = userId;
    this.completionNotes = notes;
    return this;
};

// Method to reschedule
followUpSchema.methods.reschedule = function (newDate, notes = '') {
    this.status = 'rescheduled';
    this.scheduledDate = newDate;
    this.notes += `\n[Rescheduled on ${new Date().toISOString()}]: ${notes}`;
    this.reminderSent = false; // Reset reminder
    return this;
};

// Pre-save middleware to initialize status
followUpSchema.pre('save', async function () {
    // Set to pending if it's a new document
    if (this.isNew && !this.status) {
        this.status = 'pending';
    }
});

module.exports = mongoose.model('FollowUp', followUpSchema);
