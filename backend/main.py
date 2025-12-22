from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
import json
import re
from dotenv import load_dotenv

from services.youtube_service import YouTubeService
from services.ai_service import AIService
from services.pdf_service import PDFService
from services.niche_service import NicheService
from services.static_data_service import StaticDataService

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
    static_data_service = StaticDataService()
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
    max_videos: Optional[int] = 100


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


class ReverseEngineeringPromptRequest(BaseModel):
    filenames: List[str]
    custom_prompt: str
    selected_video_ids: Optional[List[str]] = None


class ReverseEngineeringChatRequest(BaseModel):
    filenames: List[str]
    conversation_history: List[Dict]
    new_message: str


class TopicAnalysisRequest(BaseModel):
    analysis_type: str  # 'zero1', 'niche', 'outside'
    metadata_fields: List[str]  # ['title', 'transcript', 'comments', 'views', 'thumbnail']
    custom_prompt: str
    filenames: Optional[List[str]] = []
    channel_ids: Optional[List[str]] = []


class TopicChatRequest(BaseModel):
    analysis_type: str
    metadata_fields: List[str]
    conversation_history: List[Dict]
    new_message: str
    filenames: Optional[List[str]] = []
    channel_ids: Optional[List[str]] = []


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
        max_vids = request.max_videos if request.max_videos else 100
        recent_videos = await youtube_service.get_channel_videos(request.channel_id, max_results=max_vids)
        
        return {
            "success": True,
            "channel": channel_info,
            "recent_videos": recent_videos
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class TemplateAnalysisRequest(BaseModel):
    video_ids: List[str]
    template_id: str
    custom_prompt: str


@app.post("/api/analyze/template")
async def analyze_with_template(request: TemplateAnalysisRequest):
    """Analyze videos with a specific template"""
    try:
        print(f"🔍 Fetching transcripts and comments for {len(request.video_ids)} videos...")
        
        # Fetch transcripts and comments in parallel
        video_data = await youtube_service.get_video_data_parallel(request.video_ids, max_comments=50)
        
        # Build context for AI
        context_parts = []
        for video_id in request.video_ids:
            data = video_data.get(video_id, {})
            transcript = data.get('transcript', '')
            comments = data.get('comments', [])
            
            if transcript:
                context_parts.append(f"Video {video_id}:")
                context_parts.append(f"Transcript: {transcript[:2000]}...")  # First 2000 chars
                
                if comments:
                    comment_texts = [c.get('text', '') for c in comments[:20]]  # Top 20 comments
                    context_parts.append(f"Top Comments: {' | '.join(comment_texts)}")
                
                context_parts.append("\n---\n")
        
        full_context = "\n".join(context_parts)
        
        # Run AI analysis
        analysis_prompt = f"""{request.custom_prompt}

Based on the following video content, provide 6-8 specific topic suggestions with reasons:

{full_context}

CRITICAL: Return ONLY a valid JSON array of objects with this exact format:
[
  {{"topic": "Topic Title Here", "reason": "1-2 sentence explanation of why this topic is recommended"}},
  {{"topic": "Another Topic", "reason": "Explanation here"}}
]

Do not include any markdown formatting, code blocks, or additional text. Just the raw JSON array.
"""
        
        print(f"🤖 Running AI analysis with template: {request.template_id}")
        response = await ai_service.generate_response(analysis_prompt)
        
        # Parse response - try to extract JSON array
        print(f"📝 Raw AI response preview: {response[:500]}...")
        
        try:
            # Clean the response - remove markdown code blocks if present
            cleaned_response = response.strip()
            if '```json' in cleaned_response:
                # Extract content between ```json and ```
                json_match = re.search(r'```json\s*([\s\S]*?)\s*```', cleaned_response)
                if json_match:
                    cleaned_response = json_match.group(1)
            elif '```' in cleaned_response:
                # Extract content between ``` and ```
                json_match = re.search(r'```\s*([\s\S]*?)\s*```', cleaned_response)
                if json_match:
                    cleaned_response = json_match.group(1)
            
            # Try to find JSON array in response
            json_match = re.search(r'\[[\s\S]*\]', cleaned_response)
            if json_match:
                topics = json.loads(json_match.group())
                if isinstance(topics, list):
                    # Validate format
                    parsed_topics = []
                    for item in topics:
                        if isinstance(item, dict):
                            topic_text = item.get('topic', '') or item.get('title', '')
                            reason_text = item.get('reason', '') or item.get('why', '') or item.get('explanation', '')
                            
                            if topic_text:
                                parsed_topics.append({
                                    'topic': topic_text.strip(),
                                    'reason': reason_text.strip() if reason_text else 'This topic was identified based on the template analysis.'
                                })
                        elif isinstance(item, str):
                            parsed_topics.append({
                                'topic': item.strip(),
                                'reason': 'This topic was identified based on the template analysis.'
                            })
                    
                    if parsed_topics:
                        print(f"✅ Successfully parsed {len(parsed_topics)} topics with reasons")
                        print(f"📊 Sample topic: {parsed_topics[0]}")
                        return {
                            "success": True,
                            "template_id": request.template_id,
                            "topics": parsed_topics[:8],  # Return max 8 topics
                            "videos_analyzed": len(request.video_ids)
                        }
            
            # Fallback: Try to parse numbered list with "Why:" format
            print("⚠️  JSON parsing failed, trying text-based extraction...")
            lines = response.split('\n')
            parsed_topics = []
            current_topic = None
            current_reason = None
            
            for line in lines:
                line = line.strip()
                # Look for numbered lines or bold topics
                if re.match(r'^\d+\.\s*\*\*(.+?)\*\*', line):
                    # Format: 1. **Topic Title**
                    match = re.match(r'^\d+\.\s*\*\*(.+?)\*\*', line)
                    if current_topic:
                        parsed_topics.append({
                            'topic': current_topic,
                            'reason': current_reason or 'This topic was identified based on the template analysis.'
                        })
                    current_topic = match.group(1).strip()
                    current_reason = None
                    
                    # Check if reason is on same line
                    if '*Why:*' in line or 'Why:' in line:
                        reason_match = re.search(r'\*Why:\*\s*(.+)', line) or re.search(r'Why:\s*(.+)', line)
                        if reason_match:
                            current_reason = reason_match.group(1).strip()
                
                elif current_topic and ('*Why:*' in line or 'Why:' in line):
                    # Reason on separate line
                    reason_match = re.search(r'\*Why:\*\s*(.+)', line) or re.search(r'Why:\s*(.+)', line)
                    if reason_match:
                        current_reason = reason_match.group(1).strip()
            
            # Add last topic
            if current_topic:
                parsed_topics.append({
                    'topic': current_topic,
                    'reason': current_reason or 'This topic was identified based on the template analysis.'
                })
            
            if parsed_topics:
                print(f"✅ Text extraction successful: {len(parsed_topics)} topics")
                print(f"📊 Sample topic: {parsed_topics[0]}")
                return {
                    "success": True,
                    "template_id": request.template_id,
                    "topics": parsed_topics[:8],
                    "videos_analyzed": len(request.video_ids)
                }
            
            # Last resort fallback
            print("⚠️  All parsing methods failed, using basic line extraction")
            lines = [line.strip() for line in response.split('\n') if line.strip()]
            topics = []
            for line in lines:
                cleaned = line.lstrip('0123456789.-•* ').strip('"\'[]')
                if cleaned and len(cleaned) > 10 and not cleaned.startswith(('Based on', 'Here are', 'I recommend')):
                    topics.append({
                        'topic': cleaned[:200],  # Limit length
                        'reason': 'This topic was identified based on the template analysis.'
                    })
            
            return {
                "success": True,
                "template_id": request.template_id,
                "topics": topics[:8],
                "videos_analyzed": len(request.video_ids)
            }
            
        except Exception as e:
            print(f"⚠️ JSON parsing failed: {e}, falling back to line extraction")
            # Final fallback
            lines = [line.strip() for line in response.split('\n') if line.strip()]
            topics = []
            for line in lines:
                cleaned = line.lstrip('0123456789.-•* ').strip('"\'[]')
                if cleaned and len(cleaned) > 10:
                    topics.append({'topic': cleaned, 'reason': ''})
            
            return {
                "success": True,
                "template_id": request.template_id,
                "topics": topics[:8],
                "videos_analyzed": len(request.video_ids)
            }
        
    except Exception as e:
        print(f"❌ Template analysis error: {str(e)}")
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


# ============================================================================
# REVERSE ENGINEERING ENDPOINTS - Static Data Analysis
# ============================================================================

@app.get("/api/reverse-engineering/files")
async def get_available_data_files():
    """Get list of available static data files"""
    try:
        files = static_data_service.get_available_files()
        return {
            "success": True,
            "files": files,
            "count": len(files)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reverse-engineering/upload-pdf")
async def upload_youtube_data_pdf(file: UploadFile = File(...), channel_name: str = "", debug: bool = False):
    """
    Upload PDF containing YouTube data and automatically convert to JSON
    """
    try:
        print(f"\n{'='*80}")
        print(f"📄 PDF UPLOAD - File: {file.filename}")
        print(f"📺 Channel: {channel_name or 'Not specified'}")
        print(f"{'='*80}\n")
        
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Read PDF content
        content = await file.read()
        
        print(f"📖 Parsing PDF ({len(content)} bytes)...")
        
        # DEBUG MODE: Save raw extracted text
        if debug:
            from pathlib import Path
            import PyPDF2
            from io import BytesIO
            
            pdf_file = BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            raw_text = "\n".join([page.extract_text() for page in pdf_reader.pages])
            
            debug_file = Path(__file__).parent / "static_data" / "debug_pdf_text.txt"
            with open(debug_file, 'w', encoding='utf-8') as f:
                f.write(raw_text)
            print(f"🐛 Debug: Raw text saved to {debug_file}")
        
        # Parse PDF and extract YouTube data
        result = pdf_service.parse_youtube_data_pdf(content, channel_name)
        
        if not result.get("success"):
            print(f"⚠️  Could not auto-parse PDF structure")
            print(f"Error: {result.get('error')}")
            
            # Return raw text for manual review
            return {
                "success": False,
                "error": result.get("error"),
                "raw_text": result.get("raw_text", "")[:5000],  # First 5000 chars for preview
                "suggestion": "The PDF structure couldn't be automatically parsed. Please review the preview and format your data according to the template."
            }
        
        # Save JSON to static_data directory
        import os
        from pathlib import Path
        
        # Generate filename from channel name or original filename
        if channel_name:
            safe_name = "".join(c for c in channel_name if c.isalnum() or c in (' ', '-', '_')).strip()
            safe_name = safe_name.replace(' ', '_')
            json_filename = f"{safe_name}.json"
        else:
            json_filename = file.filename.replace('.pdf', '.json')
        
        static_data_dir = Path(__file__).parent / "static_data"
        static_data_dir.mkdir(exist_ok=True)
        
        json_path = static_data_dir / json_filename
        
        # Save JSON
        import json as json_module
        with open(json_path, 'w', encoding='utf-8') as f:
            json_module.dump(result["data"], f, indent=2, ensure_ascii=False)
        
        print(f"✅ Successfully parsed {result['videos_parsed']} videos")
        print(f"💾 Saved to: {json_filename}\n")
        
        return {
            "success": True,
            "filename": json_filename,
            "videos_parsed": result["videos_parsed"],
            "pages_processed": result["pages_processed"],
            "data": result["data"],
            "message": f"Successfully converted PDF to JSON with {result['videos_parsed']} videos"
        }
        
    except Exception as e:
        print(f"❌ Error in PDF upload: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reverse-engineering/load")
async def load_static_data(request: dict):
    """Load specific static data files"""
    try:
        filenames = request.get("filenames", [])
        
        if not filenames:
            raise HTTPException(status_code=400, detail="No filenames provided")
        
        # Load and combine data
        combined_data = static_data_service.load_multiple_files(filenames)
        
        # Get statistics
        stats = static_data_service.get_summary_statistics(filenames)
        
        return {
            "success": True,
            "data": combined_data,
            "statistics": stats
        }
    except Exception as e:
        print(f"❌ Error loading static data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reverse-engineering/analyze")
async def analyze_with_custom_prompt(request: ReverseEngineeringPromptRequest):
    """Run custom prompt analysis on static data"""
    try:
        print(f"\n{'='*80}")
        print(f"🔍 REVERSE ENGINEERING ANALYSIS")
        print(f"Files: {request.filenames}")
        print(f"{'='*80}\n")
        
        # Load data from files
        combined_data = static_data_service.load_multiple_files(request.filenames)
        videos = combined_data["videos"]
        
        # Filter to selected videos if specified
        if request.selected_video_ids:
            videos = [v for v in videos if v.get("video_id") in request.selected_video_ids]
        
        if not videos:
            raise HTTPException(status_code=400, detail="No videos found")
        
        print(f"📊 Total videos to analyze: {len(videos)}")
        
        # Smart truncation based on number of videos
        # Adaptive limits to stay under 100k tokens (~75k words)
        if len(videos) > 100:
            transcript_limit = 500
            comments_limit = 3
            comment_char_limit = 100
            max_videos = 100
            print(f"⚠️  Large dataset detected! Limiting to first {max_videos} videos with reduced detail")
            videos = videos[:max_videos]
        elif len(videos) > 50:
            transcript_limit = 1000
            comments_limit = 5
            comment_char_limit = 150
        elif len(videos) > 20:
            transcript_limit = 2000
            comments_limit = 10
            comment_char_limit = 200
        else:
            transcript_limit = 3000
            comments_limit = 15
            comment_char_limit = 250
        
        # Prepare video data for AI analysis
        videos_data = []
        for video in videos:
            videos_data.append({
                "title": video.get("title", ""),
                "description": video.get("description", ""),
                "transcript": video.get("transcript", "")[:transcript_limit],
                "comments": video.get("comments", [])[:comments_limit]
            })
        
        # Build the prompt
        videos_summary = []
        for idx, video in enumerate(videos_data, 1):
            video_text = f"""
═══ VIDEO {idx}: {video['title']} ═══

DESCRIPTION: {video.get('description', 'N/A')[:300]}

TRANSCRIPT EXCERPT: {video.get('transcript', 'N/A')}

TOP COMMENTS:
"""
            if video.get('comments'):
                for cidx, comment in enumerate(video['comments'], 1):
                    comment_text = comment.get('text', '') if isinstance(comment, dict) else str(comment)
                    video_text += f"{cidx}. {comment_text[:comment_char_limit]}\n"
            else:
                video_text += "No comments.\n"
            
            videos_summary.append(video_text)
        
        prompt = f"""You are analyzing YouTube video content to extract insights.

VIDEOS TO ANALYZE:
{''.join(videos_summary)}

USER'S CUSTOM ANALYSIS REQUEST:
{request.custom_prompt}

Please provide a detailed analysis based on the user's request. Structure your response clearly with:
1. Key findings
2. Patterns and themes
3. Actionable insights
4. Recommendations

Provide your response in JSON format:
{{
  "analysis_summary": "Brief overview of your findings",
  "key_findings": ["Finding 1", "Finding 2", ...],
  "patterns": ["Pattern 1", "Pattern 2", ...],
  "insights": ["Insight 1", "Insight 2", ...],
  "recommendations": ["Recommendation 1", "Recommendation 2", ...]
}}
"""
        
        print(f"🤖 Analyzing {len(videos_data)} videos with custom prompt...")
        
        # Call AI service
        import json
        response = ai_service.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a YouTube content analyst providing detailed insights based on video transcripts and comments."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=3000,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        
        print(f"✅ Analysis complete!\n")
        
        return {
            "success": True,
            "analysis": result,
            "videos_analyzed": len(videos_data),
            "total_videos_in_data": len(combined_data["videos"])
        }
        
    except Exception as e:
        print(f"❌ Error in reverse engineering analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reverse-engineering/chat")
async def chat_with_data(request: ReverseEngineeringChatRequest):
    """Chat interface for iterative analysis of static data"""
    try:
        print(f"\n{'='*80}")
        print(f"💬 REVERSE ENGINEERING CHAT")
        print(f"Files: {request.filenames}")
        print(f"{'='*80}\n")
        
        # Load data from files
        combined_data = static_data_service.load_multiple_files(request.filenames)
        videos = combined_data["videos"]
        
        # Prepare condensed data context
        data_context = f"""
You have access to data from {len(combined_data['channels'])} YouTube channels with {len(videos)} total videos.

CHANNELS:
"""
        for channel in combined_data['channels']:
            data_context += f"- {channel['channel_name']}: {channel['videos_count']} videos\n"
        
        data_context += f"""
SAMPLE VIDEO TITLES (first 10):
"""
        for idx, video in enumerate(videos[:10], 1):
            data_context += f"{idx}. {video['title']} ({video['channel_name']})\n"
        
        if len(videos) > 10:
            data_context += f"... and {len(videos) - 10} more videos\n"
        
        # Build conversation messages
        messages = [
            {
                "role": "system", 
                "content": f"""You are a helpful YouTube content analyst with access to pre-loaded video data. 
                
DATA AVAILABLE:
{data_context}

You can analyze titles, transcripts, comments, and provide insights. When users ask questions, 
provide specific, data-driven answers based on the loaded content."""
            }
        ]
        
        # Add conversation history
        for msg in request.conversation_history:
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        
        # Add new message
        messages.append({
            "role": "user",
            "content": request.new_message
        })
        
        print(f"🤖 Processing chat message...")
        
        # Call AI service
        response = ai_service.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )
        
        assistant_message = response.choices[0].message.content
        
        print(f"✅ Chat response generated!\n")
        
        return {
            "success": True,
            "response": assistant_message,
            "data_summary": {
                "total_channels": len(combined_data['channels']),
                "total_videos": len(videos)
            }
        }
        
    except Exception as e:
        print(f"❌ Error in reverse engineering chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===================================
# TOPIC IDENTIFICATION ENDPOINTS
# ===================================

def filter_video_data_by_metadata(videos: List[Dict], metadata_fields: List[str]) -> List[Dict]:
    """
    Filter video data to only include selected metadata fields
    """
    filtered_videos = []
    
    for video in videos:
        filtered_video = {}
        
        if 'title' in metadata_fields:
            filtered_video['title'] = video.get('title', '')
        
        if 'transcript' in metadata_fields:
            filtered_video['transcript'] = video.get('transcript', '')
        
        if 'comments' in metadata_fields:
            filtered_video['comments'] = video.get('comments', [])
        
        if 'views' in metadata_fields:
            filtered_video['view_count'] = video.get('view_count', 0)
            filtered_video['engagement'] = video.get('engagement', {})
        
        if 'thumbnail' in metadata_fields:
            filtered_video['thumbnail_url'] = video.get('thumbnail_url', '')
            filtered_video['title'] = video.get('title', '')  # Need title for thumbnail context
        
        # Always include video_id and channel for context
        filtered_video['video_id'] = video.get('video_id', '')
        filtered_video['channel_name'] = video.get('channel_name', '')
        
        filtered_videos.append(filtered_video)
    
    return filtered_videos


@app.post("/api/topics/analyze")
async def analyze_topics(request: TopicAnalysisRequest):
    """
    Analyze topics with metadata filtering
    """
    try:
        print(f"\n{'='*80}")
        print(f"💡 TOPIC IDENTIFICATION ANALYSIS")
        print(f"Analysis Type: {request.analysis_type}")
        print(f"Metadata Fields: {request.metadata_fields}")
        print(f"Filenames: {request.filenames}")
        print(f"Channel IDs: {request.channel_ids}")
        print(f"{'='*80}\n")
        
        # Load data
        videos = []
        
        # Load from files
        if request.filenames:
            combined_data = static_data_service.load_multiple_files(request.filenames)
            videos.extend(combined_data["videos"])
        
        # Fetch from channels if provided
        if request.channel_ids:
            for channel_id in request.channel_ids:
                try:
                    channel_videos = youtube_service.get_channel_videos(channel_id, max_results=10)
                    videos.extend(channel_videos)
                except Exception as e:
                    print(f"⚠️  Warning: Failed to fetch videos for channel {channel_id}: {str(e)}")
        
        if not videos:
            raise HTTPException(status_code=400, detail="No videos found to analyze")
        
        print(f"📊 Total videos loaded: {len(videos)}")
        
        # Filter videos based on selected metadata
        filtered_videos = filter_video_data_by_metadata(videos, request.metadata_fields)
        
        # Smart truncation based on number of videos and metadata
        has_transcript = 'transcript' in request.metadata_fields
        has_comments = 'comments' in request.metadata_fields
        
        if has_transcript:
            if len(videos) > 50:
                transcript_limit = 500
                max_videos = 50
                print(f"⚠️  Large dataset with transcripts! Limiting to first {max_videos} videos")
                filtered_videos = filtered_videos[:max_videos]
            elif len(videos) > 20:
                transcript_limit = 1000
            else:
                transcript_limit = 2000
            
            # Truncate transcripts
            for video in filtered_videos:
                if 'transcript' in video:
                    video['transcript'] = video['transcript'][:transcript_limit]
        
        if has_comments:
            comments_limit = 10 if len(videos) > 20 else 15
            for video in filtered_videos:
                if 'comments' in video:
                    video['comments'] = video['comments'][:comments_limit]
        
        # Build prompt based on available metadata
        metadata_description = ', '.join(request.metadata_fields)
        
        videos_summary = []
        for idx, video in enumerate(filtered_videos, 1):
            video_text = f"\n═══ VIDEO {idx} ═══\n"
            
            if 'title' in request.metadata_fields:
                video_text += f"TITLE: {video.get('title', 'N/A')}\n"
            
            if 'views' in request.metadata_fields:
                video_text += f"VIEWS: {video.get('view_count', 0):,}\n"
            
            if 'transcript' in request.metadata_fields and video.get('transcript'):
                video_text += f"TRANSCRIPT: {video['transcript']}\n"
            
            if 'comments' in request.metadata_fields and video.get('comments'):
                video_text += "COMMENTS:\n"
                for cidx, comment in enumerate(video['comments'][:10], 1):
                    comment_text = comment.get('text', '') if isinstance(comment, dict) else str(comment)
                    video_text += f"  {cidx}. {comment_text[:200]}\n"
            
            videos_summary.append(video_text)
        
        prompt = f"""You are a YouTube content strategist identifying high-potential content topics.

ANALYSIS TYPE: {request.analysis_type.upper()}
AVAILABLE METADATA: {metadata_description}

VIDEOS TO ANALYZE:
{''.join(videos_summary)}

USER'S ANALYSIS REQUEST:
{request.custom_prompt}

Please provide your analysis in JSON format:
{{
  "analysis_summary": "Brief overview of your findings",
  "key_findings": ["Finding 1", "Finding 2", ...],
  "patterns": ["Pattern 1", "Pattern 2", ...],
  "insights": ["Insight 1", "Insight 2", ...],
  "recommendations": ["Recommendation 1", "Recommendation 2", ...]
}}

Focus on actionable insights that can help create successful content."""
        
        print(f"🤖 Analyzing {len(filtered_videos)} videos...")
        
        # Call AI service
        import json
        response = ai_service.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a YouTube content strategist specializing in topic identification and content strategy."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=3000,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        
        print(f"✅ Topic analysis complete!\n")
        
        return {
            "success": True,
            "analysis": result,
            "videos_analyzed": len(filtered_videos),
            "metadata_used": request.metadata_fields
        }
        
    except Exception as e:
        print(f"❌ Error in topic analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/topics/chat")
async def chat_topics(request: TopicChatRequest):
    """
    Chat interface for topic analysis
    """
    try:
        print(f"\n{'='*80}")
        print(f"💬 TOPIC IDENTIFICATION CHAT")
        print(f"Analysis Type: {request.analysis_type}")
        print(f"Metadata Fields: {request.metadata_fields}")
        print(f"{'='*80}\n")
        
        # Load data
        videos = []
        
        if request.filenames:
            combined_data = static_data_service.load_multiple_files(request.filenames)
            videos.extend(combined_data["videos"])
        
        if request.channel_ids:
            for channel_id in request.channel_ids:
                try:
                    channel_videos = youtube_service.get_channel_videos(channel_id, max_results=10)
                    videos.extend(channel_videos)
                except Exception as e:
                    print(f"⚠️  Warning: Failed to fetch videos for channel {channel_id}: {str(e)}")
        
        if not videos:
            raise HTTPException(status_code=400, detail="No videos found")
        
        # Filter by metadata
        filtered_videos = filter_video_data_by_metadata(videos, request.metadata_fields)
        
        # Create condensed context
        metadata_description = ', '.join(request.metadata_fields)
        data_context = f"""
You have access to {len(filtered_videos)} YouTube videos.
Analysis type: {request.analysis_type.upper()}
Available metadata: {metadata_description}

SAMPLE VIDEO TITLES (first 5):
"""
        for idx, video in enumerate(filtered_videos[:5], 1):
            data_context += f"{idx}. {video.get('title', 'Untitled')} - {video.get('channel_name', 'Unknown')}\n"
        
        if len(filtered_videos) > 5:
            data_context += f"... and {len(filtered_videos) - 5} more videos\n"
        
        # Build messages
        messages = [
            {
                "role": "system",
                "content": f"""You are a YouTube content strategist helping identify content topics.

{data_context}

Answer questions based on the available data and metadata. Provide specific, actionable insights."""
            }
        ]
        
        # Add conversation history
        for msg in request.conversation_history:
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        
        # Add new message
        messages.append({
            "role": "user",
            "content": request.new_message
        })
        
        print(f"🤖 Processing chat message...")
        
        # Call AI service
        response = ai_service.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )
        
        assistant_message = response.choices[0].message.content
        
        print(f"✅ Chat response generated!\n")
        
        return {
            "success": True,
            "response": assistant_message,
            "videos_available": len(filtered_videos)
        }
        
    except Exception as e:
        print(f"❌ Error in topic chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===============================================
# TREND IDENTIFICATION ENDPOINTS
# ===============================================

class TrendFetchRequest(BaseModel):
    channel_ids: List[str]
    days: int  # 3, 7, 15, 30
    video_type: str  # 'all', 'videos', 'shorts'


class TrendAnalyzeRequest(BaseModel):
    videos: List[Dict]
    niche_type: str  # 'indian' or 'global'
    days: int


@app.get("/api/trends/niche-channels")
async def get_niche_channels():
    """
    Get the list of Indian and Global niche channels
    """
    try:
        import json
        niche_file_path = os.path.join(os.path.dirname(__file__), "niche_channels.json")
        
        with open(niche_file_path, 'r') as f:
            niche_data = json.load(f)
        
        return {
            "indian": niche_data.get("indian_niche", []),
            "global": niche_data.get("global_niche", [])
        }
    except Exception as e:
        print(f"❌ Error loading niche channels: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/trends/fetch-videos")
async def fetch_trend_videos(request: TrendFetchRequest):
    """
    Fetch recent videos from multiple channels with date and type filters
    """
    try:
        print(f"\n{'='*80}")
        print(f"📊 FETCHING TREND VIDEOS")
        print(f"Channels: {len(request.channel_ids)}")
        print(f"Days: {request.days}")
        print(f"Type: {request.video_type}")
        print(f"{'='*80}\n")
        
        from datetime import datetime, timedelta, timezone
        
        all_videos = []
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=request.days)
        
        print(f"📅 Cutoff date: {cutoff_date.isoformat()}")
        print(f"📅 Current time: {datetime.now(timezone.utc).isoformat()}")
        
        for idx, channel_id in enumerate(request.channel_ids, 1):
            try:
                print(f"📹 Fetching from channel {idx}/{len(request.channel_ids)}...")
                
                # Fetch videos from channel
                videos = await youtube_service.get_channel_videos(channel_id, max_results=50)
                print(f"   Received {len(videos)} videos from API")
                
                # Filter by date
                videos_added_for_this_channel = 0
                for idx, video in enumerate(videos):
                    # Parse published date
                    pub_date_str = video.get('published_at', '')
                    if pub_date_str:
                        # Handle both ISO format and simple date format
                        try:
                            if 'T' in pub_date_str:
                                pub_date = datetime.fromisoformat(pub_date_str.replace('Z', '+00:00'))
                            else:
                                pub_date = datetime.strptime(pub_date_str, '%Y-%m-%d').replace(tzinfo=timezone.utc)
                            
                            # Debug: Print first 3 video dates
                            if idx < 3:
                                print(f"      Video {idx+1}: '{video.get('title', '')[:40]}...'")
                                print(f"               Published: {pub_date.isoformat()}")
                                print(f"               Cutoff: {cutoff_date.isoformat()}")
                                print(f"               Within range: {pub_date >= cutoff_date}")
                            
                            # Check if video is within date range
                            if pub_date >= cutoff_date:
                                # Filter by video type if specified
                                if request.video_type != 'all':
                                    duration = video.get('duration', '')
                                    is_short = is_video_short(duration)
                                    
                                    if request.video_type == 'shorts' and not is_short:
                                        print(f"      Skipping '{video.get('title', '')[:40]}...' - not a short")
                                        continue
                                    if request.video_type == 'videos' and is_short:
                                        print(f"      Skipping '{video.get('title', '')[:40]}...' - is a short")
                                        continue
                                
                                all_videos.append(video)
                                videos_added_for_this_channel += 1
                            else:
                                # Video is too old
                                pass
                        except Exception as e:
                            print(f"⚠️  Warning: Could not parse date {pub_date_str}: {str(e)}")
                            # Include video anyway if we can't parse date
                            all_videos.append(video)
                            videos_added_for_this_channel += 1
                
                print(f"   ✓ Added {videos_added_for_this_channel} videos from this channel")
                
            except Exception as e:
                print(f"⚠️  Warning: Failed to fetch videos for channel {channel_id}: {str(e)}")
                continue
        
        # Sort by published date (most recent first)
        all_videos.sort(key=lambda x: x.get('published_at', ''), reverse=True)
        
        print(f"✅ Fetched {len(all_videos)} videos from {len(request.channel_ids)} channels\n")
        
        return {
            "success": True,
            "videos": all_videos,
            "total_videos": len(all_videos),
            "channels_fetched": len(request.channel_ids)
        }
        
    except Exception as e:
        print(f"❌ Error fetching trend videos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/trends/analyze-topics")
async def analyze_trending_topics(request: TrendAnalyzeRequest):
    """
    Analyze trending topics and provide content suggestions for Zero1
    """
    try:
        print(f"\n{'='*80}")
        print(f"🔥 ANALYZING TRENDING TOPICS")
        print(f"Videos: {len(request.videos)}")
        print(f"Niche: {request.niche_type}")
        print(f"Days: {request.days}")
        print(f"{'='*80}\n")
        
        # Build video summary for AI
        videos_summary = []
        for idx, video in enumerate(request.videos[:100], 1):  # Limit to 100 videos for token management
            video_text = f"{idx}. {video.get('title', 'Untitled')}\n"
            video_text += f"   Channel: {video.get('channel_title', 'Unknown')}\n"
            video_text += f"   Views: {video.get('view_count', 0):,} | "
            video_text += f"Likes: {video.get('like_count', 0):,} | "
            video_text += f"Comments: {video.get('comment_count', 0):,}\n"
            video_text += f"   Published: {video.get('published_at', 'Unknown')}\n"
            videos_summary.append(video_text)
        
        prompt = f"""You are a YouTube content strategist analyzing trending topics in the finance/personal finance niche.

CONTEXT:
- Analyzing content from {request.niche_type.upper()} niche channels
- Time period: Last {request.days} days
- Total videos: {len(request.videos)}
- Target channel: Zero1 by Zerodha (Indian finance education channel)

VIDEOS TO ANALYZE:
{''.join(videos_summary)}

TASK:
Analyze these trending videos and identify content topic suggestions for Zero1.

Focus on:
1. **Recurring themes** across multiple channels
2. **High-performing topics** (based on views, likes, engagement)
3. **Content gaps** that Zero1 could fill
4. **Emerging trends** in the finance content space
5. **Angles that would work for Zero1's audience** (Indian millennials/Gen Z interested in finance)

Provide your analysis in JSON format:
{{
  "summary": "Brief overview of the trending landscape",
  "trending_topics": [
    {{
      "title": "Topic name",
      "description": "Why this is trending and how Zero1 could approach it",
      "evidence": "Which channels are covering this and their performance"
    }}
  ],
  "content_suggestions": [
    "Specific video idea 1",
    "Specific video idea 2",
    ...
  ],
  "insights": [
    "Key insight about the niche",
    "Pattern or opportunity identified",
    ...
  ]
}}

Make suggestions actionable and specific to Zero1's brand and audience."""

        print(f"🤖 Analyzing trending topics...")
        
        # Call AI service
        import json
        response = ai_service.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a YouTube content strategist specializing in finance and personal finance content."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=3000,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        
        print(f"✅ Trend analysis complete!\n")
        
        return {
            "success": True,
            "analysis": result,
            "videos_analyzed": len(request.videos)
        }
        
    except Exception as e:
        print(f"❌ Error analyzing trends: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def is_video_short(duration: str) -> bool:
    """
    Check if a video is a YouTube Short based on duration (< 3 minutes)
    """
    if not duration:
        return False
    
    # Parse ISO 8601 duration (e.g., PT4M13S)
    import re
    match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration)
    if not match:
        return False
    
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    
    total_seconds = hours * 3600 + minutes * 60 + seconds
    return total_seconds < 180  # Less than 3 minutes


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

