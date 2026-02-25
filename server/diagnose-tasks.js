const mongoose = require('mongoose');
const Task = require('./src/models/Task');
const Team = require('./src/models/Team');
const User = require('./src/models/User');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI;

async function diagnose() {
    try {
        await mongoose.connect(dbUri);
        console.log('Connected to DB');

        const tasks = await Task.find({ isDeleted: { $ne: true } }).populate('assignedTo', 'name role').populate('teamId', 'name');
        console.log(`Total active tasks: ${tasks.length}`);

        tasks.forEach(task => {
            console.log(`Task: ${task.title}`);
            console.log(`  Assigned To: ${task.assignedTo?.name} (${task.assignedTo?.role})`);
            console.log(`  Team: ${task.teamId?.name || 'NULL'}`);
            console.log(`  TeamId (raw): ${task.teamId}`);
            console.log('---');
        });

        const teams = await Team.find().populate('leadId', 'name');
        console.log(`Total teams: ${teams.length}`);
        teams.forEach(team => {
            console.log(`Team: ${team.name}`);
            console.log(`  Lead: ${team.leadId?.name} (${team.leadId?._id})`);
            console.log('---');
        });

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

diagnose();
