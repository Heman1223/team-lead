const express = require('express');
const router = express.Router();
const {
    getCallHistory,
    initiateCall,
    updateCall,
    endCall,
    checkAvailability
} = require('../controllers/callController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .get(getCallHistory)
    .post(initiateCall);

router.get('/availability/:userId', checkAvailability);

router.route('/:id')
    .put(updateCall);

router.put('/:id/end', endCall);

module.exports = router;
