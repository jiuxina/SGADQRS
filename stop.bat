@echo off
setlocal

title SCMS Stop

echo.
echo ========================================
echo   SCMS - Stop Services
echo ========================================
echo.

echo Stopping services...
echo.

:: Stop backend window
echo [1/3] Stopping backend...
tasklist /fi "windowtitle eq SCMS Backend" 2>nul | find /i "cmd.exe" >nul
if not errorlevel 1 (
    taskkill /fi "windowtitle eq SCMS Backend" /t /f >nul 2>&1
    echo [OK] Backend stopped
) else (
    echo [--] Backend not running
)

:: Stop frontend window
echo [2/3] Stopping frontend...
tasklist /fi "windowtitle eq SCMS Frontend" 2>nul | find /i "cmd.exe" >nul
if not errorlevel 1 (
    taskkill /fi "windowtitle eq SCMS Frontend" /t /f >nul 2>&1
    echo [OK] Frontend stopped
) else (
    echo [--] Frontend not running
)

:: Stop animation demo window
echo [3/3] Stopping animation demo...
tasklist /fi "windowtitle eq Animation Demo" 2>nul | find /i "cmd.exe" >nul
if not errorlevel 1 (
    taskkill /fi "windowtitle eq Animation Demo" /t /f >nul 2>&1
    echo [OK] Animation demo stopped
) else (
    echo [--] Animation demo not running
)

:: Cleanup: kill processes on ports
echo.
echo [CLEANUP] Checking ports...

:: Kill process on port 8080 (backend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080 " ^| findstr "LISTENING" 2^>nul') do (
    echo [CLEANUP] Killing port 8080 process: %%a
    taskkill /pid %%a /f >nul 2>&1
)

:: Kill process on port 5174 (frontend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5174 " ^| findstr "LISTENING" 2^>nul') do (
    echo [CLEANUP] Killing port 5174 process: %%a
    taskkill /pid %%a /f >nul 2>&1
)

:: Kill process on port 3001 (animation demo)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 " ^| findstr "LISTENING" 2^>nul') do (
    echo [CLEANUP] Killing port 3001 process: %%a
    taskkill /pid %%a /f >nul 2>&1
)

echo.
echo ========================================
echo   All services stopped
echo ========================================
echo.
pause
exit /b 0
