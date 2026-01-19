@echo off
echo ==========================================
echo   Lektion Arkiv - Local Startup Script
echo ==========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo After installing, run this script again.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found.
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies (this may take a minute)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed.
) else (
    echo [INFO] Dependencies already installed.
)

echo.
echo [INFO] Starting development server...
echo.
call npm run dev

pause
