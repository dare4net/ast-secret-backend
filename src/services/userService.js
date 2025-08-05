const { nanoid } = require('nanoid');
const { users, messages, config } = require('../config/store');
const logger = require('../logger');

class UserService {
  static createUser(username, usePin, isPublic) {
    const userId = nanoid();
    const now = Date.now();
    const expiresAt = now + (config.messageExpiryHours * 60 * 60 * 1000);

    const userData = {
      id: userId,
      username,
      avatar: `/placeholder.svg?height=80&width=80`,
      usePin,
      isPublic,
      messageCount: 0,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      link: `http://${config.host}/u/${username}`
    };

    users.set(userId, userData);
    messages.set(userId, []);
    
    logger.debug('User created successfully', { userId, userData });
    return userData;
  }

  static getUserById(userId) {
    const user = users.get(userId);
    if (!user) return null;

    // Update message count
    user.messageCount = messages.get(userId)?.length || 0;
    users.set(userId, user);

    return user;
  }

  static getUserByUsername(username) {
    const user = Array.from(users.values()).find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!user) return null;

    // Check expiration
    const now = Date.now();
    const expiresAt = new Date(user.expiresAt).getTime();
    
    if (now > expiresAt) {
      users.delete(user.id);
      messages.delete(user.id);
      return null;
    }

    // Update message count
    const userMessages = messages.get(user.id) || [];
    user.messageCount = userMessages.length;
    users.set(user.id, user);

    return user;
  }

  static cleanExpiredUsers() {
    const now = Date.now();
    for (const [userId, userData] of users.entries()) {
      if (now > new Date(userData.expiresAt).getTime()) {
        logger.info('Cleaning expired user data', { userId });
        users.delete(userId);
        messages.delete(userId);
      }
    }
  }
}

module.exports = UserService;
