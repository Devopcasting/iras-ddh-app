#!/bin/bash

echo "🚀 Starting IRAS-DDH Frontend (Next.js)..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo "🌐 Starting Next.js development server..."
echo "📍 Frontend will be available at: http://localhost:9002"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev 