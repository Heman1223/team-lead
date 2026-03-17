const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const Task = mongoose.model('Task', new mongoose.Schema({ status: String, assignedTo: mongoose.Schema.Types.ObjectId, teamId: mongoose.Schema.Types.ObjectId, createdAt: Date }));
        const User = mongoose.model('User', new mongoose.Schema({ name: String, role: String }));

        console.log('\n--- Checking getSummary simulation (Week) ---');
        const dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 7);
        const results = await Task.countDocuments({ createdAt: { $gte: dateFilter } });
        console.log('Tasks in last week:', results);

        console.log('\n--- Checking Team Performance simulation ---');
        const performance = await Task.aggregate([
            { $group: { _id: '$assignedTo', totalTasks: { $sum: 1 } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'member' } },
            { $unwind: '$member' }
        ]);
        console.log('Example Performance Member:', performance[0]?.member?.name, 'Tasks:', performance[0]?.totalTasks);
        console.log('Structure check (member.member.name):', !!performance[0]?.member?.name);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
