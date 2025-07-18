import os
import re
import subprocess
from typing import List, Dict
import tempfile
import uuid

class ISLVideoGenerator:
    def __init__(self, dataset_path: str = "static/isl_dataset"):
        self.dataset_path = dataset_path
        self.available_videos = self._scan_dataset()
        self._check_ffmpeg()
    
    def _check_ffmpeg(self):
        """Check if FFmpeg is available on the system"""
        try:
            result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ FFmpeg is available")
            else:
                print("❌ FFmpeg is not available")
        except FileNotFoundError:
            print("❌ FFmpeg is not installed. Please install FFmpeg to use ISL video generation.")
        
    def _scan_dataset(self) -> Dict[str, str]:
        """Scan the ISL dataset and return available videos"""
        available_videos = {}
        
        if not os.path.exists(self.dataset_path):
            print(f"Warning: ISL dataset path {self.dataset_path} does not exist")
            return available_videos
            
        for item in os.listdir(self.dataset_path):
            item_path = os.path.join(self.dataset_path, item)
            if os.path.isdir(item_path):
                # Check for video file in the directory
                for file in os.listdir(item_path):
                    if file.endswith('.mp4'):
                        video_path = os.path.join(item_path, file)
                        available_videos[item] = video_path
                        break
        
        print(f"Found {len(available_videos)} ISL videos in dataset")
        return available_videos
    
    def _extract_words(self, text: str) -> List[str]:
        """Extract individual words from text, handling special cases"""
        # Convert to lowercase and remove punctuation
        text = re.sub(r'[^\w\s]', ' ', text.lower())
        
        # Split into words and filter out empty strings
        words = [word.strip() for word in text.split() if word.strip()]
        
        # Handle special cases and common words
        processed_words = []
        for word in words:
            # Handle numbers
            if word.isdigit():
                # Add each digit separately
                for digit in word:
                    processed_words.append(digit)
            else:
                processed_words.append(word)
        
        return processed_words
    
    def _find_matching_videos(self, words: List[str]) -> List[str]:
        """Find matching ISL videos for the given words"""
        matching_videos = []
        
        for word in words:
            # Direct match
            if word in self.available_videos:
                matching_videos.append(self.available_videos[word])
                continue
            
            # Try to find partial matches for common words
            if word in ['arriving', 'arrive', 'arrived']:
                if 'arriving' in self.available_videos:
                    matching_videos.append(self.available_videos['arriving'])
                    continue
            
            if word in ['platform', 'platforms']:
                if 'platform' in self.available_videos:
                    matching_videos.append(self.available_videos['platform'])
                    continue
            
            if word in ['number', 'numbers']:
                if 'number' in self.available_videos:
                    matching_videos.append(self.available_videos['number'])
                    continue
            
            if word in ['train', 'trains']:
                if 'train' in self.available_videos:
                    matching_videos.append(self.available_videos['train'])
                    continue
            
            # If no match found, we'll skip this word
            print(f"No ISL video found for word: {word}")
        
        return matching_videos
    
    def generate_isl_video(self, english_text: str, output_path: str = None) -> str:
        """Generate ISL video from English text using FFmpeg"""
        if not output_path:
            output_path = f"isl_announcement_{uuid.uuid4().hex[:8]}.mp4"
        
        print(f"Generating ISL video for text: {english_text}")
        
        # Extract words from text
        words = self._extract_words(english_text)
        print(f"Extracted words: {words}")
        
        # Find matching videos
        video_paths = self._find_matching_videos(words)
        print(f"Found {len(video_paths)} matching videos")
        
        if not video_paths:
            print("No matching ISL videos found")
            return None
        
        try:
            # Create a temporary file list for FFmpeg
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                file_list_path = f.name
                for video_path in video_paths:
                    f.write(f"file '{video_path}'\n")
            
            print(f"Created file list: {file_list_path}")
            print(f"Videos to merge: {video_paths}")
            
            # Use FFmpeg to concatenate videos
            ffmpeg_cmd = [
                'ffmpeg',
                '-f', 'concat',
                '-safe', '0',
                '-i', file_list_path,
                '-c', 'copy',
                '-y',  # Overwrite output file if it exists
                output_path
            ]
            
            print(f"Running FFmpeg command: {' '.join(ffmpeg_cmd)}")
            
            # Execute FFmpeg command
            result = subprocess.run(
                ffmpeg_cmd,
                capture_output=True,
                text=True,
                timeout=60  # 60 second timeout
            )
            
            # Clean up temporary file list
            os.unlink(file_list_path)
            
            if result.returncode != 0:
                print(f"FFmpeg error: {result.stderr}")
                return None
            
            print(f"✅ ISL video generated successfully: {output_path}")
            return output_path
            
        except subprocess.TimeoutExpired:
            print("FFmpeg command timed out")
            return None
        except Exception as e:
            print(f"Error generating ISL video: {e}")
            return None

# Global instance
isl_generator = ISLVideoGenerator() 