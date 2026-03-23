const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function deactivateUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'aditi@gamil.com' });
        if (user) {
            user.isActive = false;
            await user.save();
            console.log('✅ User aditi@gamil.com deactivated successfully!');
            console.log('Current status:', user.isActive);
        } else {
            console.log('❌ User not found');
        }
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

deactivateUser();
