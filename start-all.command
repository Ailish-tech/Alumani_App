#!/bin/bash

# Use Node 22 LTS (Expo SDK 52 is incompatible with Node 25+)
export PATH="/opt/homebrew/opt/node@22/bin:$PATH:/usr/local/bin:/opt/homebrew/bin:$HOME/.docker/bin:/Volumes/AdnaanSSD/Applications/Docker.app/Contents/Resources/bin"

# Get the absolute directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "==========================================="
echo "   AlumniConnect - Mac Full Stack Launcher "
echo "==========================================="
echo ""

echo "[1/4] Starting DynamoDB Local (Docker)..."
cd "$DIR" || exit 1
docker compose up -d
if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Docker failed to start."
    echo "Make sure Docker Desktop is open and running!"
    echo ""
    read -p "Press [Enter] to exit..."
    exit 1
fi
echo "DynamoDB Local running on http://localhost:8000"
echo ""

echo "[2/4] Waiting for DynamoDB to be ready..."
sleep 3

echo "[3/4] Creating DynamoDB table & seeding test users..."
cd "$DIR/backend" || exit 1
npx ts-node scripts/createTable.ts
echo ""

echo "[4/4] Launching Backend and Frontend in new Terminal windows..."

# Use osascript to open a new Terminal window for the backend
osascript -e "tell application \"Terminal\" to do script \"export PATH=/opt/homebrew/opt/node@22/bin:\$PATH && cd '$DIR/backend' && echo 'Backend starting on http://localhost:3001' && npm run dev\""

# Wait a moment for the backend to start
sleep 3

# Use osascript to open another Terminal window for the frontend
osascript -e "tell application \"Terminal\" to do script \"export PATH=/opt/homebrew/opt/node@22/bin:\$PATH && cd '$DIR/frontend' && echo 'Frontend starting with Expo (QR Code)...' && npx expo start\""

echo ""
echo "==========================================="
echo "           All services launched!          "
echo "==========================================="
echo " DynamoDB Local  : http://localhost:8000   "
echo " Backend API     : http://localhost:3001   "
echo " Frontend (Expo) : See QR in new window    "
echo "==========================================="
echo ""
echo "Press [Enter] when you want to stop the Docker database and exit..."
read -r empty_input

echo ""
echo "Stopping Docker container..."
cd "$DIR" || exit 1
docker compose down

echo ""
echo "Docker services stopped. You can safely close the Backend and Frontend Terminal windows now."
echo "Goodbye!"
