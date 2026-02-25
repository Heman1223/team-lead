const mongoose = require('mongoose');
const Task = require('../src/models/Task');
const Team = require('../src/models/Team');
const User = require('../src/models/User');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI;

async function migrate() {
    try {
        await mongoose.connect(dbUri);
        console.log('Connected to DB');

        const tasks = await Task.find({ teamId: null, isDeleted: { $ne: true } });
        console.log(`Found ${tasks.length} tasks with null teamId`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const task of tasks) {
            // Find team where this user is the lead
            const team = await Team.findOne({ leadId: task.assignedTo });
            
            if (team) {
                task.teamId = team._id;
                await task.save();
                console.log(`Updated task "${task.title}" with team "${team.name}"`);
                updatedCount++;
            } else {
                console.log(`Could not find team for task "${task.title}" (Assigned to: ${task.assignedTo})`);
                skippedCount++;
            }
        }

        console.log(`Migration complete. Updated: ${updatedCount}, Skipped: ${skippedCount}`);

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();
