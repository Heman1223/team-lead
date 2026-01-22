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

module.exports = router;
