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
        enum: ['Excellent', 'Good', 'Needs Attention', 'Critical'],
        default: 'Good'
    },
    healthScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
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
    totalProjects: {
        type: Number,
        default: 0
    },
    overallProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
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
teamSchema.methods.calculateHealthStatus = function(score) {
    const healthScore = score !== undefined ? score : this.healthScore;
    
    if (healthScore >= 80) this.healthStatus = 'Excellent';
    else if (healthScore >= 60) this.healthStatus = 'Good';
    else if (healthScore >= 40) this.healthStatus = 'Needs Attention';
    else this.healthStatus = 'Critical';
    
    return this.healthStatus;
};

// Update team statistics
teamSchema.methods.updateStatistics = async function() {
    const Task = mongoose.model('Task');
    const User = mongoose.model('User');
    
    // Get all tasks for this team
    const tasks = await Task.find({ teamId: this._id });
    
    // Calculate statistics
    const totalTasks = tasks.length;
    this.activeTasksCount = tasks.filter(t => 
        t.status !== 'completed' && t.status !== 'cancelled'
    ).length;
    
    this.overdueTasksCount = tasks.filter(t => 
        t.isOverdue && t.status !== 'completed'
    ).length;
    
    const completedTasksNum = tasks.filter(t => t.status === 'completed').length;
    this.completionRate = totalTasks > 0 
        ? Math.round((completedTasksNum / totalTasks) * 100) 
        : 0;
    
    // Calculate overall progress across all tasks
    const totalProgress = tasks.reduce((sum, t) => sum + (t.progressPercentage || 0), 0);
    this.overallProgress = totalTasks > 0 ? Math.round(totalProgress / totalTasks) : 0;

    // Calculate total projects (grouped by title/project field if exists, otherwise assume task groups)
    // For now, let's look at unique currentProject values if any, or just count distinct tasks as projects if they are major
    // Actually, let's just use a projects count field for now or unique categories.
    const uniqueProjects = new Set(tasks.map(t => t.projectScope || 'General').filter(p => p));
    this.totalProjects = uniqueProjects.size;

    // Get active members ratio
    const totalMembers = this.members.length;
    const activeMembersCount = await User.countDocuments({
        _id: { $in: this.members },
        isActive: true
    });
    const activeMembersRatio = totalMembers > 0 ? (activeMembersCount / totalMembers) * 100 : 0;
    
    // Non-overdue tasks ratio
    const nonOverdueRatio = totalTasks > 0 ? ((totalTasks - this.overdueTasksCount) / totalTasks) * 100 : 100;

    // Calculate team health score (0-100)
    // 40% Completion Rate, 30% Active Members, 30% Non-overdue tasks
    this.healthScore = Math.round(
        (this.completionRate * 0.4) + 
        (activeMembersRatio * 0.3) + 
        (nonOverdueRatio * 0.3)
    );
    
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
