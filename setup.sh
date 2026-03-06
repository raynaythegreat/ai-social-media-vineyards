#!/bin/bash

echo "🍷 Setting up Social Media Engine for Vineyards..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"

# Install dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create .env if it doesn't exist
if [ ! -f backend/.env ]; then
    echo ""
    echo "⚙️  Creating backend/.env file..."
    cp backend/.env.example backend/.env
    echo ""
    echo "⚠️  IMPORTANT: Edit backend/.env and add your OPENAI_API_KEY"
    echo ""
fi

echo "✅ Setup complete!"
echo ""
echo "To start the app:"
echo "  1. Add your OpenAI API key to backend/.env"
echo "  2. Run: npm run dev"
echo "  3. Open: http://localhost:5173"
echo ""
