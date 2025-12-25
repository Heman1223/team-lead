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

const subtaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'blocked'],
        default: 'not_started'
    },
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    eodReports: [{
        reportDate: {
            type: Date,
            default: Date.now
        },
        workCompleted: {
            type: String,
            required: true,
            maxlength: [2000, 'Work completed description cannot exceed 2000 characters']
        },
        hoursSpent: {
            type: Number,
            default: 0
        },
        progressUpdate: {
            type: Number,
            min: 0,
            max: 100
        },
        blockers: {
            type: String,
            maxlength: [1000, 'Blockers description cannot exceed 1000 characters']
        },
        nextDayPlan: {
            type: String,
            maxlength: [1000, 'Next day plan cannot exceed 1000 characters']
        },
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        submittedAt: {
            type: Date,
            default: Date.now
        }
    }],
    completedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const taskSchema = new mongoose.Schema({
    // Basic Task Info
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
    detailedDescription: {
        type: String,
        maxlength: [10000, 'Detailed description cannot be more than 10000 characters']
    },
    clientRequirements: {
        type: String,
        maxlength: [5000, 'Client requirements cannot be more than 5000 characters']
    },
    projectScope: {
        type: String,
        maxlength: [5000, 'Project scope cannot be more than 5000 characters']
    },
    category: {
        type: String,
        enum: ['development', 'testing', 'research', 'design', 'documentation', 'meeting', 'review', 'deployment', 'maintenance', 'other'],
        default: 'other'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    
    // Ownership & Scope
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
    taskType: {
        type: String,
        enum: ['one_time', 'daily', 'weekly', 'monthly'],
        default: 'one_time'
    },
    
    // Timeline Control
    startDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: [true, 'Please provide a due date']
    },
    deadline: {
        type: Date,
        required: [true, 'Please provide a deadline']
    },
    estimatedEffort: {
        type: Number, // in hours
        default: 0
    },
    estimatedEffortUnit: {
        type: String,
        enum: ['hours', 'days'],
        default: 'hours'
    },
    deadlineType: {
        type: String,
        enum: ['soft', 'strict'],
        default: 'soft'
    },
    
    // Performance Tracking
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'blocked', 'cancelled'],
        default: 'not_started'
    },
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    isOverdue: {
        type: Boolean,
        default: false
    },
    
    // Task Hierarchy
    isParentTask: {
        type: Boolean,
        default: true // Admin tasks are parent tasks by default
    },
    parentTaskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },
    subtasks: [subtaskSchema],
    
    // Audit Fields
    assignedAt: {
        type: Date,
        default: Date.now
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Additional Fields
    completedAt: {
        type: Date
    },
    startedAt: {
        type: Date
    },
    actualEffort: {
        type: Number, // in hours
        default: 0
    },
    attachments: [{
        name: String,
        originalName: String,
        url: String,
        fileType: String,
        fileSize: Number,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
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
    
    // Legacy fields for backward compatibility
    recurrenceType: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'none'],
        default: 'none'
    },
    recurrenceEndDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Auto-calculate progress based on subtasks
taskSchema.methods.calculateProgress = function() {
    if (this.subtasks && this.subtasks.length > 0) {
        // Calculate average progress from all subtasks
        const totalProgress = this.subtasks.reduce((sum, subtask) => {
            return sum + (subtask.progressPercentage || 0);
        }, 0);
        this.progressPercentage = Math.round(totalProgress / this.subtasks.length);
        
        // Update parent task status based on progress
        if (this.progressPercentage === 100) {
            this.status = 'completed';
            this.completedAt = new Date();
        } else if (this.progressPercentage > 0) {
            this.status = 'in_progress';
            if (!this.startedAt) {
                this.startedAt = new Date();
            }
        }
    }
    return this.progressPercentage;
};

// Auto-update overdue status
taskSchema.pre('save', function() {
    const now = new Date();
    
    // Check if task is overdue
    if (this.status !== 'completed' && this.dueDate < now) {
        this.isOverdue = true;
    } else {
        this.isOverdue = false;
    }
    
    // Set deadline same as dueDate if not set
    if (!this.deadline) {
        this.deadline = this.dueDate;
    }
    
    // Calculate progress if subtasks exist
    if (this.subtasks && this.subtasks.length > 0) {
        this.calculateProgress();
    }
});

// Index for better query performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ teamId: 1, status: 1 });
taskSchema.index({ dueDate: 1, isOverdue: 1 });
taskSchema.index({ assignedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
