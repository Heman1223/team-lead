const mongoose = require('mongoose');
const User = require('./src/models/User');
const Team = require('./src/models/Team');
const ActivityLog = require('./src/models/ActivityLog');
require('dotenv').config();

const reproduce = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Mock request body similar to what frontend sends
        const reqBody = {
            name: 'Test New User',
            email: 'testnewuser@example.com',
            password: 'password123',
            role: 'team_member',
            phone: '1234567890',
            designation: 'Developer',
            coreField: 'Web Intern',
            teamId: '' // Simulating empty string from frontend
        };

        console.log('Request body:', reqBody);

        const { name, email, password, role, phone, designation, coreField, teamId } = reqBody;

        // Simulate admin user for req.user
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) throw new Error('Admin not found');


        // Scenario 1: teamId as empty string (reproducing the bug)
        console.log('\n--- SCENARIO 1: teamId = "" ---');
        try {
            await User.create({
                name: 'Test Fail',
                email: 'fail@example.com',
                password: 'password123',
                role: 'team_member',
                teamId: '' || null // mimic the code: teamId || null.  "" || null is null.
            });
            console.log('Scenario 1 SUCCESS (Unexpected if "" causes error?)');
            // Wait, "" || null evaluates to null. So it SHOULD work?
            // Let's verify what happens if we pass "" DIRECTLY without the || null check
            // The controller has: teamId: teamId || null
            // So if req.body.teamId is "", the controller passes null.
            
            // Maybe there's a different issue?
            // What if req.body.teamId is "undefined" string?
            
        } catch (err) {
            console.log('Scenario 1 FAILED:', err.message);
        }

        // Scenario 2: Simulate controller exact behavior
        console.log('\n--- SCENARIO 2: Controller Logic Simulation ---');
        try {
            const teamIdInput = ''; // Frontend sends empty string
            const teamIdProcessed = teamIdInput || null; // Controller does this
            
            console.log('Processed teamId:', teamIdProcessed); // Should be null

            const user = await User.create({
                name: 'Test Controller',
                email: 'controller@example.com',
                password: 'password123',
                role: 'team_member',
                teamId: teamIdProcessed
            });
            console.log('Scenario 2 SUCCESS:', user._id);
            
            // Clean up
            await User.deleteOne({ _id: user._id });
        } catch (err) {
            console.log('Scenario 2 FAILED:', err.message);
            console.log('Stack:', err.stack);
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
};

reproduce();
