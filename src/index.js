const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { nanoid } = require('nanoid');
const logger = require('./logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method === 'POST' ? req.body : undefined,
  });
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  res.status(500).json({ error: 'Internal server error' });
});

// In-memory storage
const users = new Map(); // Store user data
const messages = new Map(); // Store messages for each user

// Helper function to clean expired users and messages (24 hours)
const cleanExpiredData = () => {
  const now = Date.now();
  for (const [userId, userData] of users.entries()) {
    if (now > userData.expiresAt) {
      logger.info('Cleaning expired user data', { userId });
      users.delete(userId);
      messages.delete(userId);
    }
  }
};

// Clean expired data every hour
setInterval(cleanExpiredData, 1000 * 60 * 60);

// Routes
app.post('/api/users', (req, res) => {
  const { username, usePin, isPublic } = req.body;
  const userId = nanoid();
  const now = Date.now();
  const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours from now

  logger.info('Creating new user', { username, usePin, isPublic, userId });

  const userData = {
    id: userId,
    username,
    avatar: `/placeholder.svg?height=80&width=80`,
    usePin,
    isPublic,
    messageCount: 0,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
    link: `${req.protocol}://${req.get('host')}/u/${username}`
  };

  users.set(userId, userData);
  messages.set(userId, []);

  logger.debug('User created successfully', { userId, userData });
  res.json(userData);
});

app.get('/api/users/:userId', (req, res) => {
  const { userId } = req.params;
  const user = users.get(userId);
  
  if (!user) {
    logger.warn('User not found', { userId });
    return res.status(404).json({ error: 'User not found' });
  }

  // Update message count
  user.messageCount = messages.get(userId)?.length || 0;
  users.set(userId, user);

  logger.debug('User fetched successfully', { userId, user });
  res.json(user);
});

app.get('/api/users/by-username/:username', (req, res) => {
  const { username } = req.params;
  logger.info('Looking up user by username', { 
    username,
    totalUsers: users.size,
    allUsernames: Array.from(users.values()).map(u => u.username)
  });

  // Case-insensitive username lookup
  const user = Array.from(users.values()).find(
    u => u.username.toLowerCase() === username.toLowerCase()
  );
  
  if (!user) {
    logger.warn('User not found by username', { 
      username,
      availableUsers: Array.from(users.values()).map(u => ({
        username: u.username,
        id: u.id,
        expiresAt: u.expiresAt
      }))
    });
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if user has expired
  const now = Date.now();
  const expiresAt = new Date(user.expiresAt).getTime();
  
  if (now > expiresAt) {
    logger.warn('User has expired', { 
      username,
      userId: user.id, 
      expiresAt: user.expiresAt,
      now: new Date(now).toISOString()
    });
    users.delete(user.id);
    messages.delete(user.id);
    return res.status(404).json({ error: 'User has expired' });
  }

  // Update message count
  const userMessages = messages.get(user.id) || [];
  user.messageCount = userMessages.length;
  users.set(user.id, user);

  logger.debug('User fetched successfully by username', { 
    username,
    userId: user.id,
    messageCount: user.messageCount,
    expiresAt: user.expiresAt
  });
  res.json(user);
});

app.post('/api/messages', (req, res) => {
  const { userId, content, isPublic } = req.body;
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const message = {
    id: nanoid(),
    content,
    isPublic,
    timestamp: new Date().toISOString(),
    reactions: { heart: 0, fire: 0, laugh: 0 },
    isRead: false
  };

  const userMessages = messages.get(userId) || [];
  userMessages.unshift(message); // Add new messages to the start
  messages.set(userId, userMessages);

  // Update message count
  user.messageCount = userMessages.length;
  users.set(userId, user);

  res.json(message);
});

app.get('/api/messages/:userId', (req, res) => {
  const { userId } = req.params;
  const userMessages = messages.get(userId);

  if (!userMessages) {
    return res.status(404).json({ error: 'Messages not found' });
  }

  res.json(userMessages);
});

app.post('/api/messages/:messageId/reactions', (req, res) => {
  const { messageId } = req.params;
  const { userId, reactionType } = req.body;
  
  const userMessages = messages.get(userId);
  if (!userMessages) {
    return res.status(404).json({ error: 'Messages not found' });
  }

  const message = userMessages.find(m => m.id === messageId);
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  message.reactions[reactionType]++;
  res.json(message);
});

app.delete('/api/messages/:userId/:messageId', (req, res) => {
  const { userId, messageId } = req.params;
  
  const userMessages = messages.get(userId);
  if (!userMessages) {
    return res.status(404).json({ error: 'Messages not found' });
  }

  const updatedMessages = userMessages.filter(m => m.id !== messageId);
  messages.set(userId, updatedMessages);

  // Update message count
  const user = users.get(userId);
  if (user) {
    user.messageCount = updatedMessages.length;
    users.set(userId, user);
  }

  res.json({ success: true });
});

app.post('/api/messages/:messageId/read', (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.body;
  
  const userMessages = messages.get(userId);
  if (!userMessages) {
    return res.status(404).json({ error: 'Messages not found' });
  }

  const message = userMessages.find(m => m.id === messageId);
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  message.isRead = true;
  res.json(message);
});

app.post('/api/messages/:messageId/reply', (req, res) => {
  const { messageId } = req.params;
  const { userId, reply } = req.body;
  
  const userMessages = messages.get(userId);
  if (!userMessages) {
    return res.status(404).json({ error: 'Messages not found' });
  }

  const message = userMessages.find(m => m.id === messageId);
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  message.reply = reply;
  res.json(message);
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
}); 