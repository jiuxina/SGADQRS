@echo off
setlocal

title TeamUp Startup

echo.
echo ========================================
echo   SCMS - Student Competition System
echo ========================================
echo.

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

echo [INFO] Project: %ROOT_DIR%
echo.

:: ===== Check Java =====
echo [1/5] Checking Java...
java -version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Java not found! Please install JDK 17+
    goto :fail
)
echo [OK] Java installed
echo.

:: ===== Check Node.js =====
echo [2/5] Checking Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found! Please install Node.js 18+
    goto :fail
)
echo [OK] Node.js installed
echo.

:: ===== Check MySQL =====
echo [3/5] Checking MySQL...
mysql --version >nul 2>&1
if errorlevel 1 (
    echo [WARN] mysql command not found
    echo [WARN] Please ensure MySQL is running on localhost:3306
    echo.
    goto :skip_db
)

echo [OK] MySQL client found

mysql -u root -proot -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo [WARN] Cannot connect to MySQL (root/root@localhost:3306)
    echo [WARN] Please start MySQL service first
    echo.
    goto :skip_db
)

echo [OK] MySQL connected

mysql -u root -proot -e "USE scms;" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Creating database scms...
    mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS scms DEFAULT CHARACTER SET utf8mb4;"
    if errorlevel 1 (
        echo [ERROR] Failed to create database
        goto :fail
    )
    echo [OK] Database created
    
    if exist "%BACKEND_DIR%\sql\init.sql" (
        echo [INFO] Initializing tables...
        mysql -u root -proot scms < "%BACKEND_DIR%\sql\init.sql" >nul 2>&1
        echo [OK] Tables initialized
    )
) else (
    echo [OK] Database scms exists

    :: 旧库自动升级：缺少社区表(recruit_post)时执行 TeamUp 升级脚本
    mysql -u root -proot -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='scms' AND table_name='recruit_post';" 2>nul | findstr "0" >nul
    if not errorlevel 1 (
        if exist "%BACKEND_DIR%\sql\upgrade-teamup.sql" (
            echo [INFO] Upgrading schema for TeamUp community...
            mysql -u root -proot scms < "%BACKEND_DIR%\sql\upgrade-teamup.sql" >nul 2>&1
            echo [OK] Schema upgraded
        )
    )
)

:skip_db
echo.

:: ===== Start Backend =====
echo [4/5] Starting backend...
echo.

:: Check for pre-built jar
set "JAR_FILE=%BACKEND_DIR%\target\scms-backend-1.0.0.jar"
if not exist "%JAR_FILE%" (
    echo [ERROR] Backend jar not found: %JAR_FILE%
    echo [ERROR] Please build the project first or install Maven
    goto :fail
)

echo [INFO] Starting backend (port 8080)...
start "SCMS Backend" cmd /k "java -jar "%JAR_FILE%""
echo [OK] Backend window opened

echo [INFO] Waiting 15 seconds for backend...
timeout /t 15 /nobreak >nul

:: ===== Start Frontend =====
echo [5/5] Starting frontend services...
echo.

if not exist "%FRONTEND_DIR%\package.json" (
    echo [ERROR] frontend\package.json not found!
    goto :fail
)

if not exist "%FRONTEND_DIR%\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd /d "%FRONTEND_DIR%"
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed!
        goto :fail
    )
)

echo [INFO] Starting frontend (port 3000)...
start "SCMS Frontend" /D "%FRONTEND_DIR%" cmd /k "npm run dev"
echo [OK] Frontend window opened

echo [INFO] Waiting 5 seconds...
timeout /t 5 /nobreak >nul

:: ===== Open Browser =====
echo [INFO] Opening browser...
start http://localhost:3000

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo   Frontend:       http://localhost:3000
echo   Backend:        http://localhost:8080/api
echo.
echo   Accounts:
echo     Admin:   admin / 123456
echo     Teacher: T2024001 / 123456
echo     Student: S20210001 / 123456
echo.
echo   To stop: run stop.bat
echo.
echo ========================================
echo.
pause
exit /b 0

:fail
echo.
echo ========================================
echo   Startup failed! See errors above.
echo ========================================
echo.
pause
exit /b 1
