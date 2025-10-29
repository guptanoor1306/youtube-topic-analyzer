# 🚀 Deploy Backend to Vercel

## ⚠️ Important Considerations

Vercel serverless functions have limitations:
- **Free Plan**: 10-second timeout
- **Pro Plan**: 60-second timeout
- Our AI operations can take 20-60 seconds

**Recommendation**: Pro plan or use Railway/Render for backend.

---

## 📦 Backend Deployment Steps

### Step 1: Prepare Backend for Vercel

Already done! ✅ Files created:
- `backend/vercel.json` - Vercel configuration
- `backend/requirements-vercel.txt` - Dependencies

### Step 2: Push Backend Changes to GitHub

```bash
cd /Users/noorgupta/Downloads/Cursor/topic-selection

git add .
git commit -m "Add Vercel backend configuration"
git push origin main
```

### Step 3: Deploy Backend to Vercel

**Option A: Using Vercel Dashboard**

1. Go to https://vercel.com/new
2. Import your repository again
3. Configure:
   - **Project Name**: `youtube-topic-backend`
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)

4. Add Environment Variables:
   - `OPENAI_API_KEY` = your_openai_key
   - `YOUTUBE_API_KEY` = your_youtube_key

5. Click "Deploy"

**Option B: Using Vercel CLI**

```bash
cd /Users/noorgupta/Downloads/Cursor/topic-selection/backend
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Link to existing project? No
# - Project name? youtube-topic-backend
# - Directory? ./
# - Override settings? No
```

Then add environment variables:
```bash
vercel env add OPENAI_API_KEY
vercel env add YOUTUBE_API_KEY
```

Redeploy:
```bash
vercel --prod
```

### Step 4: Get Backend URL

After deployment, you'll get:
```
https://youtube-topic-backend-xxxx.vercel.app
```

### Step 5: Update Frontend Environment Variable

1. Go to your frontend project on Vercel
2. Settings → Environment Variables
3. Update `VITE_API_URL`:
   ```
   Key: VITE_API_URL
   Value: https://youtube-topic-backend-xxxx.vercel.app
   ```
4. Go to Deployments → Redeploy

---

## ✅ Verification

Test your backend:
```bash
curl https://youtube-topic-backend-xxxx.vercel.app/health
# Should return: {"status":"healthy"}
```

---

## 🐛 Common Issues

### Issue 1: Function Timeout (508 Error)

**Symptom**: Requests timeout after 10 seconds

**Solutions**:
1. Upgrade to Vercel Pro ($20/month) for 60s timeout
2. Use Railway/Render instead (recommended)
3. Optimize API calls (reduce transcript size)

### Issue 2: Module Import Errors

**Solution**: Make sure `requirements-vercel.txt` matches `requirements.txt`

### Issue 3: Environment Variables Not Working

**Solution**: 
1. Go to Settings → Environment Variables
2. Make sure they're set for Production
3. Redeploy after adding variables

---

## 💡 Alternative: Railway (Recommended for Backend)

If Vercel times out, use Railway:

```bash
# Install Railway CLI
npm install -g railway

# Login
railway login

# Deploy
cd /Users/noorgupta/Downloads/Cursor/topic-selection/backend
railway init
railway up

# Add environment variables
railway variables set OPENAI_API_KEY=your_key
railway variables set YOUTUBE_API_KEY=your_key
```

Railway gives you:
- ✅ No timeout limits
- ✅ $5 free credit/month
- ✅ Better for long-running operations
- ✅ Automatic SSL

---

## 📊 Comparison

| Feature | Vercel (Free) | Vercel (Pro) | Railway |
|---------|---------------|--------------|---------|
| Timeout | 10s | 60s | None |
| Cost | Free | $20/mo | $5/mo |
| Best For | Frontend | Light APIs | Heavy APIs |

---

## 🎯 Recommended Setup

**For Production:**
- Frontend → Vercel (Free)
- Backend → Railway ($5/month)

**For Quick Demo:**
- Try Vercel backend first
- If it times out, switch to Railway

---

## 🚀 Quick Deploy Both

```bash
# Frontend (already deployed)
# Just update environment variable

# Backend
cd /Users/noorgupta/Downloads/Cursor/topic-selection/backend
vercel --prod

# Get the URL and update frontend
```

---

**Next Steps:**
1. ✅ Deploy backend to Vercel
2. ✅ Copy backend URL
3. ✅ Update frontend VITE_API_URL
4. ✅ Test the app!

