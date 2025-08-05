const { Server } = require('socket.io');
const logger = require('../logger');

let io;

function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? 'https://ast-secret.vercel.app'
        : 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info('New client connected');

    socket.on('join', (userId) => {
      socket.join(`user:${userId}`);
      logger.info(`Client joined room: ${userId}`);
      
      // Emit stats update when user joins
      const stats = getStats(userId);
      io.to(`user:${userId}`).emit('statsUpdate', stats);
    });

    socket.on('getStats', async (userId) => {
      const stats = getStats(userId);
      io.to(`user:${userId}`).emit('statsUpdate', stats);
    });

    socket.on('linkClicked', async (userId) => {
      incrementLinkClicks(userId);
      const stats = getStats(userId);
      io.to(`user:${userId}`).emit('statsUpdate', stats);
    });

    socket.on('disconnect', () => {
      // Update active readers count for all rooms this socket was in
      socket.rooms.forEach(room => {
        if (room.startsWith('user:')) {
          const userId = room.replace('user:', '');
          const stats = getStats(userId);
          io.to(room).emit('statsUpdate', stats);
        }
      });
      logger.info('Client disconnected');
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

// In-memory stats storage (replace with database in production)
const linkClicksMap = new Map();

function getStats(userId) {
  return {
    linkClicks: linkClicksMap.get(userId) || 0,
    activeReaders: io.sockets.adapter.rooms.get(`user:${userId}`)?.size || 0
  };
}

function incrementLinkClicks(userId) {
  const currentClicks = linkClicksMap.get(userId) || 0;
  linkClicksMap.set(userId, currentClicks + 1);
  logger.info('Link clicked', { userId, newCount: currentClicks + 1 });
}

module.exports = {
  initializeSocket,
  getIO,
  getStats,
  incrementLinkClicks
};
