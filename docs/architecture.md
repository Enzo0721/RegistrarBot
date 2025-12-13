# RegistrarBot System Architecture

RegistrarBot is a full-stack, stateful chatbot system composed of REST APIs,
real-time Socket.IO communication, persistent storage, and a locally hosted LLM.

## High-Level Components

### Backend (Node.js / Express)
- Handles REST API requests
- Serves Swagger documentation
- Manages Socket.IO connections
- Coordinates LLM requests and persistence

### Socket.IO Layer
- Provides real-time chat rooms
- Manages user join/leave lifecycle
- Triggers LLM responses when users are alone in a room
- Persists messages automatically

### LLM Integration
- Uses a locally hosted Ollama-compatible model
- Supports streaming responses
- Shared by REST and Socket workflows

### Persistence Layer
- PostgreSQL database accessed via Prisma
- Stores users, chat messages, and timestamps
- Chat history is append-only by design

### Frontend Sandbox
- Next.js-based development UI
- Communicates via REST and Socket.IO
- Used for testing and iteration

## Data Flow Summary

1. Client sends message (REST or Socket)
2. Message is persisted
3. LLM is invoked if applicable
4. Response is streamed back
5. Response is persisted
