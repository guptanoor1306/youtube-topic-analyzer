# 🎯 Niche Channel Setup Guide

## Overview

The Niche Channel feature allows you to define a curated list of ~100 YouTube channels in your niche. When searching for title suggestions, the system will:

1. Fetch recent videos from ALL your niche channels
2. Use AI to understand your topic essence
3. Filter videos that match your topic
4. Return the top 20 most relevant titles from YOUR NICHE

**Benefits:**
- ✅ Guaranteed relevant results from your niche
- ✅ Consistent style and audience
- ✅ Learn from successful creators in your space
- ✅ Much faster than general YouTube search
- ✅ More actionable insights

---

## 📝 How to Add Your 100 Niche Channels

### Step 1: Edit the JSON File

Open: `backend/niche_channels.json`

### Step 2: Add Channel Information

For each channel, you need:
- `channel_id`: The YouTube channel ID or @username
- `channel_name`: Display name (for your reference)
- `category`: Optional category to organize channels

### Example Entry:

```json
{
  "channel_id": "@GrahamStephan",
  "channel_name": "Graham Stephan",
  "category": "Personal Finance"
}
```

### Step 3: Finding Channel IDs

**Method 1: Using @username** (Easiest)
1. Go to the channel's YouTube page
2. Look at the URL: `youtube.com/@ChannelName`
3. Use `@ChannelName` as the channel_id

**Method 2: Using Channel ID**
1. Go to the channel's YouTube page
2. Click "About" tab
3. Click "Share Channel" → "Copy channel ID"
4. Use that ID directly

---

## 💡 Example: Finance Niche Setup

```json
{
  "niche_name": "Finance & Business",
  "description": "Personal finance, investing, business channels",
  "channels": [
    {
      "channel_id": "@GrahamStephan",
      "channel_name": "Graham Stephan",
      "category": "Personal Finance"
    },
    {
      "channel_id": "@AndreiJikh",
      "channel_name": "Andrei Jikh",
      "category": "Investing"
    },
    {
      "channel_id": "@MeetKevin",
      "channel_name": "Meet Kevin",
      "category": "Real Estate"
    },
    {
      "channel_id": "@ThePlainBagel",
      "channel_name": "The Plain Bagel",
      "category": "Financial Education"
    },
    {
      "channel_id": "@BeatTheBush",
      "channel_name": "BeatTheBush",
      "category": "Frugal Living"
    },
    ...add 95 more channels...
  ]
}
```

---

## 🎯 Categories to Consider

Organize your 100 channels into categories:

### Finance Niche Example:
- **Personal Finance** (20 channels)
  - Budgeting
  - Saving tips
  - Debt management
  
- **Investing** (25 channels)
  - Stock market
  - Dividend investing
  - Index funds
  - Real estate

- **Business & Entrepreneurship** (20 channels)
  - Online business
  - Side hustles
  - Freelancing

- **Cryptocurrency** (15 channels)
  - Bitcoin
  - Altcoins
  - DeFi

- **Financial Independence** (20 channels)
  - FIRE movement
  - Passive income
  - Retirement planning

---

## 🚀 Using Niche Search

### Step 1: Add Your Channels
Edit `backend/niche_channels.json` with your 100 channels

### Step 2: Restart Backend
The system will automatically load your channels on startup

### Step 3: Use the Feature
1. Complete topic analysis as usual
2. Go to Title Generation
3. **Toggle: "🎯 Search Within My Niche"** (default)
4. See results from YOUR niche channels only!

---

## 📊 How It Works

### 1. Video Fetching
```
For each of your 100 channels:
  ├─ Fetch 10 most recent videos
  ├─ Filter for long-form (>10 min)
  └─ Store with metadata
  
Total: ~1,000 videos to search from
```

### 2. AI Topic Understanding
```
Your Topic: "How to build passive income with dividend stocks"
  ↓
AI Extracts:
  ├─ Essence: "Creating income streams through dividend investing"
  ├─ Keywords: ["dividend investing", "passive income", "dividend stocks"]
  └─ Related concepts
```

### 3. Smart Filtering
```
From 1,000 videos:
  ├─ Match keywords in title
  ├─ Score by relevance
  ├─ Sort by (relevance + views)
  └─ Return top 20
```

---

## 🔄 Reload Channels Without Restart

