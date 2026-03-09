const ics = require('ics');
const sgMail = require('@sendgrid/mail');

// Use SendGrid Web API instead of SMTP (Render blocks port 587)
console.log('🔧 Initializing SendGrid Web API Configuration...');

if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY is not set in environment variables!');
    console.error('❌ Email functionality will not work!');
}

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@avanienterprises.com';

// Initialize SendGrid API
sgMail.setApiKey(SENDGRID_API_KEY);

console.log('✅ SendGrid Web API is configured and ready');

// Helper function to send email via SendGrid Web API
const sendViaAPI = async (mailData) => {
    try {
        console.log('📧 Sending via SendGrid HTTP API (Port 443)...');
        
        const response = await sgMail.send(mailData);
        
        console.log('✅ SendGrid API Response Status:', response[0].statusCode);
        return { success: true, messageId: response[0].headers['x-message-id'], response: response[0] };
    } catch (error) {
        console.error('❌ SendGrid API Error:', error.message);
        if (error.response?.body) {
            console.error('❌ SendGrid Error Details:', error.response.body);
        }
        throw error;
    }
};

// ... existing functions ...

// Send meeting invitation with .ics attachment
const sendMeetingInvitation = async (meeting) => {
    console.log('\n\n🔴🔴🔴 SEND MEETING INVITATION FUNCTION CALLED 🔴🔴🔴');
    console.log('Meeting to send invite for:', meeting.title, '| ID:', meeting._id);
    try {
        console.log('\n========== 📧 EMAIL SENDING PROCESS STARTED ==========');
        console.log('📧 Meeting ID:', meeting._id);
        console.log('📧 Meeting Title:', meeting.title);

        const lead = meeting.leadId;
        console.log('📧 Lead email:', lead?.email);
        console.log('📧 Lead clientName:', lead?.clientName);
        
        if (!lead || !lead.email) {
            console.warn('⚠️ No lead or lead email found.');
            return { success: false, error: 'No lead email found' };
        }
        
        console.log('✅ Lead validation passed. Email:', lead.email);

        const organizer = meeting.organizerId;
        console.log('📧 Organizer name:', organizer?.name);
        console.log('📧 Organizer email:', organizer?.email);
        
        const startTime = new Date(meeting.startTime);
        const endTime = new Date(meeting.endTime);
        console.log('📧 Start time:', startTime);
        console.log('📧 End time:', endTime);

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
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
            organizer: { name: organizer?.name || 'Team', email: organizer?.email || SENDGRID_FROM_EMAIL },
            attendees: [
                { name: lead.clientName, email: lead.email, rsvp: true, partstat: 'NEEDS-ACTION', role: 'REQ-PARTICIPANT' }
            ]
        };

        if (meeting.meetingLink && meeting.meetingLink.trim() !== '') {
            event.url = meeting.meetingLink;
        }

        const locationStr = meeting.location || (meeting.type === 'online' ? meeting.meetingLink : 'Offline');
        if (locationStr && locationStr.trim() !== '') {
            event.location = locationStr;
        }

        const { error, value } = ics.createEvent(event);
        if (error) {
            console.error('❌ ICS creation error:', error);
            throw error;
        }

        const subject = `Meeting Scheduled – ${process.env.COMPANY_NAME || 'Avani Enterprises'}`;
        const textContent = `Hello ${lead.clientName},\n\nYour meeting is scheduled on ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()} with ${organizer?.name || 'Your Team'} on the topic: ${meeting.title}.\n\nRegards,\n${process.env.COMPANY_NAME || 'Avani Enterprises'}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">Meeting Scheduled</h2>
                </div>
                <div style="padding: 30px;">
                    <p>Hello ${lead.clientName},</p>
                    <p>Your meeting is scheduled on this date <strong>${startTime.toLocaleDateString()}</strong> at <strong>${startTime.toLocaleTimeString()}</strong> with <strong>${organizer?.name || 'Your Team'}</strong> on the topic <strong>${meeting.title}</strong>.</p>
                    
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

        // Convert ICS to Base64 for SendGrid API
        const icsBase64 = Buffer.from(value).toString('base64');

        // SendGrid API format for mail sending (@sendgrid/mail SDK)
        const mailData = {
            to: lead.email,
            from: {
                email: SENDGRID_FROM_EMAIL,
                name: process.env.COMPANY_NAME || 'Avani Enterprises'
            },
            subject: subject,
            text: textContent,
            html: html,
            attachments: [
                {
                    content: icsBase64,
                    filename: 'invite.ics',
                    type: 'text/calendar'
                }
            ]
        };

        console.log('📧 Message object created:');
        console.log('  - To:', lead.email);
        console.log('  - From:', SENDGRID_FROM_EMAIL);
        console.log('  - Subject:', subject);
        console.log('  - Has HTML:', !!mailData.content);
        console.log('  - Has attachment:', mailData.attachments?.length > 0);

        console.log('📧 Sending email via SendGrid Web API to:', lead.email);
        
        const result = await sendViaAPI(mailData);
        console.log('✅ Email sent successfully!');
        console.log('✅ Message ID:', result.messageId);
        console.log('✅ Response Status:', result.response.status);
        console.log('========== 📧 EMAIL SENDING PROCESS COMPLETED ==========\n');
        return { success: true, messageId: result.messageId, response: result.response };
        
    } catch (error) {
        console.error('\n❌ ERROR in sendMeetingInvitation:');
        console.error('❌ Error message:', error.message);
        console.error('❌ Error code:', error.code);
        if (error.response?.data) {
            console.error('❌ SendGrid API Error:', error.response.data);
        }
        console.error('❌ Full error:', error);
        console.error('========== 📧 EMAIL SENDING PROCESS FAILED ==========\n');
        return { success: false, error: error.message, fullError: error };
    }
};

module.exports = {
    // sendLeadStatusChangeEmail,  // Commented out as they were placeholders
    // sendFollowUpCreatedEmail,
    sendMeetingInvitation
};
