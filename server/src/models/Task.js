const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a task title'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    description: {
        type: String,
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['assigned', 'in_progress', 'blocked', 'overdue', 'completed'],
        default: 'assigned'
    },
    deadline: {
        type: Date,
        required: [true, 'Please provide a deadline']
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please assign task to a team member']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    attachments: [{
        name: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    comments: [commentSchema],
    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot be more than 1000 characters']
    },
    completedAt: {
        type: Date
    },
    estimatedHours: {
        type: Number,
        default: 0
    },
    actualHours: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Auto-update overdue status
taskSchema.pre('save', function (next) {
    if (this.status !== 'completed' && this.deadline < new Date()) {
        this.status = 'overdue';
    }
    next();
});

module.exports = mongoose.model('Task', taskSchema);
