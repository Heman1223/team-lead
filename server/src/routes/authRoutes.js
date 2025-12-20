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

// Test route (GET) - for browser testing
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: '✓ Auth routes are working!',
        availableRoutes: {
            'POST /api/auth/register': 'Register new user',
            'POST /api/auth/login': 'Login user',
            'POST /api/auth/logout': 'Logout user (protected)',
            'GET /api/auth/me': 'Get current user (protected)',
            'PUT /api/auth/profile': 'Update profile (protected)',
            'PUT /api/auth/status': 'Update status (protected)'
        }
    });
});

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/status', protect, updateStatus);

module.exports = router;