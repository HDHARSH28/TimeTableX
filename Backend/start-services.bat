@echo off
REM Start both Backend and Optimizer services

echo.
echo ========================================
echo  Timetable Scheduler - Full Stack Start
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Starting services...
echo.

REM Start Python Optimizer in new window
echo Launching Python Optimizer Service on port 8000...
start "Timetable Optimizer" cmd /k "cd optimizer && python scheduler.py"

REM Wait for optimizer to start
timeout /t 3 /nobreak

REM Start Node.js Backend in new window
echo Launching Node.js Backend on port 3001...
start "Timetable Backend" cmd /k "npm run dev"

echo.
echo ========================================
echo Services Started Successfully!
echo ========================================
echo.
echo Optimizer (OR-Tools): http://localhost:8000
echo Backend API:          http://localhost:3001
echo Frontend (Vite):      http://localhost:5175
echo.
echo Press CTRL+C in each window to stop the services.
echo.
pause
