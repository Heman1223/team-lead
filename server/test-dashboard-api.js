require('dotenv').config();
const mongoose = require('mongoose');
const Team = require('./src/models/Team');
const User = require('./src/models/User');
const Task = require('./src/models/Task');

const testDashboardStats = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // Simulate the getDashboardStats function
        const totalTeams = await Team.countDocuments({ 
            $or: [
                { isActive: true },
                { isActive: { $exists: false } }
            ]
        });
        const totalUsers = await User.countDocuments({ isActive: true });
        const totalTeamLeads = await User.countDocuments({ role: 'team_lead', isActive: true });
        const totalMembers = await User.countDocuments({ role: 'team_member', isActive: true });

        const allTasks = await Task.find({ isParentTask: true });
        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(t => t.status === 'completed').length;
        const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
        const overdueTasks = allTasks.filter(t => t.status === 'overdue').length;
        const pendingTasks = allTasks.filter(t => t.status === 'pending' || t.status === 'assigned').length;

        const overallProgress = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

        console.log('\n=== DASHBOARD STATS ===');
        console.log(`Total Teams: ${totalTeams}`);
        console.log(`Total Users: ${totalUsers}`);
        console.log(`Total Team Leads: ${totalTeamLeads}`);
        console.log(`Total Members: ${totalMembers}`);
        console.log(`Total Tasks: ${totalTasks}`);
        console.log(`Completed Tasks: ${completedTasks}`);
        console.log(`In Progress Tasks: ${inProgressTasks}`);
        console.log(`Overdue Tasks: ${overdueTasks}`);
        console.log(`Pending Tasks: ${pendingTasks}`);
        console.log(`Overall Progress: ${overallProgress}%`);

        await mongoose.connection.close();
        console.log('\n✓ Connection closed');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

testDashboardStats();
