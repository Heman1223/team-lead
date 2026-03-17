const express = require('express');
const router = express.Router();
const {
    getSummary,
    getCompletionReport,
    getPerformanceReport,
    getTeamPerformance,
    getOverdueTrends,
    exportReport,
    getLeadGenerationStats,
    getLeadStatusStats
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getSummary);
router.get('/completion', authorize('team_lead'), getCompletionReport);
router.get('/performance/:userId', getPerformanceReport);
router.get('/team-performance', authorize('team_lead'), getTeamPerformance);
router.get('/overdue-trends', authorize('team_lead'), getOverdueTrends);
router.get('/export', authorize('team_lead'), exportReport);
router.get('/lead-generation', authorize('team_lead'), getLeadGenerationStats);
router.get('/lead-status', authorize('team_lead'), getLeadStatusStats);

module.exports = router;
