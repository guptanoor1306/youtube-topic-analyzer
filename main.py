"""
Root-level main.py for Railway deployment
This imports and runs the actual app from backend/main.py
"""
import sys
import os

# Add backend directory to Python path FIRST
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.insert(0, backend_path)

# Change to backend directory to load .env correctly
os.chdir(backend_path)

# Now import - this will work because backend is in sys.path
import main as backend_main

# Export the app so uvicorn can find it
app = backend_main.app

# This allows Railway to run: uvicorn main:app
# And it will use the app from backend/main.py

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

