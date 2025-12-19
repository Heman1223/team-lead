const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getStatusSummary
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.get('/status-summary', getStatusSummary);
router.route('/')
    .get(getUsers)
    .post(authorize('team_lead'), createUser);

router.route('/:id')
    .get(getUser)
    .put(authorize('team_lead'), updateUser)
    .delete(authorize('team_lead'), deleteUser);

module.exports = router;
