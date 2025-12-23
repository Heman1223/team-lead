const UserSettings = require('../models/UserSettings');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const bcrypt = require('bcryptjs');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
    try {
        let settings = await UserSettings.findOne({ userId: req.user._id });
        
        // Create default settings if not exists
        if (!settings) {
            settings = await UserSettings.create({ userId: req.user._id });
        }
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update notification settings
// @route   PUT /api/settings/notifications
// @access  Private
const updateNotificationSettings = async (req, res) => {
    try {
        let settings = await UserSettings.findOne({ userId: req.user._id });
        
        if (!settings) {
            settings = await UserSettings.create({ userId: req.user._id });
        }
        
        settings.notifications = { ...settings.notifications, ...req.body };
        await settings.save();
        
        await ActivityLog.create({
            action: 'settings_updated',
            userId: req.user._id,
            details: 'Updated notification settings'
        });
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Update notification settings error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update account preferences
// @route   PUT /api/settings/preferences
// @access  Private
const updatePreferences = async (req, res) => {
    try {
        let settings = await UserSettings.findOne({ userId: req.user._id });
        
        if (!settings) {
            settings = await UserSettings.create({ userId: req.user._id });
        }
        
        settings.preferences = { ...settings.preferences, ...req.body };
        await settings.save();
        
        await ActivityLog.create({
            action: 'settings_updated',
            userId: req.user._id,
            details: 'Updated account preferences'
        });
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update availability status
// @route   PUT /api/settings/availability
// @access  Private (Team Lead & Member)
const updateAvailability = async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Admins do not have availability status' });
        }
        
        let settings = await UserSettings.findOne({ userId: req.user._id });
        
        if (!settings) {
            settings = await UserSettings.create({ userId: req.user._id });
        }
        
        settings.availability = { ...settings.availability, ...req.body };
        await settings.save();
        
        // Also update user status
        await User.findByIdAndUpdate(req.user._id, { status: req.body.status || settings.availability.status });
        
        await ActivityLog.create({
            action: 'availability_updated',
            userId: req.user._id,
            details: `Availability set to: ${settings.availability.status}`
        });
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update call settings
// @route   PUT /api/settings/call-settings
// @access  Private (Team Lead)
const updateCallSettings = async (req, res) => {
    try {
        if (req.user.role !== 'team_lead') {
            return res.status(403).json({ success: false, message: 'Only team leads can update call settings' });
        }
        
        let settings = await UserSettings.findOne({ userId: req.user._id });
        
        if (!settings) {
            settings = await UserSettings.create({ userId: req.user._id });
        }
        
        settings.callSettings = { ...settings.callSettings, ...req.body };
        await settings.save();
        
        await ActivityLog.create({
            action: 'settings_updated',
            userId: req.user._id,
            details: 'Updated call settings'
        });
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Update call settings error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update work preferences
// @route   PUT /api/settings/work-preferences
// @access  Private (Team Member)
const updateWorkPreferences = async (req, res) => {
    try {
        if (req.user.role !== 'team_member') {
            return res.status(403).json({ success: false, message: 'Only team members can update work preferences' });
        }
        
        let settings = await UserSettings.findOne({ userId: req.user._id });
        
        if (!settings) {
            settings = await UserSettings.create({ userId: req.user._id });
        }
        
        settings.workPreferences = { ...settings.workPreferences, ...req.body };
        await settings.save();
        
        await ActivityLog.create({
            action: 'settings_updated',
            userId: req.user._id,
            details: 'Updated work preferences'
        });
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Update work preferences error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update system settings
// @route   PUT /api/settings/system
// @access  Private (Admin)
const updateSystemSettings = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only admins can update system settings' });
        }
        
        let settings = await UserSettings.findOne({ userId: req.user._id });
        
        if (!settings) {
            settings = await UserSettings.create({ userId: req.user._id });
        }
        
        settings.systemSettings = { ...settings.systemSettings, ...req.body };
        await settings.save();
        
        await ActivityLog.create({
            action: 'system_settings_updated',
            userId: req.user._id,
            details: 'Updated system settings'
        });
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Update system settings error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update audit settings
// @route   PUT /api/settings/audit
// @access  Private (Admin)
const updateAuditSettings = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only admins can update audit settings' });
        }
        
        let settings = await UserSettings.findOne({ userId: req.user._id });
        
        if (!settings) {
            settings = await UserSettings.create({ userId: req.user._id });
        }
        
        settings.auditSettings = { ...settings.auditSettings, ...req.body };
        await settings.save();
        
        await ActivityLog.create({
            action: 'audit_settings_updated',
            userId: req.user._id,
            details: 'Updated audit & logs settings'
        });
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Update audit settings error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update access settings
// @route   PUT /api/settings/access
// @access  Private (Admin)
const updateAccessSettings = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only admins can update access settings' });
        }
        
        let settings = await UserSettings.findOne({ userId: req.user._id });
        
        if (!settings) {
            settings = await UserSettings.create({ userId: req.user._id });
        }
        
        settings.accessSettings = { ...settings.accessSettings, ...req.body };
        await settings.save();
        
        await ActivityLog.create({
            action: 'access_settings_updated',
            userId: req.user._id,
            details: 'Updated user access & roles settings'
        });
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Update access settings error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update profile
// @route   PUT /api/settings/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { name, phone, avatar } = req.body;
        
        const user = await User.findById(req.user._id);
        
        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (avatar) user.avatar = avatar;
        
        await user.save();
        
        await ActivityLog.create({
            action: 'profile_updated',
            userId: req.user._id,
            details: 'Updated profile information'
        });
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Change password
// @route   PUT /api/settings/password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'New passwords do not match' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }
        
        const user = await User.findById(req.user._id).select('+password');
        
        // Verify current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        await ActivityLog.create({
            action: 'password_changed',
            userId: req.user._id,
            details: 'Password changed successfully'
        });
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    getSettings,
    updateNotificationSettings,
    updatePreferences,
    updateAvailability,
    updateCallSettings,
    updateWorkPreferences,
    updateSystemSettings,
    updateAuditSettings,
    updateAccessSettings,
    updateProfile,
    changePassword
};
