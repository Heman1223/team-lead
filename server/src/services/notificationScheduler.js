const cron = require('node-cron');
const FollowUp = require('../models/FollowUp');
const Notification = require('../models/Notification');

const initScheduler = () => {
    console.log('Initializing notification scheduler...');
    
    // Run every 15 minutes to be more responsive
    cron.schedule('*/15 * * * *', async () => {
        console.log(`[${new Date().toISOString()}] Running notification checks...`);
        await checkUpcomingFollowUps();
        await checkOverdueFollowUps();
    });
};

const checkUpcomingFollowUps = async () => {
    try {
        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const upcomingFollowUps = await FollowUp.find({
            status: 'pending',
            reminderSent: false,
            scheduledDate: {
                $gte: now,
                $lte: next24Hours
            }
        }).populate('leadId');

        if (upcomingFollowUps.length > 0) {
            console.log(`Found ${upcomingFollowUps.length} upcoming follow-ups`);
            
            for (const followUp of upcomingFollowUps) {
                // Skip if lead is not active or deleted
                if (!followUp.leadId) continue;

                await Notification.create({
                    type: 'follow_up_upcoming',
                    title: 'Upcoming Follow-Up',
                    message: `Reminder: "${followUp.title}" for ${followUp.leadId.clientName} is coming up at ${new Date(followUp.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
                    userId: followUp.assignedTo,
                    leadId: followUp.leadId._id,
                    relatedTo: followUp._id,
                    relatedToModel: 'FollowUp',
                    priority: followUp.priority === 'urgent' ? 'high' : 'medium'
                });

                followUp.reminderSent = true;
                followUp.reminderSentAt = new Date();
                await followUp.save();
            }
        }
    } catch (error) {
        console.error('Error checking upcoming follow-ups:', error);
    }
};

const checkOverdueFollowUps = async () => {
    try {
        const now = new Date();

        const overdueFollowUps = await FollowUp.find({
            status: 'pending',
            overdueNotificationSent: false,
            scheduledDate: { $lt: now }
        }).populate('leadId');

        if (overdueFollowUps.length > 0) {
            console.log(`Found ${overdueFollowUps.length} overdue follow-ups`);

            for (const followUp of overdueFollowUps) {
                // Skip if lead is not active or deleted
                if (!followUp.leadId) continue;

                await Notification.create({
                    type: 'follow_up_overdue',
                    title: 'Overdue Follow-Up',
                    message: `Overdue: "${followUp.title}" for ${followUp.leadId.clientName} was due at ${new Date(followUp.scheduledDate).toLocaleString()}`,
                    userId: followUp.assignedTo,
                    leadId: followUp.leadId._id,
                    relatedTo: followUp._id,
                    relatedToModel: 'FollowUp',
                    priority: 'high'
                });

                followUp.overdueNotificationSent = true;
                await followUp.save();
            }
        }
    } catch (error) {
        console.error('Error checking overdue follow-ups:', error);
    }
};

module.exports = initScheduler;
