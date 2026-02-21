const mongoose = require('mongoose');
require('dotenv').config();
const Task = require('./src/models/Task');
const User = require('./src/models/User');
const Team = require('./src/models/Team');

const checkTasks = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teamlead');
        console.log('Connected to MongoDB');

        const tasks = await Task.find({});
        console.log(`Total tasks found: ${tasks.length}`);

        const invalidTasks = [];
        for (const task of tasks) {
            const errors = [];
            if (!task.assignedTo) errors.push('missing assignedTo');
            if (!task.dueDate) errors.push('missing dueDate');
            if (!task.deadline) errors.push('missing deadline');
            if (!task.assignedBy) errors.push('missing assignedBy');

            if (errors.length > 0) {
                invalidTasks.push({ id: task._id, title: task.title, errors });
            }
        }

        if (invalidTasks.length > 0) {
            console.log('Found invalid tasks:');
            console.log(JSON.stringify(invalidTasks, null, 2));
        } else {
            console.log('All tasks have required fields.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkTasks();
