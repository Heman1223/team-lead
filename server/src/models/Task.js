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
        enum: ['pending', 'assigned', 'in_progress', 'blocked', 'overdue', 'completed'],
        default: 'pending'
    },
    deadline: {
        type: Date,
        required: [true, 'Please provide a deadline']
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please assign task to a user']
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    // For admin-assigned tasks to team leads
    isParentTask: {
        type: Boolean,
        default: false
    },
    parentTaskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },
    // Recurring task settings
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurrenceType: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'none'],
        default: 'none'
    },
    recurrenceEndDate: {
        type: Date
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
    startedAt: {
        type: Date
    },
    estimatedHours: {
        type: Number,
        default: 0
    },
    actualHours: {
        type: Number,
        default: 0
    },
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});

// Auto-update overdue status
taskSchema.pre('save', function () {
    if (this.status !== 'completed' && this.deadline < new Date()) {
        this.status = 'overdue';
    }
});

module.exports = mongoose.model('Task', taskSchema);
