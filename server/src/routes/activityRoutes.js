const express = require('express');
const router = express.Router();
const {
    getActivities,
    getTaskActivities,
    getUserActivities
} = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getActivities);
router.get('/task/:taskId', getTaskActivities);
router.get('/user/:userId', getUserActivities);

module.exports = router;
