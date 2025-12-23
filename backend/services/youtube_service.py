import os
from typing import List, Dict, Optional
import httpx
import re
import asyncio
from functools import lru_cache
from datetime import datetime, timedelta
import hashlib
import json
from youtube_transcript_api import YouTubeTranscriptApi
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


# Simple in-memory cache with TTL
class Cache:
    def __init__(self, ttl_seconds=3600):
        self.cache = {}
        self.ttl = ttl_seconds
    
    def get(self, key):
        if key in self.cache:
            value, timestamp = self.cache[key]
            if datetime.now() - timestamp < timedelta(seconds=self.ttl):
                print(f"✅ Cache HIT: {key[:50]}...")
                return value
            else:
                del self.cache[key]
        return None
    
    def set(self, key, value):
        self.cache[key] = (value, datetime.now())
        print(f"💾 Cache SET: {key[:50]}...")
    
    def clear_old(self):
        """Clear expired entries"""
        now = datetime.now()
        expired = [k for k, (v, t) in self.cache.items() 
                  if now - t >= timedelta(seconds=self.ttl)]
        for k in expired:
            del self.cache[k]


class YouTubeService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.youtube = build('youtube', 'v3', developerKey=api_key)
        self.transcript_cache = Cache(ttl_seconds=7200)  # 2 hour cache for transcripts
        self.comments_cache = Cache(ttl_seconds=3600)   # 1 hour cache for comments
    
    def parse_duration_to_minutes(self, duration: str) -> float:
        """Convert ISO 8601 duration to minutes"""
        # Duration format: PT#H#M#S or PT#M#S or PT#S
        match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration)
        if not match:
            return 0
        
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        
        total_minutes = hours * 60 + minutes + seconds / 60
        return total_minutes
    
    async def get_channel_info(self, channel_id: str) -> Dict:
        """Get channel information"""
        try:
            request = self.youtube.channels().list(
                part='snippet,statistics,contentDetails',
                id=channel_id
            )
            response = request.execute()
            
            if 'items' not in response:
                raise ValueError(f"Invalid API response. Please check your YouTube API key and ensure the YouTube Data API v3 is enabled.")
            
            if not response['items']:
                raise ValueError(f"Channel not found: {channel_id}")
            
            channel = response['items'][0]
            
            return {
                "channel_id": channel_id,
                "title": channel['snippet']['title'],
                "description": channel['snippet']['description'],
                "subscriber_count": channel['statistics'].get('subscriberCount', 'N/A'),
                "video_count": channel['statistics'].get('videoCount', 'N/A'),
                "thumbnail": channel['snippet']['thumbnails']['high']['url']
            }
        except HttpError as e:
            raise Exception(f"YouTube API error: {str(e)}")
    
    async def get_channel_videos(self, channel_id: str, max_results: int = 30) -> List[Dict]:
        """Get long-form videos (>3 minutes) from a channel, sorted by view count"""
        try:
            # Get uploads playlist ID
            request = self.youtube.channels().list(
                part='contentDetails',
                id=channel_id
            )
            response = request.execute()
            
            if 'items' not in response or not response['items']:
                return []
            
            uploads_playlist_id = response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
            
            # Fetch more videos to ensure we get enough after filtering
            all_video_ids = []
            next_page_token = None
            
            # Fetch multiple pages to get more videos (up to 10 pages = ~500 videos)
            for _ in range(10):
                request = self.youtube.playlistItems().list(
                    part='snippet',
                    playlistId=uploads_playlist_id,
                    maxResults=50,
                    pageToken=next_page_token
                )
                response = request.execute()
                
                for item in response['items']:
                    all_video_ids.append(item['snippet']['resourceId']['videoId'])
                
                next_page_token = response.get('nextPageToken')
                if not next_page_token:
                    break
            
            if not all_video_ids:
                return []
            
            # Get detailed video info including duration and view count
            # Process in batches of 50 (API limit)
            all_videos = []
            for i in range(0, len(all_video_ids), 50):
                batch_ids = all_video_ids[i:i+50]
                request = self.youtube.videos().list(
                    part='snippet,contentDetails,statistics',
                    id=','.join(batch_ids)
                )
                batch_response = request.execute()
                
                for video in batch_response.get('items', []):
                    duration_minutes = self.parse_duration_to_minutes(video['contentDetails']['duration'])
                    
                    # Only include videos longer than 3 minutes
                    if duration_minutes > 3:
                        all_videos.append({
                            "video_id": video['id'],
                            "title": video['snippet']['title'],
                            "channel_name": video['snippet']['channelTitle'],
                            "thumbnail": video['snippet']['thumbnails']['medium']['url'],
                            "published_at": video['snippet']['publishedAt'],
                            "view_count": int(video['statistics'].get('viewCount', 0)),
                            "duration": video['contentDetails']['duration'],
                            "duration_minutes": round(duration_minutes, 1)
                        })
            
            # Sort by view count (descending) and return top videos
            all_videos.sort(key=lambda x: x['view_count'], reverse=True)
            
            return all_videos[:max_results]
            
        except HttpError as e:
            raise Exception(f"YouTube API error: {str(e)}")
    
    async def get_video_info(self, video_id: str) -> Dict:
        """Get detailed information about a video"""
        try:
            request = self.youtube.videos().list(
                part='snippet,statistics,contentDetails',
                id=video_id
            )
            response = request.execute()
            
            if 'items' not in response or not response['items']:
                raise ValueError(f"Video not found: {video_id}")
            
            video = response['items'][0]
            
            return {
                "video_id": video_id,
                "title": video['snippet']['title'],
                "description": video['snippet']['description'],
                "channel_name": video['snippet']['channelTitle'],
                "channel_id": video['snippet']['channelId'],
                "published_at": video['snippet']['publishedAt'],
                "view_count": video['statistics'].get('viewCount', '0'),
                "like_count": video['statistics'].get('likeCount', '0'),
                "comment_count": video['statistics'].get('commentCount', '0'),
                "duration": video['contentDetails']['duration'],
                "thumbnail": video['snippet']['thumbnails']['high']['url']
            }
        except HttpError as e:
            raise Exception(f"YouTube API error: {str(e)}")
    
    async def get_transcript(self, video_id: str) -> Optional[str]:
        """Get video transcript with caching"""
        # Check cache first
        cache_key = f"transcript_{video_id}"
        cached = self.transcript_cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            # Fetch transcript using static method
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            
            if transcript_list:
                # Extract text from each transcript entry
                transcript_text = " ".join([entry['text'] for entry in transcript_list])
                # Cache the result
                self.transcript_cache.set(cache_key, transcript_text)
                return transcript_text
            return None
        except Exception as e:
            print(f"Could not fetch transcript for {video_id}: {str(e)}")
            return None
    
    async def get_comments(self, video_id: str, max_results: int = 50) -> List[Dict]:
        """Get comments from a video with caching"""
        # Check cache first
        cache_key = f"comments_{video_id}_{max_results}"
        cached = self.comments_cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            comments = []
            request = self.youtube.commentThreads().list(
                part='snippet',
                videoId=video_id,
                maxResults=min(max_results, 100),
                order='relevance'
            )
            response = request.execute()
            
            for item in response['items']:
                comment = item['snippet']['topLevelComment']['snippet']
                comments.append({
                    "author": comment['authorDisplayName'],
                    "text": comment['textDisplay'],
                    "like_count": comment['likeCount'],
                    "published_at": comment['publishedAt']
                })
            
            # Cache the result
            self.comments_cache.set(cache_key, comments)
            return comments
        except HttpError as e:
            print(f"Could not fetch comments for {video_id}: {str(e)}")
            return []
    
    async def search_videos(self, query: str, max_results: int = 10) -> List[Dict]:
        """Search for videos by keyword"""
        try:
            request = self.youtube.search().list(
                part='snippet',
                q=query,
                type='video',
                maxResults=max_results,
                order='relevance',
                videoDuration='long'  # Filter for long videos
            )
            response = request.execute()
            
            videos = []
            for item in response['items']:
                try:
                    # Skip if not a proper video result
                    if 'id' not in item or 'videoId' not in item['id']:
                        continue
                    
                    videos.append({
                        "video_id": item['id']['videoId'],
                        "title": item['snippet']['title'],
                        "channel_name": item['snippet']['channelTitle'],
                        "channel_id": item['snippet']['channelId'],
                        "thumbnail": item['snippet']['thumbnails'].get('medium', {}).get('url', ''),
                        "published_at": item['snippet']['publishedAt'],
                        "description": item['snippet']['description']
                    })
                except (KeyError, TypeError) as e:
                    print(f"⚠️ Skipping malformed search result: {e}")
                    continue
            
            return videos
        except HttpError as e:
            raise Exception(f"YouTube API error: {str(e)}")
    
    async def search_channels(self, query: str, max_results: int = 5) -> List[Dict]:
        """Search for channels"""
        try:
            request = self.youtube.search().list(
                part='snippet',
                q=query,
                type='channel',
                maxResults=max_results
            )
            response = request.execute()
            
            channels = []
            for item in response['items']:
                channels.append({
                    "channel_id": item['id']['channelId'],
                    "title": item['snippet']['title'],
                    "description": item['snippet']['description'],
                    "thumbnail": item['snippet']['thumbnails']['medium']['url']
                })
            
            return channels
        except HttpError as e:
            raise Exception(f"YouTube API error: {str(e)}")
    
    async def get_video_data_parallel(self, video_ids: List[str], max_comments: int = 20) -> Dict[str, Dict]:
        """
        Fetch transcripts and comments for multiple videos in parallel
        This is the KEY OPTIMIZATION - reduces processing time from sequential to concurrent
        """
        print(f"🚀 Starting parallel fetch for {len(video_ids)} videos...")
        start_time = datetime.now()
        
        # Create tasks for all videos
        tasks = []
        for video_id in video_ids:
            task = self._fetch_single_video_data(video_id, max_comments)
            tasks.append(task)
        
        # Execute all tasks concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Build result dictionary
        video_data = {}
        for video_id, result in zip(video_ids, results):
            if isinstance(result, Exception):
                print(f"❌ Error fetching data for {video_id}: {result}")
                video_data[video_id] = {
                    "transcript": None,
                    "comments": [],
                    "error": str(result)
                }
            else:
                video_data[video_id] = result
        
        elapsed = (datetime.now() - start_time).total_seconds()
        print(f"✅ Parallel fetch completed in {elapsed:.2f}s (avg: {elapsed/len(video_ids):.2f}s per video)")
        
        return video_data
    
    async def _fetch_single_video_data(self, video_id: str, max_comments: int) -> Dict:
        """Helper method to fetch data for a single video"""
        try:
            # Fetch transcript and comments in parallel for this video
            transcript_task = self.get_transcript(video_id)
            comments_task = self.get_comments(video_id, max_comments)
            
            transcript, comments = await asyncio.gather(
                transcript_task, 
                comments_task,
                return_exceptions=True
            )
            
            # Handle exceptions
            if isinstance(transcript, Exception):
                print(f"⚠️ Transcript error for {video_id}: {transcript}")
                transcript = None
            
            if isinstance(comments, Exception):
                print(f"⚠️ Comments error for {video_id}: {comments}")
                comments = []
            
            return {
                "transcript": transcript,
                "comments": comments
            }
        except Exception as e:
            print(f"❌ Failed to fetch data for {video_id}: {e}")
            return {
                "transcript": None,
                "comments": [],
                "error": str(e)
            }

