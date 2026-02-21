const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const connectDB = require('../src/config/db');

const addAdmin = async () => {
    try {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Database connected.');

        const email = 'Gurukripaimmigrations@gmail.com';
        const password = 'gurukripa@123';
        const name = 'Gurukripa Admin';

        console.log(`Checking if user ${email} exists...`);
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            console.log('User already exists. Updating password and role to admin...');
            
            user.password = password; // Set plain password, model will hash it
            user.role = 'admin';
            user.isActive = true;
            
            await user.save();
            console.log('Admin user updated successfully.');
        } else {
            console.log('Creating new admin user...');
            
            user = await User.create({
                name,
                email: email.toLowerCase(),
                password: password, // Pass plain password, model will hash it
                role: 'admin',
                isActive: true,
                status: 'offline'
            });
            
            console.log('Admin user created successfully.');
        }

        console.log('\nCredentials:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error adding admin:', error);
        process.exit(1);
    }
};

addAdmin();
