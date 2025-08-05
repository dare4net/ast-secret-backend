const UserService = require('../services/userService');
const logger = require('../logger');

class UserController {
  static async createUser(req, res) {
    try {
      const { username, usePin, isPublic } = req.body;
      logger.info('Creating new user', { username, usePin, isPublic });
      
      const userData = UserService.createUser(username, usePin, isPublic);
      res.json(userData);
    } catch (error) {
      logger.error('Error creating user', { error });
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  static async getUserById(req, res) {
    try {
      const { userId } = req.params;
      const user = UserService.getUserById(userId);
      
      if (!user) {
        logger.warn('User not found', { userId });
        return res.status(404).json({ error: 'User not found' });
      }

      logger.debug('User fetched successfully', { userId, user });
      res.json(user);
    } catch (error) {
      logger.error('Error fetching user', { error });
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  static async getUserByUsername(req, res) {
    try {
      const { username } = req.params;
      logger.info('Looking up user by username', { username });
      
      const user = UserService.getUserByUsername(username);
      
      if (!user) {
        logger.warn('User not found or expired', { username });
        return res.status(404).json({ error: 'User not found or expired' });
      }

      logger.debug('User fetched successfully by username', { username, userId: user.id });
      res.json(user);
    } catch (error) {
      logger.error('Error fetching user by username', { error });
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }
}

module.exports = UserController;
