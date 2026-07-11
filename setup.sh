#!/bin/bash

echo "========================================="
echo "Ask Your Documents - Setup Script"
echo "========================================="
echo ""

# Check Python version
echo "Checking Python version..."
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2]))')
echo "Python version: $PYTHON_VERSION"
echo ""

# Check Node.js version
echo "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"
echo ""

# Setup Backend
echo "========================================="
echo "Setting up Backend..."
echo "========================================="
echo ""

cd backend

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Please edit backend/.env and configure your LLM_PROVIDER and API key (OpenAI, Gemini, or OpenRouter)!"
fi

cd ..

echo ""
echo "========================================="
echo "Setting up Frontend..."
echo "========================================="
echo ""

cd frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

cd ..

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "To run the application:"
echo ""
echo "1. Make sure you have configured your LLM provider & API key in backend/.env"
echo ""
echo "2. Start the backend server:"
echo "   cd backend"
echo "   source venv/bin/activate  (or venv\\Scripts\\activate on Windows)"
echo "   HF_HUB_OFFLINE=1 uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "3. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Open your browser to http://localhost:5173"
echo ""
echo "========================================="