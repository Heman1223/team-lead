const cron = require('node-cron');
const Meeting = require('../models/Meeting');
const Notification = require('../models/Notification');

const initMeetingScheduler = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();

            // 1. Update Upcoming to Ongoing
            const startingMeetings = await Meeting.updateMany(
                {
                    status: 'upcoming',
                    startTime: { $lte: now },
                    endTime: { $gt: now }
                },
                { status: 'ongoing' }
            );

            if (startingMeetings.modifiedCount > 0) {
                console.log(`[Scheduler] Updated ${startingMeetings.modifiedCount} meetings to Ongoing`);
            }

            // 2. Update Ongoing to Missed (if not marked completed/cancelled)
            // Note: In real scenarios, we might wait 15-30 mins after endTime
            const missedMeetings = await Meeting.updateMany(
                {
                    status: 'ongoing',
                    endTime: { $lte: now }
                },
                { status: 'missed' }
            );

            if (missedMeetings.modifiedCount > 0) {
                console.log(`[Scheduler] Updated ${missedMeetings.modifiedCount} meetings to Missed`);
            }

            // 3. Status update for upcoming meetings that ended before they could even be ongoing 
            // (e.g. system was down or meeting was very short)
            const autoMissedMeetings = await Meeting.updateMany(
                {
                    status: 'upcoming',
                    endTime: { $lte: now }
                },
                { status: 'missed' }
            );

            if (autoMissedMeetings.modifiedCount > 0) {
                console.log(`[Scheduler] Updated ${autoMissedMeetings.modifiedCount} overdue upcoming meetings to Missed`);
            }

            // 4. Meeting Reminders
            // Find meetings starting in exactly X minutes based on reminderTime
            // This is a bit simplified, ideally would track sentReminders
            // For now, let's just handle a 10-minute generic warning for demo
            const reminderBatch = await Meeting.find({
                status: 'upcoming',
                startTime: {
                    $gte: new Date(now.getTime() + 9 * 60000),
                    $lte: new Date(now.getTime() + 11 * 60000)
                }
            });

            for (const meeting of reminderBatch) {
                // Create Dashboard Notification for each participant and organizer
                const userIds = [meeting.organizerId, ...meeting.participants];
                
                for (const userId of userIds) {
                    await Notification.create({
                        recipient: userId,
                        title: 'Meeting Reminder',
                        message: `Meeting "${meeting.title}" starts in 10 minutes.`,
                        type: 'meeting_reminder',
                        link: `/calendar?meetingId=${meeting._id}`
                    });
                }
            }

        } catch (error) {
            console.error('[Scheduler] Error in meeting scheduler:', error);
        }
    });

    console.log('✓ Meeting status scheduler initialized');
};

module.exports = initMeetingScheduler;
