import os
import tempfile
import subprocess
from typing import List, Dict
from google.cloud import texttospeech
import logging

logger = logging.getLogger(__name__)

class AudioGenerator:
    def __init__(self):
        self.client = None
        self._initialized = False
        
        # Voice configurations for Indian languages
        self.voices = {
            'en': 'en-IN-Chirp3-HD-Achernar',
            'hi': 'hi-IN-Chirp3-HD-Achernar', 
            'mr': 'mr-IN-Chirp3-HD-Achernar',
            'gu': 'gu-IN-Chirp3-HD-Achernar',
            'ta': 'ta-IN-Chirp3-HD-Achernar',
            'te': 'te-IN-Chirp3-HD-Achernar',
            'kn': 'kn-IN-Chirp3-HD-Achernar',
            'ml': 'ml-IN-Chirp3-HD-Achernar',
            'bn': 'bn-IN-Chirp3-HD-Achernar',
            'pa': 'pa-IN-Chirp3-HD-Achernar',
            'or': 'or-IN-Chirp3-HD-Achernar',
            'as': 'as-IN-Chirp3-HD-Achernar'
        }
        
        # Language codes mapping
        self.language_codes = {
            'en': 'en-IN',
            'hi': 'hi-IN',
            'mr': 'mr-IN', 
            'gu': 'gu-IN',
            'ta': 'ta-IN',
            'te': 'te-IN',
            'kn': 'kn-IN',
            'ml': 'ml-IN',
            'bn': 'bn-IN',
            'pa': 'pa-IN',
            'or': 'or-IN',
            'as': 'as-IN'
        }

    def _initialize_client(self):
        """Initialize the Google Cloud TTS client if not already done"""
        if not self._initialized:
            try:
                # Try to use the credentials file if it exists
                credentials_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'isl.json')
                if os.path.exists(credentials_path):
                    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
                    logger.info(f"Using Google Cloud credentials from: {credentials_path}")
                
                self.client = texttospeech.TextToSpeechClient()
                self._initialized = True
                logger.info("Google Cloud TTS client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Google Cloud TTS client: {e}")
                raise RuntimeError("Google Cloud TTS client initialization failed. Please check your credentials.")

    def generate_audio(self, text: str, language: str) -> bytes:
        """Generate audio for a single text in specified language"""
        try:
            self._initialize_client()
            
            # Get voice and language code
            voice_name = self.voices.get(language, self.voices['en'])
            language_code = self.language_codes.get(language, 'en-IN')
            
            # Create synthesis input
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            # Configure voice
            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                name=voice_name
            )
            
            # Configure audio
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=0.9,  # Previous speech rate
                pitch=0.0
            )
            
            # Perform text-to-speech request
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            return response.audio_content
            
        except Exception as e:
            logger.error(f"Error generating audio for language {language}: {str(e)}")
            raise

    def generate_multi_language_audio(self, announcements: Dict[str, str]) -> bytes:
        """Generate multi-language audio announcement"""
        try:
            # Create temporary directory for audio files
            with tempfile.TemporaryDirectory() as temp_dir:
                audio_files = []
                
                # Generate audio for each language
                for lang, text in announcements.items():
                    if text and text.strip():
                        audio_content = self.generate_audio(text, lang)
                        
                        # Save to temporary file
                        audio_file = os.path.join(temp_dir, f"{lang}.mp3")
                        with open(audio_file, 'wb') as f:
                            f.write(audio_content)
                        audio_files.append(audio_file)
                
                if not audio_files:
                    raise ValueError("No valid announcements provided")
                
                # Create concat file for ffmpeg
                concat_file = os.path.join(temp_dir, "concat.txt")
                with open(concat_file, 'w') as f:
                    for audio_file in audio_files:
                        f.write(f"file '{audio_file}'\n")
                
                # Output file
                output_file = os.path.join(temp_dir, "combined.mp3")
                
                # Use ffmpeg to concatenate audio files
                cmd = [
                    'ffmpeg', '-f', 'concat', '-safe', '0',
                    '-i', concat_file, '-c', 'copy', output_file,
                    '-y'  # Overwrite output file
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode != 0:
                    logger.error(f"FFmpeg error: {result.stderr}")
                    raise RuntimeError(f"Failed to combine audio files: {result.stderr}")
                
                # Read the combined audio file
                with open(output_file, 'rb') as f:
                    return f.read()
                    
        except Exception as e:
            logger.error(f"Error generating multi-language audio: {str(e)}")
            raise

    def get_supported_languages(self) -> List[str]:
        """Get list of supported language codes"""
        return list(self.voices.keys())

# Global instance
audio_generator = AudioGenerator() 