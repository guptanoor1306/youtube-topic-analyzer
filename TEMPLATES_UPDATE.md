# ✨ Templates Updated - Complete Guide

## 🎉 What's Been Added

### ✅ **5 Professional Templates with Your Exact Prompts**

I've implemented all 5 templates with your specific prompts, metadata weights, and analysis frameworks:

#### 1. **Most Trending** 🔥
- **Metadata Weights**: Comments 50%, Views 20%, Title 20%, Thumbnail 10%
- **Focus**: Topics currently resonating at scale
- **Output**: High-potential topics based on view patterns and audience engagement

#### 2. **Anti-Thesis** ⚡
- **Metadata Weights**: Comments 90%, Title 10%
- **Focus**: Audience pushback, misunderstandings, contrarian perspectives
- **Output**: Topics addressing disagreements and objections

#### 3. **Pain Points** 🎯
- **Metadata Weights**: Comments 60%, Transcript 40%
- **Focus**: Real user struggles, frustrations, life-stage dilemmas
- **Output**: Topics that solve problems or provide emotional validation

#### 4. **Format Recyclers** 🔄
- **Metadata Weights**: Transcript 40%, Title 35%, Thumbnail 25%
- **Focus**: Repeatable content structures that work
- **Output**: New topics using proven formats (X vs Y, How I did X, etc.)

#### 5. **Viral Potential** 📈
- **Metadata Weights**: Views 40%, Comments 30%, Title 20%, Thumbnail 10%
- **Focus**: Shareability, intrigue, mass relatability
- **Output**: Topics with high viral signals

---

## 🆕 **Custom Template Feature**

You can now create unlimited custom templates!

### How to Use Custom Templates:

1. **Click "Custom Template" tab**
2. **Select Metadata** - Choose which data to analyze:
   - ☑️ Title
   - ☑️ Thumbnail
   - ☑️ Thumbnail Text
   - ☑️ Views
   - ☑️ Comments
   - ☑️ Transcript

3. **Write Your Prompt** - Enter custom analysis instructions
4. **Run Analysis** - Get AI-powered topic suggestions

### Example Custom Prompt:

```
Analyze these videos to find topics that appeal to complete beginners in personal finance. Focus on simple, actionable topics that break down complex concepts into easy steps.

Look for:
- Topics that got high engagement from confused viewers
- Questions that keep repeating in comments
- Complex topics that need simplification

Return ONLY a JSON array of objects with this format:
[{"topic": "Topic title", "reason": "Why this topic works for beginners"}]
```

---

## 💡 **Info Button Feature**

Each topic now has an **info button (ⓘ)** that shows:
- **Why this topic is recommended**
- **Evidence from weighted analysis**
- **Specific patterns found**

**How it works:**
- Hover over the (ⓘ) icon next to any topic
- See a detailed explanation popup
- Understand the AI's reasoning

---

## 🎨 **New UI Features**

### 1. **Template Descriptions**
Each template now shows:
- One-line description
- Metadata weight breakdown
- Visual percentage indicators

Example:
```
Most Trending
Identify topics currently resonating at scale — high views + discussion
Metadata weights: comments: 50% • views: 20% • title: 20% • thumbnail: 10%
```

### 2. **Better Results Display**
- Topic title (clean, bold)
- Favorite heart icon (click to save)
- Info icon (hover for reasoning)
- Clean card layout

### 3. **Custom Template Modal**
- Beautiful modal dialog
- Checkbox grid for metadata
- Large prompt textarea
- Real-time validation

---

## 🔧 **How to Use**

### Step 1: Select Videos
1. Search for a YouTube channel
2. Select 5-20 videos from the grid
3. Click "Continue with X videos"

### Step 2: Choose Template
1. Click any template tab
2. See description & metadata weights
3. Or click "Custom Template" to create your own

### Step 3: Run Analysis
1. Click "Run Analysis"
2. Wait for AI to process (10-30 seconds)
3. Get 6-8 topic suggestions

