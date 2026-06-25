@echo off
echo ========================================
echo   SGADQRS Project Stop Script
echo ========================================
echo.

echo Stopping all services...

echo [1/2] Stopping frontend services...
taskkill /FI "WINDOWTITLE eq Frontend-5174*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq AnimationDemo-3001*" /F >nul 2>&1

echo [2/2] Stopping backend service...
taskkill /FI "WINDOWTITLE eq Backend-8080*" /F >nul 2>&1

echo.
echo ========================================
echo   All services stopped!
echo ========================================
echo.
pause
