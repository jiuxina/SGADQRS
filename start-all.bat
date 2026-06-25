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

echo [1/3] Starting Backend (port 8080)...
cd /d "%~dp0backend"
start "Backend-8080" cmd /k "mvn spring-boot:run"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend (port 5174)...
cd /d "%~dp0frontend"
start "Frontend-5174" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

echo [3/3] Starting Animation Demo (port 3001)...
cd /d "%~dp0frontend-animation-demo"
start "AnimationDemo-3001" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo   Backend:        http://localhost:8080
echo   Frontend:       http://localhost:5174
echo   Animation Demo: http://localhost:3001
echo.
echo   Press any key to close this window...
pause >nul