### Step 4: Review Results
1. Read suggested topics
2. Hover over (ⓘ) to see reasoning
3. Click ❤️ to favorite topics
4. Click "Re-generate" for new ideas

---

## 📊 **Output Format**

Each template returns results in this structure:

```json
[
  {
    "topic": "Why Your Emergency Fund is Wrong",
    "reason": "High engagement on emergency fund videos with 200+ comments questioning traditional 6-month advice. View pattern shows 2.5x average performance."
  },
  {
    "topic": "Credit Cards vs UPI - The Hidden Psychology",
    "reason": "Repeated comparisons in comments (50+ mentions) with emotional reactions. Format 'X vs Y' has 3x better CTR."
  }
]
```

**In the UI, you see:**
- **Topic**: Clear, bold title
- **(ⓘ) Icon**: Hover to see the full reasoning

---

## 🚀 **Backend Updates**

### New Endpoint Enhancements:
```python
POST /api/analyze/template
{
  "video_ids": ["id1", "id2", ...],
  "template_id": "trending",
  "custom_prompt": "...",
  "metadata": { "comments": 50, "views": 20, ... }
}
```

### What It Does:
1. ✅ Fetches transcripts (parallel)
2. ✅ Fetches top comments (parallel)
3. ✅ Builds weighted context
4. ✅ Runs AI analysis with your prompt
5. ✅ Parses JSON response
6. ✅ Returns structured topics with reasons

### Smart Parsing:
- Tries to extract JSON first
- Falls back to line parsing if needed
- Validates format (topic + reason)
- Handles both string and object formats

---

## 💾 **Template Storage**

All templates are defined in:
```
frontend/src/components/TemplateRunner.jsx
```

To add/modify templates, edit the `TEMPLATES` array:

```javascript
const TEMPLATES = [
  { 
    id: 'my_template',
    name: 'My Template',
    icon: Sparkles,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    metadata: { comments: 70, title: 30 },
    description: 'What this template does',
    prompt: `Your full prompt here...`
  }
]
```

---

## 🎯 **Tips for Best Results**

### For Templates:
1. **Select 10-20 videos** - More data = better patterns
2. **Choose high-view videos** - They have better comments
3. **Mix video types** - Get diverse insights
4. **Run multiple templates** - Compare different angles

### For Custom Prompts:
1. **Be specific** - Define exactly what you want
2. **Set context** - Mention audience, tone, constraints
3. **Request format** - Always ask for JSON output
4. **Include examples** - Show desired output format

### For Info Buttons:
1. **Hover to read** - Don't click, just hover
2. **Look for evidence** - See actual data cited
3. **Compare reasons** - Understand patterns
4. **Use for decisions** - Pick topics with strongest evidence

---

## 🐛 **Troubleshooting**

### "No topics returned"
- Check if videos have transcripts
- Ensure videos have comments
- Try simpler prompt wording

### "Invalid JSON" error
- Make sure prompt requests JSON format
- Include example in prompt
- Check AI response in backend logs

### "Analysis taking too long"
- Normal for 15+ videos
- First run is slower (no cache)
- Second run uses cached data

---

## 📈 **What You Can Do Now**

✅ **Run 5 professional templates** - Based on your exact framework  
✅ **Create unlimited custom templates** - With any metadata combo  
✅ **See detailed reasoning** - For every topic suggestion  
✅ **Favorite topics** - Save best ideas  
✅ **Re-generate** - Get fresh perspectives  
✅ **View metadata weights** - Understand analysis focus  

---

## 🎊 **Summary**

Your app now has:
- ✨ 5 professionally crafted templates with your exact prompts
- 🎨 Custom template builder with metadata selection
- 💡 Info buttons explaining AI reasoning
- 📊 Visual metadata weight indicators
- ❤️ Topic favoriting system
- 🔄 Re-generation for fresh ideas
- 🎯 All focused on Zero1's audience (22-35 salaried Indians)

**Everything is live and ready to use!** 🚀

Open http://localhost:3000, search for a channel, and start discovering winning topics!

