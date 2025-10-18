# RegistrarBot 🤖

<img width="1024" height="1024" alt="" src="https://github.com/user-attachments/assets/c6e0182c-c811-454e-a736-bebc5b5c7b25" />

A modern RPI Registrar chatbot built with Express.js, Socket.io, and Next.js. Provides both REST API and real-time chat functionality with AI integration.

## 🚀 Features

- **REST API** - Query the chatbot via HTTP endpoints
- **Socket.io Based Chat** - Socket.io powered chat rooms
- **Web Interface** - Modern Next.js frontend with Tailwind CSS

## 📁 Project Structure

```
RegistrarBot/
├── src/                    # Backend source code
│   ├── index.js           # Main Express server
│   ├── routes/            # API route handlers
│   │   └── Test.js        # Chatbot API endpoints
│   └── socket/            # Socket.io handlers
│       └── chatroom.js    # Chat room functionality
├── config/                # Configuration files
│   └── index.js           # Server configuration & logging
├── devtools/              # Frontend development tools
│   └── sandbox/           # Next.js frontend application
│       ├── src/
│       │   ├── components/    # React components
│       │   └── pages/         # Next.js pages
│       └── config/            # Frontend configuration
├── package.json           # Backend dependencies
└── README.md
```

## ⚙️ Quick Setup

### 1. Clone & Install
```bash
git clone https://github.com/Enzo0721/RegistrarBot.git
cd RegistrarBot
npm i
cd devtools/sandbox && npm i && cd ../..
```

### 2. Environment Setup

**Backend** (`.env` in root):
```env
SERVER_ADDRESS=localhost
SERVER_PORT=3001
SOCKET_ORIGIN=*
VERBOSE=true
```

**Frontend** (`devtools/sandbox/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Install Ollama & Model
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama run qwen3
```

## 🚀 Running

**Start Ollama model:**
```bash
ollama run qwen3
```

**Backend:**
```bash
npm run dev
# Available at http://localhost:3001
```

**Frontend:**
```bash
cd devtools/sandbox
npm run dev
# Available at http://localhost:3000
```

## 📡 API Endpoints

- **GET** `/health` - Health check
- **POST** `/api/v1/test/ask` - Chat with bot
- **GET** `/api/docs` - Swagger documentation

## 🔌 Socket Events

- `joinRoom` - Join chat room
- `chatMessage` - Send/receive messages
- `userJoined`/`userLeft` - User notifications

## 🐛 Troubleshooting

- **Port conflicts**: `npx kill-port 3001`
- **Ollama issues**: Ensure `ollama run qwen3` is running
- **Connection issues**: Check `.env` files and restart servers

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.