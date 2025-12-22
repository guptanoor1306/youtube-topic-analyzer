# 📊 Metadata Available for Analysis

## ✅ Currently Available

### 1. **Title** ✓
- **Source**: YouTube API
- **What it includes**: Full video title
- **Use for**: Title pattern analysis, keyword extraction, format identification

### 2. **Thumbnail URL** ✓
- **Source**: YouTube API
- **What it includes**: URL to thumbnail image
- **Use for**: Visual pattern analysis (requires image processing)
- **Note**: Currently provides URL only, not visual analysis

### 3. **Views** ✓
- **Source**: YouTube API
- **What it includes**: Total view count
- **Use for**: Performance analysis, viral potential identification

### 4. **Comments** ✓
- **Source**: YouTube Data API
- **What it includes**: Top 50 comments (sorted by relevance)
- **Data per comment**:
  - Author name
  - Comment text
  - Like count
  - Published date
- **Use for**: Audience sentiment, questions, pain points, objections

### 5. **Transcript** ✓
- **Source**: YouTube Transcript API
- **What it includes**: Full video transcript (auto-generated or manual)
- **Use for**: Content analysis, topic extraction, format identification
- **Note**: Not all videos have transcripts available

---

## 🚧 Coming Soon

### 6. **Thumbnail Text (OCR)**
- **Status**: Not yet implemented
- **What it will include**: Text extracted from thumbnail images using OCR
- **Use for**: Thumbnail text pattern analysis, clickbait detection
- **Implementation needed**: OCR service integration (e.g., Google Vision API, Tesseract)

---

## 📋 How Metadata is Fetched

### For Each Video:
1. **Basic Info** (from video selection):
   - video_id
   - title
   - thumbnail URL
   - view_count
   - published_at
   - duration

2. **On Analysis** (fetched in parallel):
   - Transcript (via `youtube_transcript_api`)
   - Top 50 comments (via YouTube Data API)

### Caching:
- **Transcripts**: Cached for 2 hours
- **Comments**: Cached for 1 hour
- **Speeds up**: Re-running analysis on same videos

---

## 🎯 Template Metadata Usage

### Most Trending
- Comments: 50%
- Views: 20%
- Title: 20%
- Thumbnail: 10%

### Anti-Thesis
- Comments: 90%
- Title: 10%

### Pain Points
- Comments: 60%
- Transcript: 40%

### Format Recyclers
- Transcript: 40%
- Title: 35%
- Thumbnail: 25%

### Viral Potential
- Views: 40%
- Comments: 30%
- Title: 20%
- Thumbnail: 10%

---

## 💡 Tips for Custom Templates

### Best Metadata Combinations:

**For Topic Discovery:**
- Comments (70%) + Transcript (30%)
- Finds what audience wants + what content covers

**For Format Analysis:**
- Transcript (50%) + Title (30%) + Thumbnail (20%)
- Identifies structure + naming patterns + visual cues

**For Viral Potential:**
- Views (40%) + Comments (40%) + Title (20%)
- Performance + engagement + curiosity triggers

**For Pain Points:**
- Comments (80%) + Transcript (20%)
- Direct audience feedback + triggering content

---

## 🔍 What Gets Sent to AI

Example context for a video:

```
Video abc123:
Title: "Why Your Emergency Fund is Wrong"
Views: 245,000
Transcript: "Today we're talking about emergency funds... [2000 chars]"
Top Comments:
1. "This changed my perspective!" (234 likes)
2. "But what about inflation?" (189 likes)
3. "I wish I knew this earlier" (156 likes)
...
```

The AI analyzes this context according to your template's prompt and metadata weights.

---

## ⚠️ Limitations

1. **Transcript Availability**
   - Not all videos have transcripts
   - Some creators disable auto-captions
   - Private/unlisted videos may not work

2. **Comment Access**
   - Some videos have comments disabled
   - Only top 50 comments fetched (for performance)
   - Sorted by relevance, not chronological

3. **API Quotas**
   - YouTube API: 10,000 units/day
   - Each video fetch: ~5 units
   - Transcript API: Unlimited (different service)

4. **Thumbnail Analysis**
   - Currently only URL available
   - No visual/text extraction yet
   - Manual interpretation needed

---

## 🚀 Future Enhancements

### Planned:
1. **Thumbnail OCR** - Extract text from thumbnails
2. **Thumbnail Visual Analysis** - Detect colors, faces, objects
3. **Description Analysis** - Include video descriptions
4. **Engagement Metrics** - Like/dislike ratios, comment velocity
5. **Timestamp Analysis** - Key moments from chapters
6. **Related Videos** - Analyze recommended videos

### Possible:
- Sentiment analysis on comments
- Topic clustering across videos
- Competitor comparison metrics
- Trend timeline analysis

