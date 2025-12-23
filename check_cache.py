#!/usr/bin/env python3
"""
Quick script to check database cache status
Run from project root: python check_cache.py
"""

import os
import sys
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from database import SessionLocal, VideoMetadata, ChannelCache

def check_cache():
    """Check what's in the cache"""
    db = SessionLocal()
    
    try:
        # Video cache stats
        total_videos = db.query(VideoMetadata).count()
        videos_with_transcript = db.query(VideoMetadata).filter(
            VideoMetadata.transcript.isnot(None)
        ).count()
        videos_with_comments = db.query(VideoMetadata).filter(
            VideoMetadata.comments.isnot(None)
        ).count()
        
        print("=" * 60)
        print("📊 VIDEO CACHE STATUS")
        print("=" * 60)
        print(f"Total videos cached: {total_videos}")
        print(f"Videos with transcripts: {videos_with_transcript}")
        print(f"Videos with comments: {videos_with_comments}")
        
        if total_videos > 0:
            print("\n📹 Recent cached videos:")
            recent = db.query(VideoMetadata).order_by(
                VideoMetadata.updated_at.desc()
            ).limit(10).all()
            
            for video in recent:
                age = datetime.utcnow() - video.updated_at
                age_str = f"{age.days}d {age.seconds//3600}h" if age.days > 0 else f"{age.seconds//3600}h {(age.seconds%3600)//60}m"
                has_transcript = "✅" if video.transcript else "❌"
                has_comments = "✅" if video.comments else "❌"
                print(f"  • {video.video_id} | {video.title[:50]:50} | T:{has_transcript} C:{has_comments} | {age_str} ago")
        
        # Channel cache stats
        total_channels = db.query(ChannelCache).count()
        print(f"\n" + "=" * 60)
        print("📺 CHANNEL CACHE STATUS")
        print("=" * 60)
        print(f"Total channels cached: {total_channels}")
        
        if total_channels > 0:
            print("\n📺 Cached channels:")
            channels = db.query(ChannelCache).order_by(
                ChannelCache.updated_at.desc()
            ).all()
            
            for channel in channels:
                age = datetime.utcnow() - channel.updated_at
                age_str = f"{age.days}d {age.seconds//3600}h" if age.days > 0 else f"{age.seconds//3600}h {(age.seconds%3600)//60}m"
                video_count = len(channel.videos) if channel.videos else 0
                print(f"  • {channel.channel_id} | {channel.channel_title[:40]:40} | {video_count} videos | {age_str} ago")
        else:
            print("  ⚠️  No channels cached yet (feature not wired up)")
        
        print("\n" + "=" * 60)
        print("💡 TIP: Run this script anytime to check cache status")
        print("=" * 60)
        
    finally:
        db.close()

if __name__ == "__main__":
    check_cache()

