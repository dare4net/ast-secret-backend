const { getIO } = require('../config/socket');

class SocketEvents {
  static emitNewMessage(userId, message, messageCount) {
    getIO().to(`user:${userId}`).emit('newMessage', { message, messageCount });
  }

  static emitNewReaction(userId, messageId, reactions) {
    getIO().to(`user:${userId}`).emit('newReaction', { messageId, reactions });
  }

  static emitNewReply(userId, messageId, reply, replyTimestamp) {
    getIO().to(`user:${userId}`).emit('newReply', { messageId, reply, replyTimestamp });
  }
}

module.exports = SocketEvents;
