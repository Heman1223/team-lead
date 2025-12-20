require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // Find admin user
        const admin = await User.findOne({ email: 'admin@teamlead.com' });
        
        if (admin) {
            console.log('\n✓ Admin account found:');
            console.log(`  - Name: ${admin.name}`);
            console.log(`  - Email: ${admin.email}`);
            console.log(`  - Role: ${admin.role}`);
            console.log(`  - Active: ${admin.isActive}`);
            console.log(`  - Password Hash: ${admin.password.substring(0, 20)}...`);
        } else {
            console.log('\n✗ Admin account NOT found!');
            console.log('Creating admin account...');
            
            const newAdmin = await User.create({
                name: 'Admin',
                email: 'admin@teamlead.com',
                password: 'admin123',
                role: 'admin',
                isActive: true
            });
            
            console.log('✓ Admin account created successfully!');
            console.log(`  - Name: ${newAdmin.name}`);
            console.log(`  - Email: ${newAdmin.email}`);
            console.log(`  - Role: ${newAdmin.role}`);
        }

        // Also check for admin@example.com
        const admin2 = await User.findOne({ email: 'admin@example.com' });
        if (admin2) {
            console.log('\n✓ Alternative admin account found:');
            console.log(`  - Name: ${admin2.name}`);
            console.log(`  - Email: ${admin2.email}`);
            console.log(`  - Role: ${admin2.role}`);
        }

        await mongoose.connection.close();
        console.log('\n✓ Connection closed');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkAdmin();
