const User = require('../models/User');
const Team = require('../models/Team');
const ActivityLog = require('../models/ActivityLog');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'team_member'
        });

        // Note: Teams should be created by admin, not automatically

        // Log activity
        await ActivityLog.create({
            action: 'user_created',
            userId: user._id,
            details: `New user registered: ${user.name} (${user.role})`
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                teamId: user.teamId,
                token
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        console.log('Login attempt received:', { email: req.body.email });
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Check for user (include password for comparison)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            console.log('Password mismatch for user:', email);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        console.log('Login successful for user:', email);

        // Update user status to online (without triggering pre-save hooks)
        await User.findByIdAndUpdate(user._id, {
            status: 'online',
            lastActive: new Date()
        });

        // Log activity
        await ActivityLog.create({
            action: 'user_login',
            userId: user._id,
            details: `User logged in: ${user.name}`
        });

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: 'online',
                teamId: user.teamId,
                avatar: user.avatar,
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error.message, error.stack);
        res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
    try {
        // Update user status to offline
        const user = await User.findById(req.user._id);
        if (user) {
            user.status = 'offline';
            user.lastActive = new Date();
            await user.save();

            // Log activity
            await ActivityLog.create({
                action: 'user_logout',
                userId: user._id,
                details: `User logged out: ${user.name}`
            });
        }

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Server error during logout' });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('teamId');
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { name, email, phone, designation, avatar } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (designation) user.designation = designation;
        if (avatar) user.avatar = avatar;

        await user.save();

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update user status
// @route   PUT /api/auth/status
// @access  Private
const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['online', 'offline', 'busy'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { status, lastActive: new Date() },
            { new: true }
        );

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    register,
    login,
    logout,
    getMe,
    updateProfile,
    updateStatus
};
