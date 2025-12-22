from typing import Dict, List
import PyPDF2
from io import BytesIO
import re
import json
from datetime import datetime


class PDFService:
    def parse_pdf(self, pdf_content: bytes) -> Dict:
        """Parse PDF and extract text content"""
        try:
            pdf_file = BytesIO(pdf_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text_content = []
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text_content.append(page.extract_text())
            
            full_text = "\n".join(text_content)
            
            return {
                "success": True,
                "num_pages": len(pdf_reader.pages),
                "content": full_text,
                "summary": full_text[:1000] + "..." if len(full_text) > 1000 else full_text
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def parse_youtube_data_pdf(self, pdf_content: bytes, channel_name: str = "") -> Dict:
        """
        Parse PDF containing YouTube data (from Google Sheets export)
        KEY INSIGHT: 1 video per page!
        """
        try:
            # Extract text from PDF page by page
            pdf_file = BytesIO(pdf_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            print(f"📄 PDF has {len(pdf_reader.pages)} pages")
            print(f"💡 Using 1 video per page strategy\n")
            
            # Parse each page as one video
            videos = []
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                
                # Extract video from this page
                video = self._extract_video_from_page(page_text, page_num + 1)
                if video:
                    videos.append(video)
                    print(f"  ✓ Page {page_num + 1}: {video['title'][:60]}...")
            
            print(f"\n📊 Successfully extracted {len(videos)} videos from {len(pdf_reader.pages)} pages")
            
            if not videos:
                return {
                    "success": False,
                    "error": "No videos could be extracted from PDF",
                    "suggestion": "Please check if PDF has the expected format (Title, Transcript, Comments)"
                }
            
            # Create JSON structure
            data = {
                "channel_name": channel_name or "Unknown Channel",
                "channel_id": "",
                "videos_count": len(videos),
                "fetch_date": datetime.now().strftime("%Y-%m-%d"),
                "notes": f"Converted from PDF - {len(pdf_reader.pages)} pages",
                "videos": videos
            }
            
            return {
                "success": True,
                "data": data,
                "videos_parsed": len(videos),
                "pages_processed": len(pdf_reader.pages)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _extract_video_from_page(self, page_text: str, page_num: int) -> Dict:
        """
        Extract one video from one page
        Format: Title at top, then Transcript with "Time:" markers, then Comments with "Likes:"
        """
        if not page_text or len(page_text) < 50:
            return None
        
        lines = page_text.split('\n')
        
        # Remove header row if present (Video, Transcript, Comments)
        if 'video' in lines[0].lower() and 'transcript' in lines[0].lower():
            lines = lines[1:]
        
        title = ""
        transcript = ""
        comments = ""
        
        in_transcript = False
        in_comments = False
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Detect section transitions
            has_time = bool(re.search(r'Time:\s*\d+:\d+', line))
            has_likes = 'Likes:' in line
            
            if not in_transcript and not in_comments:
                # TITLE section
                if has_time:
                    # Start of transcript
                    transcript = line
                    in_transcript = True
                else:
                    # Building title
                    if title:
                        title += " " + line
                    else:
                        title = line
            
            elif in_transcript and not in_comments:
                # TRANSCRIPT section
                if has_likes:
                    # Start of comments
                    comments = line
                    in_comments = True
                else:
                    transcript += " " + line
            
            elif in_comments:
                # COMMENTS section
                comments += "\n" + line
        
        # Only return if we have at least a title and transcript
        if title and len(transcript) > 50:
            return {
                "video_id": f"video_{page_num}",
                "title": title.strip(),
                "description": "",
                "published_at": "",
                "view_count": 0,
                "duration": "PT0S",
                "transcript": transcript.strip()[:50000],
                "comments": self._extract_comments(comments)
            }
        
        return None
    
    def _extract_videos_from_text(self, text: str) -> List[Dict]:
        """
        Extract video data from PDF text - Enhanced for Google Sheets tables
        """
        videos = []
        
        # Clean up the text
        text = text.replace('\x00', '')  # Remove null bytes
        
        # Strategy 1: Try to find table structure with headers
        videos = self._parse_table_structure(text)
        
        # Strategy 2: If that fails, try pattern matching
        if not videos:
            videos = self._parse_with_patterns(text)
        
        # Strategy 3: Last resort - line-by-line
        if not videos:
            videos = self._parse_line_by_line(text)
        
        return videos
    
    def _parse_table_structure(self, text: str) -> List[Dict]:
        """
        Parse Google Sheets table structure - Using strong boundary markers
        Key insight: Use FIRST "Time:" as transcript start, and check for substantial comments
        """
        videos = []
        lines = text.split('\n')
        
        # Find header
        header_idx = -1
        for idx, line in enumerate(lines):
            if 'video' in line.lower() and 'transcript' in line.lower():
                header_idx = idx
                break
        
        if header_idx == -1:
            return []
        
        # State: building a video
        current = {"title": "", "transcript": "", "comments": ""}
        in_transcript = False
        in_comments = False
        transcript_lines = 0
        comment_lines = 0
        
        for idx in range(header_idx + 1, len(lines)):
            line = lines[idx].strip()
            if not line:
                continue
            
            # Strong markers
            has_time = bool(re.search(r'Time:\s*\d+:\d+', line))
            has_likes = 'Likes:' in line
            
            # Start of NEW video: We have accumulated enough data AND see a short line with no markers
            if (in_comments and comment_lines > 30) or (in_transcript and transcript_lines > 20):
                # Check if this looks like a title (short, no Time/Likes markers)
                if len(line) < 120 and not has_time and not has_likes:
                    # Save current video
                    if current["title"] and len(current["transcript"]) > 200:
                        videos.append({
                            "video_id": f"video_{len(videos)+1}",
                            "title": current["title"].strip(),
                            "description": "",
                            "published_at": "",
                            "view_count": 0,
                            "duration": "PT0S",
                            "transcript": current["transcript"].strip()[:50000],
                            "comments": self._extract_comments(current["comments"])
                        })
                        print(f"  ✓ Extracted video {len(videos)}: {current['title'][:50]}...")
                    
                    # Start new video
                    current = {"title": line, "transcript": "", "comments": ""}
                    in_transcript = False
                    in_comments = False
                    transcript_lines = 0
                    comment_lines = 0
                    continue
            
            # TITLE section (haven't seen Time: yet)
            if not in_transcript and not in_comments:
                if has_time:
                    # This is the start of transcript!
                    current["transcript"] = line
                    in_transcript = True
                    transcript_lines = 1
                else:
                    # Still building title
                    if current["title"]:
                        current["title"] += " " + line
                    else:
                        current["title"] = line
            
            # TRANSCRIPT section
            elif in_transcript and not in_comments:
                if has_likes:
                    # This is the start of comments!
                    current["comments"] = line
                    in_comments = True
                    comment_lines = 1
                else:
                    # Continue transcript
                    current["transcript"] += " " + line
                    transcript_lines += 1
            
            # COMMENTS section
            elif in_comments:
                current["comments"] += "\n" + line
                comment_lines += 1
        
        # Save final video
        if current["title"] and len(current["transcript"]) > 200:
            videos.append({
                "video_id": f"video_{len(videos)+1}",
                "title": current["title"].strip(),
                "description": "",
                "published_at": "",
                "view_count": 0,
                "duration": "PT0S",
                "transcript": current["transcript"].strip()[:50000],
                "comments": self._extract_comments(current["comments"])
            })
            print(f"  ✓ Extracted video {len(videos)}: {current['title'][:50]}...")
        
        print(f"\n📊 Total videos extracted: {len(videos)}")
        return videos
    
    def _parse_with_patterns(self, text: str) -> List[Dict]:
        """
        Try multiple regex patterns to extract video data
        """
        videos = []
        
        # Pattern for structured data: Title: ... Transcript: ... Comments: ...
        pattern = r'Title[:\s]+([^\n]+)\s+(?:Description[:\s]+([^\n]*)\s+)?Transcript[:\s]+(.*?)(?=Comments[:\s]+|Title[:\s]+|$)'
        matches = re.finditer(pattern, text, re.IGNORECASE | re.DOTALL)
        
        for idx, match in enumerate(matches, 1):
            title = match.group(1).strip()
            transcript = match.group(3).strip() if match.group(3) else ""
            
            comment_start = match.end()
            next_match = text.find("Title:", comment_start)
            comments_text = text[comment_start:next_match] if next_match != -1 else text[comment_start:]
            comments = self._extract_comments(comments_text)
            
            if title:
                videos.append({
                    "video_id": f"video_{idx}",
                    "title": title,
                    "description": "",
                    "published_at": "",
                    "view_count": 0,
                    "duration": "PT0S",
                    "transcript": transcript[:20000],
                    "comments": comments
                })
        
        return videos
    
    def _extract_comments(self, comments_text: str) -> List[Dict]:
        """Extract individual comments from text - Enhanced for Google Sheets format"""
        comments = []
        
        if not comments_text or len(comments_text) < 5:
            return comments
        
        # Remove "Comments:" header if present
        comments_text = re.sub(r'^Comments[:\s]+', '', comments_text, flags=re.IGNORECASE)
        
        # Split into individual comments using pattern: text followed by "Likes: X" and timestamp
        # Pattern: Comment text, then "Likes: number", then "time ago"
        comment_pattern = r'(.*?)\s*Likes:\s*(\d+)\s*\n\s*([^\n]+?)\s*(?=\n\s*[A-Z]|$)'
        matches = re.finditer(comment_pattern, comments_text, re.DOTALL | re.MULTILINE)
        
        for match in matches:
            comment_text = match.group(1).strip()
            likes = int(match.group(2)) if match.group(2) else 0
            timestamp = match.group(3).strip()
            
            if comment_text and len(comment_text) > 3:
                comments.append({
                    "text": comment_text[:1000],  # Allow longer comments
                    "author": "Unknown",
                    "likes": likes,
                    "timestamp": timestamp
                })
        
        # If pattern matching didn't work, try simple split
        if not comments:
            # Try splitting by "Likes:" as a delimiter
            parts = re.split(r'\n\s*Likes:\s*\d+\s*\n', comments_text)
            for part in parts:
                part = part.strip()
                if part and len(part) > 10:
                    comments.append({
                        "text": part[:1000],
                        "author": "Unknown",
                        "likes": 0
                    })
        
        return comments[:100]  # Limit to 100 comments per video (safety)
    
    def _parse_line_by_line(self, text: str) -> List[Dict]:
        """
        Enhanced fallback parser - handles various formats
        """
        videos = []
        lines = text.split('\n')
        
        # State machine for parsing
        current_video = None
        in_transcript = False
        in_comments = False
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 5:
                # Empty line might indicate new video
                if current_video and current_video.get("title") and current_video.get("transcript"):
                    videos.append({
                        "video_id": f"video_{len(videos)+1}",
                        "title": current_video["title"],
                        "description": "",
                        "published_at": "",
                        "view_count": 0,
                        "duration": "PT0S",
                        "transcript": current_video["transcript"][:20000],
                        "comments": self._extract_comments(current_video.get("comments", ""))
                    })
                    current_video = None
                    in_transcript = False
                    in_comments = False
                continue
            
            # Check for pipe or tab separated values (table format)
            if '\t' in line or '|' in line:
                parts = re.split(r'\t+|\|', line)
                parts = [p.strip() for p in parts if p.strip()]
                
                if len(parts) >= 2:
                    # Save current if exists
                    if current_video and current_video.get("title"):
                        videos.append({
                            "video_id": f"video_{len(videos)+1}",
                            "title": current_video["title"],
                            "description": "",
                            "published_at": "",
                            "view_count": 0,
                            "duration": "PT0S",
                            "transcript": current_video.get("transcript", "")[:20000],
                            "comments": self._extract_comments(current_video.get("comments", ""))
                        })
                    
                    # Start new video
                    current_video = {
                        "title": parts[0],
                        "transcript": parts[1] if len(parts) > 1 else "",
                        "comments": parts[2] if len(parts) > 2 else ""
                    }
                    continue
            
            # Sequential parsing (title, then transcript, then comments)
            if not current_video:
                # This might be a title
                if 20 < len(line) < 250:  # Title length range
                    current_video = {"title": line, "transcript": "", "comments": ""}
                    in_transcript = True
            elif in_transcript:
                # Add to transcript
                if current_video["transcript"]:
                    current_video["transcript"] += " " + line
                else:
                    current_video["transcript"] = line
                
                # If line is short, might be moving to comments
                if len(line) < 100 and len(current_video["transcript"]) > 500:
                    in_transcript = False
                    in_comments = True
            elif in_comments:
                # Add to comments
                if current_video.get("comments"):
                    current_video["comments"] += " " + line
                else:
                    current_video["comments"] = line
        
        # Don't forget last video
        if current_video and current_video.get("title") and current_video.get("transcript"):
            videos.append({
                "video_id": f"video_{len(videos)+1}",
                "title": current_video["title"],
                "description": "",
                "published_at": "",
                "view_count": 0,
                "duration": "PT0S",
                "transcript": current_video["transcript"][:20000],
                "comments": self._extract_comments(current_video.get("comments", ""))
            })
        
        return videos

