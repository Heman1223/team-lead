const axios = require('axios');

const testLogin = async () => {
    try {
        console.log('Testing login API endpoint...\n');
        
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@teamlead.com',
            password: 'admin123'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Login successful!');
        console.log('\nResponse:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ Login failed!');
        console.log('\nError:', error.response?.data || error.message);
    }
};

testLogin();
