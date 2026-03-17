const File = require('../models/File');
const FilePermission = require('../models/FilePermission');
const Category = require('../models/Category');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Team = require('../models/Team');

/**
 * File Controller
 * Handles file management with strict file-level access control
 */

// @desc    Upload file with Cloudinary
// @route   POST /api/files/upload
// @access  Private (Admin, Team Lead, Member)
const uploadFile = async (req, res) => {
    try {
        const { file_name, category_id, tags, access_members } = req.body;
        const currentUserId = req.user._id;
        const currentUserRole = req.user.role;

        // Validate inputs
        if (!file_name) {
            return res.status(400).json({ success: false, message: 'File name is required' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file provided' });
        }

        // Validate file type
        const allowedTypes = ['pdf', 'png', 'jpg', 'jpeg', 'docx'];
        const fileExt = path.extname(req.file.originalname).toLowerCase().substring(1);

        let fileType = fileExt;
        if (fileExt === 'docx') fileType = 'docx';
        else if (['jpg', 'jpeg'].includes(fileExt)) fileType = fileExt;
        else if (fileExt === 'png') fileType = 'png';
        else if (fileExt === 'pdf') fileType = 'pdf';
        else {
            fs.unlinkSync(req.file.path); // Delete temp file
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Allowed: PDF, PNG, JPG, JPEG, DOCX'
            });
        }

        // Upload to Cloudinary
        const cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'auto',
            folder: 'team-lead-files',
            public_id: `${Date.now()}_${file_name.replace(/\s+/g, '_')}`
        });

        // Delete temp file after upload
        fs.unlinkSync(req.file.path);

        // Get current time
        const now = new Date();
        const upload_time = now.toTimeString().split(' ')[0]; // HH:MM:SS format

        // Create file record
        const fileData = {
            file_name,
            file_url: cloudinaryResult.secure_url,
            cloudinary_public_id: cloudinaryResult.public_id,
            cloudinary_resource_type: cloudinaryResult.resource_type,
            file_size: req.file.size,
            file_type: fileType,
            category_id: category_id || null,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            uploaded_by: currentUserId,
            upload_date: now,
            upload_time
        };

        const newFile = await File.create(fileData);

        // Grant access to uploaded user automatically
        await FilePermission.create({
            file_id: newFile._id,
            user_id: currentUserId,
            permission_type: 'edit', // Uploader gets full edit access
            granted_by: currentUserId
        });

        // Grant access to Admin users automatically
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            if (admin._id.toString() !== currentUserId.toString()) {
                await FilePermission.create({
                    file_id: newFile._id,
                    user_id: admin._id,
                    permission_type: 'edit',
                    granted_by: currentUserId
                });
            }
        }

        // Grant access to Team Leads of user's team
        const userTeam = req.user.teamId;
        if (userTeam) {
            const team = await Team.findById(userTeam);
            if (team && team.leadId) {
                await FilePermission.create({
                    file_id: newFile._id,
                    user_id: team.leadId,
                    permission_type: 'edit',
                    granted_by: currentUserId
                });
            }
        }

        // Grant access to selected members
        let membersToGrant = [];
        if (access_members) {
            try {
                // Since this comes from FormData, it might be a JSON string
                membersToGrant = typeof access_members === 'string' ? JSON.parse(access_members) : access_members;
            } catch (e) {
                console.warn('Failed to parse access_members:', access_members);
            }
        }

        if (Array.isArray(membersToGrant) && membersToGrant.length > 0) {
            for (const memberId of membersToGrant) {
                if (memberId && memberId !== currentUserId.toString()) {
                    const existingPermission = await FilePermission.findOne({
                        file_id: newFile._id,
                        user_id: memberId
                    });

                    if (!existingPermission) {
                        await FilePermission.create({
                            file_id: newFile._id,
                            user_id: memberId,
                            permission_type: 'edit', // Grant edit permission by default for access members
                            granted_by: currentUserId
                        });
                    }
                }
            }
        }

        // Populate and return the file
        await newFile.populate('uploaded_by', 'name email');
        await newFile.populate('category_id', 'category_name');

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            data: newFile
        });

    } catch (error) {
        // Delete temp file if exists
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {
                // Ignore cleanup errors
            }
        }
        console.error('Upload file error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading file',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
};

