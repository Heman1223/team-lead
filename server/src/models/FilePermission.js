const mongoose = require('mongoose');

/**
 * FilePermission Schema
 * Manages file-level access control
 * Each file can have multiple users with access permissions
 * 
 * Access Rules:
 * - Admin: Full access to all files
 * - Team Lead: Can grant/revoke access to members
 * - Members: Can only access files in their permissions
 */
const filePermissionSchema = new mongoose.Schema({
    file_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    permission_type: {
        type: String,
        enum: ['view', 'download', 'edit', 'delete'],
        default: 'view'
    },
    granted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    granted_at: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure unique file-user combination (can't grant same permission twice)
filePermissionSchema.index({ file_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('FilePermission', filePermissionSchema);
