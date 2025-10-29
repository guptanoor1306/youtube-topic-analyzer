# 🚀 Deploy to Vercel - Step by Step

Follow these exact steps to deploy your app in the next 5 minutes!

## 📋 Before You Start

Make sure you have:
- ✅ Vercel account (sign up at vercel.com)
- ✅ GitHub account
- ✅ Git installed (`git --version`)
- ✅ Backend running locally

---

## 🎯 Deployment Steps

### Step 1: Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

### Step 2: Prepare Your Code

```bash
cd /Users/noorgupta/Downloads/Cursor/topic-selection

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Vercel deployment"
```

### Step 3: Create GitHub Repository

**Option A - Using GitHub CLI (Recommended):**
```bash
# Install GitHub CLI if not installed
brew install gh

# Authenticate
gh auth login

# Create repo and push
gh repo create youtube-topic-analyzer --public --source=. --push
```

**Option B - Using Web Interface:**
1. Go to https://github.com/new
2. Create repository named "youtube-topic-analyzer"
3. Run these commands:
```bash
git remote add origin https://github.com/YOUR_USERNAME/youtube-topic-analyzer.git
git branch -M main
git push -u origin main
```

### Step 4: Deploy Frontend to Vercel

**Option A - Using Vercel CLI (Fastest):**
```bash
cd frontend
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? youtube-topic-analyzer
# - Directory? ./
# - Override settings? No
```

**Option B - Using Web Interface:**
1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click "Deploy"

### Step 5: Configure Environment Variables

After deployment, add environment variable:

1. Go to your project on Vercel
2. Click "Settings" → "Environment Variables"
3. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `http://YOUR_LOCAL_IP:8000`
   - **Environment**: Production, Preview, Development

To get your local IP:
```bash
# On Mac/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# On Windows:
ipconfig
```

4. Click "Save"
5. Go to "Deployments" → Click the three dots → "Redeploy"

### Step 6: Keep Backend Running

In a terminal, keep this running:
```bash
cd /Users/noorgupta/Downloads/Cursor/topic-selection/backend
source venv/bin/activate
python main.py
```

**Important**: Your team needs to be on the same network as your backend!

---

## 🌐 Alternative: Deploy Backend Too

If you want team members to access from anywhere:

### Deploy Backend to Railway

1. Go to https://railway.app
2. Click "Start New Project" → "Deploy from GitHub repo"
3. Select backend directory
4. Add environment variables:
   - `OPENAI_API_KEY`
   - `YOUTUBE_API_KEY`
5. Get the deployed URL
6. Update Vercel environment variable:
   - `VITE_API_URL` = `https://your-app.railway.app`

---

## ✅ Verification

After deployment:

1. ✅ Visit your Vercel URL (e.g., `https://youtube-topic-analyzer.vercel.app`)
2. ✅ Check if it loads the homepage
3. ✅ Try searching for a channel
4. ✅ Test video selection
5. ✅ Generate suggestions

---

## 🐛 Troubleshooting

### "Cannot connect to backend"
- ✅ Check backend is running: `curl http://localhost:8000/health`
- ✅ Verify local IP is correct
- ✅ Ensure team is on same network

### "Build failed"
```bash
cd frontend
npm run build
# If successful, try deploying again
```

### "Module not found"
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
vercel --prod
```

---

## 🎉 You're Done!

Your app is live! Share the URL with your team:
```
https://youtube-topic-analyzer-YOUR_USERNAME.vercel.app
```

---

## 📝 What's Next?

- [ ] Share Vercel URL with team
- [ ] Gather feedback
- [ ] Deploy backend to Railway/Render for remote access
- [ ] Add custom domain (optional)
- [ ] Set up analytics (optional)

---

**Need Help?** Check the browser console (F12) for errors or backend logs.

