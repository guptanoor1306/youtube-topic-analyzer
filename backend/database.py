"""
Database configuration and models for video metadata caching
"""
import os
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Database URL from environment variable (Railway provides DATABASE_URL)
DATABASE_URL = os.getenv("DATABASE_URL")

# Railway uses postgres:// but SQLAlchemy needs postgresql://
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# If no DATABASE_URL, use SQLite for local development
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./video_cache.db"
    print("⚠️  No DATABASE_URL found, using SQLite for local development")
else:
    print(f"✅ Connected to PostgreSQL database")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class VideoMetadata(Base):
    """
    Stores cached video metadata to avoid repeated YouTube API calls
    """
    __tablename__ = "video_metadata"
    
    video_id = Column(String(20), primary_key=True, index=True)
    title = Column(String(500))
    thumbnail_url = Column(String(500))
    view_count = Column(Integer)
    channel_id = Column(String(50))
    channel_title = Column(String(200))
    
    # Cached data
    transcript = Column(Text, nullable=True)  # Full transcript
    comments = Column(JSON, nullable=True)    # Top 50 comments as JSON array
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary for easy serialization"""
        return {
            'video_id': self.video_id,
            'title': self.title,
            'thumbnail_url': self.thumbnail_url,
            'view_count': self.view_count,
            'channel_id': self.channel_id,
            'channel_title': self.channel_title,
            'transcript': self.transcript,
            'comments': self.comments,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class ChannelCache(Base):
    """
    Stores cached channel data and video lists to avoid repeated YouTube API calls
    """
    __tablename__ = "channel_cache"
    
    channel_id = Column(String(50), primary_key=True, index=True)
    channel_title = Column(String(200))
    subscriber_count = Column(Integer)
    video_count = Column(Integer)
    
    # Cached video list (top 100)
    videos = Column(JSON, nullable=True)  # List of video objects
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary for easy serialization"""
        return {
            'channel_id': self.channel_id,
            'channel_title': self.channel_title,
            'subscriber_count': self.subscriber_count,
            'video_count': self.video_count,
            'videos': self.videos,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