// @desc    Get files with access control
// @route   GET /api/files
// @access  Private
const getFiles = async (req, res) => {
    try {
        const currentUserId = req.user._id.toString();
        const currentUserRole = req.user.role;

        let query = { is_active: true };

        // Access control logic
        if (currentUserRole === 'admin') {
            // Admins see all files
            // No additional filtering needed
        } else if (currentUserRole === 'team_lead') {
            // Team leads see:
            // 1. Files they uploaded
            // 2. Files they have permission to access
            const permissions = await FilePermission.find({ user_id: currentUserId });
            const fileIds = permissions.map(p => p.file_id);

            query = {
                ...query,
                $or: [
                    { uploaded_by: currentUserId },
                    { _id: { $in: fileIds } }
                ]
            };
        } else {
            // Members see only files they have permission to access
            const permissions = await FilePermission.find({ user_id: currentUserId });
            const fileIds = permissions.map(p => p.file_id);

            if (fileIds.length === 0) {
                return res.json({
                    success: true,
                    count: 0,
                    data: []
                });
            }

            query = {
                ...query,
                _id: { $in: fileIds }
            };
        }

        // Apply search filters
        const { query: searchQuery, category_id, tags } = req.query;
        let searchConditions = [];

        if (searchQuery) {
            searchConditions.push({
                $or: [
                    { file_name: { $regex: searchQuery, $options: 'i' } },
                    { tags: { $in: [new RegExp(searchQuery, 'i')] } },
                    { description: { $regex: searchQuery, $options: 'i' } }
                ]
            });
        }

        if (category_id) {
            searchConditions.push({ category_id });
        }

        if (tags) {
            const tagArray = tags.split(',').map(t => t.trim());
            searchConditions.push({ tags: { $in: tagArray } });
        }

        if (searchConditions.length > 0) {
            query = {
                $and: [
                    query,
                    ...searchConditions
                ]
            };
        }

        // Fetch files with necessary relationships
        const files = await File.find(query)
            .populate('uploaded_by', 'name email')
            .populate('category_id', 'category_name')
            .sort({ upload_date: -1 });

        // Add permission details for each file
        const filesWithPermissions = await Promise.all(
            files.map(async (file) => {
                const permissions = await FilePermission.find({ file_id: file._id })
                    .populate('user_id', 'name email role');

                return {
                    ...file.toObject(),
                    access_members: permissions.map(p => ({
                        user_id: p.user_id._id,
                        user_name: p.user_id.name,
                        user_email: p.user_id.email,
                        permission_type: p.permission_type
                    }))
                };
            })
        );

        res.json({
            success: true,
            count: filesWithPermissions.length,
            data: filesWithPermissions
        });

    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching files',
            error: error.message
        });
    }
};

// @desc    Search files
// @route   GET /api/files/search
// @access  Private
const searchFiles = async (req, res) => {
    try {
        const { query, category_id, tags, uploaded_by } = req.query;
        const currentUserId = req.user._id.toString();
        const currentUserRole = req.user.role;

        let searchQuery = { is_active: true };

        // Apply access control first
        if (currentUserRole === 'admin') {
            // Admins see all files
        } else if (currentUserRole === 'team_lead') {
            const permissions = await FilePermission.find({ user_id: currentUserId });
            const fileIds = permissions.map(p => p.file_id);

            searchQuery = {
                ...searchQuery,
                $or: [
                    { uploaded_by: currentUserId },
                    { _id: { $in: fileIds } }
                ]
            };
        } else {
            const permissions = await FilePermission.find({ user_id: currentUserId });
            const fileIds = permissions.map(p => p.file_id);

            searchQuery = {
                ...searchQuery,
                _id: { $in: fileIds }
            };
        }

        // Apply search filters
        if (query) {
            searchQuery.$or = [
                { file_name: { $regex: query, $options: 'i' } },
                { tags: { $in: [new RegExp(query, 'i')] } },
                { description: { $regex: query, $options: 'i' } }
            ];
        }

        if (category_id) {
            searchQuery.category_id = category_id;
        }

        if (tags) {
            const tagArray = tags.split(',').map(t => t.trim());
            searchQuery.tags = { $in: tagArray };
        }

        if (uploaded_by) {
            searchQuery.uploaded_by = uploaded_by;
        }

        const files = await File.find(searchQuery)
            .populate('uploaded_by', 'name email')
            .populate('category_id', 'category_name')
            .sort({ upload_date: -1 });

        res.json({
            success: true,
            count: files.length,
            data: files
        });

    } catch (error) {
        console.error('Search files error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching files',
            error: error.message
        });
    }
};

