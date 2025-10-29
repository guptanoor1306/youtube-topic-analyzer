# 🔧 API Key Troubleshooting Guide

## Issues Fixed ✅

1. **OpenAI API**: Updated to new format (openai>=1.0.0)
2. **YouTube Transcript API**: Fixed incorrect method calls  
3. **Results Component**: Added missing `setAppState` prop
4. **JSX Warning**: Fixed `>` character encoding in UI

## ⚠️ Current Issue: OpenAI API Key

The backend logs show:
```
OpenAI API error: Error code: 401 - Incorrect API key provided
```

### Solutions:

#### Option 1: Check Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Check if your current key is still active
3. If expired or revoked, create a new key
4. Copy the FULL key (starts with `sk-proj-...`)
5. Update `/Users/noorgupta/Downloads/Cursor/topic-selection/backend/.env`:

```env
OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE
```

#### Option 2: Verify Key Format

Your key should look like:
```
sk-proj-...very-long-string-with-letters-and-numbers...
```

Make sure:
- No spaces before or after the key
- The entire key is on one line
- No quotes around the key

#### Option 3: Test Your Key

Run this command to test:

```bash
cd /Users/noorgupta/Downloads/Cursor/topic-selection/backend
source venv/bin/activate
python3 -c "
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

try:
    response = client.chat.completions.create(
        model='gpt-3.5-turbo',
        messages=[{'role': 'user', 'content': 'Say hello'}],
        max_tokens=10
    )
    print('✅ OpenAI API key is VALID!')
    print(f'Response: {response.choices[0].message.content}')
except Exception as e:
    print(f'❌ OpenAI API key is INVALID')
    print(f'Error: {str(e)}')
"
```

## 🔄 After Fixing the API Key

1. **Restart the backend**:
```bash
cd /Users/noorgupta/Downloads/Cursor/topic-selection/backend
# Kill existing process
lsof -ti:8000 | xargs kill -9 2>/dev/null
# Start fresh
source venv/bin/activate
python main.py > backend_live.log 2>&1 &
```

2. **Refresh your browser** at http://localhost:3000

3. **Try generating suggestions** again

## 💡 What Should Work Now:

✅ **Video Selection**: Shows long-form videos (>3 min) sorted by views  
✅ **Duration & Views**: Displayed for each video  
✅ **Transcript Fetching**: Fixed API calls  
✅ **AI Generation**: Will work once API key is valid  

## 📊 Expected Flow:

1. Select 1-5 videos from your channel
2. Click "Suggest Series" OR "Suggest Format"
3. (Optional) Add custom instructions
4. Wait 10-30 seconds for AI processing
5. View detailed suggestions with:
   - Series ideas with episodes
   - Additional topics
   - Content gaps
   - Format adaptations (if using competitor videos)

## 🆘 Still Having Issues?

Check backend logs:
```bash
tail -20 /Users/noorgupta/Downloads/Cursor/topic-selection/backend/backend_live.log
```

Look for:
- ✅ `suggest-series` or `suggest-format` endpoint calls
- ❌ Any "OpenAI API error" messages
- ❌ Any "401" authentication errors

