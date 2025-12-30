const express = require('express');
const router = express.Router();
const {
    getLeadInflow,
    getSourceDistribution,
    getConversionMetrics,
    getTeamPerformance
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Analytics routes - Admin and Team Lead access
router.get('/leads/inflow', authorize('admin', 'team_lead'), getLeadInflow);
router.get('/leads/sources', authorize('admin', 'team_lead'), getSourceDistribution);
router.get('/leads/conversion', authorize('admin', 'team_lead'), getConversionMetrics);
router.get('/performance/team', authorize('admin', 'team_lead'), getTeamPerformance);

module.exports = router;
