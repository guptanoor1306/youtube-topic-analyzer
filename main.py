"""
Root-level main.py for Railway deployment
This imports and runs the actual app from backend/main.py
"""
import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Import the FastAPI app from backend
from backend.main import app

# This allows Railway to run: uvicorn main:app
# And it will use the app from backend/main.py

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

