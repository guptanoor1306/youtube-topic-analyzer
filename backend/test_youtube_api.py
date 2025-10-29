#!/usr/bin/env python3
"""
Test script to verify YouTube API key is working correctly
"""

import os
from dotenv import load_dotenv
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

load_dotenv()

def test_youtube_api():
    api_key = os.getenv('YOUTUBE_API_KEY')
    
    if not api_key or api_key == 'your_youtube_api_key_here':
        print("❌ ERROR: YouTube API key not found or not set in .env file")
        print("\nPlease add your YouTube API key to backend/.env file:")
        print("YOUTUBE_API_KEY=your_actual_key_here")
        return False
    
    print(f"✓ API key found: {api_key[:10]}...")
    print("\nTesting YouTube API connection...")
    
    try:
        youtube = build('youtube', 'v3', developerKey=api_key)
        
        # Test with a simple channel request
        request = youtube.channels().list(
            part='snippet',
            id='UCWIRMJrORIHH3pzqz8bjGzw'  # Zero1 by Zerodha
        )
        
        response = request.execute()
        
        if 'items' in response and len(response['items']) > 0:
            channel = response['items'][0]
            print(f"\n✅ SUCCESS! API is working correctly!")
            print(f"   Channel found: {channel['snippet']['title']}")
            print(f"   Description: {channel['snippet']['description'][:100]}...")
            return True
        else:
            print("\n❌ ERROR: API key is valid but no data returned")
            return False
            
    except HttpError as e:
        error_content = str(e.content)
        print(f"\n❌ YouTube API Error: {e.reason}")
        
        if 'API_KEY_INVALID' in error_content or 'keyInvalid' in error_content:
            print("\n🔑 The API key is invalid.")
            print("\nSteps to fix:")
            print("1. Go to: https://console.cloud.google.com/apis/credentials")
            print("2. Make sure you're in the correct project")
            print("3. Create a new API key or check your existing one")
            print("4. Copy the key to backend/.env file")
            
        elif 'accessNotConfigured' in error_content or 'API has not been used' in error_content:
            print("\n🔧 YouTube Data API v3 is not enabled for your project.")
            print("\nSteps to fix:")
            print("1. Go to: https://console.cloud.google.com/apis/library/youtube.googleapis.com")
            print("2. Click 'ENABLE' button")
            print("3. Wait a minute for it to activate")
            print("4. Try again")
            
        elif 'PERMISSION_DENIED' in error_content or 'quotaExceeded' in error_content:
            print("\n⚠️  API quota exceeded or permission denied.")
            print("\nPossible solutions:")
            print("1. Wait 24 hours for quota to reset")
            print("2. Create a new project with a new API key")
            print("3. Enable billing for higher quota limits")
            
        else:
            print(f"\nFull error details: {e.content}")
            
        return False
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("YouTube API Key Test")
    print("=" * 60)
    
    result = test_youtube_api()
    
    print("\n" + "=" * 60)
    if result:
        print("✅ All tests passed! Your API key is working correctly.")
        print("\nYou can now use the application.")
    else:
        print("❌ Tests failed. Please fix the issues above.")
        print("\nNeed help? Check:")
        print("- https://console.cloud.google.com/apis/dashboard")
        print("- https://developers.google.com/youtube/v3/getting-started")
    print("=" * 60)

