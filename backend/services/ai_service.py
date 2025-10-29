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
            # Get full transcript (up to 5000 chars for better context)
            transcript = video.get('transcript', 'N/A')
            if transcript and transcript != 'N/A':
                transcript = transcript[:5000]
            
            video_text = f"""
════════════════════════════════════════════════════════════════
VIDEO {idx}: {video['title']}
════════════════════════════════════════════════════════════════

DESCRIPTION:
{video.get('description', 'N/A')[:500]}

FULL TRANSCRIPT:
{transcript}

TOP AUDIENCE COMMENTS (showing what viewers are asking/discussing):
"""
            # Get more comments for better audience insight
            if video.get('comments'):
                for cidx, comment in enumerate(video['comments'][:20], 1):
                    video_text += f"{cidx}. {comment['text'][:300]}\n"
            else:
                video_text += "No comments available.\n"
            
            videos_summary.append(video_text)
        
        prompt = f"""You are a YouTube content strategist. Your task is to analyze SPECIFIC VIDEOS selected by the user and provide targeted suggestions.

CHANNEL CONTEXT:
{channel_desc}

SELECTED VIDEOS TO ANALYZE:
{''.join(videos_summary)}

================================================================================
IMPORTANT INSTRUCTIONS:
================================================================================

1. Focus SPECIFICALLY on the content and themes in the SELECTED VIDEOS above
2. Analyze the TRANSCRIPTS carefully to understand what topics were covered
3. Analyze the COMMENTS to understand what the audience is asking about
4. Look for patterns, questions, and interest areas across these specific videos
5. Suggest topics that are SIMILAR to what was covered in these videos
6. Identify gaps where viewers asked questions that weren't fully answered

Your suggestions should be:
- DIRECTLY related to the topics in the selected videos
- Based on ACTUAL audience questions from the comments
- Similar in style and depth to the selected videos
- Focused on expanding these specific themes, NOT generic channel suggestions

Provide:

1. **Series Suggestions** (3-5 series ideas based on these specific videos):
   - Series title (related to themes in selected videos)
   - Brief description
   - 5-7 episode topics (expand on topics mentioned in transcripts/comments)
   - Why this series would resonate with viewers of THESE specific videos

2. **Additional Topics** - Topics that are SIMILAR or RELATED to what was covered in the selected videos

3. **Content Gaps** - Specific questions/topics from the COMMENTS that viewers are asking about but weren't fully addressed in the videos
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
                    {"role": "system", "content": "You are an expert YouTube content strategist. You analyze video transcripts, audience comments, and engagement patterns to suggest specific, actionable content ideas. You ONLY suggest topics that are directly related to the selected videos, never generic suggestions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000,
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
                transcript = transcript[:3000]
            
            video_text = f"""
════════════════════════════════════════════════════════════════
MY CHANNEL VIDEO {idx}: {video['title']}
════════════════════════════════════════════════════════════════

DESCRIPTION:
{video.get('description', 'N/A')[:400]}

TRANSCRIPT/CONTENT STYLE:
{transcript}
"""
            my_videos_summary.append(video_text)
        
        competitor_videos_summary = []
        for idx, video in enumerate(competitor_videos, 1):
            transcript = video.get('transcript', 'N/A')
            if transcript and transcript != 'N/A':
                transcript = transcript[:4000]
            
            video_text = f"""
════════════════════════════════════════════════════════════════
COMPETITOR VIDEO {idx}: {video['title']}
════════════════════════════════════════════════════════════════

DESCRIPTION:
{video.get('description', 'N/A')[:400]}

FULL TRANSCRIPT:
{transcript}

AUDIENCE ENGAGEMENT (from comments - what viewers are saying/asking):
"""
            if video.get('comments'):
                for cidx, comment in enumerate(video['comments'][:15], 1):
                    video_text += f"{cidx}. {comment['text'][:250]}\n"
            else:
                video_text += "No comments available.\n"
            
            competitor_videos_summary.append(video_text)
        
        prompt = f"""You are a YouTube content adaptation specialist. Your task is to analyze SPECIFIC competitor videos and suggest how to adapt them to match MY channel's style.

MY CHANNEL'S STYLE (reference videos):
{''.join(my_videos_summary)}

COMPETITOR VIDEOS TO ANALYZE AND ADAPT:
{''.join(competitor_videos_summary)}

================================================================================
IMPORTANT INSTRUCTIONS:
================================================================================

1. Carefully analyze the TRANSCRIPTS of MY videos to understand:
   - Presentation style and tone
   - Level of depth and complexity
   - Structure and pacing
   - Audience level (beginner/intermediate/expert)

2. Carefully analyze the TRANSCRIPTS of COMPETITOR videos to understand:
   - What topics they cover
   - What questions/interests their COMMENTS reveal
   - What's working well for their audience

3. Suggest how to ADAPT these specific competitor topics to MY channel's style

Your adaptation should:
- Keep the CORE TOPICS from competitor videos
- Transform the PRESENTATION to match MY channel's style
- Address the AUDIENCE QUESTIONS from competitor comments
- Maintain consistency with MY channel's depth and tone

Provide:

1. **Format Analysis**: 
   - MY channel's distinctive style (based on transcripts)
   - COMPETITOR's style differences
   - Key adaptation points needed

2. **Video Adaptation Suggestions** (one for each competitor video):
   - Original competitor video topic
   - How to adapt it for MY channel's audience
   - Specific angles to emphasize
   - Format adjustments needed
   - Questions from competitor comments to address

3. **Bonus Ideas**: Additional related topics inspired by the competitor videos that would fit MY channel's style
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
                    {"role": "system", "content": "You are an expert at analyzing YouTube content styles and adapting ideas between different channel formats. You analyze transcripts in detail to understand tone, depth, and presentation style, then suggest how to adapt competitor topics to match a specific channel's voice while maintaining audience appeal."},
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
                "format_analysis": {},
                "adaptations": [],
                "bonus_ideas": [],
                "error": str(e)
            }

