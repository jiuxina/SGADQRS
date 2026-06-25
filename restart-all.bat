@echo off
echo ========================================
echo   SGADQRS Project Restart Script
echo ========================================
echo.

echo [1/2] Stopping all services...
call "%~dp0stop-all.bat"

echo.
echo [2/2] Restarting all services...
timeout /t 2 /nobreak >nul
call "%~dp0start-all.bat"
