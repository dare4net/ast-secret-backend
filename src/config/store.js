// In-memory storage
const users = new Map(); // Store user data
const messages = new Map(); // Store messages for each user

const config = {
  host: "ast-secret.vercel.app",
  port: process.env.PORT || 5000,
  messageExpiryHours: 24
};

module.exports = {
  users,
  messages,
  config
};
