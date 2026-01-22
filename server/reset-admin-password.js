const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ MongoDB Connected');
    } catch (error) {
        console.error('✗ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    status: String,
    isActive: Boolean
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Reset admin password
const resetAdminPassword = async () => {
    try {
        await connectDB();

        // Find admin user
        const admin = await User.findOne({ email: 'admin@teamlead.com' });
        
        if (!admin) {
            console.log('❌ Admin user not found!');
            console.log('Creating new admin user...');
            
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            // Create admin
            await User.create({
                name: 'Admin User',
                email: 'admin@teamlead.com',
                password: hashedPassword,
                role: 'admin',
                status: 'offline',
                isActive: true
            });
            
            console.log('✓ Admin user created!');
        } else {
            console.log('✓ Admin user found!');
            console.log('Resetting password...');
            
            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            // Update password directly (bypass pre-save hook)
            await User.updateOne(
                { email: 'admin@teamlead.com' },
                { $set: { password: hashedPassword, isActive: true } }
            );
            
            console.log('✓ Password reset successfully!');
        }
        
        console.log('------------------------');
        console.log('Email: admin@teamlead.com');
        console.log('Password: admin123');
        console.log('------------------------');
        console.log('You can now login with these credentials!');
        
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
};

resetAdminPassword();
