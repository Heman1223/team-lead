const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        enum: ['lead', 'member'],
        default: 'member'
    }
});

const teamSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Please provide a team name'],
        trim: true,
        unique: true,
        maxlength: [100, 'Team name cannot be more than 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    objective: {
        type: String,
        maxlength: [1000, 'Objective cannot be more than 1000 characters']
    },
    
    // Team Lead Assignment
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Team must have a lead']
    },
    
    // Team Members
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    memberDetails: [teamMemberSchema],
    
    // Team Configuration
    status: {
        type: String,
        enum: ['active', 'inactive', 'archived'],
        default: 'active'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    taskType: {
        type: String,
        enum: ['project_based', 'ongoing'],
        default: 'project_based'
    },
    
    // Team Health & Performance
    healthStatus: {
        type: String,
        enum: ['healthy', 'at_risk', 'critical'],
        default: 'healthy'
    },
    completionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    activeTasksCount: {
        type: Number,
        default: 0
    },
    overdueTasksCount: {
        type: Number,
        default: 0
    },
    
    // Legacy fields (keep for backward compatibility)
    department: {
        type: String,
        default: ''
    },
    coreField: {
        type: String,
        default: '',
        trim: true
    },
    currentProject: {
        type: String,
        default: ''
    },
    projectProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Audit Fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    archivedAt: {
        type: Date
    },
    archivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Calculate team health status based on performance
teamSchema.methods.calculateHealthStatus = function() {
    const completionRate = this.completionRate || 0;
    const hasOverdue = this.overdueTasksCount > 0;
    
    if (hasOverdue || completionRate < 50) {
        this.healthStatus = 'critical';
    } else if (completionRate >= 50 && completionRate < 80) {
        this.healthStatus = 'at_risk';
    } else {
        this.healthStatus = 'healthy';
    }
    
    return this.healthStatus;
};

// Update team statistics
teamSchema.methods.updateStatistics = async function() {
    const Task = mongoose.model('Task');
    
    // Get all tasks for this team
    const tasks = await Task.find({ teamId: this._id });
    
    // Calculate statistics
    this.activeTasksCount = tasks.filter(t => 
        t.status !== 'completed' && t.status !== 'cancelled'
    ).length;
    
    this.overdueTasksCount = tasks.filter(t => 
        t.isOverdue && t.status !== 'completed'
    ).length;
    
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    this.completionRate = tasks.length > 0 
        ? Math.round((completedTasks / tasks.length) * 100) 
        : 0;
    
    // Calculate health status
    this.calculateHealthStatus();
    
    return this;
};

// Index for better query performance
teamSchema.index({ name: 1 });
teamSchema.index({ leadId: 1 });
teamSchema.index({ status: 1 });
teamSchema.index({ healthStatus: 1 });

module.exports = mongoose.model('Team', teamSchema);
