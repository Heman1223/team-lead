const sgMail = require('@sendgrid/mail');
const ics = require('ics');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// ... existing functions ...

// Send meeting invitation with .ics attachment
const sendMeetingInvitation = async (meeting) => {
    try {
        if (!process.env.SENDGRID_API_KEY) {
            console.warn('⚠️ SendGrid API key not configured. Skipping email.');
            return { success: false, error: 'SendGrid not configured' };
        }

        const lead = meeting.leadId;
        if (!lead || !lead.email) {
            return { success: false, error: 'No lead email found' };
        }

        const organizer = meeting.organizerId;
        const startTime = new Date(meeting.startTime);
        const endTime = new Date(meeting.endTime);

        // Create .ics file
        const event = {
            start: [
                startTime.getFullYear(),
                startTime.getMonth() + 1,
                startTime.getDate(),
                startTime.getHours(),
                startTime.getMinutes()
            ],
            duration: { 
                hours: Math.floor((endTime - startTime) / (1000 * 60 * 60)), 
                minutes: Math.floor(((endTime - startTime) / (1000 * 60)) % 60) 
            },
            title: meeting.title,
            description: meeting.description || meeting.agenda || 'Meeting scheduled via CRM',
            location: meeting.location || (meeting.type === 'online' ? meeting.meetingLink : 'Offline'),
            url: meeting.meetingLink,
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
            organizer: { name: organizer.name, email: organizer.email || process.env.SENDGRID_FROM_EMAIL },
            attendees: [
                { name: lead.clientName, email: lead.email, rsvp: true, partstat: 'NEEDS-ACTION', role: 'REQ-PARTICIPANT' }
            ]
        };

        const { error, value } = ics.createEvent(event);
        if (error) {
            console.error('ICS creation error:', error);
            throw error;
        }

        const subject = `Meeting Scheduled – ${process.env.COMPANY_NAME || 'Avani Enterprises'}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">Meeting Invitation</h2>
                </div>
                <div style="padding: 30px;">
                    <p>Hello ${lead.clientName},</p>
                    <p>A meeting has been scheduled with our team.</p>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Topic:</strong> ${meeting.title}</p>
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${startTime.toLocaleDateString()}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}</p>
                        ${meeting.type === 'online' ? `<p style="margin: 5px 0;"><strong>Meeting Link:</strong> <a href="${meeting.meetingLink}" style="color: #2563eb;">Join Meeting</a></p>` : `<p style="margin: 5px 0;"><strong>Location:</strong> ${meeting.location}</p>`}
                    </div>
                    
                    <p>Please join at the scheduled time. You can also find an invitation file attached to add this to your calendar.</p>
                    
                    <p style="margin-top: 30px;">Regards,<br><strong>${process.env.COMPANY_NAME || 'Avani Enterprises'}</strong></p>
                </div>
                <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
                    This is an automated message from ${process.env.COMPANY_NAME || 'Avani Enterprises'} CRM.
                </div>
            </div>
        `;

        const msg = {
            to: lead.email,
            from: {
                email: process.env.SENDGRID_FROM_EMAIL,
                name: process.env.COMPANY_NAME || 'Avani Enterprises'
            },
            subject: subject,
            html: html,
            attachments: [
                {
                    content: Buffer.from(value).toString('base64'),
                    filename: 'invite.ics',
                    type: 'text/calendar',
                    disposition: 'attachment',
                    contentId: 'invite'
                }
            ]
        };

        await sgMail.send(msg);
        console.log(`✅ Meeting invitation sent to: ${lead.email}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending meeting invitation:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    // sendLeadStatusChangeEmail,  // Commented out as they were placeholders
    // sendFollowUpCreatedEmail,
    sendMeetingInvitation
};
