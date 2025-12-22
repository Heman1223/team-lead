const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const testNull = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected');

        try {
            console.log('Testing teamId: null');
            const user = await User.create({
                name: 'Test Null 2',
                email: 'null2@example.com',
                password: 'password123',
                role: 'team_member',
                teamId: null
            });
            console.log('Success: User created with null teamId');
            console.log('User ID:', user._id);
            await User.deleteOne({ _id: user._id });
        } catch(e) {
            console.log('FAILED teamId: null');
            console.log('Error:', e.message);
        }

        await mongoose.connection.close();
    } catch (e) { console.error(e); }
};

testNull();
