const axios = require('axios');

async function test() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'admin@teamlead.com',
            password: 'admin123',
            requiredRole: 'admin'
        });
        
        const token = loginRes.data.data.token;
        console.log('Login successful. Token acquired.');
        
        console.log('Testing payment-summary endpoint...');
        const summaryRes = await axios.get('http://localhost:5001/api/leads/admin/payment-summary', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Response Status:', summaryRes.status);
        console.log('Response Data:', JSON.stringify(summaryRes.data, null, 2));
    } catch (error) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    }
}

test();
