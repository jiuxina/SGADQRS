@echo off
echo ========================================
echo   SGADQRS Project Startup Script
echo ========================================
echo.

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo [1/2] Starting Backend (port 8080)...
cd /d "%~dp0backend"
start "Backend-8080" cmd /k "mvn spring-boot:run"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (port 3000)...
cd /d "%~dp0frontend"
start "Frontend-3000" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo   Backend:        http://localhost:8080/api
echo   Frontend:       http://localhost:3000
echo.
echo   Press any key to close this window...
pause >nul
