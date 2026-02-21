const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserDetails,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    getAllTeams,
    getTeamDetails,
    createTeam,
    updateTeam,
    deleteTeam,
    assignMembersToTeam,
    removeMemberFromTeam,
    getTeamPerformance: getAdminTeamPerformance,
    getAllTasks,
    getAllActivities,
    getDashboardStats,
    assignTaskToTeamLead,
    getAllTeamLeads,
    updateTask,
    deleteTask,
    reassignTask,
    cancelTask,
    uploadTaskAttachment,
    deleteTaskAttachment,
    sendAdminMessage
} = require('../controllers/adminController');
const {
    getTeamPerformance: getAnalyticsTeamPerformance,
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

router.get('/users/:id/details', getUserDetails);

router.route('/users/:id')
    .put(updateUser)
    .delete(deleteUser);

router.put('/users/:id/reset-password', resetUserPassword);
router.post('/users/:id/message', sendAdminMessage);

// Team management routes
router.route('/teams')
    .get(getAllTeams)
    .post(createTeam);

router.get('/teams/:id/details', getTeamDetails);
router.get('/teams/:id/performance', getAdminTeamPerformance);

router.route('/teams/:id')
    .put(updateTeam)
    .delete(deleteTeam);

router.put('/teams/:id/assign-members', assignMembersToTeam);
router.put('/teams/:id/remove-member', removeMemberFromTeam);

// View all data routes
router.get('/tasks', getAllTasks);
router.get('/activities', getAllActivities);
router.get('/stats', getDashboardStats);

// Task assignment routes
router.post('/assign-task', assignTaskToTeamLead);
router.get('/team-leads', getAllTeamLeads);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);
router.put('/tasks/:id/reassign', reassignTask);
router.put('/tasks/:id/cancel', cancelTask);
router.post('/tasks/:id/attachments', uploadTaskAttachment);
router.delete('/tasks/:id/attachments/:attachmentId', deleteTaskAttachment);

// Analytics routes
router.get('/analytics/team-performance', getAnalyticsTeamPerformance);
router.get('/analytics/best-teams', getBestPerformingTeams);
router.get('/analytics/team-lead-effectiveness/:leadId', getTeamLeadEffectiveness);
router.get('/analytics/dashboard-stats', getAnalyticsDashboardStats);

module.exports = router;
