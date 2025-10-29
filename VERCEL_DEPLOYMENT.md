# 🚀 Vercel Deployment Guide

This guide will help you deploy the YouTube Topic Analyzer to Vercel for your team to review.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account**: Create a repo for your project
3. **API Keys**: 
   - OpenAI API Key
   - YouTube Data API v3 Key

---

## 🎯 Deployment Options

### **Option 1: Frontend Only on Vercel (Recommended for Quick Demo)**

Since Vercel is optimized for frontend apps, deploy only the React frontend. Keep the backend running locally for now.

#### Steps:

1. **Push Frontend to GitHub**
```bash
cd /Users/noorgupta/Downloads/Cursor/topic-selection/frontend
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. **Deploy to Vercel**
- Go to [vercel.com/new](https://vercel.com/new)
- Import your GitHub repository
- Framework Preset: **Vite**
- Root Directory: Leave as is (since you're pushing only frontend)
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

3. **Configure Environment Variables**

In Vercel dashboard → Settings → Environment Variables, add:

```
VITE_API_URL=http://YOUR_LOCAL_IP:8000
```

Replace `YOUR_LOCAL_IP` with your machine's local IP (find it using `ifconfig` on Mac/Linux or `ipconfig` on Windows).

4. **Share with Team**

Team members need to:
- Have your backend running locally
- Connect to your local network (same WiFi)
- Access the Vercel URL

**⚠️ Limitation**: This only works when your team is on the same network as your backend.

---

### **Option 2: Full Stack Deployment (Production Ready)**

For a production deployment, you need to deploy both frontend and backend.

#### Backend Options:

##### A) **Railway** (Easiest for Python)

1. **Prepare Backend**

Create `Procfile` in backend directory:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Create `runtime.txt`:
```
python-3.11
```

2. **Deploy to Railway**
- Go to [railway.app](https://railway.app)
- Create new project from GitHub
- Select backend directory
- Add environment variables:
  - `OPENAI_API_KEY`
  - `YOUTUBE_API_KEY`

3. **Get Railway URL** (e.g., `https://your-app.railway.app`)

##### B) **Render** (Alternative)

1. Create `render.yaml` in project root:
```yaml
services:
  - type: web
    name: youtube-topic-backend
    env: python
    buildCommand: "cd backend && pip install -r requirements.txt"
    startCommand: "cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: OPENAI_API_KEY
        sync: false
      - key: YOUTUBE_API_KEY
        sync: false
```

2. Deploy at [render.com](https://render.com)

#### Frontend Deployment:

1. **Update API URL**

In `frontend/vite.config.js`, add:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://your-backend.railway.app', // Your backend URL
        changeOrigin: true,
      }
    }
  }
})
```

2. **Deploy to Vercel**
- Same steps as Option 1
- No need for `VITE_API_URL` environment variable

---

### **Option 3: All-in-One Vercel (Using Serverless Functions)**

Convert the backend to Vercel serverless functions.

**⚠️ Complexity**: Requires significant refactoring. Not recommended for quick demo.

---

## 🔧 Configuration Files Needed

### 1. `vercel.json` (in frontend directory)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "http://your-backend-url.railway.app/api/:path*"
    }
  ]
}
```

### 2. `.env.production` (in frontend directory)

```env
VITE_API_URL=https://your-backend.railway.app
```

---

## 🎨 Recommended Deployment Strategy

For **team review**, I recommend:

### **Quick Demo (1-2 days)**
- Deploy frontend to Vercel
- Keep backend running on your local machine
- Share Vercel URL with team (same network only)

### **Production (1 week+)**
- Deploy backend to Railway or Render
- Deploy frontend to Vercel
- Configure custom domain
- Add authentication if needed

---

## 📝 Step-by-Step: Quick Vercel Deployment

1. **Prepare Frontend**
```bash
cd /Users/noorgupta/Downloads/Cursor/topic-selection/frontend
npm run build
# Test build locally
npm run preview
```

2. **Create GitHub Repo**
```bash
git init
git add .
git commit -m "YouTube Topic Analyzer frontend"
gh repo create youtube-topic-analyzer --public --source=. --push
```

3. **Deploy to Vercel**
- Go to https://vercel.com/new
- Import from GitHub
- Select your repo
- Click "Deploy"

4. **Configure API**

Option A: Run backend locally and expose via ngrok
```bash
cd /Users/noorgupta/Downloads/Cursor/topic-selection/backend
source venv/bin/activate
python main.py

# In another terminal
ngrok http 8000
# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
```

Then update Vercel environment variable:
```
VITE_API_URL=https://abc123.ngrok.io
```

Option B: Deploy backend to Railway (see above)

---

## 🐛 Common Issues

### Issue 1: CORS Errors
**Solution**: Add to `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-vercel-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 2: API Timeout
**Solution**: Increase timeout in Vercel settings (Pro plan only) or use Railway/Render for backend.

### Issue 3: Build Fails
**Solution**: Check Node version. Add to `package.json`:
```json
"engines": {
  "node": ">=18.0.0"
}
```

---

## 📊 Cost Estimate

| Service | Free Tier | Paid |
|---------|-----------|------|
| Vercel | Yes (frontend) | $20/month |
| Railway | $5 credit/month | $5+ usage |
| Render | Yes (limited) | $7/month |
| ngrok | Yes (basic) | $8/month |

**For team review**: Free tier is sufficient!

---

## ✅ Quick Start Checklist

- [ ] Backend running locally on port 8000
- [ ] Frontend builds successfully (`npm run build`)
- [ ] GitHub repo created
- [ ] Vercel account created
- [ ] Repository imported to Vercel
- [ ] Environment variables configured
- [ ] Deployment successful
- [ ] Test API connection
- [ ] Share URL with team

---

## 🆘 Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify API keys are correct
4. Test backend health: `curl http://your-backend-url/health`

---

## 🎯 Next Steps

After team review:
1. Gather feedback
2. Implement improvements
3. Deploy backend to production
4. Add authentication
5. Configure custom domain
6. Set up monitoring

---

**Created**: 2024
**Last Updated**: Now
**Version**: 1.0

