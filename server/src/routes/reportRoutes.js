const express = require('express');
const mongoose = require('mongoose');
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
router.get('/completion', authorize('admin', 'team_lead', 'team_member'), getCompletionReport);
router.get('/performance/:userId', getPerformanceReport);
router.get('/team-performance', authorize('admin', 'team_lead', 'team_member'), getTeamPerformance);
router.get('/overdue-trends', authorize('admin', 'team_lead', 'team_member'), getOverdueTrends);
router.get('/export', authorize('admin', 'team_lead', 'team_member'), exportReport);
router.get('/lead-generation', authorize('admin', 'team_lead', 'team_member'), getLeadGenerationStats);
router.get('/lead-status', authorize('admin', 'team_lead', 'team_member'), getLeadStatusStats);

module.exports = router;
