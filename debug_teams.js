const mongoose = require('mongoose');
const User = require('./server/src/models/User');
const Team = require('./server/src/models/Team');

async function debug() {
    try {
        await mongoose.connect('mongodb://localhost:27017/team-lead');
        console.log('Connected to MongoDB');

        const leads = await User.find({ role: 'team_lead' });
        console.log(`Found ${leads.length} Team Leads`);

        for (const lead of leads) {
            console.log(`\nLead: ${lead.name} (${lead._id})`);
            console.log(`Lead's teamId: ${lead.teamId}`);

            const teamsLed = await Team.find({ leadId: lead._id });
            console.log(`Teams where this user is leadId: ${teamsLed.length}`);
            teamsLed.forEach(t => console.log(` - Team: ${t.name} (${t._id})`));

            const teamOfLead = await Team.findById(lead.teamId);
            if (teamOfLead) {
                console.log(`Team the lead belongs to: ${teamOfLead.name} (${teamOfLead._id})`);
                console.log(`That team's leadId: ${teamOfLead.leadId}`);
            } else {
                console.log('Lead belongs to no team (teamId is null or invalid)');
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
