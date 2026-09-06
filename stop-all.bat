@echo off
echo ========================================
echo   SGADQRS Project Stop Script
echo ========================================
echo.

echo Stopping all services...

echo [1/2] Stopping frontend service...
taskkill /FI "WINDOWTITLE eq Frontend-3000*" /F >nul 2>&1

echo [2/2] Stopping backend service...
taskkill /FI "WINDOWTITLE eq Backend-8080*" /F >nul 2>&1

echo.
echo ========================================
echo   All services stopped!
echo ========================================
echo.
pause
