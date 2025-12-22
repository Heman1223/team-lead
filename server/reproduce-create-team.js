const mongoose = require('mongoose');
const User = require('./src/models/User');
const Team = require('./src/models/Team');
const ActivityLog = require('./src/models/ActivityLog');
require('dotenv').config();

const reproduce = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // 1. Create a dummy Team Lead
        const lead = await User.create({
            name: 'Temp Lead',
            email: 'templead-' + Date.now() + '@example.com',
            password: 'password123',
            role: 'team_lead',
            isActive: true
        });
        console.log('Created Temp Lead:', lead._id);

        // 2. Simulate createTeam controller logic
        console.log('--- Simulating createTeam ---');
        
        const teamData = {
            name: 'Test Team ' + Date.now(),
            leadId: lead._id,
            description: 'Test Desc',
            status: 'active'
        };

        // Controller Logic Start
        const teamLead = await User.findById(teamData.leadId);
        if (!teamLead) throw new Error('Lead not found');

        console.log('Lead found. Creating Team...');
        const team = await Team.create({
            name: teamData.name,
            leadId: teamData.leadId,
            description: teamData.description,
            status: teamData.status,
            // defaults...
            createdBy: lead._id // mimicing req.user._id
        });
        console.log('Team created:', team._id);

        console.log('Updating Lead teamId...');
        teamLead.teamId = team._id;
        await teamLead.save(); // <--- SUSPECT POINT
        console.log('Lead updated.');

        // Activity Log
        console.log('Creating Activity Log...');
        await ActivityLog.create({
            action: 'team_created',
            userId: lead._id,
            teamId: team._id,
            details: 'Test details'
        });
        console.log('Activity Log created.');
        
        console.log('SUCCESS: Team creation simulation completed.');

        // Cleanup
        await Team.deleteOne({ _id: team._id });
        await User.deleteOne({ _id: lead._id });
        await ActivityLog.deleteOne({ teamId: team._id });

        await mongoose.connection.close();
    } catch (e) {
        console.error('FAILED:', e.message);
        console.error('Stack:', e.stack);
        process.exit(1);
    }
};

reproduce();
