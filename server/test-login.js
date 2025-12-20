require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const testLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        const email = 'admin@teamlead.com';
        const password = 'admin123';

        // Find user
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            console.log('✗ User not found');
            await mongoose.connection.close();
            return;
        }

        console.log('\n✓ User found:');
        console.log(`  - Name: ${user.name}`);
        console.log(`  - Email: ${user.email}`);
        console.log(`  - Role: ${user.role}`);
        console.log(`  - Active: ${user.isActive}`);

        // Test password
        console.log('\nTesting password...');
        const isMatch = await user.matchPassword(password);
        
        if (isMatch) {
            console.log('✓ Password matches! Login should work.');
        } else {
            console.log('✗ Password does NOT match!');
            console.log('\nResetting password to "admin123"...');
            
            user.password = password;
            await user.save();
            
            console.log('✓ Password reset successfully!');
            
            // Test again
            const userAfterReset = await User.findOne({ email }).select('+password');
            const isMatchAfterReset = await userAfterReset.matchPassword(password);
            console.log(`✓ Password verification after reset: ${isMatchAfterReset ? 'SUCCESS' : 'FAILED'}`);
        }

        await mongoose.connection.close();
        console.log('\n✓ Connection closed');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

testLogin();
