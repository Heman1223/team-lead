const axios = require('axios');

async function verifyDMFix() {
    const API_URL = 'http://localhost:5001/api';
    const LOGIN_CREDENTIALS = { email: 'admin@test.com', password: 'password123' }; // Adjust if needed

    try {
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, LOGIN_CREDENTIALS);
        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        console.log('Fetching users to find a recipient...');
        const usersRes = await axios.get(`${API_URL}/admin/users`, config);
        const recipient = usersRes.data.data.find(u => u.role === 'team_member');
        
        if (!recipient) {
            console.log('No team member found to send message to.');
            return;
        }

        console.log(`Sending message to ${recipient.name} (${recipient._id})...`);
        const messageData = {
            title: 'Test Message',
            message: 'This is a test message to verify the fix.',
            priority: 'medium'
        };

        const msgRes = await axios.post(`${API_URL}/admin/users/${recipient._id}/message`, messageData, config);
        
        if (msgRes.data.success) {
            console.log('✅ Success! Message sent successfully.');
            console.log('Notification created:', msgRes.data.data._id);
        } else {
            console.log('❌ Failure! API returned success: false');
        }

    } catch (error) {
        console.error('Verification failed:', error.response?.data || error.message);
    }
}

// verifyDMFix();
