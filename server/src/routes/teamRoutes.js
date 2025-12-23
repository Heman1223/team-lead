const express = require('express');
const router = express.Router();
const {
    getTeams,
    getTeam,
    getMyTeam,
    getLedTeams,
    createTeam,
    updateTeam,
    addMember,
    removeMember
} = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/my-team', getMyTeam);
router.get('/my-led-teams', authorize('team_lead'), getLedTeams);
router.route('/')
    .get(getTeams)
    .post(authorize('team_lead'), createTeam);

router.route('/:id')
    .get(getTeam)
    .put(authorize('team_lead'), updateTeam);

router.post('/:id/members', authorize('team_lead'), addMember);
router.delete('/:id/members/:userId', authorize('team_lead'), removeMember);

module.exports = router;
