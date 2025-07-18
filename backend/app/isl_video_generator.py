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
                # Check if this is a train name or station name (typically in uppercase in original text)
                # For train names and station names, spell out each word of the name
                if self._is_likely_train_or_station_name(word):
                    # Split the word into individual characters for spelling
                    for char in word:
                        processed_words.append(char)
                else:
                    processed_words.append(word)
        
        return processed_words
    
    def _extract_words_with_train_names(self, text: str) -> List[str]:
        """Extract words from text, properly handling train names and station names"""
        # First, identify and preserve train names and station names
        # These are typically in uppercase in the original text
        original_text = text
        
        # Convert to lowercase for processing, but keep track of original case
        text_lower = text.lower()
        
        # Split into words and filter out empty strings
        words = [word.strip() for word in text_lower.split() if word.strip()]
        
        processed_words = []
        for word in words:
            # Handle numbers
            if word.isdigit():
                # Add each digit separately
                for digit in word:
                    processed_words.append(digit)
            else:
                # Check if this word corresponds to a train name or station name in original text
                # Train names and station names are typically in uppercase
                original_word = self._find_original_word(original_text, word)
                if original_word and original_word.isupper():
                    # This is likely a train name or station name - spell out each character
                    for char in original_word:
                        processed_words.append(char.lower())
                else:
                    # Regular word - use as is
                    processed_words.append(word)
        
        return processed_words
    
    def _extract_words_improved(self, text: str) -> List[str]:
        """Extract words from text, properly handling train names and station names"""
        # Split the text into words while preserving original case
        words = text.split()
        
        processed_words = []
        for word in words:
            # Remove punctuation from the word
            clean_word = re.sub(r'[^\w]', '', word)
            
            if not clean_word:
                continue
                
            # Handle numbers
            if clean_word.isdigit():
                # Add each digit separately
                for digit in clean_word:
                    processed_words.append(digit)
            elif clean_word.isupper():
                # This is a train name or station name - spell out each character
                for char in clean_word:
                    processed_words.append(char.lower())
            else:
                # Regular word - use as is (lowercase)
                processed_words.append(clean_word.lower())
        
        return processed_words
    
    def _find_original_word(self, original_text: str, lowercase_word: str) -> str:
        """Find the original word in the original text that corresponds to the lowercase word"""
        # Split original text into words
        original_words = original_text.split()
        
        # Find the word that matches when converted to lowercase
        for original_word in original_words:
            if original_word.lower() == lowercase_word:
                return original_word
        
        return lowercase_word
    
    def _is_likely_train_or_station_name(self, word: str) -> bool:
        """Check if a word is likely a train name or station name"""
        # Common patterns for train names and station names
        train_station_patterns = [
            r'^[a-z]+$',  # All letters
            r'^[a-z]+\s+[a-z]+$',  # Two word names
            r'^[a-z]+\s+[a-z]+\s+[a-z]+$',  # Three word names
        ]
        
        # Check if word matches any pattern
        for pattern in train_station_patterns:
            if re.match(pattern, word):
                return True
        
        # Additional check for common train/station words
        train_station_words = [
            'train', 'express', 'duronto', 'rajdhani', 'shatabdi', 'garib', 'rath',
            'central', 'junction', 'terminal', 'station', 'mumbai', 'delhi', 'chennai',
            'kolkata', 'bangalore', 'hyderabad', 'ahmedabad', 'pune', 'jaipur',
            'lucknow', 'patna', 'bhubaneswar', 'ghaziabad', 'firozpur', 'jammu'
        ]
        
        return word in train_station_words
    
    def _build_ffmpeg_command_with_audio(self, file_list_path: str, audio_files: dict, output_path: str) -> bool:
        """Build and execute FFmpeg command to concatenate videos and embed merged audio"""
        # First, create a temporary video without audio
        temp_video = f"/tmp/temp_video_{uuid.uuid4().hex[:8]}.mp4"
        
        # Build the command to concatenate videos first
        concat_cmd = [
            'ffmpeg',
            '-f', 'concat',
            '-safe', '0',
            '-i', file_list_path,
            '-c', 'copy',
            '-y',
            temp_video
        ]
        
        # Execute the concat command
        result = subprocess.run(concat_cmd, capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            print(f"Error creating temp video: {result.stderr}")
            return False
        
        # Check if temp video was created
        if not os.path.exists(temp_video):
            print(f"Temp video was not created: {temp_video}")
            return False
        
        # First, merge all audio files into a single audio file
        merged_audio = f"/tmp/merged_audio_{uuid.uuid4().hex[:8]}.aac"
        
        # Collect valid audio files
        valid_audio_files = []
        for language, audio_path in audio_files.items():
            if os.path.exists(audio_path):
                valid_audio_files.append(audio_path)
        
        if not valid_audio_files:
            # No valid audio files, just copy the temp video
            try:
                os.rename(temp_video, output_path)
                return True
            except Exception as e:
                print(f"Error copying temp video: {e}")
                return False
        
        # Build audio merge command
        audio_inputs = []
        audio_filters = []
        
        for i, audio_path in enumerate(valid_audio_files):
            audio_inputs.extend(['-i', audio_path])
            audio_filters.append(f'[{i}:a]')
        
        # Merge audio files
        audio_merge_cmd = [
            'ffmpeg'
        ] + audio_inputs + [
            '-filter_complex', f'{"".join(audio_filters)}amix=inputs={len(audio_filters)}:duration=longest[aout]',
            '-map', '[aout]',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-y',
            merged_audio
        ]
        
        print(f"Merging audio files: {valid_audio_files}")
        result = subprocess.run(audio_merge_cmd, capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            print(f"Error merging audio files: {result.stderr}")
            # Clean up temp video
            try:
                os.unlink(temp_video)
            except:
                pass
            return False
        
        # Now embed the merged audio into the video
        final_cmd = [
            'ffmpeg',
            '-i', temp_video,
            '-i', merged_audio,
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-shortest',  # End when shortest stream ends
            '-y',
            output_path
        ]
        
        print(f"Embedding merged audio into video...")
        result = subprocess.run(final_cmd, capture_output=True, text=True, timeout=60)
        
        # Clean up temporary files
        try:
            os.unlink(temp_video)
            os.unlink(merged_audio)
        except:
            pass
        
        if result.returncode != 0:
            print(f"Error embedding audio into video: {result.stderr}")
            return False
        
        return True
    
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
    
    def generate_isl_video(self, english_text: str, output_path: str = None, audio_files: dict = None) -> str:
        """Generate ISL video from English text using FFmpeg with embedded audio"""
        if not output_path:
            output_path = f"isl_announcement_{uuid.uuid4().hex[:8]}.mp4"
        
        print(f"Generating ISL video for text: {english_text}")
        
        # Extract words from text with proper train name handling
        words = self._extract_words_improved(english_text)
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
                    # Use absolute path to avoid path issues
                    abs_video_path = os.path.abspath(video_path)
                    f.write(f"file '{abs_video_path}'\n")
            
            print(f"Created file list: {file_list_path}")
            print(f"Videos to merge: {video_paths}")
            
            # Prepare FFmpeg command
            if audio_files and len(audio_files) > 0:
                # Generate video with embedded audio
                print("Generating ISL video with embedded audio...")
                success = self._build_ffmpeg_command_with_audio(file_list_path, audio_files, output_path)
                if not success:
                    print("Failed to generate ISL video with audio")
                    return None
            else:
                # Generate video without audio
                print("Generating ISL video without audio...")
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
                
                if result.returncode != 0:
                    print(f"FFmpeg error: {result.stderr}")
                    return None
            
            # Clean up temporary file list
            os.unlink(file_list_path)
            
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