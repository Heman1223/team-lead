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

        const subject = `Meeting Confirmation: ${meeting.title}`;
        const textContent = `Hello ${lead.clientName},\n\nYour meeting is scheduled on ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()} with ${organizer?.name || 'Your Team'} on the topic: ${meeting.title}.\n\nRegards,\n${process.env.COMPANY_NAME || 'Avani Enterprises'}`;

        const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; font-size: 24px;">Meeting Scheduled</h2>
                </div>
                <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hello ${lead.clientName},</p>
                    
                    <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">Your meeting has been scheduled with us. Here are the details:</p>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: 600; color: #1f2937;">Topic:</td>
                                <td style="padding: 8px 0; text-align: right;">${meeting.title}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: 600; color: #1f2937;">Date:</td>
                                <td style="padding: 8px 0; text-align: right;">${startTime.toLocaleDateString()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: 600; color: #1f2937;">Time:</td>
                                <td style="padding: 8px 0; text-align: right;">${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: 600; color: #1f2937;">With:</td>
                                <td style="padding: 8px 0; text-align: right;">${organizer?.name || 'Your Team'}</td>
                            </tr>
                            ${meeting.type === 'online' ? `<tr>
                                <td style="padding: 8px 0; font-weight: 600; color: #1f2937;">Location:</td>
                                <td style="padding: 8px 0; text-align: right;"><a href="${meeting.meetingLink}" style="color: #2563eb; text-decoration: none; font-weight: 600;">Join Video Call</a></td>
                            </tr>` : `<tr>
                                <td style="padding: 8px 0; font-weight: 600; color: #1f2937;">Location:</td>
                                <td style="padding: 8px 0; text-align: right;">${meeting.location || 'In-Person'}</td>
                            </tr>`}
                        </table>
                    </div>
                    
                    <p style="font-size: 14px; line-height: 1.6; margin: 20px 0; color: #555;">Please find the meeting invitation attached (invite.ics file) which you can add to your calendar application.</p>
                    
                    <p style="font-size: 13px; line-height: 1.6; margin: 20px 0 0 0; color: #666;">Best regards,<br><strong>${process.env.COMPANY_NAME || 'Avani Enterprises'}</strong></p>
                </div>
                <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0;">This is an automated message from ${process.env.COMPANY_NAME || 'Avani Enterprises'} CRM.</p>
                    <p style="margin: 5px 0 0 0; font-size: 11px;">If you did not schedule this meeting, please ignore this email.</p>
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
            replyTo: {
                email: organizer?.email || SENDGRID_FROM_EMAIL,
                name: organizer?.name || 'Avani Enterprises'
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
            ],
            headers: {
                'X-Priority': '3',
                'X-Mailer': 'Avani Enterprises CRM',
                'Importance': 'normal',
                'List-Unsubscribe': '<mailto:noreply@avanienterprises.com?subject=unsubscribe>',
                'X-MSMail-Priority': 'Normal',
                'Precedence': 'bulk'
            }
        };

        console.log('📧 Message object created:');
        console.log('  - To:', lead.email);
        console.log('  - From:', SENDGRID_FROM_EMAIL);
        console.log('  - Subject:', subject);
        console.log('  - Has HTML:', !!mailData.html);
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
