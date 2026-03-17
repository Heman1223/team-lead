const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./src/models/User');
const Team = require('./src/models/Team');
const Task = require('./src/models/Task');

const diagnostic = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log('\n--- USERS ---');
        users.forEach(u => {
            console.log(`- ID: ${u._id} | Name: ${u.name} | Role: ${u.role} | TeamID: ${u.teamId}`);
        });

        const teams = await Team.find({});
        console.log('\n--- TEAMS ---');
        teams.forEach(t => {
            console.log(`- ID: ${t._id} | Name: ${t.name} | Lead: ${t.leadId} | Members: ${t.members.join(', ')} | Status: ${t.status}`);
        });

        const tasksCount = await Task.countDocuments({});
        console.log(`\nTOTAL TASKS IN DB: ${tasksCount}`);
        
        const tasksWithTeamValues = await Task.aggregate([
            { $group: { _id: '$teamId', count: { $sum: 1 } } }
        ]);
        console.log('\n--- TASKS BY teamId ---');
        tasksWithTeamValues.forEach(t => {
            console.log(`- TeamID: ${t._id} | Count: ${t.count}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

diagnostic();
