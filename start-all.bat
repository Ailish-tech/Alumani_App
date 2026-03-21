@echo off
title AlumniConnect - Full Stack Launcher
color 0A

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   AlumniConnect - Full Stack Launcher    ║
echo  ╚══════════════════════════════════════════╝
echo.

:: ─── Open Firewall Ports (needs admin, fails silently if not) ──────────
netsh advfirewall firewall add rule name="AlumniConnect Backend 3000" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
netsh advfirewall firewall add rule name="AlumniConnect Expo 8081" dir=in action=allow protocol=TCP localport=8081 >nul 2>&1
netsh advfirewall firewall add rule name="AlumniConnect Expo 19000" dir=in action=allow protocol=TCP localport=19000 >nul 2>&1
netsh advfirewall firewall add rule name="AlumniConnect Expo 19006" dir=in action=allow protocol=TCP localport=19006 >nul 2>&1

:: ─── Step 1: Start DynamoDB Local (Docker) ─────────────────────────────
echo [1/4] Starting DynamoDB Local (Docker)...
cd /d "%~dp0"
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ERROR: Docker failed. Make sure Docker Desktop is running!
    echo  Download: https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)
echo       DynamoDB Local running on http://localhost:8000
echo.

:: ─── Step 2: Wait for DynamoDB to be ready ─────────────────────────────
echo [2/4] Waiting for DynamoDB to be ready...
timeout /t 3 /nobreak >nul

:: ─── Step 3: Create table + seed data ──────────────────────────────────
echo [3/4] Creating DynamoDB table + seeding test users...
cd /d "%~dp0backend"
call npx ts-node scripts/createTable.ts
echo.

:: ─── Step 4: Start Backend + Frontend in separate windows ──────────────
echo [4/4] Launching Backend + Frontend...
echo.

:: Start Backend (new window)
start "AlumniConnect Backend" cmd /k "cd /d "%~dp0backend" && echo. && echo  Backend starting on http://localhost:3000 && echo. && npm run dev"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

:: Start Frontend with QR code (new window)
start "AlumniConnect Frontend" cmd /k "cd /d "%~dp0frontend" && echo. && echo  Frontend starting with Expo (QR Code)... && echo. && npx expo start"

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║         All services launched!           ║
echo  ╠══════════════════════════════════════════╣
echo  ║                                          ║
echo  ║  DynamoDB Local  :  http://localhost:8000 ║
echo  ║  Backend API     :  http://localhost:3000 ║
echo  ║  Frontend (Expo) :  See QR in Expo window ║
echo  ║                                          ║
echo  ║  Scan the QR code with Expo Go app       ║
echo  ║  to open on your phone!                  ║
echo  ║                                          ║
echo  ╚══════════════════════════════════════════╝
echo.
echo   Press any key to stop all services...
echo.
pause

:: ─── Cleanup: Stop everything ──────────────────────────────────────────
echo.
echo  Stopping all services...
cd /d "%~dp0"
docker-compose down
taskkill /FI "WindowTitle eq AlumniConnect Backend*" /F >nul 2>&1
taskkill /FI "WindowTitle eq AlumniConnect Frontend*" /F >nul 2>&1
echo  All services stopped.
echo.
pause
