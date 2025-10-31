# 🚀 Deployment Guide - Vercel + Railway

Complete guide to deploy your YouTube Topic Analyzer to production.

---

## 📋 Prerequisites

- [x] GitHub account
- [x] Vercel account (sign up at vercel.com)
- [x] Railway account (sign up at railway.app)
- [x] YouTube API Key
- [x] OpenAI API Key

---

## 🎯 Deployment Overview

```
┌─────────────────┐         ┌──────────────────┐
│                 │         │                  │
│  Frontend       │────────▶│    Backend       │
│  (Vercel)       │  API    │   (Railway)      │
│                 │  Calls  │                  │
│  React + Vite   │         │  FastAPI Python  │
└─────────────────┘         └──────────────────┘
```

---

## 🔧 Part 1: Deploy Backend to Railway

### Step 1: Push to GitHub

```bash
# Make sure all changes are committed
git status

# Push to GitHub
git push origin main
```

### Step 2: Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `topic-selection` repository
5. Railway will auto-detect the Python app

### Step 3: Configure Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```
YOUTUBE_API_KEY=your_actual_youtube_api_key
OPENAI_API_KEY=your_actual_openai_api_key
PORT=8000
```

### Step 4: Configure Build Settings

Railway should auto-detect, but verify:

**Root Directory:** Leave empty (Railway will use railway.json)
**Build Command:** `cd backend && pip install -r requirements.txt`
**Start Command:** `cd backend && python main.py`

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for deployment to complete (2-3 minutes)
3. Railway will provide a URL like: `https://your-app.railway.app`
4. Click **"Generate Domain"** to get a public URL
5. **Copy this URL** - you'll need it for Vercel!

### Step 6: Test Backend

```bash
curl https://your-railway-url.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "YouTube Topic Analyzer API",
  "youtube_api": "configured",
  "openai_api": "configured"
}
```

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Update Frontend Config

Edit `frontend/.env.production`:

```bash
VITE_API_BASE_URL=https://your-railway-url.railway.app
```

**Replace with your actual Railway URL from Part 1!**

### Step 2: Commit and Push

```bash
cd /Users/noorgupta/Downloads/Cursor/topic-selection
git add frontend/.env.production
git commit -m "Update production API URL"
git push origin main
```

### Step 3: Create Vercel Project

1. Go to https://vercel.com
2. Click **"Add New Project"**
3. Import your GitHub repository `topic-selection`
4. Vercel will auto-detect Vite

### Step 4: Configure Build Settings

**Framework Preset:** Vite
**Root Directory:** `frontend`
**Build Command:** `npm run build`
**Output Directory:** `dist`

### Step 5: Add Environment Variable

In Vercel dashboard, go to **Settings > Environment Variables**:

```
VITE_API_BASE_URL = https://your-railway-url.railway.app
```

**Important:** Add this to **Production**, **Preview**, and **Development** environments!

### Step 6: Deploy

1. Click **"Deploy"**
2. Wait for deployment (1-2 minutes)
3. Vercel will provide URLs like:
   - Production: `https://your-app.vercel.app`
   - Preview: `https://your-app-git-main.vercel.app`

### Step 7: Test Frontend

1. Visit your Vercel URL
2. You should see the YouTube Topic Analyzer homepage
3. Try analyzing a topic to test the full flow

---

## 🔒 Part 3: Configure CORS (Backend)

Your backend needs to allow requests from Vercel.

Railway already has this configured in `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**For better security**, update `allow_origins`:

```python
allow_origins=[
    "https://your-app.vercel.app",
    "http://localhost:3000"  # For local development
]
```

Then commit and push to redeploy.

---

## ✅ Part 4: Verification Checklist

### Backend Health Check
- [ ] Railway deployment successful
- [ ] `/health` endpoint returns healthy status
- [ ] Environment variables configured
- [ ] Domain generated and accessible

### Frontend Health Check
- [ ] Vercel deployment successful
- [ ] Homepage loads correctly
- [ ] API connection working
- [ ] Can analyze topics
- [ ] Can generate titles
- [ ] Can generate thumbnails

### Full Integration Test
1. [ ] Visit Vercel URL
2. [ ] Enter channels and analyze topic
3. [ ] View results
4. [ ] Navigate to Title Generation
5. [ ] See 30 relevant titles (5-10 seconds)
6. [ ] Select a title
7. [ ] Generate thumbnail
8. [ ] Download generated thumbnail

---

## 🐛 Troubleshooting

### Issue: Backend not responding

**Check Railway logs:**
```
Railway Dashboard → Your Project → Deployments → View Logs
```

**Common issues:**
- Missing environment variables
- Port not set to 8000
- Python dependencies failed to install

### Issue: Frontend can't connect to backend

**Check:**
1. `VITE_API_BASE_URL` is set correctly in Vercel
2. Railway backend is running
3. CORS is configured correctly
4. Railway domain is public

**Test in browser console:**
```javascript
fetch('https://your-railway-url.railway.app/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

### Issue: "API Key not configured"

**Check Railway environment variables:**
- `YOUTUBE_API_KEY` is set
- `OPENAI_API_KEY` is set
- No extra spaces or quotes
- Variables are saved and deployed

### Issue: Vercel build fails

**Common fixes:**
1. Check `package.json` in frontend folder
2. Ensure `npm run build` works locally
3. Verify root directory is set to `frontend`
4. Check build logs in Vercel dashboard

---

## 💰 Cost Estimates

### Railway (Backend)
- **Hobby Plan:** $5/month
- **Starter Plan:** $20/month (recommended)
- Includes: 500 GB bandwidth, always-on deployment

### Vercel (Frontend)
- **Hobby Plan:** FREE
- Unlimited bandwidth for personal projects
- Automatic HTTPS and CDN

### APIs
- **YouTube API:** FREE (10,000 quota/day)
- **OpenAI API:** Pay-per-use
  - GPT-4-Turbo: ~$0.01 per request
  - DALL-E 3: ~$0.04 per image
  - Estimated: $10-50/month depending on usage

**Total: ~$5-70/month** depending on plan and usage

---

## 🔄 Redeployment

### Backend (Railway)
```bash
git add .
git commit -m "Update backend"
git push origin main
```
Railway auto-deploys from main branch.

### Frontend (Vercel)
```bash
git add .
git commit -m "Update frontend"
git push origin main
```
Vercel auto-deploys from main branch.

---

## 🌍 Custom Domain (Optional)

### For Vercel (Frontend)
1. Go to Vercel Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as shown
4. Wait for DNS propagation (up to 48 hours)

### For Railway (Backend)
1. Go to Railway Project Settings
2. Click "Add Custom Domain"
3. Add domain and configure DNS
4. Update `VITE_API_BASE_URL` in Vercel with new domain

---

## 📊 Monitoring

### Railway Metrics
- View logs in real-time
- Monitor CPU/Memory usage
- Check deployment history

### Vercel Analytics
- Free analytics for all projects
- Page views, performance metrics
- Error tracking

---

## 🎉 You're Done!

Your app is now live at:
- **Frontend:** https://your-app.vercel.app
- **Backend:** https://your-app.railway.app

Share the Vercel URL with users!

---

## 📝 Quick Commands Reference

```bash
# Check deployment status
git status
git log --oneline -5

# Redeploy both
git add .
git commit -m "Update"
git push origin main

# Test locally before deploying
cd backend && python main.py  # Terminal 1
cd frontend && npm run dev    # Terminal 2
```

---

## 🆘 Need Help?

- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs
- **Project README:** Check RELEVANCE_IMPROVEMENTS.md

---

**Happy Deploying! 🚀**

