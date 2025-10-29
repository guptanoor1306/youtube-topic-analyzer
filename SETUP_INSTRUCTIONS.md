# 🚀 Quick Setup Instructions

## ✅ Status
- ✓ Backend dependencies installed
- ✓ Frontend dependencies installed  
- ✓ Frontend server running on http://localhost:3000
- ⚠️  **ACTION REQUIRED**: Add API keys to start backend

## 📍 Where to Add API Keys

### Step 1: Open the `.env` file
The file is located at:
```
/Users/noorgupta/Downloads/Cursor/topic-selection/backend/.env
```

### Step 2: Add Your API Keys

Open the file in any text editor and replace the placeholders:

```env
# YouTube Data API v3 Key
YOUTUBE_API_KEY=YOUR_ACTUAL_YOUTUBE_API_KEY_HERE

# OpenAI API Key  
OPENAI_API_KEY=YOUR_ACTUAL_OPENAI_API_KEY_HERE
```

### Step 3: Get Your API Keys

#### YouTube Data API v3:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Create a new project (or select existing)
3. Enable "YouTube Data API v3"
4. Create credentials → API Key
5. Copy the key and paste it in `.env`

#### OpenAI API:
1. Go to: https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key and paste it in `.env`

### Step 4: Start the Backend

After adding your API keys, run:

```bash
cd /Users/noorgupta/Downloads/Cursor/topic-selection/backend
source venv/bin/activate
python main.py
```

## 🌐 Access the Application

Once both servers are running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🎯 Quick Test

1. Open http://localhost:3000 in your browser
2. Enter channel ID: `UCUUlw3anBIkbW9W44Y-eURw` (Zero1 by Zerodha)
3. Click "Continue to Video Selection"
4. Select videos and explore!

## ⚠️ Troubleshooting

**Backend won't start:**
- Make sure you've added valid API keys to `.env`
- Check if another process is using port 8000

**Frontend errors:**
- Backend must be running on port 8000
- Check browser console for errors

## 📝 Notes

- The `.env` file is in `.gitignore` - your API keys are safe
- Both servers must be running for the app to work
- Frontend uses proxy to connect to backend

