const mongoose = require('mongoose');
require('dotenv').config();

const Team = require('./src/models/Team');
const User = require('./src/models/User');

const cleanupDefaultTeams = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Find all teams with "Default team" description
        const defaultTeams = await Team.find({ 
            description: 'Default team' 
        });

        console.log(`Found ${defaultTeams.length} default teams to remove`);

        for (const team of defaultTeams) {
            console.log(`Removing team: ${team.name}`);
            
            // Remove teamId reference from users
            await User.updateMany(
                { teamId: team._id },
                { $unset: { teamId: '' } }
            );
            
            // Delete the team
            await team.deleteOne();
        }

        console.log('✅ Default teams cleaned up successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error cleaning up teams:', error);
        process.exit(1);
    }
};

cleanupDefaultTeams();
