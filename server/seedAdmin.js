const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teamlead');
        console.log('✓ MongoDB Connected');
    } catch (error) {
        console.error('✗ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

// User Schema (inline for seeding)
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'team_lead', 'team_member'], default: 'team_member' },
    status: { type: String, default: 'offline' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Seed admin user
const seedAdmin = async () => {
    try {
        await connectDB();

        // Check if admin exists
        const adminExists = await User.findOne({ email: 'admin@teamlead.com' });
        if (adminExists) {
            console.log('⚠ Admin user already exists!');
            console.log('Email: admin@teamlead.com');
            console.log('You can use this account to login.');
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Create admin user
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@teamlead.com',
            password: hashedPassword,
            role: 'admin',
            status: 'offline',
            isActive: true
        });

        console.log('✓ Admin user created successfully!');
        console.log('------------------------');
        console.log('Email: admin@teamlead.com');
        console.log('Password: admin123');
        console.log('------------------------');
        console.log('Please change the password after first login!');
        
        process.exit(0);
    } catch (error) {
        console.error('✗ Error seeding admin:', error.message);
        process.exit(1);
    }
};

seedAdmin();