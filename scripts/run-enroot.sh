#!/bin/bash
# run-enroot.sh - Run RegistrarBot services with Enroot
# Usage: ./run-enroot.sh [start|stop|status|logs]

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENROOT_DATA="${ENROOT_DATA:-$HOME/.local/share/enroot}"

# Source configuration if it exists
if [ -f "$PROJECT_ROOT/enroot-config.env" ]; then
    source "$PROJECT_ROOT/enroot-config.env"
fi

# Load environment variables from .env
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

COMMAND=${1:-start}

start_database() {
    echo -e "${GREEN}Starting PostgreSQL database...${NC}"
    
    nohup enroot start \
        --root \
        --rw \
        --mount "$HOME/registrarbot-data/postgres:/var/lib/postgresql/data" \
        --env POSTGRES_USER="${DB_USER:-myuser}" \
        --env POSTGRES_PASSWORD="${DB_PASSWORD:-mypassword}" \
        --env POSTGRES_DB="${DB_NAME:-registrarbot_db}" \
        "$ENROOT_DB_IMAGE" \
        postgres \
        > "$HOME/registrarbot-data/logs/db.log" 2>&1 &
    
    DB_PID=$!
    echo "$DB_PID" > "$HOME/registrarbot-data/db.pid"
    echo "  → Database started (PID: $DB_PID)"
    
    # Wait for database to be ready
    echo "  → Waiting for database to be ready..."
    sleep 8
}

start_app() {
    echo -e "${GREEN}Starting RegistrarBot API...${NC}"
    
    # Get database container hostname
    DB_HOST="${DB_HOST:-localhost}"
    
    nohup enroot start \
        --root \
        --rw \
        --mount "$PROJECT_ROOT/src:/app/src" \
        --mount "$PROJECT_ROOT/config:/app/config" \
        --mount "$PROJECT_ROOT/prisma:/app/prisma" \
        --env DATABASE_URL="postgresql://${DB_USER:-myuser}:${DB_PASSWORD:-mypassword}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME:-registrarbot_db}" \
        --env SERVER_PUBLIC_URL="http://localhost:${APP_HOST_PORT:-3000}" \
        --env SERVER_ADDRESS="${SERVER_ADDRESS:-http://localhost}" \
        --env SERVER_PORT="${SERVER_PORT:-5000}" \
        --env SOCKET_ORIGIN="${SOCKET_ORIGIN:-*}" \
        "$ENROOT_APP_IMAGE" \
        node src/index.js \
        > "$HOME/registrarbot-data/logs/app.log" 2>&1 &
    
    APP_PID=$!
    echo "$APP_PID" > "$HOME/registrarbot-data/app.pid"
    echo "  → App started (PID: $APP_PID)"
    echo "  → API available at: http://localhost:${APP_HOST_PORT:-3000}"
}

start_sandbox() {
    echo -e "${GREEN}Starting Sandbox UI...${NC}"
    
    nohup enroot start \
        --root \
        --rw \
        --mount "$PROJECT_ROOT/devtools/sandbox/src:/app/src" \
        --mount "$PROJECT_ROOT/devtools/sandbox/config:/app/config" \
        --env PORT="${SANDBOX_PORT:-3001}" \
        --env HOSTNAME="0.0.0.0" \
        --env NEXT_PUBLIC_API_URL="http://localhost:${APP_HOST_PORT:-3000}" \
        "$ENROOT_SANDBOX_IMAGE" \
        npm run dev \
        > "$HOME/registrarbot-data/logs/sandbox.log" 2>&1 &
    
    SANDBOX_PID=$!
    echo "$SANDBOX_PID" > "$HOME/registrarbot-data/sandbox.pid"
    echo "  → Sandbox started (PID: $SANDBOX_PID)"
    echo "  → UI available at: http://localhost:${SANDBOX_HOST_PORT:-3001}"
}

stop_services() {
    echo -e "${YELLOW}Stopping services...${NC}"
    
    if [ -f "$HOME/registrarbot-data/app.pid" ]; then
        APP_PID=$(cat "$HOME/registrarbot-data/app.pid")
        kill $APP_PID 2>/dev/null && echo "  → App stopped" || echo "  → App not running"
        rm "$HOME/registrarbot-data/app.pid"
    fi
    
    if [ -f "$HOME/registrarbot-data/sandbox.pid" ]; then
        SANDBOX_PID=$(cat "$HOME/registrarbot-data/sandbox.pid")
        kill $SANDBOX_PID 2>/dev/null && echo "  → Sandbox stopped" || echo "  → Sandbox not running"
        rm "$HOME/registrarbot-data/sandbox.pid"
    fi
    
    if [ -f "$HOME/registrarbot-data/db.pid" ]; then
        DB_PID=$(cat "$HOME/registrarbot-data/db.pid")
        kill $DB_PID 2>/dev/null && echo "  → Database stopped" || echo "  → Database not running"
        rm "$HOME/registrarbot-data/db.pid"
    fi
}

show_status() {
    echo "==================================================================="
    echo "RegistrarBot Service Status"
    echo "==================================================================="
    
    check_service() {
        local name=$1
        local pidfile=$2
        
        if [ -f "$pidfile" ]; then
            local pid=$(cat "$pidfile")
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "  ${GREEN}●${NC} $name (PID: $pid) - Running"
            else
                echo -e "  ${RED}●${NC} $name - Stopped (stale PID file)"
            fi
        else
            echo -e "  ${RED}●${NC} $name - Not running"
        fi
    }
    
    check_service "Database" "$HOME/registrarbot-data/db.pid"
    check_service "App" "$HOME/registrarbot-data/app.pid"
    check_service "Sandbox" "$HOME/registrarbot-data/sandbox.pid"
    
    echo ""
    echo "Endpoints:"
    echo "  • API: http://localhost:${APP_HOST_PORT:-3000}/health"
    echo "  • Docs: http://localhost:${APP_HOST_PORT:-3000}/api/docs"
    echo "  • Sandbox: http://localhost:${SANDBOX_HOST_PORT:-3001}"
}

show_logs() {
    echo "Log locations:"
    echo "  → $HOME/registrarbot-data/logs/"
    echo ""
    echo "To view logs in real-time:"
    echo "  tail -f $HOME/registrarbot-data/logs/*.log"
}

case "$COMMAND" in
    start)
        echo "==================================================================="
        echo "Starting RegistrarBot on Enroot"
        echo "==================================================================="
        start_database
        sleep 3
        start_app
        start_sandbox
        echo ""
        echo -e "${GREEN}All services started!${NC}"
        show_status
        ;;
    stop)
        stop_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    restart)
        stop_services
        sleep 2
        $0 start
        ;;
    *)
        echo "Usage: $0 {start|stop|status|logs|restart}"
        exit 1
        ;;
esac
