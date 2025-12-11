#!/bin/bash
# deploy-enroot.sh - Deploy RegistrarBot to NVIDIA Enroot
# This script builds Docker images and converts them for Enroot

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENROOT_DATA="${ENROOT_DATA:-$HOME/.local/share/enroot}"

echo "==================================================================="
echo "RegistrarBot - Enroot Deployment Script"
echo "==================================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build Docker images
echo -e "${GREEN}[1/5] Building Docker images...${NC}"
cd "$PROJECT_ROOT"
docker compose build

# Step 2: Export Docker images to tarballs
echo -e "${GREEN}[2/5] Exporting Docker images...${NC}"
mkdir -p enroot-images

echo "  → Exporting app image..."
docker save registrarbot-app:latest -o enroot-images/registrarbot-app.tar

echo "  → Exporting database image..."
docker pull postgres:15-alpine
docker save postgres:15-alpine -o enroot-images/postgres-db.tar

echo "  → Exporting sandbox image (if needed)..."
cd devtools/sandbox
docker compose build
docker save sandbox-sandbox:latest -o ../../enroot-images/sandbox.tar
cd "$PROJECT_ROOT"

# Step 3: Import images into Enroot
echo -e "${GREEN}[3/5] Importing images into Enroot...${NC}"

echo "  → Importing app..."
enroot import -o "$ENROOT_DATA/registrarbot-app.sqsh" dockerd://registrarbot-app:latest

echo "  → Importing database..."
enroot import -o "$ENROOT_DATA/postgres-db.sqsh" dockerd://postgres:15-alpine

echo "  → Importing sandbox..."
enroot import -o "$ENROOT_DATA/sandbox.sqsh" dockerd://sandbox-sandbox:latest

# Step 4: Create runtime directories
echo -e "${GREEN}[4/5] Setting up runtime directories...${NC}"
mkdir -p "$HOME/registrarbot-data/postgres"
mkdir -p "$HOME/registrarbot-data/logs"

# Step 5: Create Enroot configuration
echo -e "${GREEN}[5/5] Creating Enroot configuration...${NC}"
cat > "$PROJECT_ROOT/enroot-config.env" << EOF
# Enroot Runtime Configuration for RegistrarBot
# Source this file before running containers

# Database
export ENROOT_DB_DATA="$HOME/registrarbot-data/postgres"
export DB_PORT=5432

# Application
export APP_PORT=3000
export SERVER_PORT=5000

# Sandbox
export SANDBOX_PORT=3001

# Enroot image paths
export ENROOT_APP_IMAGE="$ENROOT_DATA/registrarbot-app.sqsh"
export ENROOT_DB_IMAGE="$ENROOT_DATA/postgres-db.sqsh"
export ENROOT_SANDBOX_IMAGE="$ENROOT_DATA/sandbox.sqsh"
EOF

echo -e "${GREEN}==================================================================="
echo "Deployment Complete!"
echo "===================================================================${NC}"
echo ""
echo "Images created:"
echo "  • $ENROOT_DATA/registrarbot-app.sqsh"
echo "  • $ENROOT_DATA/postgres-db.sqsh"
echo "  • $ENROOT_DATA/sandbox.sqsh"
echo ""
echo "Next steps:"
echo "  1. Source the config: source enroot-config.env"
echo "  2. Start services: ./run-enroot.sh"
echo ""
echo -e "${YELLOW}Note: Enroot containers run independently. See run-enroot.sh for details.${NC}"
