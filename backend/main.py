from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

from services.youtube_service import YouTubeService
from services.ai_service import AIService
from services.pdf_service import PDFService
from services.niche_service import NicheService

# Force load .env file and override any existing environment variables
load_dotenv(override=True)

# Print Railway environment info for debugging
import sys
print("=" * 60)
print("🚀 STARTING YOUTUBE TOPIC ANALYZER")
print("=" * 60)
print(f"Python version: {sys.version}")
print(f"PORT env var: {os.getenv('PORT', 'NOT SET')}")
print(f"RAILWAY_ENVIRONMENT: {os.getenv('RAILWAY_ENVIRONMENT', 'NOT SET')}")
print("=" * 60)

app = FastAPI(title="YouTube Topic Identifier")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://youtube-topic-analyzer.vercel.app",
        "https://youtube-topic-analyzer-production.up.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services with error handling
try:
    youtube_api_key = os.getenv("YOUTUBE_API_KEY")
    openai_api_key = os.getenv("OPENAI_API_KEY")
    
    if not youtube_api_key:
        print("WARNING: YOUTUBE_API_KEY not set")
    if not openai_api_key:
        print("WARNING: OPENAI_API_KEY not set")
    
    youtube_service = YouTubeService(api_key=youtube_api_key)
    ai_service = AIService(api_key=openai_api_key)
    pdf_service = PDFService()
    niche_service = NicheService()
    print("✅ All services initialized successfully")
except Exception as e:
    print(f"❌ Error initializing services: {e}")
    raise


# Health check endpoint for Railway
@app.get("/")
async def root():
    """Root endpoint - Railway health check"""
    return {"status": "healthy", "service": "YouTube Topic Analyzer API", "version": "1.0"}


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy", 
        "service": "YouTube Topic Analyzer API",
        "youtube_api": "configured" if os.getenv("YOUTUBE_API_KEY") else "missing",
        "openai_api": "configured" if os.getenv("OPENAI_API_KEY") else "missing"
    }


# Request/Response Models
class VideoInfo(BaseModel):
    video_id: str
    title: str
    channel_name: str
    thumbnail: str


class ChannelSetupRequest(BaseModel):
    channel_id: str
    channel_name: str


class VideoSelectionRequest(BaseModel):
    video_ids: List[str]


class SearchRequest(BaseModel):
    query: str
    max_results: Optional[int] = 10


class SuggestSeriesRequest(BaseModel):
    primary_channel_id: str
    selected_video_ids: List[str]
    has_pdf_data: bool = False
    additional_prompt: Optional[str] = None


class SuggestFormatRequest(BaseModel):
    my_video_ids: List[str]
    competitor_video_ids: List[str]
    additional_prompt: Optional[str] = None


class SearchSimilarTitlesRequest(BaseModel):
    topic: str
    max_results: Optional[int] = 30  # Increased to 30


class GenerateThumbnailRequest(BaseModel):
    topic: str
    selected_thumbnail_urls: List[str]
    prompt: str


class SearchNicheTitlesRequest(BaseModel):
    topic: str
    use_niche: bool = True
    videos_per_channel: Optional[int] = 3  # Reduced from 10 to 3 for speed
    max_results: Optional[int] = 20


# Duplicate routes removed - using detailed versions above at lines 63-77


