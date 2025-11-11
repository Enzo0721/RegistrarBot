# RegistrarBot 🤖

<img width="1024" height="1024" alt="" src="https://github.com/user-attachments/assets/c6e0182c-c811-454e-a736-bebc5b5c7b25" />

A modern RPI Registrar chatbot built with Express.js, Socket.io, and Next.js. Provides both REST API and real-time chat functionality with AI integration.

## 🚀 Features

- **REST API** - Query the chatbot via HTTP endpoints
- **Socket.io Based Chat** - Socket.io powered chat rooms
- **Web Interface** - Modern Next.js frontend with Tailwind CSS

## 📝 Development Status & Tasks

<!-- MONDAY_BOARD_START -->
| Task | Status |
|---|---|
| Environment | Working on it |
| Security Protocols | Not Started |
| LLM | Stuck |
| Database | Working on it |
| Dashboard | Not Started |
| Chatroom | Working on it |
| Multilingual | Not Started |
| Documentation & Git | Working on it |

<!-- MONDAY_BOARD_END -->

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

### Option 1: Docker (Recommended)

**Main Application (Backend + Database):**
```bash
# From project root
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Services & Ports:**
- **Port 3000**: RegistrarBot API Server (Express + Socket.IO)
  - Health Check: http://localhost:3000/health
  - API Docs (Swagger): http://localhost:3000/api/docs
  - Chat API: http://localhost:3000/api/v1/test/ask
- **Port 5432**: PostgreSQL Database
  - Used internally by the app and Prisma
  - Connection: `postgresql://myuser:mypassword@localhost:5432/registrarbot_db`

**Sandbox (Frontend Development Tool):**
```bash
# From devtools/sandbox directory
cd devtools/sandbox
docker-compose up -d --build

# View logs
docker-compose logs -f
```

**Sandbox Ports:**
- **Port 3001**: Next.js Development Server
  - Web UI for testing the chatbot: http://localhost:3001
  - Hot reload enabled for frontend development

### Option 2: Local Development

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

## 🗄️ Database Management with Prisma Studio

Prisma Studio is a visual database browser that lets you view and edit your database data through a web interface.

**Starting Prisma Studio:**
```bash
# Local development (outside Docker)
npx prisma studio

# Access at: http://localhost:5555
```

**What Prisma Studio Does:**
- 📊 **Browse Data**: View all tables and records in a visual interface
- ✏️ **Edit Records**: Add, update, or delete database entries
- 🔍 **Filter & Search**: Query your data with filters
- 🔗 **Relations**: Navigate relationships between tables

**Common Use Cases:**
- Inspect data after API calls
- Manually add test data
- Debug database issues
- Verify migrations worked correctly

**Note**: Prisma Studio connects to your database using the `DATABASE_URL` in your `.env` file. Make sure your database is running (via Docker or locally) before starting Studio.

## 🐛 Troubleshooting

### Docker Issues
- **Docker daemon not running**: 
  - Start Docker Desktop on Windows
  - Enable WSL integration: Docker Desktop → Settings → Resources → WSL Integration
  - Verify with: `docker ps`
- **Database connection issues**: Check logs with `docker-compose logs db`
- **Port conflicts**: Modify ports in `docker-compose.yml` if 3000, 3001, or 5432 are in use

### Local Development Issues
- **Port conflicts**: `npx kill-port 3001`
- **Ollama issues**: Ensure `ollama run qwen3` is running
- **Connection issues**: Check `.env` files and restart servers

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.