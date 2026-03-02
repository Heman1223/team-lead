// Test Team Member Lead Upload Functionality
const API_URL = 'http://localhost:5001/api';

async function testTeamMemberLeadUpload() {
    console.log('🧪 Testing Team Member Lead Upload API...\n');

    let teamMemberToken = null;

    try {
        // Test 1: Login as Team Member
        console.log('1️⃣ Testing team member login...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'member@teamlead.com', // Assuming this exists
                password: 'member123'
            })
        });

        if (!loginRes.ok) {
            // Try creating a team member first
            console.log('   Team member not found, trying to register...');
            const registerRes = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Team Member',
                    email: 'member@teamlead.com',
                    password: 'member123',
                    role: 'team_member'
                })
            });

            if (registerRes.ok) {
                const registerData = await registerRes.json();
                teamMemberToken = registerData.data.token;
                console.log('✅ Team member registered and logged in!');
            } else {
                throw new Error('Failed to register team member');
            }
        } else {
            const loginData = await loginRes.json();
            teamMemberToken = loginData.data.token;
            console.log('✅ Team member login successful!');
        }

        const authHeaders = { 
            'Authorization': `Bearer ${teamMemberToken}`,
            'Content-Type': 'application/json'
        };

        // Test 2: Create a single lead as team member
        console.log('\n2️⃣ Testing lead creation by team member...');
        const createLeadRes = await fetch(`${API_URL}/leads`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                clientName: 'Test Client from Team Member',
                email: 'test@teammember.com',
                phone: '+1234567890',
                category: 'web_development',
                description: 'Test lead created by team member',
                source: 'manual',
                priority: 'medium'
            })
        });

        if (createLeadRes.ok) {
            const leadData = await createLeadRes.json();
            console.log('✅ Lead created successfully by team member!');
            console.log('   Lead ID:', leadData.data._id);
        } else {
            const error = await createLeadRes.text();
            console.log('❌ Lead creation failed:', createLeadRes.status, error);
        }

        // Test 3: Test lead preview endpoint (CSV upload simulation)
        console.log('\n3️⃣ Testing lead preview endpoint...');
        
        // Create a simple CSV content
        const csvContent = `client_name,email,phone,project_category,description
Test Client 1,client1@test.com,+1234567890,web_development,Website project
Test Client 2,client2@test.com,+0987654321,mobile_app,Mobile application`;

        const formData = new FormData();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        formData.append('file', blob, 'test_leads.csv');

        const previewRes = await fetch(`${API_URL}/leads/preview`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${teamMemberToken}`
            },
            body: formData
        });

        if (previewRes.ok) {
            const previewData = await previewRes.json();
            console.log('✅ Lead preview endpoint accessible to team member!');
            console.log('   Headers found:', previewData.data.headers);
            console.log('   Total rows:', previewData.data.totalRows);
        } else {
            const error = await previewRes.text();
            console.log('❌ Lead preview failed:', previewRes.status, error);
        }

        // Test 4: Test lead import endpoint
        console.log('\n4️⃣ Testing lead import endpoint...');
        const importRes = await fetch(`${API_URL}/leads/import`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                leads: [
                    {
                        clientName: 'Imported Client 1',
                        email: 'imported1@test.com',
                        phone: '+1111111111',
                        category: 'web_development',
                        description: 'Imported lead 1',
                        source: 'csv_import',
                        priority: 'high'
                    },
                    {
                        clientName: 'Imported Client 2',
                        email: 'imported2@test.com',
                        phone: '+2222222222',
                        category: 'seo',
                        description: 'Imported lead 2',
                        source: 'csv_import',
                        priority: 'medium'
                    }
                ]
            })
        });

        if (importRes.ok) {
            const importData = await importRes.json();
            console.log('✅ Lead import successful for team member!');
            console.log('   Imported count:', importData.count);
        } else {
            const error = await importRes.text();
            console.log('❌ Lead import failed:', importRes.status, error);
        }

        console.log('\n🎉 Team member lead upload functionality test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testTeamMemberLeadUpload();
