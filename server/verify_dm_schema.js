const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./src/models/User');
const Notification = require('./src/models/Notification');
const ActivityLog = require('./src/models/ActivityLog');

async function test() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const admin = await User.findOne({ role: 'admin' });
        const targetUser = await User.findOne({ role: 'team_member' });

        if (!admin || !targetUser) {
            console.log('Missing admin or team_member in DB.');
            process.exit(0);
        }

        console.log(`Testing message from ${admin.email} to ${targetUser.email}`);

        // 1. Create Notification (Should work)
        const notification = await Notification.create({
            type: 'manual_reminder',
            title: 'Test DM',
            message: 'Hello! This is a test message.',
            userId: targetUser._id,
            senderId: admin._id,
            priority: 'medium',
            relatedToModel: 'User',
            relatedTo: targetUser._id
        });
        console.log('✅ Notification created:', notification._id);

        // 2. Create Activity Log (The part that was failing)
        const activity = await ActivityLog.create({
            action: 'notification_sent',
            userId: admin._id,
            targetUserId: targetUser._id,
            details: `Sent admin message to ${targetUser.name}: Test DM`
        });
        console.log('✅ Activity logged:', activity._id);

        console.log('FIX VERIFIED SUCCESSFULLY');
        
        // Cleanup if desired, or keep for proof
        // await Notification.findByIdAndDelete(notification._id);
        // await ActivityLog.findByIdAndDelete(activity._id);

        process.exit(0);
    } catch (err) {
        console.error('❌ VERIFICATION FAILED:', err.message);
        process.exit(1);
    }
}

test();
