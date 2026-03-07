const express = require('express');
const router = express.Router();
const {
    getMeetings,
    getMeetingById,
    createMeeting,
    updateMeeting,
    deleteMeeting
} = require('../controllers/meetingController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .get(getMeetings)
    .post(authorize('admin', 'team_lead', 'team_member'), createMeeting);

router.route('/:id')
    .get(getMeetingById)
    .put(authorize('admin', 'team_lead', 'team_member'), updateMeeting)
    .delete(authorize('admin', 'team_lead', 'team_member'), deleteMeeting);

module.exports = router;
