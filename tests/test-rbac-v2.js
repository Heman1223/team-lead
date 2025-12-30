// RBAC Verification Script V2
const API_URL = 'http://127.0.0.1:5001/api';

async function runTests() {
    console.log('🧪 Starting RBAC Verification (Explicit Fetch)...\n');

    try {
        // 1. Admin Login
        console.log('1️⃣  Admin Login');
        let loginRes;
        try {
            loginRes = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'admin@teamlead.com', password: 'admin123' })
            });
        } catch (err) {
            console.error('❌ Network Error during Admin Login:', err.cause || err);
            return;
        }
        
        if (!loginRes.ok) throw new Error('Admin login failed');
        const loginData = await loginRes.json();
        const adminToken = loginData.data.token;
        console.log('✅ Admin logged in');

        const adminHeaders = {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        };

        // 2. Fetch Users (Reference)
        const usersRes = await fetch(`${API_URL}/admin/users`, { headers: adminHeaders });
        if (!usersRes.ok) {
            console.error('❌ Admin failed to fetch users:', usersRes.status, await usersRes.text());
        } else {
            const usersData = await usersRes.json();
            console.log(`✅ Admin fetched ${usersData.count} users`);
        }

        // 3. Setup Test Users
        console.log('\n2️⃣  Setting up Test Users...');
        const uniqueId = Date.now();
        const leadEmail = `lead${uniqueId}@test.com`;
        const memberEmail = `member${uniqueId}@test.com`;
        const password = 'password123';

        // Create Lead
        const createLeadRes = await fetch(`${API_URL}/admin/users`, {
            method: 'POST',
            headers: adminHeaders,
            body: JSON.stringify({ name: 'Test Lead', email: leadEmail, password, role: 'team_lead' })
        });
        console.log('Lead Creation:', await createLeadRes.text());
        
        // Create Member
        const createMemberRes = await fetch(`${API_URL}/admin/users`, {
            method: 'POST',
            headers: adminHeaders,
            body: JSON.stringify({ name: 'Test Member', email: memberEmail, password, role: 'team_member' })
        });
        console.log('Member Creation:', await createMemberRes.text());
        console.log('✅ QA Users created');

        // Login Lead
        const leadLoginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: leadEmail, password })
        });
        const leadLoginData = await leadLoginRes.json();
        if (!leadLoginRes.ok) {
            console.error('❌ Lead Login Failed:', leadLoginData);
            return;
        }
        const leadToken = leadLoginData.data.token;
        const leadHeaders = { 'Authorization': `Bearer ${leadToken}`, 'Content-Type': 'application/json' };

        // Login Member
        const memberLoginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: memberEmail, password })
        });
        const memberLoginData = await memberLoginRes.json();
        if (!memberLoginRes.ok) {
            console.error('❌ Member Login Failed:', memberLoginData);
            return;
        }
        const memberToken = memberLoginData.data.token;
        const memberHeaders = { 'Authorization': `Bearer ${memberToken}`, 'Content-Type': 'application/json' };


        // 4. Test Permissions
        console.log('\n3️⃣  Testing Permissions...');

        // Lead accessing Inflow (Allowed)
        const leadInflowRes = await fetch(`${API_URL}/analytics/leads/inflow`, { headers: leadHeaders });
        console.log(`   [Lead] Get Inflow: ${leadInflowRes.status} (Expected 200) ${leadInflowRes.status === 200 ? '✅' : '❌'}`);

        // Member accessing Team Performance (Restricted)
        const memberPerfRes = await fetch(`${API_URL}/analytics/performance/team`, { headers: memberHeaders });
        console.log(`   [Member] Get Team Performance: ${memberPerfRes.status} (Expected 403) ${memberPerfRes.status === 403 ? '✅' : '❌'}`);

        // Member accessing Admin Users (Restricted)
        const memberUsersRes = await fetch(`${API_URL}/admin/users`, { headers: memberHeaders });
        console.log(`   [Member] Get Admin Users: ${memberUsersRes.status} (Expected 403) ${memberUsersRes.status === 403 ? '✅' : '❌'}`);

    } catch (e) {
        console.error('\n❌ CRITICAL ERROR:', e.message);
    }
}

runTests();