If you update `niche_channels.json` while the server is running:

```bash
curl -X POST http://localhost:8000/api/niche-channels/reload
```

Or use the API endpoint from your frontend.

---

## 📈 Performance Tips

### For 100 Channels:
- **Initial fetch**: ~30-60 seconds (fetches 1,000 videos)
- **Caching**: Results cached by YouTube service
- **Subsequent searches**: 2-5 seconds

### Optimization:
1. Use category filters (coming soon)
2. Adjust `videos_per_channel` (default: 10)
3. YouTube API has quota limits - 100 channels = ~100-200 API calls

---

## 🎯 Example Niches

### Tech/Programming
- Coding tutorials
- Web development
- App development
- Tech reviews
- Career advice

### Fitness
- Workout routines
- Nutrition
- Bodybuilding
- Yoga
- Weight loss

### Travel
- Travel vlogs
- Budget travel
- Destination guides
- Travel tips
- Digital nomad

### Education
- Science channels
- History
- Math tutorials
- Language learning
- Study tips

---

## 🔧 API Endpoints

### Get Niche Channels
```bash
GET /api/niche-channels
```
Returns list of all configured channels

### Reload Channels
```bash
POST /api/niche-channels/reload
```
Reloads channels from JSON file

### Search Niche Titles
```bash
POST /api/search-niche-titles
{
  "topic": "your topic",
  "videos_per_channel": 10,
  "max_results": 20
}
```

---

## 🎨 UI Features

### Toggle Button
Switch between:
- 🎯 **Search Within My Niche** (recommended)
- 🌐 **Search All YouTube** (broader but less relevant)

### Info Display
Shows:
- Number of niche channels searched
- Total videos analyzed
- AI-extracted essence
- Keywords used

---

## 📝 Sample 100-Channel List Structure

```json
{
  "niche_name": "Your Niche Name",
  "description": "Description of your niche",
  "channels": [
    // Top Tier (20 channels) - Biggest in your niche
    {"channel_id": "@Channel1", "channel_name": "Name 1", "category": "Main"},
    {"channel_id": "@Channel2", "channel_name": "Name 2", "category": "Main"},
    // ... 18 more
    
    // Mid Tier (30 channels) - Growing channels
    {"channel_id": "@Channel21", "channel_name": "Name 21", "category": "Growing"},
    // ... 29 more
    
    // Niche Specific (30 channels) - Specialized content
    {"channel_id": "@Channel51", "channel_name": "Name 51", "category": "Specialized"},
    // ... 29 more
    
    // Up and Coming (20 channels) - New but promising
    {"channel_id": "@Channel81", "channel_name": "Name 81", "category": "Emerging"},
    // ... 19 more
  ]
}
```

---

## 🚨 Troubleshooting

### "No videos found in niche channels"
- Check if `niche_channels.json` exists in `backend/` folder
- Verify channel IDs are correct
- Try reloading: `POST /api/niche-channels/reload`

### "Channel not found: @username"
- Double-check the @username is correct
- Try using the full channel ID instead
- Some channels may be private or terminated

### Slow performance
- Reduce `videos_per_channel` from 10 to 5
- Use fewer channels initially (start with 20-30)
- YouTube API has rate limits

---

## 💡 Pro Tips

1. **Start Small**: Begin with 20-30 channels, test, then add more
2. **Mix Sizes**: Include big and small channels for variety
3. **Keep Updated**: Review and update your list quarterly
4. **Use Categories**: Organize by sub-niche for future features
5. **Quality > Quantity**: 50 great channels > 100 mediocre ones

---

## 🎉 Benefits of Niche Search

### vs. General YouTube Search:
| Feature | General Search | Niche Search |
|---------|---------------|--------------|
| Relevance | Hit or miss | ✅ Guaranteed |
| Speed | 5-10s | ✅ 2-5s |
| Style Match | Random | ✅ Consistent |
| Audience Fit | Unknown | ✅ Aligned |
| Actionability | Low | ✅ High |

---

## 📚 Next Steps

1. ✅ Add your 100 niche channels to `niche_channels.json`
2. ✅ Restart the backend server
3. ✅ Go to Title Generation
4. ✅ Use "🎯 Search Within My Niche"
5. ✅ Get amazing, relevant title suggestions!

**Your niche search will be 10x more relevant than general YouTube search!** 🚀

