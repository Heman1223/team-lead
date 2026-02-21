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
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        default: 'other'
    },
    description: {
        type: String,
        default: '',
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    inquiryMessage: {
        type: String,
        default: '',
        maxlength: [2000, 'Inquiry message cannot be more than 2000 characters']
    },

    // Lead Status & Priority (Strictly following workflow)
    status: {
        type: String,
        enum: ['new', 'contacted', 'qualified', 'proposal', 'converted', 'lost'],
        default: 'new',
        required: true
    },
    notInterestedReason: {
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
        default: 'manual'
    },
    sourceDetails: {
        type: String,
        default: ''
    },

    // Communication History & Activity Timeline
    notes: [{
        content: {
            type: String,
            required: true,
            maxlength: [1000, 'Note cannot be more than 1000 characters']
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
            enum: ['note', 'call_done', 'call_not_picked', 'email', 'meeting', 'proposal', 'follow_up_scheduled', 'status_changed', 'lead_assigned'],
            default: 'note'
        }
    }],

    // Attachments
    attachments: [{
        fileName: {
            type: String,
            required: true
        },
        fileUrl: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number,
            default: 0
        },
        fileType: {
            type: String,
            default: ''
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Status History - Complete Traceability
    statusHistory: [{
        status: {
            type: String,
            required: true
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String,
            default: ''
        }
    }],

    // Escalation
    escalatedToAdmin: {
        type: Boolean,
        default: false
    },
    escalatedAt: {
        type: Date,
        default: null
    },
    escalatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    escalationReason: {
        type: String,
        default: ''
    },

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

    // System Fields (Soft Delete with 60-day recovery)
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
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
    },
    // Conversion tracking
    convertedAt: {
        type: Date,
        default: null
    },
    conversionDuration: {
        type: Number, // in days
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

// Update lead status with automatic tracking and activity logging
leadSchema.methods.updateStatus = function (newStatus, updatedBy, notes = '') {
    const oldStatus = this.status;
    this.status = newStatus;
    this.lastUpdatedBy = updatedBy;

    // Log status change in history
    this.statusHistory.push({
        status: newStatus,
        changedBy: updatedBy,
        changedAt: new Date(),
        notes: notes || `Status changed from ${oldStatus} to ${newStatus}`
    });

    // Track conversion
    if (newStatus === 'converted' && !this.convertedAt) {
        this.convertedAt = new Date();
        this.actualCloseDate = new Date();
        // Calculate conversion duration in days
        const createdDate = new Date(this.createdAt);
        const convertedDate = new Date();
        this.conversionDuration = Math.ceil((convertedDate - createdDate) / (1000 * 60 * 60 * 24));
    }

    // Add automatic note for status change
    this.addNote(
        notes || `Status changed from ${oldStatus} to ${newStatus}`,
        updatedBy,
        'status_changed'
    );

    return this;
};

// Soft delete with 60-day recovery period
leadSchema.methods.softDelete = function (deletedBy) {
    this.isDeleted = true;
    this.isActive = false;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this;
};

// Restore deleted lead
leadSchema.methods.restore = function () {
    this.isDeleted = false;
    this.isActive = true;
    this.deletedAt = null;
    this.deletedBy = null;
    return this;
};

// Add attachment
leadSchema.methods.addAttachment = function (fileName, fileUrl, fileSize, fileType, uploadedBy) {
    this.attachments.push({
        fileName,
        fileUrl,
        fileSize,
        fileType,
        uploadedBy,
        uploadedAt: new Date()
    });
    return this;
};

module.exports = mongoose.model('Lead', leadSchema);