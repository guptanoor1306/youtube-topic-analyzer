"""
Service to handle loading and processing of static YouTube data
This allows using pre-fetched data instead of hitting YouTube API
"""

import json
import os
from typing import List, Dict, Optional
from pathlib import Path


class StaticDataService:
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent / "static_data"
        self.loaded_data = {}
        
    def get_available_files(self) -> List[Dict]:
        """Get list of available data files"""
        files = []
        
        if not self.data_dir.exists():
            print(f"Warning: static_data directory not found at {self.data_dir}")
            return files
        
        for file_path in self.data_dir.glob("*.json"):
            if file_path.name in ['data_template.json']:
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    files.append({
                        "filename": file_path.name,
                        "channel_name": data.get("channel_name", "Unknown"),
                        "videos_count": data.get("videos_count", len(data.get("videos", []))),
                        "fetch_date": data.get("fetch_date", "Unknown"),
                        "notes": data.get("notes", "")
                    })
            except Exception as e:
                print(f"Error reading {file_path.name}: {e}")
                
        return files
    
    def load_data_file(self, filename: str) -> Dict:
        """Load a specific data file"""
        file_path = self.data_dir / filename
        
        if not file_path.exists():
            raise FileNotFoundError(f"Data file not found: {filename}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        # Cache the loaded data
        self.loaded_data[filename] = data
        
        return data
    
    def get_all_videos_from_file(self, filename: str) -> List[Dict]:
        """Get all videos from a data file in a format similar to API response"""
        data = self.load_data_file(filename)
        videos = []
        
        for video in data.get("videos", []):
            videos.append({
                "video_id": video.get("video_id", ""),
                "title": video.get("title", ""),
                "channel_name": data.get("channel_name", ""),
                "description": video.get("description", ""),
                "view_count": video.get("view_count", 0),
                "published_at": video.get("published_at", ""),
                "transcript": video.get("transcript", ""),
                "comments": video.get("comments", [])
            })
            
        return videos
    
    def load_multiple_files(self, filenames: List[str]) -> Dict:
        """Load multiple data files and combine them"""
        combined_data = {
            "channels": [],
            "total_videos": 0,
            "videos": []
        }
        
        for filename in filenames:
            try:
                data = self.load_data_file(filename)
                videos = self.get_all_videos_from_file(filename)
                
                combined_data["channels"].append({
                    "channel_name": data.get("channel_name", "Unknown"),
                    "channel_id": data.get("channel_id", ""),
                    "videos_count": len(videos)
                })
                
                combined_data["videos"].extend(videos)
                combined_data["total_videos"] += len(videos)
                
            except Exception as e:
                print(f"Error loading {filename}: {e}")
                
        return combined_data
    
    def search_videos_in_data(self, filenames: List[str], query: str) -> List[Dict]:
        """Search for videos matching a query in loaded data"""
        combined_data = self.load_multiple_files(filenames)
        query_lower = query.lower()
        
        matching_videos = []
        for video in combined_data["videos"]:
            title_match = query_lower in video["title"].lower()
            desc_match = query_lower in video.get("description", "").lower()
            
            if title_match or desc_match:
                matching_videos.append(video)
                
        return matching_videos
    
    def get_summary_statistics(self, filenames: List[str]) -> Dict:
        """Get summary statistics from loaded data"""
        combined_data = self.load_multiple_files(filenames)
        
        total_comments = sum(
            len(video.get("comments", [])) 
            for video in combined_data["videos"]
        )
        
        total_views = sum(
            video.get("view_count", 0) 
            for video in combined_data["videos"]
        )
        
        videos_with_transcripts = sum(
            1 for video in combined_data["videos"] 
            if video.get("transcript") and video["transcript"] != ""
        )
        
        return {
            "total_channels": len(combined_data["channels"]),
            "total_videos": combined_data["total_videos"],
            "total_comments": total_comments,
            "total_views": total_views,
            "videos_with_transcripts": videos_with_transcripts,
            "channels": combined_data["channels"]
        }

