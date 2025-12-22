# Deployment Guide - Vercel

This guide will help you deploy the YouTube Topic Analyzer to Vercel.

## Prerequisites

- GitHub account with your repository pushed
- Vercel account (free tier works fine)
- OpenAI API Key ([Get it here](https://platform.openai.com/api-keys))
- YouTube Data API Key ([Get it here](https://console.cloud.google.com/apis/credentials))

---

## Step 1: Prepare Your Repository

✅ **Already Done!** Your code is pushed to:
```
https://github.com/guptanoor1306/youtube-topic-analyzer.git
```

---

## Step 2: Deploy to Vercel

### A. Connect Your Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub repository: `youtube-topic-analyzer`
5. Click **"Import"**

### B. Configure Build Settings

Vercel should auto-detect the configuration from `vercel.json`, but verify:

**Framework Preset:** Other
**Root Directory:** `./`
**Build Command:** (leave empty, handled by vercel.json)
**Output Directory:** (leave empty, handled by vercel.json)

### C. Add Environment Variables

In the **"Environment Variables"** section, add:

| Name | Value | Description |
|------|-------|-------------|
| `OPENAI_API_KEY` | `sk-proj-...` | Your OpenAI API key |
| `YOUTUBE_API_KEY` | `AIza...` | Your YouTube Data API v3 key |

**Important:** Make sure to add these for **Production**, **Preview**, and **Development** environments.

### D. Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. Your app will be live at: `https://your-project.vercel.app`

---

## Step 3: Verify Deployment

### Test the Deployment:

1. **Open your Vercel URL**
2. **Search for a channel** (e.g., "Zero1 by Zerodha")
3. **Select a few videos**
4. **Run a template** (e.g., "Most Trending")
5. **Check if topics appear** with info (ⓘ) buttons

---

## Troubleshooting

### Issue: "API key not found" Error

**Solution:**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Verify both `OPENAI_API_KEY` and `YOUTUBE_API_KEY` are set
- Redeploy: Deployments → Latest → ⋯ → Redeploy

### Issue: Backend API Returns 500 Error

**Solution:**
- Check Vercel Function Logs: Project → Deployments → Latest → View Function Logs
- Look for Python errors or missing dependencies
- Verify `backend/requirements.txt` has all packages

### Issue: Frontend Shows Blank Page

**Solution:**
- Check Browser Console (F12) for errors
- Verify API endpoint in frontend is pointing to correct URL
- Check if CORS is properly configured in `backend/main.py`

### Issue: YouTube API Quota Exceeded

**Solution:**
- Each YouTube Data API key has 10,000 units/day quota
- Fetching 100 videos + transcripts uses ~300 units
- Consider caching or using multiple API keys for high traffic

---

## Automatic Deployments

✅ **Enabled by Default!**

Every time you push to `main` branch:
1. Vercel automatically detects the push
2. Builds and deploys the new version
3. Updates your live site (usually within 2 minutes)

To disable: Vercel Dashboard → Settings → Git → Uncheck "Production Branch"

---

## Custom Domain (Optional)

### Add Your Own Domain:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `topics.yourdomain.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate to be issued (~1 minute)

---

## Performance Optimization

### Enable Caching:

The app already uses in-memory caching:
- **Transcripts**: 2 hours
- **Comments**: 1 hour

For production at scale, consider:
- Redis for distributed caching
- Background job queue for heavy processing
- CDN for static assets

---

## Monitoring

### View Logs:

**Function Logs:**
Vercel Dashboard → Deployments → Latest → **View Function Logs**

**Real-time Logs:**
```bash
vercel logs [deployment-url] --follow
```

### Check Analytics:

Vercel Dashboard → **Analytics** tab
- Page views
- Function invocations
- Errors and performance

---

## Cost Estimate

### Vercel (Hobby Plan - Free):
- ✅ 100 GB bandwidth/month
- ✅ 100 GB-hours serverless function execution
- ✅ Unlimited deployments

### External APIs:
- **OpenAI GPT-4**: ~$0.03 per analysis (with 3 videos)
- **YouTube Data API**: Free (10,000 units/day)

**Estimated Monthly Cost:** $5-20 (depending on usage)

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **GitHub Issues**: https://github.com/guptanoor1306/youtube-topic-analyzer/issues
- **OpenAI Help**: https://help.openai.com
- **YouTube API Docs**: https://developers.google.com/youtube/v3

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test all templates
3. ✅ Share the URL with your team
4. 🎯 Analyze channels and generate topics!

**Your Live App:** `https://your-project.vercel.app`

---

*Last Updated: December 22, 2025*

