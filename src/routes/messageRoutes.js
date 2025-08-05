const express = require('express');
const MessageController = require('../controllers/messageController');

const router = express.Router();

router.post('/', MessageController.createMessage);
router.get('/:userId', MessageController.getMessages);
router.post('/:messageId/reactions', MessageController.addReaction);
router.delete('/:userId/:messageId', MessageController.deleteMessage);
router.post('/:messageId/read', MessageController.markAsRead);
router.post('/:messageId/reply', MessageController.addReply);

module.exports = router;
