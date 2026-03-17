const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const diagnostic = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const Team = mongoose.model('Team', new mongoose.Schema({
            name: String,
            members: [mongoose.Schema.Types.ObjectId],
            leadId: mongoose.Schema.Types.ObjectId
        }));

        const teams = await Team.find({});
        console.log(`Total Teams: ${teams.length}`);

        let totalAssignments = 0;
        let uniqueMembers = new Set();

        teams.forEach(t => {
            console.log(`Team: ${t.name}, Members count: ${t.members.length}, Lead: ${t.leadId}`);
            totalAssignments += t.members.length;
            t.members.forEach(m => uniqueMembers.add(m.toString()));
            if (t.leadId) uniqueMembers.add(t.leadId.toString());
        });

        console.log(`Sum of members.length across all teams: ${totalAssignments}`);
        console.log(`Unique members (including leads): ${uniqueMembers.size}`);

        const User = mongoose.model('User', new mongoose.Schema({ role: String }));
        const allUsers = await User.countDocuments({});
        console.log(`Total Users in database: ${allUsers}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

diagnostic();
