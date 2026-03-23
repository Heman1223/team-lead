const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'aditi@gamil.com' });
        if (user) {
            console.log('User found:', user.email);
            console.log('isActive:', user.isActive);
            console.log('role:', user.role);
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser();
