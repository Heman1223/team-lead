require('dotenv').config();

console.log('=== SENDGRID CONFIGURATION CHECK ===\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log('   SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? `✅ Set (${process.env.SENDGRID_API_KEY.substring(0, 10)}...)` : '❌ Not set');
console.log('   SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || '❌ Not set');
console.log('   NOTIFICATION_EMAIL:', process.env.NOTIFICATION_EMAIL || '❌ Not set');
console.log();

// Check if SendGrid package is installed
try {
    const sgMail = require('@sendgrid/mail');
    console.log('2. SendGrid Package: ✅ Installed');
    console.log();
} catch (error) {
    console.log('2. SendGrid Package: ❌ Not installed');
    console.log('   Run: npm install @sendgrid/mail');
    console.log();
    process.exit(1);
}

// Test SendGrid API key validity
async function testSendGridAPI() {
    const sgMail = require('@sendgrid/mail');
    
    if (!process.env.SENDGRID_API_KEY) {
        console.log('3. SendGrid API Test: ❌ API key not configured');
        return;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    console.log('3. Testing SendGrid API...');
    
    try {
        const msg = {
            to: process.env.NOTIFICATION_EMAIL,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: 'SendGrid Test - CRM System',
            text: 'This is a test email from your CRM system.',
            html: '<strong>This is a test email from your CRM system.</strong>'
        };

        await sgMail.send(msg);
        console.log('   ✅ Test email sent successfully!');
        console.log(`   📧 Check ${process.env.NOTIFICATION_EMAIL} inbox (including spam folder)`);
        console.log();
        
        console.log('4. Next Steps:');
        console.log('   • Check your email inbox: ' + process.env.NOTIFICATION_EMAIL);
        console.log('   • Check spam/junk folder');
        console.log('   • Check SendGrid Activity Feed: https://app.sendgrid.com/email_activity');
        console.log();
        
        console.log('5. If you received the test email:');
        console.log('   ✅ SendGrid is configured correctly!');
        console.log('   ✅ Emails should work when you change lead status or create follow-ups');
        console.log();
        
        console.log('6. If you did NOT receive the test email:');
        console.log('   • Check SendGrid Activity Feed for delivery status');
        console.log('   • Verify sender email is verified in SendGrid');
        console.log('   • Check if API key has "Mail Send" permission');
        console.log();
        
    } catch (error) {
        console.log('   ❌ Error sending test email');
        console.log('   Error:', error.message);
        console.log();
        
        if (error.code === 401 || error.code === 403) {
            console.log('   🔧 Troubleshooting:');
            console.log('   • Your API key may be invalid or expired');
            console.log('   • Generate a new API key: https://app.sendgrid.com/settings/api_keys');
            console.log('   • Make sure API key has "Mail Send" permission');
        } else if (error.message.includes('does not match a verified Sender Identity')) {
            console.log('   🔧 Troubleshooting:');
            console.log('   • Your sender email is not verified in SendGrid');
            console.log('   • Verify sender: https://app.sendgrid.com/settings/sender_auth/senders');
            console.log('   • Make sure SENDGRID_FROM_EMAIL matches a verified sender');
        } else {
            console.log('   🔧 Troubleshooting:');
            console.log('   • Check SendGrid Activity Feed: https://app.sendgrid.com/email_activity');
            console.log('   • Verify all configuration in .env file');
        }
        console.log();
    }
}

testSendGridAPI().catch(console.error);
