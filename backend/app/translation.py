import os
from google.cloud import translate_v2 as translate
from typing import Dict, Optional

class TranslationService:
    def __init__(self):
        # Initialize the Google Cloud Translate client
        # The credentials file should be at backend/isl.json
        credentials_path = os.path.join(os.path.dirname(__file__), '..', 'isl.json')
        if os.path.exists(credentials_path):
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
            self.client = translate.Client()
        else:
            print("Warning: Google Cloud credentials file not found at", credentials_path)
            self.client = None

    def translate_text(self, text: str, target_language: str) -> Optional[str]:
        """
        Translate text to target language using Google Cloud Translate API
        
        Args:
            text: Text to translate
            target_language: Target language code (e.g., 'hi' for Hindi, 'gu' for Gujarati, 'mr' for Marathi)
            
        Returns:
            Translated text or None if translation fails
        """
        if not self.client:
            print("Translation service not available - credentials not found")
            return None
            
        try:
            result = self.client.translate(text, target_language=target_language)
            return result['translatedText']
        except Exception as e:
            print(f"Translation error: {e}")
            return None

    def translate_announcement(self, english_text: str, local_language: str) -> Dict[str, str]:
        """
        Translate English announcement to Hindi and local language
        
        Args:
            english_text: English announcement text
            local_language: Local language name ('Gujarati' or 'Marathi')
            
        Returns:
            Dictionary with translated texts
        """
        translations = {
            'english': english_text,
            'hindi': '',
            'local': ''
        }
        
        # Language code mapping
        language_codes = {
            'Hindi': 'hi',
            'Gujarati': 'gu', 
            'Marathi': 'mr'
        }
        
        # Translate to Hindi
        hindi_code = language_codes.get('Hindi')
        if hindi_code:
            hindi_translation = self.translate_text(english_text, hindi_code)
            if hindi_translation:
                translations['hindi'] = hindi_translation
        
        # Translate to local language (if different from Hindi)
        if local_language != 'Hindi':
            local_code = language_codes.get(local_language)
            if local_code:
                local_translation = self.translate_text(english_text, local_code)
                if local_translation:
                    translations['local'] = local_translation
        
        return translations

# Create a global instance
translation_service = TranslationService() 