const mongoose = require('mongoose');
const User = require('./src/models/User');
const Team = require('./src/models/Team'); // Required for population
require('dotenv').config();

async function testGetAllUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ deletedAt: null }).populate('teamId').select('-password').lean();
        
        console.log('Testing GET /admin/users data:');
        const aditi = users.find(u => u.email === 'aditi@gamil.com');
        if (aditi) {
            console.log('User found: Aditi Mishra');
            console.log('isActive in API data:', aditi.isActive);
            // console.log('Full user data snippet:', JSON.stringify(aditi, null, 2).substring(0, 500));
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

testGetAllUsers();
