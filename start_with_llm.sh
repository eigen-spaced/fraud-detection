#!/bin/bash

# Startup script for Fraud Detection with LLM Integration
echo "🚀 Starting Fraud Detection System with LLM Integration"
echo "=================================================="

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env file not found"
    echo "   Creating from .env.example..."
    cp backend/.env.example backend/.env
    echo "   ✅ Created backend/.env - please add your OPEN_ROUTER_KEY"
fi

# Check if frontend .env.local exists
if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  Warning: frontend/.env.local file not found"
    echo "   Creating from .env.example..."
    cp frontend/.env.example frontend/.env.local
    echo "   ✅ Created frontend/.env.local"
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo ""
echo "🔍 Checking dependencies..."

if ! command_exists python3; then
    echo "❌ Python 3 not found. Please install Python 3.11+"
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi

echo "✅ All dependencies found"

# Start backend in background
echo ""
echo "🐍 Starting Backend (FastAPI)..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "   Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "   Installing Python dependencies..."
pip install -e . >/dev/null 2>&1

# Start backend server
echo "   Starting FastAPI server on port 8000..."
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Go back to root
cd ..

# Start frontend
echo ""
echo "⚛️  Starting Frontend (Next.js)..."
cd frontend

# Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "   Installing npm dependencies..."
    npm install >/dev/null 2>&1
fi

# Start frontend server
echo "   Starting Next.js development server on port 3000..."
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

# Go back to root
cd ..

echo ""
echo "🎉 Servers starting up!"
echo "=================================================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "🧪 To test LLM integration:"
echo "   1. Open the frontend at http://localhost:3000"
echo "   2. Look for the 'LLM Explanation' section"
echo "   3. Click the 'Test LLM' button"
echo ""
echo "⚠️  Make sure to set your OPEN_ROUTER_KEY in backend/.env"
echo ""
echo "Press Ctrl+C to stop both servers"

# Create cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Handle Ctrl+C
trap cleanup SIGINT

# Wait for user to stop
wait