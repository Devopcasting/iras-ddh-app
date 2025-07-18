#!/usr/bin/env python3

import os
import sys
import tempfile
import subprocess
import uuid
import json
from app.isl_video_generator import ISLVideoGenerator
from app.audio_generator import audio_generator

def test_api_flow():
    """Test the exact API flow for ISL video generation"""
    
    # Simulate the API request
    request = {
        "english_text": "Attention please! Train number 2 0 9 0 1 VANDE BHARAT EXP from MUMBAI CENTRAL to GANDHI NAGAR will arrive at platform number 5. Thank you.",
        "include_audio": True
    }
    
    english_text = request.get("english_text", "").strip()
    include_audio = request.get("include_audio", True)
    
    print(f"=== Testing API Flow ===")
    print(f"English text: {english_text}")
    print(f"Include audio: {include_audio}")
    
    # Step 1: Create ISL videos directory
    isl_videos_dir = "/var/www/html/isl_videos"
    try:
        os.makedirs(isl_videos_dir, exist_ok=True)
        os.chmod(isl_videos_dir, 0o755)
        print(f"✅ Created ISL videos directory: {isl_videos_dir}")
    except Exception as e:
        print(f"❌ Error creating directory: {e}")
        isl_videos_dir = "isl_videos"
        os.makedirs(isl_videos_dir, exist_ok=True)
        print(f"✅ Using fallback directory: {isl_videos_dir}")
    
    # Step 2: Generate unique filename
    filename = f"isl_announcement_{uuid.uuid4().hex[:8]}.mp4"
    output_path = os.path.join(isl_videos_dir, filename)
    print(f"✅ Output path: {output_path}")
    
    # Step 3: Generate audio files
    audio_files = {}
    if include_audio:
        print(f"\n=== Generating Audio Files ===")
        try:
            languages = {
                'english': 'en',
                'hindi': 'hi', 
                'marathi': 'mr',
                'gujarati': 'gu'
            }
            
            for lang_name, lang_code in languages.items():
                print(f"\n--- Generating {lang_name} audio ---")
                try:
                    # Generate audio using the audio generator
                    audio_content = audio_generator.generate_audio(english_text, lang_code)
                    print(f"Audio content length: {len(audio_content)} bytes")
                    
                    if len(audio_content) == 0:
                        print(f"❌ No audio content generated for {lang_name}")
                        continue
                    
                    # Save audio to temporary file
                    temp_audio_path = f"/tmp/isl_audio_{lang_name}_{uuid.uuid4().hex[:8]}.mp3"
                    with open(temp_audio_path, 'wb') as f:
                        f.write(audio_content)
                    
                    # Verify file was created
                    if os.path.exists(temp_audio_path):
                        file_size = os.path.getsize(temp_audio_path)
                        print(f"✅ Audio file created: {temp_audio_path} ({file_size} bytes)")
                        
                        if file_size > 0:
                            audio_files[lang_name] = temp_audio_path
                            
                            # Validate audio file
                            result = subprocess.run([
                                'ffprobe', '-v', 'quiet', '-print_format', 'json', 
                                '-show_streams', temp_audio_path
                            ], capture_output=True, text=True, timeout=10)
                            
                            if result.returncode == 0:
                                print(f"✅ Audio file is valid")
                            else:
                                print(f"❌ Audio file is not valid: {result.stderr}")
                        else:
                            print(f"❌ Audio file is empty")
                    else:
                        print(f"❌ Audio file was not created")
                        
                except Exception as e:
                    print(f"❌ Error generating audio for {lang_name}: {e}")
            
            print(f"\n=== Audio Generation Summary ===")
            print(f"Successfully generated audio files: {len(audio_files)}")
            for lang, path in audio_files.items():
                print(f"  {lang}: {path}")
                
        except Exception as e:
            print(f"❌ Error in audio generation: {e}")
    
    # Step 4: Generate ISL video
    print(f"\n=== Generating ISL Video ===")
    try:
        isl_generator = ISLVideoGenerator()
        
        print(f"Generating ISL video with {len(audio_files)} audio files...")
        result_path = isl_generator.generate_isl_video(english_text, output_path, audio_files)
        
        if result_path:
            print(f"✅ ISL video generated: {result_path}")
            
            # Check file properties
            if os.path.exists(result_path):
                file_size = os.path.getsize(result_path)
                print(f"File size: {file_size} bytes")
                
                # Check video streams
                result_probe = subprocess.run([
                    'ffprobe', '-v', 'quiet', '-print_format', 'json', 
                    '-show_streams', result_path
                ], capture_output=True, text=True, timeout=10)
                
                if result_probe.returncode == 0:
                    streams_info = json.loads(result_probe.stdout)
                    video_streams = [s for s in streams_info['streams'] if s['codec_type'] == 'video']
                    audio_streams = [s for s in streams_info['streams'] if s['codec_type'] == 'audio']
                    
                    print(f"Video streams: {len(video_streams)}")
                    print(f"Audio streams: {len(audio_streams)}")
                    
                    if len(audio_streams) > 0:
                        audio_stream = audio_streams[0]
                        print(f"✅ Audio stream found:")
                        print(f"  Codec: {audio_stream['codec_name']}")
                        print(f"  Duration: {audio_stream['duration']} seconds")
                        print(f"  Bitrate: {audio_stream['bit_rate']} bps")
                        print(f"  Channels: {audio_stream['channels']}")
                    else:
                        print(f"❌ No audio stream found in video!")
                        
                else:
                    print(f"❌ Could not analyze video: {result_probe.stderr}")
            else:
                print(f"❌ Generated file does not exist")
        else:
            print(f"❌ Failed to generate ISL video")
            
    except Exception as e:
        print(f"❌ Error in ISL video generation: {e}")
    
    # Step 5: Clean up
    print(f"\n=== Cleaning Up ===")
    for audio_path in audio_files.values():
        try:
            if os.path.exists(audio_path):
                os.unlink(audio_path)
                print(f"Cleaned up: {audio_path}")
        except Exception as e:
            print(f"Error cleaning up {audio_path}: {e}")
    
    print(f"\n=== Test Complete ===")

if __name__ == "__main__":
    test_api_flow() 