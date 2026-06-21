@echo off
setlocal

echo.
echo ========================================
echo   SCMS - Restart Services
echo ========================================
echo.

:: Stop first
echo [1/2] Stopping existing services...
call "%~dp0stop.bat"

:: Wait
timeout /t 2 /nobreak >nul

:: Start
echo [2/2] Starting services...
call "%~dp0start.bat"
