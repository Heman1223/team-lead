const nodemailer = require('nodemailer');
const ics = require('ics');
const dns = require('dns');

// Force IPv4 globally for this service to fix Render ENETUNREACH (IPv6) issues with Hostinger
dns.setDefaultResultOrder('ipv4first');

// Initialize Nodemailer Transporter
// Check whether to use SendGrid or Hostinger/Gmail based on environment variables
let transporterConfig;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // If explicit Email & Password are provided (e.g., Hostinger, Gmail)
    console.log('Using SMTP Configuration from EMAIL_USER');
    transporterConfig = {
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    };
} else {
    // Fallback to SendGrid via its apikey if no explicit email configured
    console.log('Using SendGrid Configuration');
    transporterConfig = {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false, // use TLS
        auth: {
            user: 'apikey', // SendGrid requires the literal string 'apikey'
            pass: process.env.SENDGRID_API_KEY,
        }
    };
}

const transporter = nodemailer.createTransport({
    ...transporterConfig,
    // Render/Infrastructure Fixes
    family: 4,            // Force IPv4 locally
    pool: true,           // Enable connection pooling
    maxConnections: 5,    // Limit the number of connections
    connectionTimeout: 20000, // 20 seconds
    greetingTimeout: 20000,   // 20 seconds
    socketTimeout: 30000,      // 30 seconds
    tls: {
        rejectUnauthorized: false
    }
});

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ SMTP Connection Error:', error);
    } else {
        console.log('✅ SMTP Server is ready to take our messages');
    }
});

// ... existing functions ...

// Send meeting invitation with .ics attachment
const sendMeetingInvitation = async (meeting) => {
    try {
        console.log('📧 Attempting to send meeting invitation for:', meeting._id);

        const lead = meeting.leadId;
        if (!lead) {
            console.warn('⚠️ No lead object found in meeting.');
            return { success: false, error: 'No lead found' };
        }
        if (!lead.email) {
            console.warn('⚠️ No lead email found for lead:', lead._id || lead);
            return { success: false, error: 'No lead email found' };
        }
        console.log('📧 Target Email:', lead.email);

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
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
            organizer: { name: organizer.name, email: organizer.email || process.env.SENDGRID_FROM_EMAIL || 'no-reply@avani.com' },
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
        const textContent = `Hello ${lead.clientName},\n\nYour meeting is scheduled on ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()} with ${organizer.name} on the topic: ${meeting.title}.\n\nRegards,\n${process.env.COMPANY_NAME || 'Avani Enterprises'}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">Meeting Scheduled</h2>
                </div>
                <div style="padding: 30px;">
                    <p>Hello ${lead.clientName},</p>
                    <p>Your meeting is scheduled on this date <strong>${startTime.toLocaleDateString()}</strong> at <strong>${startTime.toLocaleTimeString()}</strong> with <strong>${organizer.name}</strong> on the topic <strong>${meeting.title}</strong>.</p>
                    
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
            from: process.env.EMAIL_USER
                ? `"Avani Enterprises" <${process.env.EMAIL_USER}>`
                : `"Avani Enterprises" <${process.env.SENDGRID_FROM_EMAIL || 'no-reply@avani.com'}>`,
            subject: subject,
            text: textContent,
            html: html,
            attachments: [
                {
                    content: value,
                    filename: 'invite.ics',
                    contentType: 'text/calendar'
                }
            ]
        };

        console.log('📧 Sending email via Nodemailer...');
        const info = await transporter.sendMail(msg);
        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true };
    } catch (error) {
        console.error('❌ Error in sendMeetingInvitation:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    // sendLeadStatusChangeEmail,  // Commented out as they were placeholders
    // sendFollowUpCreatedEmail,
    sendMeetingInvitation
};
