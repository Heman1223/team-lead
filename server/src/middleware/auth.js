const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                console.log(`[AUTH] User not found for ID: ${decoded.id}`);
                return res.status(401).json({ success: false, message: 'User not found' });
            }

            if (req.user.isActive === false) {
                console.log(`[AUTH] Inactive user access denied: ${req.user.email}`);
                return res.status(403).json({ 
                    success: false, 
                    message: 'Your account is inactive. Please contact your administrator for assistance.' 
                });
            }

            console.log(`[AUTH] Protected route accessed by: ${req.user.email} (${req.user.role})`);
            next();
        } catch (error) {
            console.error('[AUTH] Token verification failed:', error.message);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    } else {
        console.log('[AUTH] No token provided for protected route:', req.originalUrl);
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

// Role-based authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            console.error('[AUTH] Authorize middleware called without req.user!');
            return res.status(401).json({ success: false, message: 'Not authorized, session missing' });
        }
        if (!roles.includes(req.user.role)) {
            console.log(`[AUTH] Role access denied: ${req.user.role} not in [${roles.join(', ')}]`);
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };