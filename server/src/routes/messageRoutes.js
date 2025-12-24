const express = require('express');
const router = express.Router();
const {
    getConversations,
    getMessages,
    sendMessage,
    markAsRead,
    getUnreadCount
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Get all conversations for current user
router.get('/conversations', getConversations);

// Get unread message count
router.get('/unread-count', getUnreadCount);

// Get messages with specific user / Send new message
router.route('/:userId')
    .get(getMessages);

// Send a new message
router.post('/', sendMessage);

// Mark message as read
router.put('/:id/read', markAsRead);

module.exports = router;
