const MessageService = require('../services/messageService');
const logger = require('../logger');

class MessageController {
  static async createMessage(req, res) {
    try {
      const { userId, content, isPublic } = req.body;
      const message = MessageService.createMessage(userId, content, isPublic);
      
      if (!message) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(message);
    } catch (error) {
      logger.error('Error creating message', { error });
      res.status(500).json({ error: 'Failed to create message' });
    }
  }

  static async getMessages(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const messages = MessageService.getUserMessages(
        userId,
        parseInt(page),
        parseInt(limit)
      );
      
      if (!messages || !messages.data) {
        return res.status(404).json({ error: 'Messages not found' });
      }

      res.json(messages);
    } catch (error) {
      logger.error('Error fetching messages', { error });
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  static async addReaction(req, res) {
    try {
      const { messageId } = req.params;
      const { userId, reactionType } = req.body;
      
      logger.info(`Adding reaction to ${messageId}`, { reactionType });
      
      const message = MessageService.addReaction(userId, messageId, reactionType);
      
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      res.json(message);
    } catch (error) {
      logger.error('Error adding reaction', { error });
      res.status(500).json({ error: 'Failed to add reaction' });
    }
  }

  static async deleteMessage(req, res) {
    try {
      const { userId, messageId } = req.params;
      const success = MessageService.deleteMessage(userId, messageId);
      
      if (!success) {
        return res.status(404).json({ error: 'Message not found' });
      }

      res.json({ success: true });
    } catch (error) {
      logger.error('Error deleting message', { error });
      res.status(500).json({ error: 'Failed to delete message' });
    }
  }

  static async markAsRead(req, res) {
    try {
      const { messageId } = req.params;
      const { userId } = req.body;
      
      const message = MessageService.markAsRead(userId, messageId);
      
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      res.json(message);
    } catch (error) {
      logger.error('Error marking message as read', { error });
      res.status(500).json({ error: 'Failed to mark message as read' });
    }
  }

  static async addReply(req, res) {
    try {
      const { messageId } = req.params;
      const { userId, reply } = req.body;
      
      logger.info(`Adding reply to ${messageId}`, { reply });
      
      const message = MessageService.addReply(userId, messageId, reply);
      
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      res.json(message);
    } catch (error) {
      logger.error('Error adding reply', { error });
      res.status(500).json({ error: 'Failed to add reply' });
    }
  }
}

module.exports = MessageController;
