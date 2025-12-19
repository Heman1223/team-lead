const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
    callerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['initiated', 'answered', 'missed', 'busy', 'offline'],
        default: 'initiated'
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot be more than 500 characters']
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }
}, {
    timestamps: true
});

// Calculate duration before saving if endTime is set
callLogSchema.pre('save', function (next) {
    if (this.endTime && this.startTime) {
        this.duration = Math.floor((this.endTime - this.startTime) / 1000);
    }
    next();
});

module.exports = mongoose.model('CallLog', callLogSchema);
