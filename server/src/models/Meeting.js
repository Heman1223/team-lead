const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Meeting title is required'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        default: null
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },
    startTime: {
        type: Date,
        required: [true, 'Start time is required']
    },
    endTime: {
        type: Date,
        required: [true, 'End time is required']
    },
    type: {
        type: String,
        enum: ['online', 'offline'],
        default: 'online'
    },
    meetingLink: {
        type: String,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    agenda: {
        type: String,
        trim: true
    },
    organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'missed', 'cancelled', 'rescheduled'],
        default: 'upcoming'
    },
    reminderTime: {
        type: Number, // Minutes before meeting
        default: 30
    },
    notes: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        default: '#2563eb' // Default Blue (Upcoming)
    }
}, {
    timestamps: true
});

// Virtual for duration in minutes
meetingSchema.virtual('duration').get(function() {
    return Math.round((this.endTime - this.startTime) / (1000 * 60));
});

// Pre-save hook to update color based on status
meetingSchema.pre('save', function() {
    const statusColors = {
        upcoming: '#2563eb',   // Blue
        ongoing: '#9333ea',    // Purple
        completed: '#16a34a',  // Green
        missed: '#dc2626',     // Red
        cancelled: '#6b7280',  // Gray
        rescheduled: '#9ca3af' // Muted Gray
    };
    
    if (this.isModified('status')) {
        this.color = statusColors[this.status] || '#2563eb';
    }
});

// Index for performance
meetingSchema.index({ startTime: 1, endTime: 1 });
meetingSchema.index({ leadId: 1 });
meetingSchema.index({ organizerId: 1 });
meetingSchema.index({ status: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
