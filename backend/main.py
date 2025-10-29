from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

from services.youtube_service import YouTubeService
from services.ai_service import AIService
from services.pdf_service import PDFService

# Force load .env file and override any existing environment variables
load_dotenv(override=True)

app = FastAPI(title="YouTube Topic Identifier")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
youtube_service = YouTubeService(api_key=os.getenv("YOUTUBE_API_KEY"))
ai_service = AIService(api_key=os.getenv("OPENAI_API_KEY"))
pdf_service = PDFService()


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


@app.get("/")
async def root():
    return {"message": "YouTube Topic Identifier API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


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
    """Analyze videos and suggest series topics"""
    try:
        # Get detailed data for selected videos
        videos_data = []
        for video_id in request.selected_video_ids:
            video_info = await youtube_service.get_video_info(video_id)
            transcript = await youtube_service.get_transcript(video_id)
            comments = await youtube_service.get_comments(video_id, max_results=100)
            
            videos_data.append({
                "title": video_info["title"],
                "description": video_info.get("description", ""),
                "transcript": transcript,
                "comments": comments
            })
        
        # Get channel context
        channel_info = await youtube_service.get_channel_info(request.primary_channel_id)
        
        # Generate suggestions using AI
        suggestions = await ai_service.suggest_series(
            channel_context=channel_info,
            videos_data=videos_data,
            additional_prompt=request.additional_prompt
        )
        
        return {
            "success": True,
            "suggestions": suggestions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/suggest-format")
async def suggest_format(request: SuggestFormatRequest):
    """Analyze competitor videos and suggest format conversions"""
    try:
        # Get data for my videos
        my_videos_data = []
        for video_id in request.my_video_ids:
            video_info = await youtube_service.get_video_info(video_id)
            transcript = await youtube_service.get_transcript(video_id)
            
            my_videos_data.append({
                "title": video_info["title"],
                "description": video_info.get("description", ""),
                "transcript": transcript
            })
        
        # Get data for competitor videos
        competitor_videos_data = []
        for video_id in request.competitor_video_ids:
            video_info = await youtube_service.get_video_info(video_id)
            transcript = await youtube_service.get_transcript(video_id)
            comments = await youtube_service.get_comments(video_id, max_results=30)
            
            competitor_videos_data.append({
                "title": video_info["title"],
                "description": video_info.get("description", ""),
                "transcript": transcript,
                "comments": comments
            })
        
        # Generate format suggestions using AI
        suggestions = await ai_service.suggest_format(
            my_videos=my_videos_data,
            competitor_videos=competitor_videos_data,
            additional_prompt=request.additional_prompt
        )
        
        return {
            "success": True,
            "suggestions": suggestions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

