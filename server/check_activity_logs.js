const mongoose = require('mongoose');
const ActivityLog = require('./src/models/ActivityLog');
require('dotenv').config();

async function checkLogs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const logs = await ActivityLog.find({ 
            details: { $regex: 'changed user status', $options: 'i' }
        }).sort({ createdAt: -1 }).limit(10);
        
        console.log('Found', logs.length, 'status change logs:');
        logs.forEach(log => {
            console.log(`[${log.createdAt.toISOString()}] ${log.details}`);
        });
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkLogs();
