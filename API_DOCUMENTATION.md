# API Documentation

Complete guide to all available endpoints in the RegistrarBot API.

**Base URL**: `http://localhost:3000` (or your configured `SERVER_ADDRESS:SERVER_PORT`)

---

## REST Endpoints

### Health Check

**GET** `/health` or `/api/health`

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "uptime": 1234.56,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Test Endpoints

**GET** `/api/v1/test/ping`

```bash
curl http://localhost:3000/api/v1/test/ping
```

**Response:**
```json
{
  "ping": "pong"
}
```

**POST** `/api/v1/test/ask`

```bash
curl -X POST http://localhost:3000/api/v1/test/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the weather like?"}'
```

**Response:**
```json
{
  "question": "What is the weather like?",
  "response": "I'm a helpful cat assistant..."
}
```

---

### Chat History Endpoints

#### POST `/api/v1/chat/save`

Save chat messages (appends to existing history, does not overwrite).

**Single Message:**
```bash
curl -X POST http://localhost:3000/api/v1/chat/save \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "message": {
      "role": "user",
      "content": "Hello, how are you?"
    }
  }'
```

**Batch Messages:**
```bash
curl -X POST http://localhost:3000/api/v1/chat/save \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "messages": [
      {"role": "user", "content": "What is the capital of France?"},
      {"role": "assistant", "content": "The capital of France is Paris."}
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "userId": 1,
  "messageId": 42,
  "message": "Message appended to chat history successfully"
}
```

**Request Body:**
- `username` (string, required): Unique username
- `email` (string, optional): Email address
- `name` (string, optional): Display name
- `message` (object, required*): Single message with `role` ("system"|"user"|"assistant") and `content`
- `messages` (array, required*): Array of message objects

*Either `message` or `messages` must be provided.

---

#### GET `/api/v1/chat/history`

Retrieve complete chat history for a user.

```bash
curl "http://localhost:3000/api/v1/chat/history?username=john_doe"
```

**Response:**
```json
{
  "success": true,
  "userId": 1,
  "username": "john_doe",
  "lastOnline": "2024-01-15T10:30:00.000Z",
  "messages": [
    {"role": "system", "content": "you are a helpful cat assistant..."},
    {"role": "user", "content": "Hello, how are you?"},
    {"role": "assistant", "content": "Meow! I'm doing great!"}
  ]
}
```

**Query Parameters:**
- `username` (string, required): Username of the user

---

#### POST `/api/v1/chat/save-full`

Save entire conversation history with automatic deduplication.

```bash
curl -X POST http://localhost:3000/api/v1/chat/save-full \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "history": [
      {"role": "system", "content": "you are a helpful cat assistant..."},
      {"role": "user", "content": "Hello"},
      {"role": "assistant", "content": "Meow! Hello there!"}
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "userId": 1,
  "count": 2,
  "totalInHistory": 3,
  "alreadyExisted": 1,
  "message": "Saved 2 new message(s), 1 already existed"
}
```

**Request Body:**
- `username` (string, required): Unique username
- `email` (string, optional): Email address
- `name` (string, optional): Display name
- `history` (array, required): Complete conversation history

---

## Socket.IO Events

Messages sent via Socket.IO are automatically saved to the database.

### Client → Server

#### `join_room`
```javascript
socket.emit("join_room", roomId, username);
```
- `roomId` (string): Room identifier
- `username` (string): Username

**Auto-actions:** Creates/retrieves user, loads chat history, initializes LLM.

#### `chat_message`
```javascript
socket.emit("chat_message", { message: "Hello!" });
```
- `message` (string): Message content

**Auto-actions:** Saves user message. If alone in room, LLM responds and response is saved.

### Server → Client

#### `user_joined`
```javascript
socket.on("user_joined", (username, userCount) => {
  // username: string, userCount: number
});
```

#### `chat_message`
```javascript
socket.on("chat_message", (data) => {
  // data: { user: string, message: string, timestamp: Date }
});
```

#### `llm_start`
```javascript
socket.on("llm_start", () => {
  // LLM is processing
});
```

#### `llm_end`
```javascript
socket.on("llm_end", (data) => {
  // data: { user: "ollama", message: string, timestamp: Date }
});
```

#### `llm_error`
```javascript
socket.on("llm_error", (data) => {
  // data: { error: string }
});
```

#### `room_full`
```javascript
socket.on("room_full", (data) => {
  // data: { room: string }
});
```

#### `user_disconnected`
```javascript
socket.on("user_disconnected", (username, userCount) => {
  // username: string, userCount: number
});
```

### Example Usage

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.emit('join_room', 'room123', 'john_doe');

socket.on('user_joined', (username, count) => {
  console.log(`${username} joined (${count} users)`);
});

socket.emit('chat_message', { message: 'Hello!' });

socket.on('chat_message', (data) => {
  console.log(`${data.user}: ${data.message}`);
});

socket.on('llm_end', (data) => {
  console.log(`Assistant: ${data.message}`);
});
```

---

## Swagger Documentation

Interactive API docs: **GET** `/api/docs`

Visit `http://localhost:3000/api/docs` for Swagger UI with try-it-out functionality.

---

## Notes

- All messages are **appended** to database (never overwritten)
- Messages automatically saved via Socket.IO: user messages, assistant responses, system prompt
- `lastOnline` timestamp updated on each message save
- Chat history persists across sessions
- Usernames must be unique
- Timestamps in ISO 8601 format (UTC)

---

## Error Responses

**400 Bad Request:**
```json
{"error": "Error message"}
```

**404 Not Found:**
```json
{"error": "User not found"}
```

**500 Internal Server Error:**
```json
{"error": "Internal server error message"}
```
