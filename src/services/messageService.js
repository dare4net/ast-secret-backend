const { nanoid } = require('nanoid');
const { messages, users } = require('../config/store');
const SocketEvents = require('../events/socketEvents');
const logger = require('../logger');

class MessageService {
  static createMessage(userId, content, isPublic) {
    const user = users.get(userId);
    if (!user) return null;

    const message = {
      id: nanoid(),
      content,
      isPublic,
      timestamp: new Date().toISOString(),
      reactions: { heart: 0, fire: 0, laugh: 0 },
      isRead: false
    };

    const userMessages = messages.get(userId) || [];
    userMessages.unshift(message);
    messages.set(userId, userMessages);

    // Update message count
    user.messageCount = userMessages.length;
    users.set(userId, user);

    // Emit socket event
    SocketEvents.emitNewMessage(userId, message, user.messageCount);

    return message;
  }

  static getUserMessages(userId, page = 1, limit = 20) {
    const userMessages = messages.get(userId) || [];
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      data: userMessages.slice(startIndex, endIndex),
      currentPage: page,
      totalPages: Math.ceil(userMessages.length / limit),
      totalMessages: userMessages.length,
      hasMore: endIndex < userMessages.length
    };
  }

  static addReaction(userId, messageId, reactionType) {
    const userMessages = messages.get(userId);
    if (!userMessages) return null;

    const message = userMessages.find(m => m.id === messageId);
    if (!message) return null;

    message.reactions[reactionType]++;

    // Emit socket event
    SocketEvents.emitNewReaction(userId, messageId, message.reactions);

    return message;
  }

  static deleteMessage(userId, messageId) {
    const userMessages = messages.get(userId);
    if (!userMessages) return false;

    const updatedMessages = userMessages.filter(m => m.id !== messageId);
    messages.set(userId, updatedMessages);

    // Update message count
    const user = users.get(userId);
    if (user) {
      user.messageCount = updatedMessages.length;
      users.set(userId, user);
    }

    return true;
  }

  static markAsRead(userId, messageId) {
    const userMessages = messages.get(userId);
    if (!userMessages) return null;

    const message = userMessages.find(m => m.id === messageId);
    if (!message) return null;

    message.isRead = true;
    return message;
  }

  static addReply(userId, messageId, reply) {
    const userMessages = messages.get(userId);
    if (!userMessages) return null;

    const message = userMessages.find(m => m.id === messageId);
    if (!message) return null;

    message.reply = reply;
    message.replyTimestamp = new Date().toISOString();

    // Emit socket event
    SocketEvents.emitNewReply(userId, messageId, reply, message.replyTimestamp);

    return message;
  }
}

module.exports = MessageService;
