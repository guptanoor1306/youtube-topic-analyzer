# 🚀 Quick Deployment Guide

You have **two deployments** running:

## 🚂 **Railway (Backend) - Currently Deploying**

✅ **Already Set Up & Auto-Deploying!**

**What it does:**
- Runs your Python FastAPI backend
- Handles YouTube API calls
- Processes AI requests via OpenAI

**Your Railway URL:** `https://youtube-topic-analyzer-production.up.railway.app`

**Status:** 🔵 DEPLOYING (as shown in your screenshot)

---

## ⚡ **Action Required: Add Environment Variables to Railway**

1. Go to **Railway Dashboard**
2. Click on your service
3. Go to **"Variables"** tab
4. Add these 3 variables:

```
OPENAI_API_KEY=your_openai_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here  
PORT=8000
```

5. **Redeploy** (or it will auto-redeploy)

---

## 🔺 **Vercel (Frontend) - Needs Setup**

**What it does:**
- Hosts your React frontend
- Fast global CDN
- Connects to Railway backend

### Setup Steps:

#### 1. Go to Vercel
Visit: [vercel.com](https://vercel.com) and sign in

#### 2. Import Project
- Click **"Add New Project"**
- Select **"Import Git Repository"**
- Choose: `guptanoor1306/youtube-topic-analyzer`

#### 3. Configure Build
Set these values:

```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build  
Output Directory: dist
Install Command: npm install
```

#### 4. Add Environment Variable
Add this in Vercel's environment variables section:

```
VITE_API_URL=https://youtube-topic-analyzer-production.up.railway.app
```

Make sure to add it for **Production**, **Preview**, and **Development**.

#### 5. Deploy
Click **"Deploy"** and wait 2-3 minutes!

---

## ✅ Verification Checklist

### Railway Backend:
- [ ] Environment variables added (3 variables)
- [ ] Deployment successful (green checkmark)
- [ ] Test: Visit `https://youtube-topic-analyzer-production.up.railway.app/docs`
  - Should show FastAPI documentation

### Vercel Frontend:
- [ ] Project imported from GitHub
- [ ] Root directory set to `frontend`
- [ ] Environment variable `VITE_API_URL` added
- [ ] Deployment successful
- [ ] Test: Open your Vercel URL and search for a channel

---

## 🧪 Quick Test

Once both are deployed:

1. **Open your Vercel URL**
2. **Search for:** "Zero1 by Zerodha"
3. **Select 3-4 videos**
4. **Run "Most Trending" template**
5. **Check if topics appear** with info buttons

If it works → 🎉 **You're live!**

---

## 🐛 Troubleshooting

### Railway backend not responding:
1. Check **Railway Dashboard → Logs**
2. Verify all 3 environment variables are set
3. Make sure deployment shows "Active" (green)

### Frontend can't connect to backend:
1. Check browser console (F12) for errors
2. Verify `VITE_API_URL` in Vercel settings
3. Test backend directly: `curl https://youtube-topic-analyzer-production.up.railway.app/`

### CORS error:
✅ **Already fixed!** Your backend CORS includes Vercel domains.

---

## 💰 Cost Summary

- **Railway**: ~$5/month (Hobby Plan)
- **Vercel**: Free (Hobby Plan)
- **OpenAI API**: ~$0.03 per analysis
- **YouTube API**: Free (10,000 units/day)

**Total:** $5-10/month depending on usage

---

## 📱 Your Live URLs (After Setup)

**Backend API:** https://youtube-topic-analyzer-production.up.railway.app  
**API Docs:** https://youtube-topic-analyzer-production.up.railway.app/docs  
**Frontend App:** https://your-project.vercel.app (will be assigned after Vercel setup)

---

## 🎯 What Railway is Deploying Right Now

From your screenshot, I can see:
- 🔵 **"feat: Complete redesign with AI-powered..."** (3 min ago)
- 🔵 **"docs: Add comprehensive Vercel deploy..."** (2 min ago)

These are your latest commits being deployed automatically! ✅

Once the deployment finishes (usually 2-3 min), your backend will be updated with all the new features.

---

## 📚 More Help

- **Detailed Railway Setup:** See `RAILWAY_SETUP.md`
- **Detailed Vercel Setup:** See `DEPLOYMENT.md`
- **Project README:** See `README.md`

---

*Created: December 22, 2025*
*Your deployments are in progress! 🚀*

