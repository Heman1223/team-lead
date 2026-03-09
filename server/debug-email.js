require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

console.log('Testing SMTP connection from debug script...');
console.log('User:', process.env.EMAIL_USER);

transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Connection failed:', error);
    } else {
        console.log('✅ Connection successful!');
        
        const mailOptions = {
            from: `"Test Debug" <${process.env.EMAIL_USER}>`,
            to: process.env.NOTIFICATION_EMAIL || 'sohamdang0@gmail.com',
            subject: 'Debug: Manual SMTP Test',
            text: 'Testing if email reaches the inbox from the debug script.'
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('❌ Failed to send debug email:', err);
            } else {
                console.log('✅ Debug email sent:', info.response);
                console.log('Message ID:', info.messageId);
            }
            process.exit();
        });
    }
});
