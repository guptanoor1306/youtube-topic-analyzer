"""
Root-level main.py for Railway deployment
This sets up the path and imports the actual app from backend/main.py
"""
import sys
import os

# Get absolute paths
root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, 'backend')

# Add backend to path so imports work
sys.path.insert(0, backend_dir)

# CRITICAL: Change working directory to backend BEFORE importing
# This ensures .env loads correctly and relative imports work
os.chdir(backend_dir)

# Now we can safely import the app
# The import will execute backend/main.py which has all the relative imports
try:
    print("=" * 60)
    print("🔧 ROOT WRAPPER: Loading backend/main.py...")
    print(f"   Working dir: {os.getcwd()}")
    print(f"   Python path: {sys.path[:2]}")
    print("=" * 60)
    
    import main as backend_main
    app = backend_main.app
    
    print("✅ Successfully loaded app from backend/main.py")
    print("=" * 60)
    
except Exception as e:
    print("=" * 60)
    print(f"❌ ERROR loading backend/main.py: {e}")
    print("=" * 60)
    import traceback
    traceback.print_exc()
    raise

# Export app for uvicorn
# Railway will run: uvicorn main:app --host 0.0.0.0 --port $PORT

