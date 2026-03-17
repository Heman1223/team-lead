const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const checkDates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const Task = mongoose.model('Task', new mongoose.Schema({ createdAt: Date, title: String }));
        const Lead = mongoose.model('Lead', new mongoose.Schema({ createdAt: Date, firstName: String, clientName: String }));

        const latestTask = await Task.findOne().sort({ createdAt: -1 });
        const oldestTask = await Task.findOne().sort({ createdAt: 1 });
        const latestLead = await Lead.findOne().sort({ createdAt: -1 });
        const oldestLead = await Lead.findOne().sort({ createdAt: 1 });

        console.log('--- Tasks ---');
        console.log('Latest Task:', latestTask?.createdAt, latestTask?.title);
        console.log('Oldest Task:', oldestTask?.createdAt, oldestTask?.title);

        console.log('--- Leads ---');
        console.log('Latest Lead:', latestLead?.createdAt, latestLead?.clientName);
        console.log('Oldest Lead:', oldestLead?.createdAt, oldestLead?.clientName);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDates();
