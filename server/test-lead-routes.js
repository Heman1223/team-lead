// Test script to check if leadRoutes can be loaded
try {
    const leadRoutes = require('./src/routes/leadRoutes');
    console.log('✓ Lead routes loaded successfully');
    console.log('Route object:', leadRoutes);
} catch (err) {
    console.error('✗ Failed to load lead routes');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
}
