const express = require('express');
const router = express.Router();
const {
    getFollowUps,
    createFollowUp,
    updateFollowUp,
    markFollowUpComplete,
    rescheduleFollowUp,
    cancelFollowUp,
    getOverdueFollowUps,
    getUpcomingFollowUps
} = require('../controllers/followUpController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Special routes MUST come before /:id routes to avoid conflicts
router.get('/status/overdue', getOverdueFollowUps);
router.get('/status/upcoming', getUpcomingFollowUps);

// Follow-up CRUD routes
router.route('/')
    .get(getFollowUps)
    .post(createFollowUp);

router.route('/:id')
    .put(updateFollowUp)
    .delete(cancelFollowUp);

// Action routes
router.put('/:id/complete', markFollowUpComplete);
router.put('/:id/reschedule', rescheduleFollowUp);

module.exports = router;
