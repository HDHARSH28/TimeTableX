#!/bin/bash

# Start both Backend and Optimizer services for Unix/Linux/Mac

echo ""
echo "========================================"
echo " Timetable Scheduler - Full Stack Start"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+ from https://www.python.org"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "Starting services..."
echo ""

# Start Python Optimizer in background
echo "Launching Python Optimizer Service on port 8000..."
(cd optimizer && python3 scheduler.py) &
OPTIMIZER_PID=$!

# Wait for optimizer to start
sleep 3

# Start Node.js Backend
echo "Launching Node.js Backend on port 3001..."
npm run dev &
BACKEND_PID=$!

echo ""
echo "========================================"
echo "Services Started Successfully!"
echo "========================================"
echo ""
echo "Optimizer (OR-Tools): http://localhost:8000"
echo "Backend API:          http://localhost:3001"
echo "Frontend (Vite):      http://localhost:5175"
echo ""
echo "To stop services, run: kill $OPTIMIZER_PID $BACKEND_PID"
echo ""

# Wait for both processes
wait $OPTIMIZER_PID $BACKEND_PID
