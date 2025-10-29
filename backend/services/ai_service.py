from typing import List, Dict, Optional
from openai import OpenAI
import json


class AIService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = OpenAI(api_key=api_key)
    
    async def suggest_series(self, channel_context: Dict, videos_data: List[Dict], additional_prompt: Optional[str] = None) -> Dict:
        """Generate series suggestions based on channel and video analysis"""
        
        # Prepare context for the prompt
        channel_desc = f"""
Channel: {channel_context['title']}
Description: {channel_context['description']}
Subscribers: {channel_context['subscriber_count']}
"""
        
        videos_summary = []
        for idx, video in enumerate(videos_data, 1):
            # Optimize: Reduce transcript to 3000 chars (saves tokens)
            transcript = video.get('transcript', 'N/A')
            if transcript and transcript != 'N/A':
                transcript = transcript[:3000]
            
            video_text = f"""
═══ VIDEO {idx}: {video['title']} ═══

DESCRIPTION: {video.get('description', 'N/A')[:400]}

TRANSCRIPT: {transcript}

TOP COMMENTS:
"""
            # Optimize: Reduce to 15 comments at 200 chars each
            if video.get('comments'):
                for cidx, comment in enumerate(video['comments'][:15], 1):
                    video_text += f"{cidx}. {comment['text'][:200]}\n"
            else:
                video_text += "No comments.\n"
            
            videos_summary.append(video_text)
        
        prompt = f"""You are a YouTube content strategist analyzing specific videos to suggest targeted content ideas.

CHANNEL: {channel_context['title']}

SELECTED VIDEOS:
{''.join(videos_summary)}

TASK:
1. Analyze transcripts for main topics & themes
2. Review comments for audience questions & interests
3. Find patterns across these specific videos
4. Suggest series/topics DIRECTLY related to selected content

OUTPUT (3-5 series, 5-10 additional topics, 3-5 content gaps):

1. **Series Suggestions**: Based on themes in selected videos
   - Title + description
   - 5-7 episode topics expanding on transcript/comment themes
   - Rationale for this audience

2. **Additional Topics**: Similar/related to selected video content

3. **Content Gaps**: Unanswered questions from comments
"""

        # Add additional prompt if provided
        if additional_prompt:
            prompt += f"""

**Additional Instructions from User:**
{additional_prompt}

Please incorporate these instructions into your analysis and suggestions.
"""

        prompt += """

Provide your response in JSON format:
{{
  "series_suggestions": [
    {{
      "title": "Series Title",
      "description": "Brief description",
      "episodes": ["Episode 1", "Episode 2", ...],
      "rationale": "Why this works"
    }}
  ],
  "additional_topics": ["Topic 1", "Topic 2", ...],
  "content_gaps": ["Gap 1", "Gap 2", ...]
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a YouTube content strategist. Analyze selected videos' transcripts and comments to suggest specific, actionable content ideas directly related to them."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2500,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            print(f"OpenAI API error: {str(e)}")
            return {
                "series_suggestions": [],
                "additional_topics": [],
                "content_gaps": [],
                "error": str(e)
            }
    
    async def suggest_format(self, my_videos: List[Dict], competitor_videos: List[Dict], additional_prompt: Optional[str] = None) -> Dict:
        """Analyze competitor videos and suggest how to adapt topics to your channel's format"""
        
        my_videos_summary = []
        for idx, video in enumerate(my_videos, 1):
            transcript = video.get('transcript', 'N/A')
            if transcript and transcript != 'N/A':
                transcript = transcript[:2500]  # Optimized
            
            video_text = f"""
═══ MY VIDEO {idx}: {video['title']} ═══
DESC: {video.get('description', 'N/A')[:300]}
STYLE: {transcript}
"""
            my_videos_summary.append(video_text)
        
        competitor_videos_summary = []
        for idx, video in enumerate(competitor_videos, 1):
            transcript = video.get('transcript', 'N/A')
            if transcript and transcript != 'N/A':
                transcript = transcript[:3000]  # Optimized
            
            video_text = f"""
═══ COMPETITOR {idx}: {video['title']} ═══
DESC: {video.get('description', 'N/A')[:300]}
TRANSCRIPT: {transcript}
COMMENTS:
"""
            if video.get('comments'):
                for cidx, comment in enumerate(video['comments'][:12], 1):  # Reduced to 12
                    video_text += f"{cidx}. {comment['text'][:180]}\n"  # Reduced to 180 chars
            else:
                video_text += "None\n"
            
            competitor_videos_summary.append(video_text)
        
        prompt = f"""Analyze competitor videos and adapt them to MY channel's style.

MY CHANNEL STYLE:
{''.join(my_videos_summary)}

COMPETITOR VIDEOS:
{''.join(competitor_videos_summary)}

TASK:
1. Identify MY channel's style (tone, depth, structure, audience level)
2. Extract competitor topics & audience questions from comments
3. Adapt competitor content to MY style

OUTPUT:

1. **Format Analysis**: MY style vs competitor style, key differences

2. **Adaptations** (for each competitor video):
   - Original topic
   - Adapted title for MY channel
   - Reframing approach
   - Key points to cover
   - Format changes needed
   - Unique angle

3. **Bonus Ideas**: Related topics fitting MY style
"""

        # Add additional prompt if provided
        if additional_prompt:
            prompt += f"""

**Additional Instructions from User:**
{additional_prompt}

Please incorporate these instructions into your format analysis and adaptations.
"""

        prompt += """

Provide your response in JSON format:
{{
  "format_analysis": {{
    "my_channel_style": "Description",
    "competitor_style": "Description",
    "key_differences": ["Difference 1", "Difference 2", ...]
  }},
  "adaptations": [
    {{
      "original_topic": "Competitor video title",
      "adapted_title": "Suggested title for my channel",
      "reframing": "How to reframe",
      "key_points": ["Point 1", "Point 2", ...],
      "format_changes": "Suggested format changes",
      "unique_angle": "My channel's unique perspective"
    }}
  ],
  "bonus_ideas": ["Additional video idea 1", "Additional video idea 2", ...]
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You analyze YouTube content and adapt competitor ideas to match a channel's unique style and voice."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=3000,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            print(f"OpenAI API error: {str(e)}")
            return {
                "format_analysis": {},
                "adaptations": [],
                "bonus_ideas": [],
                "error": str(e)
            }

