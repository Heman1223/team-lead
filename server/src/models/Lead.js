const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    // Basic Lead Information
    clientName: {
        type: String,
        required: [true, 'Client name is required'],
        trim: true,
        maxlength: [100, 'Client name cannot be more than 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['web_development', 'mobile_app', 'ui_ux_design', 'digital_marketing', 'seo', 'content_writing', 'consulting', 'other'],
        default: 'other'
    },
    description: {
        type: String,
        default: '',
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },

    // Lead Status & Priority
    status: {
        type: String,
        enum: ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost', 'archived'],
        default: 'new'
    },
    lostReason: {
        type: String,
        default: ''
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },

    // Assignment Information
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    assignedTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    assignedAt: {
        type: Date,
        default: null
    },

    // Lead Value & Budget
    estimatedValue: {
        type: Number,
        default: 0,
        min: 0
    },
    actualValue: {
        type: Number,
        default: 0,
        min: 0
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
    },

    // Timeline
    expectedCloseDate: {
        type: Date,
        default: null
    },
    actualCloseDate: {
        type: Date,
        default: null
    },
    followUpDate: {
        type: Date,
        default: null
    },

    // Lead Source & Tracking
    source: {
        type: String,
        enum: ['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'trade_show', 'csv_import', 'other'],
        default: 'csv_import'
    },
    sourceDetails: {
        type: String,
        default: ''
    },

    // Communication History
    notes: [{
        content: {
            type: String,
            required: true,
            maxlength: [500, 'Note cannot be more than 500 characters']
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        type: {
            type: String,
            enum: ['note', 'call', 'email', 'meeting', 'proposal', 'follow_up'],
            default: 'note'
        }
    }],

    // Lead Qualification
    isQualified: {
        type: Boolean,
        default: false
    },
    qualificationScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    qualificationCriteria: {
        budget: {
            type: Boolean,
            default: false
        },
        authority: {
            type: Boolean,
            default: false
        },
        need: {
            type: Boolean,
            default: false
        },
        timeline: {
            type: Boolean,
            default: false
        }
    },

    // Additional Information
    companyName: {
        type: String,
        default: '',
        trim: true
    },
    companySize: {
        type: String,
        enum: ['startup', 'small', 'medium', 'large', 'enterprise', 'unknown'],
        default: 'unknown'
    },
    industry: {
        type: String,
        default: '',
        trim: true
    },
    website: {
        type: String,
        default: '',
        trim: true
    },

    // System Fields
    isActive: {
        type: Boolean,
        default: true
    },
    importBatch: {
        type: String,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Indexes for better query performance
leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ assignedTeam: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ category: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ followUpDate: 1 });

// Calculate qualification score based on criteria
leadSchema.methods.calculateQualificationScore = function () {
    const criteria = this.qualificationCriteria;
    const totalCriteria = 4;
    const metCriteria = Object.values(criteria).filter(Boolean).length;

    this.qualificationScore = Math.round((metCriteria / totalCriteria) * 100);
    this.isQualified = this.qualificationScore >= 75;

    return this.qualificationScore;
};

// Add note to lead
leadSchema.methods.addNote = function (content, addedBy, type = 'note') {
    this.notes.push({
        content,
        addedBy,
        type,
        addedAt: new Date()
    });
    return this;
};

// Update lead status with automatic date tracking
leadSchema.methods.updateStatus = function (newStatus, updatedBy) {
    const oldStatus = this.status;
    this.status = newStatus;
    this.lastUpdatedBy = updatedBy;

    // Set close date for won/lost leads
    if (['won', 'lost'].includes(newStatus) && !this.actualCloseDate) {
        this.actualCloseDate = new Date();
    }

    // Add automatic note for status change
    this.addNote(
        `Status changed from ${oldStatus} to ${newStatus}`,
        updatedBy,
        'note'
    );

    return this;
};

module.exports = mongoose.model('Lead', leadSchema);