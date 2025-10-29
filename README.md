# YouTube Topic Identifier

A powerful tool to help identify content topics and formats for your YouTube channel by analyzing your videos and competitor content using AI.

## Features

- 🎯 **Channel Setup**: Connect your primary YouTube channel (e.g., Zero1 by Zerodha)
- 📹 **Video Selection**: Select 1-5 videos from your channel for analysis
- 📄 **PDF Upload**: Optional upload of detailed channel analysis with top videos data
- 🔍 **Competitor Search**: Search for competitor videos by keyword or channel
- 🤖 **AI-Powered Suggestions**: Two analysis modes:
  - **Suggest Series**: Generate series ideas based on your content
  - **Suggest Format**: Adapt competitor content to your channel's format
- ✨ **Custom Instructions**: Add additional prompts to guide AI generation

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **YouTube Data API v3**: Fetch video metadata, transcripts, and comments
- **OpenAI GPT-4**: AI-powered content analysis and suggestions
- **PyPDF2**: PDF parsing for channel analysis documents

### Frontend
- **React**: Component-based UI library
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **Lucide React**: Beautiful icon library

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 18+
- YouTube Data API v3 key
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file from the example:
```bash
cp .env.example .env
```

5. Add your API keys to `.env`:
```env
YOUTUBE_API_KEY=your_youtube_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

6. Run the backend server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Getting API Keys

### YouTube Data API v3 Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Go to Credentials and create an API key
5. Copy the API key to your `.env` file

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API keys section
4. Create a new API key
5. Copy the API key to your `.env` file

## Usage Flow

### Method 1: Suggest Series

1. **Setup Channel**: Enter your channel ID and optionally upload a PDF with channel data
2. **Select Videos**: Choose 1-5 videos from your channel
3. **Add Custom Instructions** (Optional): Provide additional context like "Focus on beginner-friendly content"
4. **Generate**: Click "Suggest Series" to get AI-powered series ideas

### Method 2: Suggest Format

1. **Setup Channel**: Enter your channel ID
2. **Select Your Videos**: Choose 1-5 videos from your channel
3. **Search Competitors**: Use keyword or channel search to find competitor videos
4. **Select Competitor Videos**: Choose up to 5 competitor videos
5. **Add Custom Instructions** (Optional): Provide specific requirements
6. **Generate**: Click "Generate Format Suggestions" to see how to adapt competitor formats

## API Endpoints

### Channel Management
- `POST /api/channel/setup` - Setup primary channel
- `POST /api/upload-pdf` - Upload channel analysis PDF

### Video Operations
- `POST /api/videos/details` - Get video details with transcripts and comments
- `POST /api/search/videos` - Search videos by keyword
- `POST /api/search/channel` - Search videos from a specific channel

### AI Analysis
- `POST /api/suggest-series` - Generate series suggestions
- `POST /api/suggest-format` - Generate format adaptation suggestions

## Project Structure

```
topic-selection/
├── backend/
│   ├── services/
│   │   ├── __init__.py
│   │   ├── youtube_service.py  # YouTube API integration
│   │   ├── ai_service.py       # OpenAI integration
│   │   └── pdf_service.py      # PDF parsing
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   └── .env.example           # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── App.jsx           # Main app component
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Vite configuration
│   └── tailwind.config.js    # Tailwind configuration
├── .gitignore
└── README.md
```

## Features in Detail

### Custom Instructions
The new custom instructions feature allows you to:
- Add specific focus areas (e.g., "Focus on data-driven insights")
- Set tone preferences (e.g., "Make it more educational")
- Define target audience (e.g., "Content for beginners")
- Specify format preferences (e.g., "Short-form, practical videos")

The AI will incorporate these instructions into the system prompt for more tailored suggestions.

## Tips for Best Results

1. **Select Diverse Videos**: Choose videos covering different topics for better analysis
2. **Use Custom Instructions**: Be specific about your needs (e.g., "Focus on stock market basics for Indian investors")
3. **PDF Upload**: Include your channel's top 30 videos data for richer context
4. **Competitor Selection**: Choose competitors with similar audience but different angles
5. **Review Suggestions**: Use AI suggestions as inspiration, not absolute rules

## Troubleshooting

### Backend Issues
- **YouTube API quota exceeded**: Wait 24 hours or use a different API key
- **OpenAI API errors**: Check your API key and billing status
- **Transcript not available**: Some videos don't have transcripts; try different videos

### Frontend Issues
- **CORS errors**: Ensure backend is running on port 8000
- **Build errors**: Delete `node_modules` and run `npm install` again

## License

MIT License - Feel free to use this for your YouTube channel growth!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

