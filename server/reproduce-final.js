const mongoose = require('mongoose');
const User = require('./src/models/User');
const fs = require('fs');
require('dotenv').config();

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('reproduce_result.txt', msg + '\n');
};

const run = async () => {
    try {
        fs.writeFileSync('reproduce_result.txt', 'Starting reproduction...\n');
        await mongoose.connect(process.env.MONGODB_URI);
        log('Connected to DB');

        // Test 1: teamId = null
        try {
            log('Test 1: teamId = null');
            const u1 = await User.create({
                name: 'Test Null',
                email: 'testnull@example.com',
                password: 'password123',
                role: 'team_member',
                teamId: null
            });
            log('Test 1 SUCCESS: ' + u1._id);
            await User.deleteOne({ _id: u1._id });
        } catch (e) {
            log('Test 1 FAILED: ' + e.message);
        }

        // Test 2: teamId = ""
        try {
            log('Test 2: teamId = ""');
            const u2 = await User.create({
                name: 'Test Empty',
                email: 'testempty@example.com',
                password: 'password123',
                role: 'team_member',
                teamId: ''
            });
            log('Test 2 SUCCESS: ' + u2._id);
            await User.deleteOne({ _id: u2._id });
        } catch (e) {
            log('Test 2 FAILED: ' + e.message);
        }
        
        // Test 3: teamId = undefined (not present)
        try {
            log('Test 3: teamId = undefined');
            const u3 = await User.create({
                name: 'Test Undefined',
                email: 'testundefined@example.com',
                password: 'password123',
                role: 'team_member'
                // teamId omitted
            });
            log('Test 3 SUCCESS: ' + u3._id);
            await User.deleteOne({ _id: u3._id });
        } catch (e) {
            log('Test 3 FAILED: ' + e.message);
        }

        await mongoose.connection.close();
        log('Done');
    } catch (e) {
        log('FATAL: ' + e.message);
    }
};

run();
