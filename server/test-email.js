require('dotenv').config();
const { sendLeadStatusChangeEmail, sendFollowUpCreatedEmail } = require('./src/services/emailService');

console.log('=== EMAIL NOTIFICATION TEST (SendGrid) ===\n');

// Check if environment variables are set
console.log('Checking environment variables...');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Not set');
console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL ? '✅ Set' : '❌ Not set');
console.log('NOTIFICATION_EMAIL:', process.env.NOTIFICATION_EMAIL ? '✅ Set' : '❌ Not set');
console.log();

if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL || !process.env.NOTIFICATION_EMAIL) {
    console.error('❌ Please configure email settings in .env file first!');
    console.log('\nRequired variables:');
    console.log('  SENDGRID_API_KEY=your-sendgrid-api-key');
    console.log('  SENDGRID_FROM_EMAIL=your-verified-sender@yourdomain.com');
    console.log('  NOTIFICATION_EMAIL=pikabhu31st@gmail.com');
    console.log('\nGet your SendGrid API key from: https://app.sendgrid.com/settings/api_keys');
    process.exit(1);
}

// Test data
const testLead = {
    clientName: 'Test Client',
    email: 'testclient@example.com',
    phone: '+1234567890',
    companyName: 'Test Company Inc.',
    status: 'contacted'
};

const testUser = {
    name: 'Test User',
    email: 'testuser@example.com'
};

const testFollowUp = {
    title: 'Follow-up Call',
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    scheduledTime: '10:00 AM',
    priority: 'high',
    notes: 'Discuss project requirements and timeline',
    assignedTo: {
        name: 'John Doe'
    }
};

// Run tests
async function runTests() {
    console.log('Starting email tests...\n');

    // Test 1: Lead Status Change Email
    console.log('Test 1: Sending Lead Status Change Email...');
    try {
        const result1 = await sendLeadStatusChangeEmail(testLead, 'new', 'contacted', testUser);
        if (result1.success) {
            console.log('✅ Lead status change email sent successfully!');
        } else {
            console.log('❌ Failed to send lead status change email:', result1.error);
        }
    } catch (error) {
        console.error('❌ Error in Test 1:', error.message);
    }

    console.log();

    // Test 2: Follow-up Creation Email
    console.log('Test 2: Sending Follow-up Creation Email...');
    try {
        const result2 = await sendFollowUpCreatedEmail(testFollowUp, testLead, testUser);
        if (result2.success) {
            console.log('✅ Follow-up creation email sent successfully!');
        } else {
            console.log('❌ Failed to send follow-up creation email:', result2.error);
        }
    } catch (error) {
        console.error('❌ Error in Test 2:', error.message);
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log(`\nCheck ${process.env.NOTIFICATION_EMAIL} inbox for test emails.`);
    console.log('If you received both emails, the setup is working correctly! 🎉');
}

runTests().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
