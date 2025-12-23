const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    
    // Notification Settings (All Roles)
    notifications: {
        taskAssignment: { type: Boolean, default: true },
        deadlineReminders: { type: Boolean, default: true },
        callNotifications: { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: true },
        inAppNotifications: { type: Boolean, default: true },
        dailySummary: { type: Boolean, default: false },
        overdueAlerts: { type: Boolean, default: true },
        memberInactivityAlerts: { type: Boolean, default: false }
    },
    
    // Account Preferences (All Roles)
    preferences: {
        language: { type: String, default: 'en', enum: ['en', 'es', 'fr', 'de'] },
        theme: { type: String, default: 'light', enum: ['light', 'dark', 'auto'] },
        timezone: { type: String, default: 'UTC' },
        dateFormat: { type: String, default: 'MM/DD/YYYY', enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] },
        timeFormat: { type: String, default: '12h', enum: ['12h', '24h'] }
    },
    
    // Availability Status (Team Lead & Member)
    availability: {
        status: { type: String, default: 'available', enum: ['available', 'busy', 'offline'] },
        autoStatus: { type: Boolean, default: false }, // Auto-set to offline when inactive
        customMessage: { type: String, default: '' }
    },
    
    // Call Settings (Team Lead)
    callSettings: {
        autoLogMissedCalls: { type: Boolean, default: true },
        enableCallHistory: { type: Boolean, default: true },
        defaultCallTimeout: { type: Number, default: 30 }, // minutes
        allowIncomingCalls: { type: Boolean, default: true }
    },
    
    // Work Preferences (Team Member)
    workPreferences: {
        taskReminderFrequency: { type: String, default: 'daily', enum: ['hourly', 'daily', 'weekly', 'none'] },
        workingHoursStart: { type: String, default: '09:00' },
        workingHoursEnd: { type: String, default: '17:00' },
        workingDays: { type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
    },
    
    // System Settings (Admin Only)
    systemSettings: {
        taskPriorityRules: {
            highPriorityThreshold: { type: Number, default: 3 }, // days
            mediumPriorityThreshold: { type: Number, default: 7 }
        },
        defaultDeadlineDays: { type: Number, default: 7 },
        performanceThresholds: {
            excellent: { type: Number, default: 90 },
            good: { type: Number, default: 70 },
            needsImprovement: { type: Number, default: 50 }
        },
        teamHealthLogic: {
            criticalOverdueCount: { type: Number, default: 5 },
            atRiskCompletionRate: { type: Number, default: 60 }
        }
    },
    
    // Audit & Logs Settings (Admin Only)
    auditSettings: {
        enableActivityTracking: { type: Boolean, default: true },
        logRetentionDays: { type: Number, default: 90 },
        detailedLogging: { type: Boolean, default: false }
    },
    
    // User Access & Roles (Admin Only)
    accessSettings: {
        enabledFeatures: {
            tasks: { type: Boolean, default: true },
            calls: { type: Boolean, default: true },
            reports: { type: Boolean, default: true },
            communication: { type: Boolean, default: true }
        },
        lockCriticalActions: { type: Boolean, default: true }
    }
}, {
    timestamps: true
});

// Index for faster queries
userSettingsSchema.index({ userId: 1 });

module.exports = mongoose.model('UserSettings', userSettingsSchema);
