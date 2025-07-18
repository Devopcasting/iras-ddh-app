#!/usr/bin/env python3

import os
import sys
import tempfile
import subprocess
from app.isl_video_generator import ISLVideoGenerator

def test_audio_merge():
    """Test the audio merging functionality"""
    
    # Test announcement text
    test_text = "Attention please! Train number 2 0 9 0 1 VANDE BHARAT EXP from MUMBAI CENTRAL to GANDHI NAGAR will arrive at platform number 5. Thank you."
    
    # Create temporary audio files for testing
    temp_audio_files = {}
    
    try:
        # Create test audio files (using text-to-speech or dummy files)
        languages = ['english', 'hindi', 'marathi', 'gujarati']
        
        for lang in languages:
            # Create a simple test audio file using FFmpeg
            temp_audio = f"/tmp/test_audio_{lang}_{os.getpid()}.mp3"
            
            # Generate a simple tone for testing
            cmd = [
                'ffmpeg',
                '-f', 'lavfi',
                '-i', f'sine=frequency=440:duration=2',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-y',
                temp_audio
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                temp_audio_files[lang] = temp_audio
                print(f"Created test audio for {lang}: {temp_audio}")
            else:
                print(f"Failed to create test audio for {lang}: {result.stderr}")
        
        if not temp_audio_files:
            print("No test audio files created. Skipping test.")
            return
        
        # Initialize ISL generator
        isl_generator = ISLVideoGenerator()
        
        # Test output path
        output_path = f"/var/www/html/isl_videos/test_merged_audio_{os.getpid()}.mp4"
        
        # Ensure output directory exists
        os.makedirs("/var/www/html/isl_videos", exist_ok=True)
        
        print(f"Testing ISL video generation with merged audio...")
        print(f"Text: {test_text}")
        print(f"Audio files: {temp_audio_files}")
        
        # Generate ISL video with merged audio
        result = isl_generator.generate_isl_video(
            english_text=test_text,
            output_path=output_path,
            audio_files=temp_audio_files
        )
        
        if result:
            print(f"✅ Success! ISL video generated: {result}")
            
            # Check if file exists and has reasonable size
            if os.path.exists(result):
                file_size = os.path.getsize(result)
                print(f"File size: {file_size} bytes")
                
                if file_size > 1000:  # Should be at least 1KB
                    print("✅ File size looks reasonable")
                else:
                    print("⚠️ File size seems too small")
            else:
                print("❌ Generated file does not exist")
        else:
            print("❌ Failed to generate ISL video")
            
    except Exception as e:
        print(f"Error during test: {e}")
        
    finally:
        # Clean up temporary audio files
        for audio_file in temp_audio_files.values():
            try:
                if os.path.exists(audio_file):
                    os.unlink(audio_file)
                    print(f"Cleaned up: {audio_file}")
            except Exception as e:
                print(f"Error cleaning up {audio_file}: {e}")

if __name__ == "__main__":
    test_audio_merge() 