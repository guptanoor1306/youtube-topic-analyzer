"""
Database service for video metadata caching
"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import json

from database import VideoMetadata, ChannelCache


class DatabaseService:
    """Handles video metadata caching in database"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_video_metadata(self, video_id: str) -> Optional[VideoMetadata]:
        """
        Get cached video metadata from database
        Returns None if not found
        """
        return self.db.query(VideoMetadata).filter(
            VideoMetadata.video_id == video_id
        ).first()
    
    def get_multiple_videos(self, video_ids: List[str]) -> Dict[str, VideoMetadata]:
        """
        Get multiple videos from cache
        Returns dict mapping video_id -> VideoMetadata
        """
        videos = self.db.query(VideoMetadata).filter(
            VideoMetadata.video_id.in_(video_ids)
        ).all()
        
        return {video.video_id: video for video in videos}
    
    def save_video_metadata(
        self,
        video_id: str,
        title: str,
        thumbnail_url: str,
        view_count: int,
        channel_id: str,
        channel_title: str,
        transcript: Optional[str] = None,
        comments: Optional[List[Dict]] = None
    ) -> VideoMetadata:
        """
        Save or update video metadata in database
        """
        # Check if video already exists
        video = self.get_video_metadata(video_id)
        
        if video:
            # Update existing record
            video.title = title
            video.thumbnail_url = thumbnail_url
            video.view_count = view_count
            video.channel_id = channel_id
            video.channel_title = channel_title
            
            if transcript is not None:
                video.transcript = transcript
            if comments is not None:
                video.comments = comments
            
            video.updated_at = datetime.utcnow()
        else:
            # Create new record
            video = VideoMetadata(
                video_id=video_id,
                title=title,
                thumbnail_url=thumbnail_url,
                view_count=view_count,
                channel_id=channel_id,
                channel_title=channel_title,
                transcript=transcript,
                comments=comments
            )
            self.db.add(video)
        
        self.db.commit()
        self.db.refresh(video)
        return video
    
    def update_transcript(self, video_id: str, transcript: str) -> bool:
        """Update only the transcript for a video"""
        video = self.get_video_metadata(video_id)
        if video:
            video.transcript = transcript
            video.updated_at = datetime.utcnow()
            self.db.commit()
            return True
        return False
    
    def update_comments(self, video_id: str, comments: List[Dict]) -> bool:
        """Update only the comments for a video"""
        video = self.get_video_metadata(video_id)
        if video:
            video.comments = comments
            video.updated_at = datetime.utcnow()
            self.db.commit()
            return True
        return False
    
    def is_cache_fresh(self, video_id: str, max_age_hours: int = 24) -> bool:
        """
        Check if cached data is still fresh
        Returns False if cache doesn't exist or is too old
        """
        video = self.get_video_metadata(video_id)
        if not video or not video.updated_at:
            return False
        
        age = datetime.utcnow() - video.updated_at
        return age < timedelta(hours=max_age_hours)
    
    def get_cache_stats(self) -> Dict:
        """Get statistics about cached videos"""
        total_videos = self.db.query(VideoMetadata).count()
        videos_with_transcript = self.db.query(VideoMetadata).filter(
            VideoMetadata.transcript.isnot(None)
        ).count()
        videos_with_comments = self.db.query(VideoMetadata).filter(
            VideoMetadata.comments.isnot(None)
        ).count()
        
        return {
            'total_videos': total_videos,
            'videos_with_transcript': videos_with_transcript,
            'videos_with_comments': videos_with_comments
        }
    
    # Channel caching methods
    def get_channel_cache(self, channel_id: str) -> Optional[ChannelCache]:
        """Get cached channel data"""
        return self.db.query(ChannelCache).filter(
            ChannelCache.channel_id == channel_id
        ).first()
    
    def save_channel_cache(
        self,
        channel_id: str,
        channel_title: str,
        subscriber_count: int,
        video_count: int,
        videos: List[Dict]
    ) -> ChannelCache:
        """Save or update channel cache"""
        channel = self.get_channel_cache(channel_id)
        
        if channel:
            # Update existing
            channel.channel_title = channel_title
            channel.subscriber_count = subscriber_count
            channel.video_count = video_count
            channel.videos = videos
            channel.updated_at = datetime.utcnow()
        else:
            # Create new
            channel = ChannelCache(
                channel_id=channel_id,
                channel_title=channel_title,
                subscriber_count=subscriber_count,
                video_count=video_count,
                videos=videos
            )
            self.db.add(channel)
        
        self.db.commit()
        self.db.refresh(channel)
        return channel
    
    def clear_channel_cache(self, channel_id: str) -> bool:
        """Clear cache for a specific channel"""
        channel = self.get_channel_cache(channel_id)
        if channel:
            self.db.delete(channel)
            self.db.commit()
            return True
        return False
    
    def is_channel_cache_fresh(self, channel_id: str, max_age_hours: int = 24) -> bool:
        """Check if channel cache is still fresh (default: 24 hours)"""
        channel = self.get_channel_cache(channel_id)
        if not channel or not channel.updated_at:
            return False
        
        age = datetime.utcnow() - channel.updated_at
        return age < timedelta(hours=max_age_hours)

