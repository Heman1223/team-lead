const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Common settings (all roles)
router.get('/', getSettings);
router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.put('/notifications', updateNotificationSettings);
router.put('/preferences', updatePreferences);

// Team Lead & Member settings
router.put('/availability', updateAvailability);

// Team Lead specific
router.put('/call-settings', updateCallSettings);

// Team Member specific
router.put('/work-preferences', updateWorkPreferences);

// Admin specific
router.put('/system', updateSystemSettings);
router.put('/audit', updateAuditSettings);
router.put('/access', updateAccessSettings);

module.exports = router;
