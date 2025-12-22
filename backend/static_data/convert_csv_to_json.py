#!/usr/bin/env python3
"""
CSV to JSON Converter for YouTube Static Data
Converts your Google Sheets export to the required JSON format
"""

import csv
import json
import sys
from datetime import datetime

def convert_csv_to_json(csv_file, channel_name=None, channel_id=None):
    """
    Convert CSV to JSON format for Reverse Engineering tool
    
    Expected CSV columns:
    video_id, title, description, published_at, view_count, duration, transcript, comments
    
    For comments column: separate multiple comments with '|||'
    """
    
    data = {
        "channel_name": channel_name or "",
        "channel_id": channel_id or "",
        "videos_count": 0,
        "fetch_date": datetime.now().strftime("%Y-%m-%d"),
        "notes": "Converted from CSV",
        "videos": []
    }
    
    print(f"📖 Reading CSV file: {csv_file}")
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        # Get column names
        fieldnames = reader.fieldnames
        print(f"📋 Found columns: {', '.join(fieldnames)}")
        
        for idx, row in enumerate(reader, 1):
            # Parse comments if they exist
            comments = []
            if row.get('comments'):
                comment_texts = row['comments'].split('|||')
                for comment_text in comment_texts:
                    if comment_text.strip():
                        comments.append({
                            "text": comment_text.strip(),
                            "author": "Unknown",
                            "likes": 0
                        })
            
            # Build video object
            video = {
                "video_id": row.get('video_id', f'video_{idx}'),
                "title": row.get('title', ''),
                "description": row.get('description', ''),
                "published_at": row.get('published_at', ''),
                "view_count": int(row.get('view_count', 0)) if row.get('view_count', '').strip() else 0,
                "duration": row.get('duration', 'PT0S'),
                "transcript": row.get('transcript', ''),
                "comments": comments
            }
            
            data["videos"].append(video)
            
            # Set channel name from first video if available and not provided
            if not data["channel_name"] and row.get('channel_name'):
                data["channel_name"] = row['channel_name']
            
            print(f"  ✓ Processed video {idx}: {video['title'][:50]}...")
    
    data["videos_count"] = len(data["videos"])
    
    # Validate
    if not data["channel_name"]:
        print("⚠️  Warning: Channel name not found. Please specify with --channel-name")
    
    # Save to JSON
    output_file = csv_file.replace('.csv', '.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Successfully converted {len(data['videos'])} videos")
    print(f"💾 Saved to: {output_file}")
    print(f"📊 Total comments: {sum(len(v['comments']) for v in data['videos'])}")
    print(f"📊 Total views: {sum(v['view_count'] for v in data['videos']):,}")
    
    return output_file

def print_usage():
    print("""
Usage: python convert_csv_to_json.py <csv_file> [options]

Options:
  --channel-name    Name of the YouTube channel
  --channel-id      YouTube channel ID (optional)

Example:
  python convert_csv_to_json.py ZERO1_data.csv --channel-name "Zero1 by Zerodha"
  python convert_csv_to_json.py data.csv --channel-name "Think School" --channel-id UCxxxxxxxx

CSV Format:
  The CSV should have these columns (column names must match):
  - video_id      (optional, will auto-generate if missing)
  - title         (required)
  - description   (optional)
  - published_at  (optional)
  - view_count    (optional)
  - duration      (optional, e.g., PT15M30S)
  - transcript    (required for best results)
  - comments      (optional, separate multiple with |||)
    """)

if __name__ == "__main__":
    if len(sys.argv) < 2 or '--help' in sys.argv or '-h' in sys.argv:
        print_usage()
        sys.exit(0)
    
    csv_file = sys.argv[1]
    
    # Parse optional arguments
    channel_name = None
    channel_id = None
    
    for i, arg in enumerate(sys.argv):
        if arg == '--channel-name' and i + 1 < len(sys.argv):
            channel_name = sys.argv[i + 1]
        elif arg == '--channel-id' and i + 1 < len(sys.argv):
            channel_id = sys.argv[i + 1]
    
    try:
        convert_csv_to_json(csv_file, channel_name, channel_id)
    except FileNotFoundError:
        print(f"❌ Error: File '{csv_file}' not found")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

