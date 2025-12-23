# 🔍 How to Check if Cache is Working

## Method 1: Backend Logs (Easiest)

### On Railway:
1. Go to Railway dashboard → Your project → Backend service
2. Click "Deployments" → Latest deployment → "View Logs"
3. Look for these indicators:

```
✅ CACHE WORKING:
💾 Found 4/4 videos in cache          ← All videos cached!
💾 Using cached data for video XYZ    ← Individual cache hit

❌ NO CACHE (first run):
💾 Found 0/4 videos in cache          ← Nothing cached yet
📥 Fetching 4 videos from YouTube API ← Fetching fresh data
✅ Saved video XYZ to database        ← Now cached for next time
```

### Test It:
1. **First Analysis**: Select 3-4 videos → Run template
   - Logs: `💾 Found 0/4 videos in cache`
   - Time: ~10-15 seconds (fetching transcripts)
   
2. **Second Analysis** (same videos, different template):
   - Logs: `💾 Found 4/4 videos in cache`
   - Time: ~2-3 seconds (from cache) ⚡

---

## Method 2: Check Database Directly

### Local Development (SQLite):

```bash
# 1. Database file location
ls -lh backend/video_cache.db

# 2. Check if file exists and size
# If file > 50KB, you have cached data

# 3. Query the database (requires sqlite3)
cd backend
sqlite3 video_cache.db

# SQL commands:
SELECT COUNT(*) FROM video_metadata;
SELECT video_id, title, created_at FROM video_metadata ORDER BY created_at DESC LIMIT 5;
SELECT COUNT(*) FROM channel_cache;
.exit
```

### Railway (PostgreSQL):

```bash
# Option 1: Railway CLI
railway connect postgres

# Then run SQL:
SELECT COUNT(*) FROM video_metadata;
SELECT video_id, title FROM video_metadata LIMIT 10;

# Option 2: Railway Dashboard
# Go to PostgreSQL service → Data tab → Run queries
```

---

## Method 3: Use the Check Script

Once you have backend dependencies installed:

```bash
# Install dependencies (if needed)
cd backend
pip install -r requirements.txt

# Run the check script
cd ..
python3 check_cache.py
```

**Output:**
```
============================================================
📊 VIDEO CACHE STATUS
============================================================
Total videos cached: 12
Videos with transcripts: 10
Videos with comments: 12

📹 Recent cached videos:
  • ABC123 | House - Rent or Buy? (The 420 Rule)        | T:✅ C:✅ | 2h 15m ago
  • XYZ789 | Smartest Way to Buy Your First Car         | T:✅ C:✅ | 2h 15m ago
  • ...

============================================================
📺 CHANNEL CACHE STATUS
============================================================
Total channels cached: 0
  ⚠️  No channels cached yet (feature not wired up)

============================================================
💡 TIP: Run this script anytime to check cache status
============================================================
```

---

## Method 4: API Endpoint (Add This)

You can add a simple endpoint to check cache status:

```python
# Add to backend/main.py
@app.get("/api/cache/stats")
async def get_cache_stats(db: Session = Depends(get_db)):
    """Get cache statistics"""
    db_service = DatabaseService(db)
    stats = db_service.get_cache_stats()
    
    # Add channel stats
    channel_count = db.query(ChannelCache).count()
    stats['total_channels'] = channel_count
    
    return stats
```

Then visit: `https://your-railway-app.com/api/cache/stats`

**Response:**
```json
{
  "total_videos": 12,
  "videos_with_transcript": 10,
  "videos_with_comments": 12,
  "total_channels": 0
}
```

---

## 🗄️ Where is Data Stored?

### Local Development:
```
File: backend/video_cache.db
Type: SQLite database
Location: Same folder as main.py
Size: Grows as you cache more videos
```

### Railway Production:
```
Type: PostgreSQL database
Location: Railway-managed server
Access: Via DATABASE_URL environment variable
Persistence: Data survives deployments ✅
```

---

## 📊 Database Schema

### video_metadata table:
| Column | Type | Description |
|--------|------|-------------|
| video_id | String (PK) | YouTube video ID |
| title | String | Video title |
| thumbnail_url | String | Thumbnail URL |
| view_count | Integer | View count |
| channel_id | String | Channel ID |
| channel_title | String | Channel name |
| **transcript** | Text | Full video transcript (cached!) |
| **comments** | JSON | Top 50 comments (cached!) |
| created_at | DateTime | First cached |
| updated_at | DateTime | Last updated |

### channel_cache table:
| Column | Type | Description |
|--------|------|-------------|
| channel_id | String (PK) | YouTube channel ID |
| channel_title | String | Channel name |
| subscriber_count | Integer | Subscriber count |
| video_count | Integer | Total videos |
| **videos** | JSON | List of 100 videos (cached!) |
| created_at | DateTime | First cached |
| updated_at | DateTime | Last updated |

**Note:** Channel cache table exists but not yet wired up to API.

---

## ⏱️ Cache TTL (Time To Live)

### Current Settings:
- **Video metadata**: Cached forever (until manually cleared)
- **Channel data**: 24 hours (planned, not yet implemented)
- **Transcripts**: In-memory cache for 2 hours
- **Comments**: In-memory cache for 1 hour

### Why Two Caches?
1. **In-memory cache** (temporary): Fast, but lost on server restart
2. **Database cache** (persistent): Survives restarts, shared across requests

---

## 🧪 Testing Cache Performance

### Benchmark Test:
```bash
# 1. Select 4 videos
# 2. Run "Most Trending" template
# Note the time: ~12 seconds (no cache)

# 3. Immediately run "Anti-Thesis" on SAME videos
# Note the time: ~3 seconds (from cache)

# Speed improvement: 4x faster! ⚡
```

### What Gets Cached:
✅ Video metadata (title, views, etc.)
✅ Full transcripts
✅ Top 50 comments
✅ Timestamps (when cached)

### What Doesn't Get Cached:
❌ AI analysis results (always fresh)
❌ Template outputs (regenerated each time)
❌ User favorites (session-based)

---

## 🔄 When Does Cache Refresh?

### Automatic:
- Never (videos don't change much)
- Could add: 7-day TTL for view counts

### Manual:
- Clear cache button (to be added)
- Restart server (in-memory cache cleared)
- Direct database deletion

---

## 💡 Pro Tips:

1. **First time analyzing a video**: Slow (YouTube API)
2. **Second time (any template)**: Fast (database)
3. **Different videos from same channel**: Only new videos fetched
4. **Popular channels**: Over time, most videos will be cached

---

## 🚀 Expected Performance:

### Without Cache:
- Fetch 4 videos: ~12 seconds
- API quota: 4 units per video

### With Cache (after first run):
- Fetch 4 videos: ~2 seconds
- API quota: 0 units (from database!)

### Savings:
- **Time**: 6x faster ⚡
- **Cost**: 100% API quota savings 💰
- **Reliability**: Works even if YouTube API is slow

