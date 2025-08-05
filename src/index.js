const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createServer } = require('http');
const logger = require('./logger');
const { initializeSocket } = require('./config/socket');
const { config } = require('./config/store');
const UserService = require('./services/userService');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

// Constants
const PORT = config.port;

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

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the AST Secret API');
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Clean expired data every hour
setInterval(UserService.cleanExpiredUsers, 1000 * 60 * 60);



// Start server
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
}); 