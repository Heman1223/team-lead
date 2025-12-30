const API_URL = 'http://localhost:5001/api';

async function login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data.data.token;
}

async function get(endpoint, token) {
    const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    return { status: res.status, data: await res.json() };
}

async function runTests() {
    console.log('🧪 Starting RBAC Debug...\n');
    try {
        const token = await login('admin@teamlead.com', 'admin123');
        console.log('✅ Login success');
        
        const res = await fetch(`${API_URL}/admin/users`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        console.log(`Debug Status: ${res.status}`);
        
        if (res.ok) {
            const json = await res.json();
            console.log('Debug Data Keys:', Object.keys(json));
            if (json.data) {
                console.log('Debug Data.Data is Array?', Array.isArray(json.data));
                console.log('Debug Data.Data Length:', json.data.length);
            }
        } else {
            console.log('Debug Error Body:', await res.text());
        }
    } catch (e) {
        console.error('Test Error:', e.message);
    }
}

runTests();
