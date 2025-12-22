# Railway + Vercel Deployment Setup

Your project uses a **split deployment** strategy:
- **Railway**: Backend API (Python/FastAPI)
- **Vercel**: Frontend (React/Vite)

---

## ✅ What's Already Configured

### Railway Backend:
- ✅ Auto-deploys from GitHub
- ✅ Python backend with FastAPI
- ✅ URL: `https://youtube-topic-analyzer-production.up.railway.app`

### Vercel Frontend:
- ⏳ Needs setup (see below)
- Will connect to Railway backend
- Fast CDN delivery

---

## 🚂 Railway Backend Setup

### 1. Add Environment Variables in Railway

Go to: **Railway Dashboard → Your Project → Variables Tab**

Add these variables:

```
OPENAI_API_KEY=your_openai_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here
PORT=8000
```

### 2. Verify Backend is Running

Once the current deployment finishes (you can see it's deploying now):

**Test URL:** `https://youtube-topic-analyzer-production.up.railway.app/docs`

You should see the FastAPI Swagger documentation.

### 3. Check Logs

If anything fails:
1. Railway Dashboard → Your Service
2. Click **"Deployments"** tab
3. Click on latest deployment → **"View Logs"**

---

## 🔺 Vercel Frontend Setup

### 1. Import Your Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import: `guptanoor1306/youtube-topic-analyzer`
4. Click **"Import"**

### 2. Configure Build Settings

**Framework Preset:** Vite
**Root Directory:** `frontend`
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`

### 3. Add Environment Variable

In Vercel, add this environment variable:

```
VITE_API_URL=https://youtube-topic-analyzer-production.up.railway.app
```

**Important:** Add it for **Production**, **Preview**, and **Development** environments.

### 4. Deploy

Click **"Deploy"** and wait 2-3 minutes.

Your frontend will be live at: `https://your-project.vercel.app`

---

## 🧪 Testing the Full Stack

### 1. Test Backend API Directly

```bash
curl https://youtube-topic-analyzer-production.up.railway.app/
```

Should return: `{"message":"YouTube Topic Analyzer API"}`

### 2. Test Frontend → Backend Connection

1. Open your Vercel URL
2. Search for a channel (e.g., "Zero1 by Zerodha")
3. If it works → ✅ Everything is connected!
4. If it fails → Check browser console (F12) for errors

---

## 🔧 Local Development

### Backend (Railway-compatible):

```bash
cd backend

# Create .env file
cp .env.example .env
# Add your API keys

# Run locally
./venv/bin/python main.py
```

Runs on: `http://localhost:8000`

### Frontend (Vercel-compatible):

```bash
cd frontend

# The .env.local file is already set to use localhost:8000
npm run dev
```

Runs on: `http://localhost:3000`

---

## 🔄 Automatic Deployments

### Railway (Backend):
✅ **Already enabled** - deploys on every push to `main`

### Vercel (Frontend):
Will be enabled after initial setup - deploys on every push to `main`

---

## 📊 Cost Estimate

### Railway (Hobby Plan - $5/month):
- 500 hours of usage
- $0.000231 per GB-second
- Recommended for backend APIs

### Vercel (Free Hobby Plan):
- 100 GB bandwidth
- Unlimited deployments
- Perfect for frontends

### External APIs:
- **OpenAI GPT-4**: ~$0.03 per analysis
- **YouTube Data API**: Free (10,000 units/day)

**Total Monthly Cost:** ~$5-10

---

## 🐛 Troubleshooting

### Issue: Railway backend returns 500 error

**Solution:**
1. Check Railway logs for Python errors
2. Verify environment variables are set
3. Check `backend/requirements.txt` has all dependencies

### Issue: Frontend can't connect to backend

**Solution:**
1. Check Vercel environment variable: `VITE_API_URL`
2. Verify Railway backend is running (visit `/docs` endpoint)
3. Check browser console for CORS errors

### Issue: CORS error in browser

**Solution:**
Update `backend/main.py` CORS origins to include your Vercel URL:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-project.vercel.app"  # Add your Vercel URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📈 Monitoring

### Railway Logs:
Dashboard → Deployments → View Logs

### Vercel Analytics:
Dashboard → Analytics tab

### API Health Check:
`https://youtube-topic-analyzer-production.up.railway.app/docs`

---

## 🎯 Quick Checklist

**Railway Backend:**
- [ ] Environment variables added (OPENAI_API_KEY, YOUTUBE_API_KEY, PORT)
- [ ] Deployment successful
- [ ] `/docs` endpoint accessible
- [ ] Test API call works

**Vercel Frontend:**
- [ ] Repository imported
- [ ] Build settings configured (root: `frontend`)
- [ ] Environment variable added (VITE_API_URL)
- [ ] Deployment successful
- [ ] Can search for channels

---

## 🚀 Your Live URLs

**Backend API:** https://youtube-topic-analyzer-production.up.railway.app
**Frontend App:** https://your-project.vercel.app (after Vercel setup)

**API Documentation:** https://youtube-topic-analyzer-production.up.railway.app/docs

---

*Last Updated: December 22, 2025*

