const express = require('express');
const router = express.Router();
const {
    register,
    login,
    logout,
    getMe,
    updateProfile,
    updateStatus
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/status', protect, updateStatus);

module.exports = router;
