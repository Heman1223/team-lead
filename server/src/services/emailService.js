const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Send lead status change notification
const sendLeadStatusChangeEmail = async (lead, oldStatus, newStatus, updatedBy) => {
    try {
        if (!process.env.SENDGRID_API_KEY) {
            console.warn('⚠️ SendGrid API key not configured. Skipping email.');
            return { success: false, error: 'SendGrid not configured' };
        }

        const subject = `Lead Status Update: ${lead.clientName}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Lead Status Update</h2>
                <p>Dear Team,</p>
                <p>The status of the following lead has been updated:</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1f2937;">Lead Details</h3>
                    <p><strong>Client Name:</strong> ${lead.clientName}</p>
                    <p><strong>Email:</strong> ${lead.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${lead.phone || 'N/A'}</p>
                    <p><strong>Company:</strong> ${lead.companyName || 'N/A'}</p>
                </div>
                
                <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Status Changed:</strong></p>
                    <p style="margin: 5px 0 0 0; font-size: 16px;">
                        <span style="color: #dc2626;">${oldStatus}</span> 
                        → 
                        <span style="color: #16a34a;">${newStatus}</span>
                    </p>
                </div>
                
                <p><strong>Updated By:</strong> ${updatedBy.name} (${updatedBy.email})</p>
                <p><strong>Updated At:</strong> ${new Date().toLocaleString()}</p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 12px;">
                    This is an automated notification from your CRM system.
                </p>
            </div>
        `;

        // Plain text version (helps with spam filters)
        const text = `
Lead Status Update

Dear Team,

The status of the following lead has been updated:

Lead Details:
- Client Name: ${lead.clientName}
- Email: ${lead.email || 'N/A'}
- Phone: ${lead.phone || 'N/A'}
- Company: ${lead.companyName || 'N/A'}

Status Changed: ${oldStatus} → ${newStatus}

Updated By: ${updatedBy.name} (${updatedBy.email})
Updated At: ${new Date().toLocaleString()}

---
This is an automated notification from your CRM system.
        `;

        const msg = {
            to: process.env.NOTIFICATION_EMAIL,
            from: {
                email: process.env.SENDGRID_FROM_EMAIL,
                name: 'CRM System'
            },
            subject: subject,
            text: text,
            html: html,
            trackingSettings: {
                clickTracking: { enable: false },
                openTracking: { enable: false }
            },
            mailSettings: {
                bypassListManagement: { enable: false }
            }
        };

        await sgMail.send(msg);
        console.log(`✅ Lead status change email sent for: ${lead.clientName}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending lead status change email:', error);
        return { success: false, error: error.message };
    }
};

// Send follow-up creation notification
const sendFollowUpCreatedEmail = async (followUp, lead, createdBy) => {
    try {
        if (!process.env.SENDGRID_API_KEY) {
            console.warn('⚠️ SendGrid API key not configured. Skipping email.');
            return { success: false, error: 'SendGrid not configured' };
        }

        const subject = `New Follow-up Scheduled: ${lead.clientName}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">New Follow-up Scheduled</h2>
                <p>Dear Team,</p>
                <p>A new follow-up has been scheduled for the following lead:</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1f2937;">Lead Details</h3>
                    <p><strong>Client Name:</strong> ${lead.clientName}</p>
                    <p><strong>Email:</strong> ${lead.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${lead.phone || 'N/A'}</p>
                    <p><strong>Company:</strong> ${lead.companyName || 'N/A'}</p>
                    <p><strong>Current Status:</strong> <span style="color: #2563eb; font-weight: bold;">${lead.status}</span></p>
                </div>
                
                <div style="background-color: #dbeafe; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1f2937;">Follow-up Details</h3>
                    <p><strong>Title:</strong> ${followUp.title}</p>
                    <p><strong>Scheduled Date:</strong> ${new Date(followUp.scheduledDate).toLocaleDateString()}</p>
                    ${followUp.scheduledTime ? `<p><strong>Scheduled Time:</strong> ${followUp.scheduledTime}</p>` : ''}
                    <p><strong>Priority:</strong> <span style="text-transform: uppercase; color: ${followUp.priority === 'urgent' ? '#dc2626' : followUp.priority === 'high' ? '#f59e0b' : '#16a34a'};">${followUp.priority}</span></p>
                    ${followUp.notes ? `<p><strong>Notes:</strong> ${followUp.notes}</p>` : ''}
                </div>
                
                <p><strong>Assigned To:</strong> ${followUp.assignedTo?.name || 'N/A'}</p>
                <p><strong>Created By:</strong> ${createdBy.name} (${createdBy.email})</p>
                <p><strong>Created At:</strong> ${new Date().toLocaleString()}</p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 12px;">
                    This is an automated notification from your CRM system.
                </p>
            </div>
        `;

        // Plain text version (helps with spam filters)
        const text = `
New Follow-up Scheduled

Dear Team,

A new follow-up has been scheduled for the following lead:

Lead Details:
- Client Name: ${lead.clientName}
- Email: ${lead.email || 'N/A'}
- Phone: ${lead.phone || 'N/A'}
- Company: ${lead.companyName || 'N/A'}
- Current Status: ${lead.status}

Follow-up Details:
- Title: ${followUp.title}
- Scheduled Date: ${new Date(followUp.scheduledDate).toLocaleDateString()}
${followUp.scheduledTime ? `- Scheduled Time: ${followUp.scheduledTime}` : ''}
- Priority: ${followUp.priority.toUpperCase()}
${followUp.notes ? `- Notes: ${followUp.notes}` : ''}

Assigned To: ${followUp.assignedTo?.name || 'N/A'}
Created By: ${createdBy.name} (${createdBy.email})
Created At: ${new Date().toLocaleString()}

---
This is an automated notification from your CRM system.
        `;

        const msg = {
            to: process.env.NOTIFICATION_EMAIL,
            from: {
                email: process.env.SENDGRID_FROM_EMAIL,
                name: 'CRM System'
            },
            subject: subject,
            text: text,
            html: html,
            trackingSettings: {
                clickTracking: { enable: false },
                openTracking: { enable: false }
            },
            mailSettings: {
                bypassListManagement: { enable: false }
            }
        };

        await sgMail.send(msg);
        console.log(`✅ Follow-up creation email sent for: ${lead.clientName}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending follow-up creation email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendLeadStatusChangeEmail,
    sendFollowUpCreatedEmail
};