@app.post("/api/channel/setup")
async def setup_channel(request: ChannelSetupRequest):
    """Setup primary channel and fetch basic info"""
    try:
        channel_info = await youtube_service.get_channel_info(request.channel_id)
        recent_videos = await youtube_service.get_channel_videos(request.channel_id, max_results=20)
        
        return {
            "success": True,
            "channel": channel_info,
            "recent_videos": recent_videos
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and parse PDF with channel analysis"""
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        content = await file.read()
        parsed_data = pdf_service.parse_pdf(content)
        
        return {
            "success": True,
            "filename": file.filename,
            "parsed_data": parsed_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/videos/details")
async def get_video_details(request: VideoSelectionRequest):
    """Get detailed information about selected videos including transcripts and comments"""
    try:
        videos_data = []
        
        for video_id in request.video_ids:
            video_info = await youtube_service.get_video_info(video_id)
            transcript = await youtube_service.get_transcript(video_id)
            comments = await youtube_service.get_comments(video_id, max_results=50)
            
            videos_data.append({
                "video_id": video_id,
                "info": video_info,
                "transcript": transcript,
                "comments": comments
            })
        
        return {
            "success": True,
            "videos": videos_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search/videos")
async def search_videos(request: SearchRequest):
    """Search for videos by keyword"""
    try:
        results = await youtube_service.search_videos(request.query, max_results=request.max_results)
        
        return {
            "success": True,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search/channel")
async def search_channel(request: SearchRequest):
    """Search for videos from a specific channel"""
    try:
        # First search for the channel
        channel_results = await youtube_service.search_channels(request.query, max_results=5)
        
        if not channel_results:
            return {
                "success": True,
                "channels": [],
                "videos": []
            }
        
        # Get videos from the first matching channel
        channel_id = channel_results[0]["channel_id"]
        videos = await youtube_service.get_channel_videos(channel_id, max_results=request.max_results)
        
        return {
            "success": True,
            "channels": channel_results,
            "videos": videos
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/suggest-series")
async def suggest_series(request: SuggestSeriesRequest):
    """Analyze videos and suggest series topics - OPTIMIZED with parallel processing"""
    try:
        print(f"\n{'='*80}")
        print(f"🎯 SUGGEST SERIES - Processing {len(request.selected_video_ids)} videos")
        print(f"{'='*80}\n")
        
        # Fetch video data in PARALLEL (huge speed improvement!)
        video_data_map = await youtube_service.get_video_data_parallel(
            request.selected_video_ids, 
            max_comments=100
        )
        
        # Get video info in parallel as well
        import asyncio
        video_info_tasks = [youtube_service.get_video_info(vid) for vid in request.selected_video_ids]
        video_infos = await asyncio.gather(*video_info_tasks, return_exceptions=True)
        
        # Combine data
        videos_data = []
        for video_id, video_info in zip(request.selected_video_ids, video_infos):
            if isinstance(video_info, Exception):
                print(f"⚠️ Skipping video {video_id} due to error: {video_info}")
                continue
                
            video_data = video_data_map.get(video_id, {})
            videos_data.append({
                "title": video_info.get("title", "Unknown"),
                "description": video_info.get("description", ""),
                "transcript": video_data.get("transcript"),
                "comments": video_data.get("comments", [])
            })
        
        if not videos_data:
            raise Exception("Failed to fetch data for any of the selected videos")
        
        # Get channel context
        channel_info = await youtube_service.get_channel_info(request.primary_channel_id)
        
        print(f"\n🤖 Sending {len(videos_data)} videos to AI for analysis...")
        
        # Generate suggestions using AI
        suggestions = await ai_service.suggest_series(
            channel_context=channel_info,
            videos_data=videos_data,
            additional_prompt=request.additional_prompt
        )
        
        print(f"✅ AI analysis complete!\n")
        
        return {
            "success": True,
            "suggestions": suggestions
        }
    except Exception as e:
        print(f"❌ Error in suggest_series: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/suggest-format")
async def suggest_format(request: SuggestFormatRequest):
    """Analyze competitor videos and suggest format conversions - OPTIMIZED with parallel processing"""
    try:
        print(f"\n{'='*80}")
        print(f"🎯 SUGGEST FORMAT - Processing {len(request.my_video_ids)} my videos + {len(request.competitor_video_ids)} competitor videos")
        print(f"{'='*80}\n")
        
        import asyncio
        
        # Fetch ALL video data in parallel
        my_data_task = youtube_service.get_video_data_parallel(request.my_video_ids, max_comments=10)
        competitor_data_task = youtube_service.get_video_data_parallel(request.competitor_video_ids, max_comments=30)
        
        my_video_data_map, competitor_video_data_map = await asyncio.gather(
            my_data_task, 
            competitor_data_task
        )
        
        # Fetch video info in parallel
        all_video_ids = request.my_video_ids + request.competitor_video_ids
        video_info_tasks = [youtube_service.get_video_info(vid) for vid in all_video_ids]
        all_video_infos = await asyncio.gather(*video_info_tasks, return_exceptions=True)
        
        # Split the results
        my_video_infos = all_video_infos[:len(request.my_video_ids)]
        competitor_video_infos = all_video_infos[len(request.my_video_ids):]
        
        # Build my videos data
        my_videos_data = []
        for video_id, video_info in zip(request.my_video_ids, my_video_infos):
            if isinstance(video_info, Exception):
                print(f"⚠️ Skipping my video {video_id} due to error: {video_info}")
                continue
                
            video_data = my_video_data_map.get(video_id, {})
            my_videos_data.append({
                "title": video_info.get("title", "Unknown"),
                "description": video_info.get("description", ""),
                "transcript": video_data.get("transcript")
            })
        
        # Build competitor videos data
        competitor_videos_data = []
        for video_id, video_info in zip(request.competitor_video_ids, competitor_video_infos):
            if isinstance(video_info, Exception):
                print(f"⚠️ Skipping competitor video {video_id} due to error: {video_info}")
                continue
                
            video_data = competitor_video_data_map.get(video_id, {})
            competitor_videos_data.append({
                "title": video_info.get("title", "Unknown"),
                "description": video_info.get("description", ""),
                "transcript": video_data.get("transcript"),
                "comments": video_data.get("comments", [])
            })
        
        if not my_videos_data or not competitor_videos_data:
            raise Exception("Failed to fetch data for videos")
        
        print(f"\n🤖 Sending {len(my_videos_data)} + {len(competitor_videos_data)} videos to AI for format analysis...")
        
        # Generate format suggestions using AI
        suggestions = await ai_service.suggest_format(
            my_videos=my_videos_data,
            competitor_videos=competitor_videos_data,
            additional_prompt=request.additional_prompt
        )
        
        print(f"✅ AI format analysis complete!\n")
        
        return {
            "success": True,
            "suggestions": suggestions
        }
    except Exception as e:
        print(f"❌ Error in suggest_format: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search-similar-titles")
async def search_similar_titles(request: SearchSimilarTitlesRequest):
    """Search YouTube for similar titles using AI to understand topic essence"""
    try:
        print(f"\n{'='*80}")
        print(f"🔍 SEARCHING SIMILAR TITLES - Topic: {request.topic}")
        print(f"{'='*80}\n")
        
        # Step 1: Use AI to extract the essence and best search keywords
        print(f"🤖 Using AI to understand topic essence...")
        keyword_data = await ai_service.extract_search_keywords(request.topic)
        
        print(f"📌 Essence: {keyword_data.get('essence', 'N/A')}")
        print(f"🔑 Keywords: {keyword_data.get('primary_keywords', [])}")
        print(f"🔍 Search queries: {keyword_data.get('search_queries', [])}\n")
        
        # Step 2: Search using multiple relevant queries
        import asyncio
        all_videos = {}
        
        search_queries = keyword_data.get('search_queries', [request.topic])[:2]  # Use top 2 queries for speed
        
        print(f"🔎 Searching with {len(search_queries)} optimized queries...")
        search_tasks = [
            youtube_service.search_videos(query=query, max_results=20)  # 2 queries × 20 = 40 videos
            for query in search_queries
        ]
        search_results_list = await asyncio.gather(*search_tasks, return_exceptions=True)
        
        # Combine and deduplicate results
        for search_results in search_results_list:
            if isinstance(search_results, Exception):
                continue
            for video in search_results:
                video_id = video.get("video_id")
                if video_id and video_id not in all_videos:
                    all_videos[video_id] = video
        
        print(f"📊 Found {len(all_videos)} unique videos")
        
        # Step 3: Get detailed info for all videos
        video_ids = list(all_videos.keys())
        video_info_tasks = [youtube_service.get_video_info(vid) for vid in video_ids]
        video_infos = await asyncio.gather(*video_info_tasks, return_exceptions=True)
        
        # Step 4: Filter and score videos
        long_form_videos = []
        primary_keywords = keyword_data.get('primary_keywords', [])
        
        # Create a list of all relevant words to check against
        all_keyword_words = set()
        for keyword in primary_keywords:
            all_keyword_words.update(keyword.lower().split())
        
        for video_info in video_infos:
            if isinstance(video_info, Exception):
                continue
            
            # Parse duration
            duration_minutes = youtube_service.parse_duration_to_minutes(video_info.get('duration', 'PT0S'))
            
            # Only include videos > 10 minutes
            if duration_minutes > 10:
                title_lower = video_info["title"].lower()
                description_lower = video_info.get("description", "").lower()
                
                # IMPROVED RELEVANCE SCORING - Focus on keyword matching
                relevance_score = 0
                matched_keywords = []
                
                # Strategy 1: Check for exact phrase matches (HIGHEST PRIORITY)
                for keyword in primary_keywords:
                    keyword_lower = keyword.lower()
                    if keyword_lower in title_lower:
                        # Exact phrase in title = VERY relevant
                        relevance_score += 100
                        matched_keywords.append(keyword)
                    elif keyword_lower in description_lower:
                        # Exact phrase in description = moderately relevant
                        relevance_score += 20
                        matched_keywords.append(keyword)
                
                # Strategy 2: Check for individual keyword words in title
                title_words = set(title_lower.split())
                common_words = {'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'and', 'or', 'but', 'is', 'are', 'was', 'were'}
                meaningful_keyword_words = all_keyword_words - common_words
                word_matches = title_words.intersection(meaningful_keyword_words)
                
                # Each meaningful word match adds to score
                relevance_score += len(word_matches) * 10
                
                # Strategy 3: Check essence match (core concept)
                essence_lower = keyword_data.get('essence', '').lower()
                essence_words = set(essence_lower.split()) - common_words
                essence_matches = title_words.intersection(essence_words)
                relevance_score += len(essence_matches) * 15
                
                # FILTER: Only include videos with some relevance
                if relevance_score < 10:
                    continue  # Skip videos with low/no relevance
                
                video_score = relevance_score
                
                long_form_videos.append({
                    "video_id": video_info["video_id"],
                    "title": video_info["title"],
                    "channel_name": video_info["channel_name"],
                    "thumbnail": video_info["thumbnail"],
                    "view_count": int(video_info.get("view_count", 0)),
                    "duration_minutes": round(duration_minutes, 1),
                    "published_at": video_info["published_at"],
                    "relevance_score": video_score
                })
        
        # Sort ONLY by relevance score (not views!)
        # This ensures most relevant titles come first, regardless of popularity
        long_form_videos.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        # Remove relevance_score from final output and take top results
        top_videos = []
        for video in long_form_videos[:request.max_results]:
            video_copy = video.copy()
            video_copy.pop("relevance_score", None)
            top_videos.append(video_copy)
        
        print(f"✅ Returning {len(top_videos)} relevant long-form videos\n")
        
        return {
            "success": True,
            "topic": request.topic,
            "essence": keyword_data.get('essence', ''),
            "keywords_used": primary_keywords,
            "videos": top_videos,
            "count": len(top_videos)
        }
    except Exception as e:
        print(f"❌ Error in search_similar_titles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search-niche-titles")
async def search_niche_titles(request: SearchNicheTitlesRequest):
    """Search for titles within your curated niche channels"""
    try:
        print(f"\n{'='*80}")
        print(f"🎯 NICHE TITLE SEARCH - Topic: {request.topic}")
        print(f"{'='*80}\n")
        
        # Step 1: Extract essence and keywords using AI
        print(f"🤖 Using AI to understand topic essence...")
        keyword_data = await ai_service.extract_search_keywords(request.topic)
        
        print(f"📌 Essence: {keyword_data.get('essence', 'N/A')}")
        print(f"🔑 Keywords: {keyword_data.get('primary_keywords', [])}\n")
        
        # Step 2: Quick search from top 30 channels (priority channels)
        # This gives fast results: 30 channels × 3 videos = ~90 videos in 5-10 seconds
        max_channels = min(30, len(niche_service.channels))
        print(f"📺 Quick search: Fetching from top {max_channels} priority channels...")
        print(f"   (30 channels × 3 videos = ~90 videos for fast results)")
        niche_videos = await niche_service.fetch_videos_from_niche(
            youtube_service=youtube_service,
            videos_per_channel=request.videos_per_channel,
            min_duration_minutes=10,
            max_channels=max_channels
        )
        
        if not niche_videos:
            return {
                "success": False,
                "error": "No videos found in niche channels. Please add channels to niche_channels.json",
                "topic": request.topic,
                "videos": [],
                "count": 0
            }
        
        # Step 3: Filter videos by relevance to topic
        primary_keywords = keyword_data.get('primary_keywords', [request.topic])
        filtered_videos = niche_service.filter_videos_by_keywords(
            videos=niche_videos,
            keywords=primary_keywords,
            top_n=request.max_results
        )
        
        print(f"✅ Returning {len(filtered_videos)} relevant niche videos\n")
        
        return {
            "success": True,
            "topic": request.topic,
            "essence": keyword_data.get('essence', ''),
            "keywords_used": primary_keywords,
            "niche_channels_count": len(niche_service.channels),
            "total_videos_searched": len(niche_videos),
            "videos": filtered_videos,
            "count": len(filtered_videos)
        }
        
    except Exception as e:
        print(f"❌ Error in search_niche_titles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/niche-channels")
async def get_niche_channels():
    """Get the list of niche channels"""
    try:
        return {
            "success": True,
            "channels": niche_service.channels,
            "count": len(niche_service.channels)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/niche-channels/reload")
async def reload_niche_channels():
    """Reload niche channels from JSON file"""
    try:
        niche_service.reload_channels()
        return {
            "success": True,
            "message": f"Reloaded {len(niche_service.channels)} channels",
            "count": len(niche_service.channels)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-thumbnail")
async def generate_thumbnail(request: GenerateThumbnailRequest):
    """Generate a thumbnail using AI based on topic, selected thumbnails, and user prompt"""
    try:
        print(f"\n{'='*80}")
        print(f"🎨 GENERATING THUMBNAIL - Topic: {request.topic}")
        print(f"Selected thumbnails: {len(request.selected_thumbnail_urls)}")
        print(f"{'='*80}\n")
        
        # Generate thumbnail using AI service
        thumbnail_result = await ai_service.generate_thumbnail(
            topic=request.topic,
            reference_thumbnails=request.selected_thumbnail_urls,
            user_prompt=request.prompt
        )
        
        print(f"✅ Thumbnail generated!\n")
        
        return {
            "success": True,
            "thumbnail_url": thumbnail_result["thumbnail_url"],
            "revised_prompt": thumbnail_result.get("revised_prompt", "")
        }
    except Exception as e:
        print(f"❌ Error in generate_thumbnail: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

