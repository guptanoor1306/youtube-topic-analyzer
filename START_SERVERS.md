# 🚀 Start Servers Guide

## The Issue

There's an environment variable `OPENAI_API_KEY` set in your shell that contains the placeholder text. This overrides the .env file.

## ✅ Solution: Use These Commands

### Terminal 1 - Start Backend (Clean Environment)

```bash
cd /Users/noorgupta/Downloads/Cursor/topic-selection/backend

# Method 1: Using the startup script
./start.sh

# OR Method 2: Manual commands
env -i HOME="$HOME" PATH="$PATH" USER="$USER" bash -c '
  cd /Users/noorgupta/Downloads/Cursor/topic-selection/backend &&
  source venv/bin/activate &&
  python main.py
'
```

### Terminal 2 - Start Frontend

```bash
cd /Users/noorgupta/Downloads/Cursor/topic-selection/frontend
npm run dev
```

## 🔍 Verify It's Working

1. Backend should show:
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

2. Test the API key:
   ```bash
   curl http://localhost:8000/health
   ```

3. Open browser: http://localhost:3000

4. Select videos and click "Suggest Series" - you should see AI-generated results!

## ⚠️ If You Still Get API Key Errors

Check your shell config files and remove any OPENAI_API_KEY exports:

```bash
# Check these files:
cat ~/.zshrc | grep OPENAI
cat ~/.bash_profile | grep OPENAI
cat ~/.bashrc | grep OPENAI

# If you find any, edit the file and remove those lines
```

## 🧪 Quick Test

Run this to verify the .env file is correct:

```bash
cd /Users/noorgupta/Downloads/Cursor/topic-selection/backend
cat .env | grep OPENAI_API_KEY
```

Should show a key starting with `sk-proj-` that's 150+ characters long.

