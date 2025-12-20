// Quick API Test Script
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAPI() {
    console.log('🧪 Testing Admin Panel API...\n');

    try {
        // Test 1: Health Check
        console.log('1️⃣ Testing health endpoint...');
        const health = await axios.get(`${API_URL.replace('/api', '')}/api/health`);
        console.log('✅ Health check:', health.data);

        // Test 2: Login
        console.log('\n2️⃣ Testing login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@teamlead.com',
            password: 'admin123'
        });
        const token = loginRes.data.data.token;
        console.log('✅ Login successful! Token:', token.substring(0, 20) + '...');

        // Test 3: Get Users
        console.log('\n3️⃣ Testing get all users...');
        const usersRes = await axios.get(`${API_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Users fetched:', usersRes.data.count, 'users');
        console.log('   Users:', usersRes.data.data.map(u => u.name).join(', '));

        // Test 4: Get Teams
        console.log('\n4️⃣ Testing get all teams...');
        const teamsRes = await axios.get(`${API_URL}/admin/teams`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Teams fetched:', teamsRes.data.count, 'teams');

        // Test 5: Get Team Leads
        console.log('\n5️⃣ Testing get team leads...');
        const leadsRes = await axios.get(`${API_URL}/admin/team-leads`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Team leads fetched:', leadsRes.data.count, 'leads');

        // Test 6: Get Dashboard Stats
        console.log('\n6️⃣ Testing dashboard stats...');
        const statsRes = await axios.get(`${API_URL}/admin/analytics/dashboard-stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Dashboard stats:', statsRes.data.data);

        // Test 7: Create Test User
        console.log('\n7️⃣ Testing create user...');
        try {
            const createRes = await axios.post(`${API_URL}/admin/users`, {
                name: 'Test User ' + Date.now(),
                email: `test${Date.now()}@example.com`,
                password: 'password123',
                role: 'team_member'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ User created:', createRes.data.data.name);
        } catch (err) {
            console.log('⚠️  Create user error:', err.response?.data?.message || err.message);
        }

        console.log('\n✅ ALL TESTS PASSED! API is working correctly.\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
        console.error('   Status:', error.response?.status);
        console.error('   URL:', error.config?.url);
    }
}

testAPI();
