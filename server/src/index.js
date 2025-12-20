const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('=== SERVER STARTING ===');
console.log('Environment variables loaded');
console.log('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/teamlead');
console.log('Port:', process.env.PORT || 5000);

const connectDB = require('./config/db');

// Create Express app
const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('Middleware configured');

// Request logger - MUST be before routes
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Health check FIRST
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Connect to database and load routes
const startServer = async () => {
    try {
        console.log('\n--- Connecting to Database ---');
        await connectDB();
        console.log('✓ Database connected\n');

        console.log('--- Loading Routes ---');
        
        // Load auth routes
        try {
            const authRoutes = require('./routes/authRoutes');
            console.log('✓ Auth routes file loaded');
            
            // Mount the routes
            app.use('/api/auth', authRoutes);
            console.log('✓ Auth routes mounted at /api/auth');
            
            // List all registered routes
            console.log('\nRegistered Auth Routes:');
            authRoutes.stack.forEach(r => {
                if (r.route) {
                    const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
                    console.log(`  ${methods} /api/auth${r.route.path}`);
                }
            });
        } catch (err) {
            console.error('✗ ERROR loading auth routes:', err.message);
            console.error('Full error:', err);
            throw err;
        }

        // Try loading other routes (with error handling)
        const otherRoutes = [
            { path: '/api/admin', file: './routes/adminRoutes', name: 'Admin' },
            { path: '/api/users', file: './routes/userRoutes', name: 'User' },
            { path: '/api/teams', file: './routes/teamRoutes', name: 'Team' },
            { path: '/api/tasks', file: './routes/taskRoutes', name: 'Task' },
            { path: '/api/notifications', file: './routes/notificationRoutes', name: 'Notification' },
            { path: '/api/calls', file: './routes/callRoutes', name: 'Call' },
            { path: '/api/activities', file: './routes/activityRoutes', name: 'Activity' },
            { path: '/api/reports', file: './routes/reportRoutes', name: 'Report' }
        ];

        otherRoutes.forEach(route => {
            try {
                const routeModule = require(route.file);
                app.use(route.path, routeModule);
                console.log(`✓ ${route.name} routes mounted at ${route.path}`);
            } catch (err) {
                console.log(`⚠ ${route.name} routes not found (skipping)`);
            }
        });

        console.log('\n--- All Routes Loaded ---\n');

        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error('ERROR:', err.message);
            console.error(err.stack);
            res.status(err.status || 500).json({
                success: false,
                message: err.message || 'Internal Server Error',
                error: process.env.NODE_ENV === 'development' ? err.stack : undefined
            });
        });

        // 404 handler - MUST BE LAST
        app.use((req, res) => {
            console.log(`404 - Route not found: ${req.method} ${req.url}`);
            res.status(404).json({ 
                success: false, 
                message: 'Route not found',
                requestedUrl: req.url,
                method: req.method
            });
        });

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log('=================================');
            console.log(`✓ Server running on port ${PORT}`);
            console.log(`✓ Health check: http://localhost:${PORT}/health`);
            console.log(`✓ Auth test: http://localhost:${PORT}/api/auth/test`);
            console.log('=================================\n');
        });

    } catch (error) {
        console.error('FATAL ERROR starting server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;