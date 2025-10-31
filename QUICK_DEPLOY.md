# ⚡ Quick Deploy Guide

## 🚀 Deploy in 5 Minutes!

### Step 1: Push to GitHub (if not already done)

```bash
git push origin main
```

---

### Step 2: Deploy Backend to Railway

1. **Go to:** https://railway.app/new
2. **Click:** "Deploy from GitHub repo"
3. **Select:** `topic-selection` repository
4. **Add Environment Variables:**
   - `YOUTUBE_API_KEY` = your_youtube_api_key
   - `OPENAI_API_KEY` = your_openai_api_key
   - `PORT` = 8000

5. **Click:** "Deploy"
6. **Wait:** 2-3 minutes
7. **Click:** "Generate Domain" to get public URL
8. **Copy:** Your Railway URL (e.g., `https://abc123.railway.app`)

---

### Step 3: Deploy Frontend to Vercel

1. **Go to:** https://vercel.com/new
2. **Click:** "Import" your GitHub `topic-selection` repo
3. **Configure:**
   - Framework: **Vite**
   - Root Directory: **frontend**
   - Build Command: **npm run build**
   - Output Directory: **dist**

4. **Add Environment Variable:**
   - Name: `VITE_API_BASE_URL`
   - Value: `https://your-railway-url.railway.app` (from Step 2)

5. **Click:** "Deploy"
6. **Wait:** 1-2 minutes
7. **Done!** Your app is live at `https://your-app.vercel.app`

---

### Step 4: Test

Visit your Vercel URL and try:
1. Analyze a topic
2. Generate titles (should work in 5-10 seconds!)
3. Generate thumbnails

---

## ✅ That's It!

**Your app is now live!** 🎉

- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-railway-url.railway.app`

---

## 🐛 Issues?

Check full guide: `DEPLOYMENT_GUIDE.md`

### Quick Checks:
- ✅ Environment variables set in Railway
- ✅ Railway backend URL correct in Vercel
- ✅ `/health` endpoint works: `curl https://your-railway-url.railway.app/health`

