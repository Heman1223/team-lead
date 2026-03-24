const http = require('http');

const loginData = JSON.stringify({
    email: 'admin@teamlead.com',
    password: 'admin123',
    requiredRole: 'admin'
});

const loginOptions = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
};

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body || '{}') }));
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function run() {
    try {
        console.log('Logging in...');
        const loginRes = await request(loginOptions, loginData);
        if (loginRes.status !== 200) {
            console.error('Login failed:', loginRes.status, loginRes.body);
            return;
        }

        const token = loginRes.body.data.token;
        console.log('Login successful.');

        console.log('Testing payment-summary...');
        const summaryOptions = {
            hostname: 'localhost',
            port: 5001,
            path: '/api/leads/admin/payment-summary',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const summaryRes = await request(summaryOptions);
        console.log('Summary Status:', summaryRes.status);
        console.log('Summary Body:', JSON.stringify(summaryRes.body, null, 2));

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
