#!/usr/bin/env python3

import sys
import os
sys.path.append('backend')

from app.isl_video_generator import isl_generator
from app.audio_generator import audio_generator
import uuid

def test_isl_with_audio():
    test_text = "Attention please! Train number 2 0 9 0 1 VANDE BHARAT EXP from MUMBAI CENTRAL to GANDHI NAGAR will arrive at platform number 5. Thank you."
    
    print("Testing ISL video generation with audio...")
    print(f"Input text: {test_text}")
    print()
    
    # Generate audio files for all languages
    audio_files = {}
    languages = {
        'english': 'en',
        'hindi': 'hi', 
        'marathi': 'mr',
        'gujarati': 'gu'
    }
    
    print("Generating audio files...")
    for lang_name, lang_code in languages.items():
        try:
            # Generate audio using the audio generator
            audio_content = audio_generator.generate_audio(test_text, lang_code)
            
            # Save audio to temporary file
            temp_audio_path = f"/tmp/isl_audio_{lang_name}_{uuid.uuid4().hex[:8]}.mp3"
            with open(temp_audio_path, 'wb') as f:
                f.write(audio_content)
            
            audio_files[lang_name] = temp_audio_path
            print(f"✅ Generated audio for {lang_name}: {temp_audio_path}")
            
        except Exception as e:
            print(f"❌ Error generating audio for {lang_name}: {e}")
    
    print()
    print(f"Generated {len(audio_files)} audio files")
    print()
    
    # Generate ISL video with audio
    print("Generating ISL video with embedded audio...")
    result = isl_generator.generate_isl_video(test_text, 'test_isl_with_audio.mp4', audio_files)
    
    if result:
        print(f"✅ ISL video generated successfully: {result}")
        
        # Check file size
        if os.path.exists(result):
            file_size = os.path.getsize(result)
            print(f"📁 File size: {file_size / (1024*1024):.2f} MB")
    else:
        print("❌ Failed to generate ISL video")
    
    # Clean up temporary audio files
    print()
    print("Cleaning up temporary audio files...")
    for audio_path in audio_files.values():
        try:
            if os.path.exists(audio_path):
                os.unlink(audio_path)
                print(f"🗑️ Cleaned up: {audio_path}")
        except Exception as e:
            print(f"❌ Error cleaning up {audio_path}: {e}")
    
    print()
    print("Test completed!")

if __name__ == "__main__":
    test_isl_with_audio() 