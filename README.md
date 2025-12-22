# YouTube Topic Analyzer

AI-powered tool to analyze YouTube videos and generate topic suggestions based on proven engagement patterns.

## Features

- **🔍 Channel Search**: Search any YouTube channel and fetch top 100 videos automatically
- **📹 Video Selection**: Select videos from your channel for AI analysis
- **🎯 AI Templates**: 5 pre-built analysis templates + custom template builder
  - **Most Trending**: Topics with high views + discussion
  - **Anti-Thesis**: Contrarian angles Zero1 could explore
  - **Pain Points**: Problems your audience needs solved
  - **Format Recyclers**: Proven formats worth adapting
  - **Viral Potential**: Topics with shareability
- **💡 Smart Recommendations**: Each topic includes AI reasoning for why it's recommended
- **⭐ Favorites System**: Save topics across multiple analysis runs
- **🎨 Modern UI**: Clean, light-mode interface optimized for content strategists

## Quick Start

### Prerequisites
- Python 3.13+
- Node.js 16+
- OpenAI API Key
- YouTube API Key (optional for reverse engineering)

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add your API keys
python main.py
```

Backend runs on: `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:3000`

## Environment Variables

Create `.env` file in project root:
```env
OPENAI_API_KEY=your_openai_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here
```

**Get Your API Keys:**
- OpenAI: https://platform.openai.com/api-keys
- YouTube: https://console.cloud.google.com/apis/credentials

## How It Works

### 1. **Search Channel**
Enter any YouTube channel name (e.g., "Zero1 by Zerodha", "Think School")

### 2. **Select Videos**
Browse and select from the channel's top 100 most viewed videos

### 3. **Choose Template**
Pick from 5 AI-powered analysis templates or create your own custom prompt

### 4. **Get Insights**
View AI-generated topic suggestions with detailed reasoning for each recommendation

### 5. **Save Favorites**
Mark topics you like - they persist across multiple analysis runs

## Project Structure

```
topic-selection/
├── backend/
│   ├── main.py                    # FastAPI server
│   ├── services/
│   │   ├── ai_service.py         # OpenAI integration
│   │   └── youtube_service.py    # YouTube API + transcripts
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.jsx                  # Channel search
│   │   │   ├── NewVideoSelection.jsx     # Video picker
│   │   │   └── TemplateRunner.jsx        # Analysis & results
│   │   └── App.jsx
│   └── package.json
└── .env                           # API keys (create this)
```

## Available Templates

### 🔥 Most Trending
Identifies topics currently resonating at scale based on high views and discussion volume.
- **Weights**: Comments 50%, Views 20%, Title 20%, Thumbnail 10%

### ⚡ Anti-Thesis
Finds contrarian angles where Zero1 could take an opposing or nuanced stance.
- **Weights**: Comments 60%, Title 20%, Transcript 20%

### 💊 Pain Points
Surfaces problems and frustrations your audience needs addressed.
- **Weights**: Comments 70%, Transcript 20%, Title 10%

### 🎬 Format Recyclers
Identifies proven video formats and structures worth adapting.
- **Weights**: Views 40%, Title 30%, Thumbnail 20%, Transcript 10%

### 🚀 Viral Potential
Spots topics with built-in shareability and broad appeal.
- **Weights**: Views 50%, Comments 30%, Title 20%

### ⚙️ Custom Template
Build your own analysis by selecting metadata fields and writing a custom prompt.

## Tech Stack

**Backend:**
- FastAPI (Python web framework)
- OpenAI GPT-4 (AI analysis)
- YouTube Data API v3 (Channel & video data)
- youtube-transcript-api (Video transcripts)

**Frontend:**
- React 18 (UI framework)
- Vite (Build tool)
- TailwindCSS (Styling)
- Lucide Icons (Icon library)
- Axios (API client)

## Deployment

### Deploy to Vercel

1. **Prepare Your Project:**
   ```bash
   git add -A
   git commit -m "feat: Complete redesign with AI-powered templates"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect the configuration

3. **Add Environment Variables:**
   In Vercel dashboard, add:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `YOUTUBE_API_KEY`: Your YouTube Data API key

4. **Deploy:**
   - Vercel will automatically deploy on every push to main
   - Your app will be live at `https://your-project.vercel.app`

### Local Development

Always create a `.env` file with your API keys before running locally:
```bash
cp .env.example .env
# Edit .env and add your actual API keys
```

## Support

For issues or questions, check the code comments or API endpoint documentation in `backend/main.py`.

## License

MIT
