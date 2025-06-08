# AST Secret Backend

Simple Express backend for the anonymous messaging app with in-memory storage.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`.

## API Endpoints

### Users

- `POST /api/users` - Create a new temporary user
  ```json
  {
    "username": "string",
    "usePin": "boolean",
    "isPublic": "boolean"
  }
  ```

- `GET /api/users/:username` - Get user information

### Messages

- `POST /api/messages` - Send a message
  ```json
  {
    "userId": "string",
    "content": "string",
    "isPublic": "boolean"
  }
  ```

- `GET /api/messages/:userId` - Get all messages for a user

- `POST /api/messages/:messageId/reactions` - Add reaction to a message
  ```json
  {
    "userId": "string",
    "reactionType": "heart | fire | laugh"
  }
  ```

- `DELETE /api/messages/:userId/:messageId` - Delete a message

## Features

- In-memory storage of users and messages
- Automatic cleanup of expired users and messages (24-hour expiry)
- CORS enabled for frontend integration
- Message reactions support
- Public/private message toggle 