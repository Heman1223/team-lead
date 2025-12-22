const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const testCreate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected');

        try {
            console.log('Attempting create with teamId: null');
            const user1 = await User.create({
                name: 'Test Null',
                email: 'null@example.com',
                password: 'password123',
                role: 'team_member',
                teamId: null
            });
            console.log('Success null');
            await User.deleteOne({ _id: user1._id });
        } catch(e) { console.error('Error null:', e.message); }

        try {
            console.log('Attempting create with teamId: "" (empty string)');
            const user2 = await User.create({
                name: 'Test Empty',
                email: 'empty@example.com',
                password: 'password123',
                role: 'team_member',
                teamId: ''
            });
            console.log('Success empty');
            await User.deleteOne({ _id: user2._id });
        } catch(e) { console.error('Error empty:', e.message); }

        await mongoose.connection.close();
    } catch (e) { console.error(e); }
};

testCreate();