// @desc    Update file metadata (name, category, tags)
// @route   PUT /api/files/:id
// @access  Private (Admin, Team Lead of same team)
const updateFile = async (req, res) => {
    try {
        const { id } = req.params;
        const { file_name, category_id, tags, description } = req.body;
        const currentUserId = req.user._id.toString();
        const currentUserRole = req.user.role;

        // Get file
        const file = await File.findById(id);
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        // Check authorization - only admin, uploader, or users with permission can update
        const permission = await FilePermission.findOne({
            file_id: id,
            user_id: currentUserId
        });

        const canUpdate = currentUserRole === 'admin' ||
            file.uploaded_by.toString() === currentUserId ||
            (permission && (permission.permission_type === 'edit' || permission.permission_type === 'view'));

        if (!canUpdate) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to edit this file'
            });
        }

        // Update fields
        if (file_name) file.file_name = file_name;
        if (category_id) file.category_id = category_id;
        if (tags) file.tags = tags.split(',').map(tag => tag.trim());
        if (description !== undefined) file.description = description;

        file.updated_at = new Date();

        await file.save();
        await file.populate('uploaded_by', 'name email');
        await file.populate('category_id', 'category_name');

        res.json({
            success: true,
            message: 'File updated successfully',
            data: file
        });

    } catch (error) {
        console.error('Update file error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating file',
            error: error.message
        });
    }
};

// @desc    Replace file (upload new file, keep same record)
// @route   POST /api/files/:id/replace
// @access  Private (Admin, Team Lead)
const replaceFile = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user._id.toString();
        const currentUserRole = req.user.role;

        // Get file
        const file = await File.findById(id);
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        // Check authorization
        const canReplace = currentUserRole === 'admin' ||
            file.uploaded_by.toString() === currentUserId;

        if (!canReplace) {
            return res.status(403).json({
                success: false,
                message: 'Only admin and uploader can replace files'
            });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file provided' });
        }

        // Delete old file from Cloudinary
        try {
            await cloudinary.uploader.destroy(file.cloudinary_public_id);
        } catch (error) {
            console.warn('Could not delete old file from Cloudinary:', error);
        }

        // Upload new file
        const cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'auto',
            folder: 'team-lead-files',
            public_id: `${Date.now()}_${file.file_name.replace(/\s+/g, '_')}`
        });

        fs.unlinkSync(req.file.path);

        // Update file record
        file.file_url = cloudinaryResult.secure_url;
        file.cloudinary_public_id = cloudinaryResult.public_id;
        file.cloudinary_resource_type = cloudinaryResult.resource_type;
        file.file_size = req.file.size;

        const now = new Date();
        file.upload_date = now;
        file.upload_time = now.toTimeString().split(' ')[0];
        file.updated_at = now;

        await file.save();
        await file.populate('uploaded_by', 'name email');
        await file.populate('category_id', 'category_name');

        res.json({
            success: true,
            message: 'File replaced successfully',
            data: file
        });

    } catch (error) {
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) { }
        }
        console.error('Replace file error:', error);
        res.status(500).json({
            success: false,
            message: 'Error replacing file',
            error: error.message
        });
    }
};

// @desc    Secure proxy to download file
// @route   GET /api/files/:id/download
// @access  Private
const downloadFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        // Access Control Check
        const currentUserId = req.user._id;
        const currentUserRole = req.user.role;

        if (currentUserRole !== 'admin') {
            const hasPermission = await FilePermission.findOne({
                file_id: file._id,
                user_id: currentUserId
            });

            if (!hasPermission && file.uploaded_by.toString() !== currentUserId.toString()) {
                return res.status(403).json({ success: false, message: 'Not authorized to download this file' });
            }
        }

        // Generate a securely signed URL from Cloudinary using the stored public ID
        // Private/Authenticated files require signature to download directly via Axios
        const signedUrl = cloudinary.url(file.cloudinary_public_id, {
            resource_type: file.cloudinary_resource_type || 'auto',
            sign_url: true,
            secure: true
        });

        // Fetch file from the securely signed Cloudinary URL as a stream
        const response = await axios({
            method: 'GET',
            url: signedUrl,
            responseType: 'stream',
        });

        // Ensure extension exists for downloaded filename
        let fileName = file.file_name || 'download';
        if (file.file_type && !fileName.toLowerCase().endsWith(`.${file.file_type.toLowerCase()}`)) {
            fileName = `${fileName}.${file.file_type}`;
        }

        // Set Headers
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', response.headers['content-type']);
        if (response.headers['content-length']) {
            res.setHeader('Content-Length', response.headers['content-length']);
        }

        // Stream via piping
        response.data.pipe(res);

    } catch (error) {
        console.error('Error in downloadFile:', error.message);
        if (error.response) {
            console.error('Cloudinary Response Status:', error.response.status);
            console.error('Cloudinary Response Headers:', error.response.headers);
            
            // If it's a stream, we might not get data directly. 
            // We just log what we can.
            if (error.response.status === 401) {
                 return res.status(401).json({ success: false, message: 'Upstream file host denied access' });
            }
        }
        res.status(500).json({ success: false, message: 'Server Error while proxying download' });
    }
};

