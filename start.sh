#!/bin/bash

# AI Car Wash Chain Optimizer - Start Script
# ==========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║     🚗💦  AI Car Wash Chain Optimizer  💦🚗     ║"
echo "║         SparkleWash Management Platform          ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found! Creating default...${NC}"
  cat > .env << 'EOF'
DATABASE_URL=postgresql://carwash_user:carwash_pass@localhost:5432/carwash_optimizer
DB_HOST=localhost
DB_PORT=5432
DB_NAME=carwash_optimizer
DB_USER=carwash_user
DB_PASSWORD=carwash_pass
BACKEND_PORT=3001
FRONTEND_PORT=3000
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL=anthropic/claude-haiku-4.5
JWT_SECRET=carwash-optimizer-secret-key-2024
EOF
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Default .env created${NC}"
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# Function to kill processes on ports
cleanup_ports() {
  echo -e "${YELLOW}→ Cleaning up ports $BACKEND_PORT and $FRONTEND_PORT...${NC}"

  for PORT in $BACKEND_PORT $FRONTEND_PORT; do
    PID=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$PID" ]; then
      echo -e "  Killing process on port $PORT (PID: $PID)"
      kill -9 $PID 2>/dev/null || true
      sleep 1
    fi
  done

  echo -e "${GREEN}✓ Ports cleaned${NC}"
}

# Function to cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}→ Shutting down services...${NC}"

  # Kill background processes
  if [ -n "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID 2>/dev/null || true
  fi

  # Kill any remaining processes on our ports
  for PORT in $BACKEND_PORT $FRONTEND_PORT; do
    PID=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$PID" ]; then
      kill -9 $PID 2>/dev/null || true
    fi
  done

  echo -e "${GREEN}✓ All services stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Clean up ports first
cleanup_ports

# Check PostgreSQL
echo -e "${BLUE}→ Checking PostgreSQL...${NC}"
if command -v pg_isready &> /dev/null; then
  if pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
  else
    echo -e "${YELLOW}⚠ PostgreSQL not responding. Attempting to start...${NC}"
    if command -v brew &> /dev/null; then
      brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
      sleep 2
    fi
  fi
fi

# Setup database
echo -e "${BLUE}→ Setting up database...${NC}"

# Create user and database if they don't exist
psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" 2>/dev/null | grep -q 1 || \
  psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U postgres -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}' CREATEDB;" 2>/dev/null || true

psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null | grep -q 1 || \
  psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null || true

# Grant privileges
psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" 2>/dev/null || true
psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U postgres -d ${DB_NAME} -c "GRANT ALL ON SCHEMA public TO ${DB_USER};" 2>/dev/null || true

echo -e "${GREEN}✓ Database ready${NC}"

# Install dependencies
echo -e "${BLUE}→ Installing backend dependencies...${NC}"
cd "$SCRIPT_DIR/backend"
npm install --silent 2>/dev/null
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

echo -e "${BLUE}→ Installing frontend dependencies...${NC}"
cd "$SCRIPT_DIR/frontend"
npm install --silent 2>/dev/null
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

cd "$SCRIPT_DIR"

# Run database seed
echo -e "${BLUE}→ Seeding database with sample data...${NC}"
cd "$SCRIPT_DIR/backend"
node src/db/seed.js
echo -e "${GREEN}✓ Database seeded successfully${NC}"

cd "$SCRIPT_DIR"

# Start backend with nodemon for hot reload
echo -e "${PURPLE}→ Starting backend server (port $BACKEND_PORT) with hot reload...${NC}"
cd "$SCRIPT_DIR/backend"
npx nodemon src/server.js &
BACKEND_PID=$!
cd "$SCRIPT_DIR"
sleep 2

# Start frontend with hot reload (React default)
echo -e "${PURPLE}→ Starting frontend (port $FRONTEND_PORT) with hot reload...${NC}"
cd "$SCRIPT_DIR/frontend"
BROWSER=none PORT=$FRONTEND_PORT npm start &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              Services Started!                   ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  Frontend:  ${GREEN}http://localhost:$FRONTEND_PORT${NC}                ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  Backend:   ${GREEN}http://localhost:$BACKEND_PORT${NC}                ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  Database:  ${GREEN}PostgreSQL on :${DB_PORT:-5432}${NC}               ${CYAN}║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  Login:     ${YELLOW}admin@carwash.com / password123${NC}     ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  AI Model:  ${YELLOW}${OPENROUTER_MODEL}${NC}  ${CYAN}║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  ${PURPLE}Both servers auto-reload on code changes${NC}       ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  Press ${RED}Ctrl+C${NC} to stop all services             ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Wait for background processes
wait
