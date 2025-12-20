require('dotenv').config();
const mongoose = require('mongoose');
const Team = require('./src/models/Team');
const User = require('./src/models/User');

const checkTeams = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // Count all teams
        const allTeams = await Team.find();
        console.log('\n=== ALL TEAMS ===');
        console.log(`Total teams in database: ${allTeams.length}`);
        
        allTeams.forEach((team, index) => {
            console.log(`\n${index + 1}. ${team.name}`);
            console.log(`   - ID: ${team._id}`);
            console.log(`   - isActive: ${team.isActive}`);
            console.log(`   - status: ${team.status}`);
            console.log(`   - Members: ${team.members.length}`);
            console.log(`   - Lead ID: ${team.leadId}`);
        });

        // Count with isActive filter
        const activeTeams = await Team.countDocuments({ isActive: true });
        console.log(`\n✓ Teams with isActive=true: ${activeTeams}`);

        // Count with the new query
        const teamsWithNewQuery = await Team.countDocuments({ 
            $or: [
                { isActive: true },
                { isActive: { $exists: false } }
            ]
        });
        console.log(`✓ Teams with new query: ${teamsWithNewQuery}`);

        // Count users
        const teamLeads = await User.countDocuments({ role: 'team_lead', isActive: true });
        const teamMembers = await User.countDocuments({ role: 'team_member', isActive: true });
        console.log(`\n✓ Team Leads: ${teamLeads}`);
        console.log(`✓ Team Members: ${teamMembers}`);

        await mongoose.connection.close();
        console.log('\n✓ Connection closed');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkTeams();
