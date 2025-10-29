#!/bin/bash

# Clean startup script for the backend
cd /Users/noorgupta/Downloads/Cursor/topic-selection/backend

# Unset any existing OpenAI key environment variable
unset OPENAI_API_KEY
unset YOUTUBE_API_KEY

# Kill any existing process on port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null

# Wait a moment
sleep 2

# Activate virtual environment
source venv/bin/activate

# Start the server
echo "🚀 Starting backend server..."
python main.py


