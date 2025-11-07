# AI Model Testing / Mid-Semester Proof of Work
Documented_by: Zaid Siddiqui
Models_Tested:
  - GPT-4 (ChatGPT)
  - Ollama (local)
  - LLaMA (local)
  - Google Gemini
Quick_Setup:
  Clone_Install: |
    git clone https://github.com/Enzo0721/RegistrarBot.git
    cd RegistrarBot
    npm install
    cd devtools/sandbox && npm install && cd ../..
  Environment_Backend: |
    SERVER_ADDRESS=localhost
    SERVER_PORT=3001
    SOCKET_ORIGIN=*
    VERBOSE=true
  Environment_Frontend: |
    NEXT_PUBLIC_API_URL=http://localhost:3001
  Install_Ollama: |
    curl -fsSL https://ollama.ai/install.sh | sh
    ollama run qwen3
Running_Project:
  Start_Ollama: ollama run qwen3
  Backend: |
    npm run dev
    # Available at http://localhost:3001
  Frontend: |
    cd devtools/sandbox
    npm run dev
    # Available at http://localhost:3000
API_Endpoints:
  - GET /health - Health check
  - POST /api/v1/test/ask - Chat with bot
  - GET /api/docs - Swagger documentation
Socket_Events:
  - joinRoom - Join chat room
  - chatMessage - Send/receive messages
  - userJoined/userLeft - User notifications
Prompts_Used:
"Provide a link to the RPI academic calendar for Fall 2025."

"What are the final exam dates for the current semester?"

"List all available majors and minors at RPI."

"How can I check my grades online?"

"Show me the steps to register for classes using RPI’s portal."

"Provide the URL for the course catalog for the Computer Science department."

"How do I drop or add a class after registration has started?"

"List the office hours and contact info for the Registrar’s Office."

"Show me how to request an official transcript."

"Provide links to all scholarship and financial aid pages."

"Explain how to apply for graduation online."

"Check if the student has any holds on their account."

"Provide the schedule for Spring 2026 classes in Electrical Engineering."

"Generate a step-by-step guide for changing my major."

"List all deadlines for tuition payments this semester."

"Provide links to course descriptions for 4000-level CS courses."

"Check if a particular class is full or has available seats."

"Explain how to register for an independent study course."

"Provide links to student resources for academic advising and planning."

GitHub: https://github.com/zaidsiddiqui2401

