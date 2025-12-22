require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const fixAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // Find admin user
        let admin = await User.findOne({ email: 'admin@teamlead.com' }).select('+password');
        
        if (!admin) {
            console.log('✗ Admin account NOT found. Creating...');
            admin = await User.create({
                name: 'Admin',
                email: 'admin@teamlead.com',
                password: 'admin123',
                role: 'admin',
                isActive: true
            });
            console.log('✓ Admin account created successfully!');
        } else {
            console.log('✓ Admin account found');
            
            // Ensure admin is active
            if (!admin.isActive) {
                console.log('⚠ Admin account was inactive. Activating...');
                admin.isActive = true;
                await admin.save();
                console.log('✓ Admin account activated');
            } else {
                console.log('✓ Admin account is already active');
            }
        }

        console.log('\n=== Admin Account Details ===');
        console.log('Email: admin@teamlead.com');
        console.log('Password: admin123');
        console.log(`Role: ${admin.role}`);
        console.log(`Active: ${admin.isActive}`);
        console.log('=============================\n');

        await mongoose.connection.close();
        console.log('✓ Connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixAdmin();
