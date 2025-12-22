"""Railway deployment entry point - imports app from backend/"""
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

# Change to backend directory so .env loads correctly
import os
os.chdir(str(backend_dir))

# Import the app
from main import app

# Export for uvicorn
__all__ = ["app"]