// @desc    Delete file
// @route   DELETE /api/files/:id
// @access  Private (Admin, Team Lead)
const deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user._id.toString();
        const currentUserRole = req.user.role;

        // Get file
        const file = await File.findById(id);
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        // Check authorization
        const canDelete = currentUserRole === 'admin' ||
            file.uploaded_by.toString() === currentUserId;

        if (!canDelete) {
            return res.status(403).json({
                success: false,
                message: 'Only admin and uploader can delete files'
            });
        }

        // Delete from Cloudinary
        try {
            await cloudinary.uploader.destroy(file.cloudinary_public_id);
        } catch (error) {
            console.warn('Could not delete file from Cloudinary:', error);
        }

        // Delete from database
        await File.findByIdAndDelete(id);

        // Delete permissions
        await FilePermission.deleteMany({ file_id: id });

        res.json({
            success: true,
            message: 'File deleted successfully'
        });

    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting file',
            error: error.message
        });
    }
};

// @desc    Grant access to user
// @route   POST /api/files/:id/grant-access
// @access  Private (Admin or Uploader)
const grantAccess = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;
        const currentUserId = req.user._id.toString();
        const currentUserRole = req.user.role;

        // Check file exists
        const file = await File.findById(id);
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        // Only admins or the uploader can grant access
        const canGrant = currentUserRole === 'admin' || file.uploaded_by.toString() === currentUserId;
        if (!canGrant) {
            return res.status(403).json({
                success: false,
                message: 'Only admins and file uploaders can grant file access'
            });
        }

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        // Check user exists
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if permission already exists
        const existingPermission = await FilePermission.findOne({
            file_id: id,
            user_id: user_id
        });

        if (existingPermission) {
            return res.status(400).json({
                success: false,
                message: 'User already has access to this file'
            });
        }

        // Create permission
        const permission = await FilePermission.create({
            file_id: id,
            user_id: user_id,
            permission_type: 'edit', // Changed from 'view' to 'edit' to allow metadata updates
            granted_by: currentUserId
        });

        res.status(201).json({
            success: true,
            message: 'Access granted successfully',
            data: permission
        });

    } catch (error) {
        console.error('Grant access error:', error);
        res.status(500).json({
            success: false,
            message: 'Error granting access',
            error: error.message
        });
    }
};

// @desc    Revoke access from user
// @route   DELETE /api/files/:id/revoke-access/:user_id
// @access  Private (Admin or Uploader)
const revokeAccess = async (req, res) => {
    try {
        const { id, user_id } = req.params;
        const currentUserId = req.user._id.toString();
        const currentUserRole = req.user.role;

        // Check file exists
        const file = await File.findById(id);
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        // Only admins or uploader can revoke access
        const canRevoke = currentUserRole === 'admin' || file.uploaded_by.toString() === currentUserId;
        if (!canRevoke) {
            return res.status(403).json({
                success: false,
                message: 'Only admins and file uploaders can revoke file access'
            });
        }

        // Fetch target user to check hierarchy
        const targetUser = await User.findById(user_id);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Target user not found' });
        }

        // Specific hierarchy rules
        // Admin -> Cannot be revoked by anyone
        if (targetUser.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot revoke access from an Admin' });
        }

        // Uploader -> Cannot be revoked by anyone
        if (file.uploaded_by.toString() === user_id) {
            return res.status(403).json({ success: false, message: 'Cannot revoke access from the file uploader' });
        }

        // Hierarchy rule checking
        if (currentUserRole !== 'admin') {
            // Team Lead cannot revoke another Team Lead
            if (currentUserRole === 'team_lead' && targetUser.role === 'team_lead') {
                return res.status(403).json({ success: false, message: 'Team Leads cannot revoke access from other Team Leads' });
            }
            // Team Member cannot revoke a Team Lead
            if (currentUserRole === 'team_member' && targetUser.role === 'team_lead') {
                return res.status(403).json({ success: false, message: 'Team Members cannot revoke access from Team Leads' });
            }
        }

        // Delete permission
        const permission = await FilePermission.findOneAndDelete({
            file_id: id,
            user_id: user_id
        });

        if (!permission) {
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }

        res.json({
            success: true,
            message: 'Access revoked successfully'
        });

    } catch (error) {
        console.error('Revoke access error:', error);
        res.status(500).json({
            success: false,
            message: 'Error revoking access',
            error: error.message
        });
    }
};

module.exports = {
    uploadFile,
    getFiles,
    searchFiles,
    updateFile,
    replaceFile,
    downloadFile,
    deleteFile,
    grantAccess,
    revokeAccess
};
