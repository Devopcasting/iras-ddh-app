#!/bin/bash

echo "🚀 Starting IRAS-DDH Backend with Migration..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup first."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Run migration to add station_code column
echo "🔄 Running database migration..."
python migrate_add_station_code.py

# Start the server
echo "🚀 Starting FastAPI server..."
python run.py 