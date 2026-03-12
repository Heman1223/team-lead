const mongoose = require('mongoose');

/**
 * File Schema
 * Stores file metadata and Cloudinary URL
 * Supports: PDF, PNG, JPG, JPEG, DOCX
 */
const fileSchema = new mongoose.Schema({
    file_name: {
        type: String,
        required: [true, 'File name is required'],
        trim: true,
        maxlength: [255, 'File name cannot exceed 255 characters']
    },
    file_url: {
        type: String,
        required: [true, 'File URL from Cloudinary is required']
    },
    cloudinary_public_id: {
        type: String,
        required: true // For deletion/replacement
    },
    cloudinary_resource_type: {
        type: String,
        enum: ['image', 'video', 'raw', 'auto'],
        default: 'auto'
    },
    file_size: {
        type: Number, // In bytes
        required: true
    },
    file_type: {
        type: String,
        enum: ['pdf', 'png', 'jpg', 'jpeg', 'docx'],
        required: true
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    tags: {
        type: [String], // Array of tags
        default: []
    },
    uploaded_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    upload_date: {
        type: Date,
        required: true
    },
    upload_time: {
        type: String, // HH:MM:SS format
        required: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    is_active: {
        type: Boolean,
        default: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for faster searches
fileSchema.index({ file_name: 'text', tags: 'text', description: 'text' });
fileSchema.index({ category_id: 1 });
fileSchema.index({ uploaded_by: 1 });
fileSchema.index({ upload_date: -1 });

module.exports = mongoose.model('File', fileSchema);
