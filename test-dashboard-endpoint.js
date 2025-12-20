const axios = require('axios');

// Test the dashboard stats endpoint
const testEndpoint = async () => {
    try {
        // First, login as admin to get token
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@example.com',
            password: 'admin123'
        });

        const token = loginRes.data.token;
        console.log('✓ Logged in as admin');

        // Test dashboard stats endpoint
        const statsRes = await axios.get('http://localhost:5000/api/admin/analytics/dashboard-stats', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('\n=== DASHBOARD STATS RESPONSE ===');
        console.log(JSON.stringify(statsRes.data, null, 2));

        // Test team performance endpoint
        const performanceRes = await axios.get('http://localhost:5000/api/admin/analytics/team-performance', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('\n=== TEAM PERFORMANCE RESPONSE ===');
        console.log(JSON.stringify(performanceRes.data, null, 2));

        // Test best teams endpoint
        const bestTeamsRes = await axios.get('http://localhost:5000/api/admin/analytics/best-teams', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('\n=== BEST TEAMS RESPONSE ===');
        console.log(JSON.stringify(bestTeamsRes.data, null, 2));

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
};

testEndpoint();
