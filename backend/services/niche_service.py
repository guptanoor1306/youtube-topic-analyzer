import json
import os
from typing import List, Dict, Optional
import asyncio


class NicheService:
    def __init__(self, json_file_path: str = "niche_channels.json"):
        self.json_file_path = json_file_path
        self.channels = []
        self.load_channels()
    
    def load_channels(self):
        """Load channels from JSON file"""
        try:
            if os.path.exists(self.json_file_path):
                with open(self.json_file_path, 'r') as f:
                    data = json.load(f)
                    self.channels = data.get('channels', [])
                    print(f"✅ Loaded {len(self.channels)} niche channels from {self.json_file_path}")
            else:
                print(f"⚠️  Niche channels file not found: {self.json_file_path}")
                self.channels = []
        except Exception as e:
            print(f"❌ Error loading niche channels: {e}")
            self.channels = []
    
    def reload_channels(self):
        """Reload channels from file (useful after updates)"""
        self.load_channels()
    
    def get_channel_ids(self) -> List[str]:
        """Get list of all channel IDs"""
        return [ch.get('channel_id') for ch in self.channels if ch.get('channel_id')]
    
    def get_channels_by_category(self, category: str) -> List[Dict]:
        """Get channels filtered by category"""
        return [ch for ch in self.channels if ch.get('category', '').lower() == category.lower()]
    
    async def fetch_videos_from_niche(
        self, 
        youtube_service,
        videos_per_channel: int = 3,
        min_duration_minutes: int = 10,
        max_channels: int = None
    ) -> List[Dict]:
        """
        Fetch recent videos from niche channels
        
        Args:
            youtube_service: YouTubeService instance
            videos_per_channel: How many recent videos to fetch per channel
            min_duration_minutes: Minimum video duration to include
            max_channels: Limit number of channels to fetch from (None = all)
            
        Returns:
            List of video dictionaries with metadata
        """
        # Limit channels if specified
        channels_to_fetch = self.channels if max_channels is None else self.channels[:max_channels]
        
        print(f"\n{'='*80}")
        print(f"🔍 FETCHING VIDEOS FROM {len(channels_to_fetch)} NICHE CHANNELS")
        print(f"   ({videos_per_channel} videos per channel = ~{len(channels_to_fetch) * videos_per_channel} total)")
        print(f"{'='*80}\n")
        
        all_videos = []
        
        # Fetch videos from each channel in parallel
        tasks = []
        for channel in channels_to_fetch:
            channel_id = channel.get('channel_id')
            if channel_id:
                # Handle @username format
                if channel_id.startswith('@'):
                    # Need to search for the channel first to get actual ID
                    task = self._fetch_channel_videos_by_username(
                        youtube_service, 
                        channel_id, 
                        videos_per_channel
                    )
                else:
                    task = youtube_service.get_channel_videos(channel_id, videos_per_channel)
                
                tasks.append(task)
        
        # Execute all fetches in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Combine results
        for channel, videos in zip(self.channels, results):
            if isinstance(videos, Exception):
                print(f"⚠️  Error fetching from {channel.get('channel_name', 'Unknown')}: {videos}")
                continue
            
            if videos:
                # Add channel category to each video
                for video in videos:
                    video['niche_category'] = channel.get('category', 'General')
                    video['niche_channel'] = channel.get('channel_name', video.get('channel_name'))
                
                all_videos.extend(videos)
        
        print(f"📊 Fetched {len(all_videos)} total videos from niche channels")
        
        # Filter by duration
        filtered_videos = [
            v for v in all_videos 
            if v.get('duration_minutes', 0) >= min_duration_minutes
        ]
        
        print(f"✅ {len(filtered_videos)} videos after filtering (>{min_duration_minutes} min)")
        
        return filtered_videos
    
    async def _fetch_channel_videos_by_username(
        self, 
        youtube_service, 
        username: str, 
        max_results: int
    ) -> List[Dict]:
        """Fetch videos for a channel using @username"""
        try:
            # Search for the channel
            channels = await youtube_service.search_channels(username, max_results=1)
            
            if channels:
                channel_id = channels[0]['channel_id']
                videos = await youtube_service.get_channel_videos(channel_id, max_results)
                return videos
            else:
                print(f"⚠️  Could not find channel: {username}")
                return []
        except Exception as e:
            print(f"❌ Error fetching {username}: {e}")
            return []
    
    def filter_videos_by_keywords(
        self, 
        videos: List[Dict], 
        keywords: List[str],
        top_n: int = 20
    ) -> List[Dict]:
        """
        Filter and rank videos by keyword relevance
        
        Args:
            videos: List of video dictionaries
            keywords: List of keywords to match against
            top_n: Number of top results to return
            
        Returns:
            Filtered and ranked list of videos
        """
        print(f"\n🔍 Filtering {len(videos)} videos with keywords: {keywords}")
        
        scored_videos = []
        
        for video in videos:
            title_lower = video.get('title', '').lower()
            
            # Calculate relevance score
            relevance_score = 0
            
            for keyword in keywords:
                keyword_lower = keyword.lower()
                
                # Check if full keyword phrase is in title
                if keyword_lower in title_lower:
                    relevance_score += 10
                else:
                    # Check individual words
                    keyword_words = set(keyword_lower.split())
                    title_words = set(title_lower.split())
                    matches = keyword_words.intersection(title_words)
                    
                    # Remove common words
                    common_words = {'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'and', 'or', 'but', 'how', 'what', 'why', 'when'}
                    meaningful_matches = matches - common_words
                    
                    if meaningful_matches:
                        relevance_score += len(meaningful_matches) * 2
            
            # Only include videos with some relevance
            if relevance_score > 0:
                video['relevance_score'] = relevance_score
                scored_videos.append(video)
        
        # Sort by relevance score, then by view count
        scored_videos.sort(
            key=lambda x: (x['relevance_score'], x.get('view_count', 0)), 
            reverse=True
        )
        
        print(f"✅ Found {len(scored_videos)} relevant videos")
        
        # Remove score from output and return top N
        result = []
        for video in scored_videos[:top_n]:
            video_copy = video.copy()
            video_copy.pop('relevance_score', None)
            result.append(video_copy)
        
        return result
    
    def add_channel(self, channel_id: str, channel_name: str, category: str = "General"):
        """Add a new channel to the niche"""
        new_channel = {
            "channel_id": channel_id,
            "channel_name": channel_name,
            "category": category
        }
        self.channels.append(new_channel)
        self.save_channels()
    
    def remove_channel(self, channel_id: str):
        """Remove a channel from the niche"""
        self.channels = [ch for ch in self.channels if ch.get('channel_id') != channel_id]
        self.save_channels()
    
    def save_channels(self):
        """Save channels back to JSON file"""
        try:
            with open(self.json_file_path, 'r') as f:
                data = json.load(f)
            
            data['channels'] = self.channels
            
            with open(self.json_file_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            print(f"✅ Saved {len(self.channels)} channels to {self.json_file_path}")
        except Exception as e:
            print(f"❌ Error saving channels: {e}")

