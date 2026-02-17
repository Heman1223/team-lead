const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// TEMPORARY ROUTE - Remove after creating admin!
// This route helps create admin user on live deployment
router.post('/create-admin', async (req, res) => {
    try {
        console.log('Setup: Checking for admin user...');
        
        // Check if admin exists
        const adminExists = await User.findOne({ email: 'admin@teamlead.com' });
        if (adminExists) {
            console.log('Setup: Admin already exists');
            return res.json({ 
                success: true, 
                message: 'Admin user already exists',
                email: 'admin@teamlead.com',
                note: 'You can login with this account'
            });
        }

        console.log('Setup: Creating admin user...');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Create admin
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@teamlead.com',
            password: hashedPassword,
            role: 'admin',
            status: 'offline',
            isActive: true
        });

        console.log('Setup: Admin user created successfully!');

        res.json({
            success: true,
            message: 'Admin user created successfully!',
            credentials: {
                email: 'admin@teamlead.com',
                password: 'admin123'
            },
            note: 'Please remove this setup route after creating admin!'
        });
    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating admin user',
            error: error.message 
        });
    }
});

// GET version for easy browser access
router.get('/create-admin', async (req, res) => {
    try {
        console.log('Setup: Checking for admin user...');
        
        // Check if admin exists
        const adminExists = await User.findOne({ email: 'admin@teamlead.com' });
        if (adminExists) {
            console.log('Setup: Admin already exists');
            return res.json({ 
                success: true, 
                message: 'Admin user already exists',
                email: 'admin@teamlead.com',
                note: 'You can login with this account'
            });
        }

        console.log('Setup: Creating admin user...');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Create admin
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@teamlead.com',
            password: hashedPassword,
            role: 'admin',
            status: 'offline',
            isActive: true
        });

        console.log('Setup: Admin user created successfully!');

        res.json({
            success: true,
            message: 'Admin user created successfully!',
            credentials: {
                email: 'admin@teamlead.com',
                password: 'admin123'
            },
            note: 'IMPORTANT: Remove this setup route after creating admin!'
        });
    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating admin user',
            error: error.message 
        });
    }
});

// Reset admin password
router.get('/reset-admin-password', async (req, res) => {
    try {
        console.log('Setup: Resetting admin password...');
        
        // Find admin user
        const admin = await User.findOne({ email: 'admin@teamlead.com' });
        if (!admin) {
            return res.status(404).json({ 
                success: false, 
                message: 'Admin user not found'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Update password directly (bypass pre-save hook)
        await User.updateOne(
            { email: 'admin@teamlead.com' },
            { $set: { password: hashedPassword, isActive: true } }
        );

        console.log('Setup: Password reset successfully!');

        res.json({
            success: true,
            message: 'Admin password reset successfully!',
            credentials: {
                email: 'admin@teamlead.com',
                password: 'admin123'
            },
            note: 'You can now login with these credentials'
        });
    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error resetting password',
            error: error.message 
        });
    }
});

// CREATE SPECIFIC ADMIN
router.get('/setup-gurukripa-admin', async (req, res) => {
    try {
        const email = 'Gurukripaimmigrations@gmail.com';
        const password = 'gurukripa@123';
        const name = 'Gurukripa Admin';

        console.log(`Setup: Checking for user ${email}...`);
        
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            console.log('Setup: User already exists. Updating role and password...');
            user.password = password; // Hashing handled by model pre-save hook
            user.role = 'admin';
            user.isActive = true;
            await user.save();
        } else {
            console.log('Setup: Creating new admin user...');
            await User.create({
                name,
                email: email.toLowerCase(),
                password, // Hashing handled by model pre-save hook
                role: 'admin',
                isActive: true
            });
        }

        res.json({
            success: true,
            message: 'Admin account processed successfully!',
            email: email,
            role: 'admin',
            note: 'You can now login with the provided credentials.'
        });
    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error setting up admin user',
            error: error.message 
        });
    }
});

module.exports = router;
