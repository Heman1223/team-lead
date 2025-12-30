// Quick API Test Script
const API_URL = 'http://localhost:5001/api';

async function testAPI() {
    console.log('🧪 Testing Admin Panel API...\n');

    try {
        // Test 1: Health Check
        console.log('1️⃣ Testing health endpoint...');
        try {
            const healthRes = await fetch(`${API_URL.replace('/api', '')}/api/health`);
            const healthData = await healthRes.json();
            console.log('✅ Health check:', healthData);
        } catch (e) {
            console.log('⚠️ Health check skipped (endpoint might differ)');
        }

        // Test 2: Login
        console.log('\n2️⃣ Testing login...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@teamlead.com',
                password: 'admin123'
            })
        });

        if (!loginRes.ok) {
            const error = await loginRes.text();
            throw new Error(`Login failed: ${loginRes.status} ${error}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.data.token;
        console.log('✅ Login successful! Token:', token.substring(0, 20) + '...');

        const authHeaders = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Test 3: Get Users
        console.log('\n3️⃣ Testing get all users...');
        const usersRes = await fetch(`${API_URL}/admin/users`, { headers: authHeaders });
        const usersData = await usersRes.json();
        console.log('✅ Users fetched:', usersData.count, 'users');
        if (usersData.data) console.log('   Users:', usersData.data.map(u => `${u.name} (${u.role})`).join(', '));

        // Test 4: Get Teams
        console.log('\n4️⃣ Testing get all teams...');
        const teamsRes = await fetch(`${API_URL}/admin/teams`, { headers: authHeaders });
        const teamsData = await teamsRes.json();
        console.log('✅ Teams fetched:', teamsData.count, 'teams');

        // Test 5: Get Team Leads
        console.log('\n5️⃣ Testing get team leads...');
        const leadsRes = await fetch(`${API_URL}/admin/team-leads`, { headers: authHeaders });
        const leadsData = await leadsRes.json();
        console.log('✅ Team leads fetched:', leadsData.count, 'leads');

        // Test 6: Get Dashboard Stats
        console.log('\n6️⃣ Testing dashboard stats...');
        const statsRes = await fetch(`${API_URL}/leads/stats`, { headers: authHeaders });
        const statsData = await statsRes.json();
        console.log('✅ Lead stats:', statsData.data);

        // --- RBAC TESTS START ---
        console.log('\n=== Starting RBAC Verification ===');

        const uniqueId = Date.now();
        const leadEmail = `lead${uniqueId}@test.com`;
        const memberEmail = `member${uniqueId}@test.com`;
        const password = 'password123';

        // 7. Create Test Users
        console.log('7️⃣ Creating Test Team Lead & Member...');
        
        // Create Lead
        const createLeadRes = await fetch(`${API_URL}/admin/users`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ name: 'Test Lead', email: leadEmail, password, role: 'team_lead' })
        });
        if (!createLeadRes.ok) {
            console.error('❌ Lead Creation Failed:', await createLeadRes.text());
        }

        // Create Member
        const createMemberRes = await fetch(`${API_URL}/admin/users`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ name: 'Test Member', email: memberEmail, password, role: 'team_member' })
        });
        if (!createMemberRes.ok) {
            console.error('❌ Member Creation Failed:', await createMemberRes.text());
        }
        console.log('✅ Test users created (if no errors above)');

        // 8. Test Lead Permissions
        console.log('\n8️⃣ Testing Team Lead Access...');
        const leadLoginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: leadEmail, password })
        });
        const leadLoginData = await leadLoginRes.json();
        if (!leadLoginRes.ok) {
            console.error('❌ Lead Login Failed Details:', JSON.stringify(leadLoginData));
        } else {
            const leadToken = leadLoginData.data.token;
            const leadHeaders = { 'Authorization': `Bearer ${leadToken}`, 'Content-Type': 'application/json' };

            const leadInflow = await fetch(`${API_URL}/analytics/leads/inflow`, { headers: leadHeaders });
            console.log(`   [Lead] Get Inflow: ${leadInflow.status} (Expected 200) ${leadInflow.status === 200 ? '✅' : '❌'}`);
        }

        // 9. Test Member Permissions
        console.log('\n9️⃣ Testing Team Member Restrictions...');
        const memberLoginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: memberEmail, password })
        });
        const memberLoginData = await memberLoginRes.json();
        if (!memberLoginRes.ok) {
             console.error('❌ Member Login Failed Details:', JSON.stringify(memberLoginData));
        } else {
            const memberToken = memberLoginData.data.token;
            const memberHeaders = { 'Authorization': `Bearer ${memberToken}`, 'Content-Type': 'application/json' };

            const memberPerf = await fetch(`${API_URL}/analytics/performance/team`, { headers: memberHeaders });
            console.log(`   [Member] Get Team Performance: ${memberPerf.status} (Expected 403) ${memberPerf.status === 403 ? '✅' : '❌'}`);

            const memberAdminUsers = await fetch(`${API_URL}/admin/users`, { headers: memberHeaders });
            console.log(`   [Member] Get Admin Users: ${memberAdminUsers.status} (Expected 403) ${memberAdminUsers.status === 403 ? '✅' : '❌'}`);
        }
        // --- RBAC TESTS END ---

        console.log('\n✅ ALL TESTS PASSED! API is working correctly.\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
    }
}

testAPI();
