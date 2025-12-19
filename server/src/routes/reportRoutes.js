const express = require('express');
const router = express.Router();
const {
    getSummary,
    getCompletionReport,
    getPerformanceReport,
    getTeamPerformance,
    getOverdueTrends,
    exportReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getSummary);
router.get('/completion', authorize('team_lead'), getCompletionReport);
router.get('/performance/:userId', getPerformanceReport);
router.get('/team-performance', authorize('team_lead'), getTeamPerformance);
router.get('/overdue-trends', authorize('team_lead'), getOverdueTrends);
router.get('/export', authorize('team_lead'), exportReport);

module.exports = router;
