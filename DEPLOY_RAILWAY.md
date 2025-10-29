# 🚂 Deploy Backend to Railway (Recommended)

Railway has NO timeout limits and $5 free credit per month!

## 🚀 Quick Deploy (5 Minutes)

### Step 1: Install Railway CLI

```bash
npm install -g railway
```

### Step 2: Login to Railway

```bash
railway login
```

This will open a browser for authentication.

### Step 3: Deploy Backend

```bash
cd /Users/noorgupta/Downloads/Cursor/topic-selection/backend

# Initialize Railway project
railway init

# Name it: youtube-topic-backend

# Link to GitHub (optional but recommended)
railway link

# Deploy
railway up

# Add environment variables
railway variables set OPENAI_API_KEY=your_openai_key
railway variables set YOUTUBE_API_KEY=your_youtube_key

# Get your Railway URL
railway domain
```

### Step 4: Update Frontend

1. Go to Vercel → Frontend project
2. Settings → Environment Variables
3. Update `VITE_API_URL` to your Railway URL:
   ```
   https://your-app.railway.app
   ```
4. Redeploy frontend

---

## 🎯 Or Use Railway Dashboard

### Web Interface Method:

1. Go to https://railway.app
2. Sign up / Login
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose: `guptanoor1306/youtube-topic-analyzer`
6. Root Directory: `backend`
7. Add environment variables:
   - `OPENAI_API_KEY`
   - `YOUTUBE_API_KEY`
8. Deploy!

Railway will automatically:
- ✅ Install dependencies
- ✅ Start your FastAPI server
- ✅ Give you a public URL
- ✅ Handle unlimited request duration

---

## 💰 Cost

- **Free $5 credit/month**
- After that: Pay as you go (~$5-10/month for light usage)
- NO timeout limits!

---

## ✅ After Railway Deployment

Update your frontend's `VITE_API_URL` to the Railway URL and redeploy.

Then you can:
- ✅ Use all 15 videos
- ✅ Long AI processing
- ✅ No timeouts!

---

**Need help with Railway setup? Let me know!**

