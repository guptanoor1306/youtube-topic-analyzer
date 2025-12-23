# Railway Database Setup

## Problem
Cached channels disappear on refresh because Railway is using **SQLite** (ephemeral storage that gets wiped on each deploy).

## Solution
Add a **PostgreSQL database** to Railway for persistent storage.

---

## Steps to Add PostgreSQL on Railway:

### 1. **Go to your Railway project**
   - Open: https://railway.app/project/YOUR_PROJECT_ID

### 2. **Add PostgreSQL Service**
   - Click **"+ New"** button
   - Select **"Database"**
   - Choose **"Add PostgreSQL"**

### 3. **Connect to Backend**
   - Railway will automatically create a `DATABASE_URL` environment variable
   - Your backend already has code to use it:
     ```python
     DATABASE_URL = os.getenv("DATABASE_URL")
     if DATABASE_URL and DATABASE_URL.starts with("postgres://"):
         DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
     ```

### 4. **Redeploy**
   - Railway will auto-redeploy your backend
   - Database tables will be created automatically on first run
   - Check logs for: `✅ Database tables created successfully`

### 5. **Verify**
   - Search for a channel on your app
   - Refresh the page
   - The channel should still appear in "Popular Channels" ✅

---

## Database Tables Created:

1. **`channel_cache`**
   - `channel_id` (primary key)
   - `channel_title`
   - `subscriber_count`
   - `video_count`
   - `videos` (JSON array of top 100 videos)
   - `created_at`, `updated_at`

2. **`video_metadata`**
   - `video_id` (primary key)
   - `title`, `thumbnail_url`, `view_count`
   - `transcript`, `comments` (JSON)
   - `created_at`, `updated_at`

---

## Check Current Database:

**Current Status:**
```
⚠️ No DATABASE_URL found, using SQLite for local development
```

**After Adding PostgreSQL:**
```
✅ Connected to PostgreSQL database
✅ Database tables created successfully
```

---

## Cost:
- Railway's PostgreSQL is **$5/month** (includes 1GB storage, 1M rows)
- Free tier includes $5 credit per month
- Perfect for caching channel data

---

## Alternative (Not Recommended):
If you don't want to use PostgreSQL, SQLite will work locally but data will be lost on each Railway deploy.
