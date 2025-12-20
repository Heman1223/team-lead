const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserActive,
    resetUserPassword,
    getAllTeams,
    createTeam,
    assignMembersToTeam,
    getAllTasks,
    getAllActivities,
    getDashboardStats,
    assignTaskToTeamLead,
    getAllTeamLeads
} = require('../controllers/adminController');
const {
    getTeamPerformance,
    getBestPerformingTeams,
    getTeamLeadEffectiveness,
    getDashboardStats: getAnalyticsDashboardStats
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// User management routes
router.route('/users')
    .get(getAllUsers)
    .post(createUser);

router.route('/users/:id')
    .put(updateUser)
    .delete(deleteUser);

router.put('/users/:id/toggle-active', toggleUserActive);
router.put('/users/:id/reset-password', resetUserPassword);

// Team management routes
router.route('/teams')
    .get(getAllTeams)
    .post(createTeam);

router.put('/teams/:id/assign-members', assignMembersToTeam);

// View all data routes
router.get('/tasks', getAllTasks);
router.get('/activities', getAllActivities);
router.get('/stats', getDashboardStats);

// Task assignment routes
router.post('/assign-task', assignTaskToTeamLead);
router.get('/team-leads', getAllTeamLeads);

// Analytics routes
router.get('/analytics/team-performance', getTeamPerformance);
router.get('/analytics/best-teams', getBestPerformingTeams);
router.get('/analytics/team-lead-effectiveness/:leadId', getTeamLeadEffectiveness);
router.get('/analytics/dashboard-stats', getAnalyticsDashboardStats);

module.exports = router;
