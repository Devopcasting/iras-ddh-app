#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal
from app.models import Base, MultiLanguageAudioFile, MultiLanguageAudioVersion

def create_multi_language_audio_tables():
    """Create multi-language audio file tables"""
    print("🔄 Creating multi-language audio file tables...")
    
    try:
        # Create tables
        Base.metadata.create_all(bind=engine, tables=[
            MultiLanguageAudioFile.__table__,
            MultiLanguageAudioVersion.__table__
        ])
        
        print("✅ Multi-language audio file tables created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating multi-language audio file tables: {e}")
        raise

if __name__ == "__main__":
    create_multi_language_audio_tables() 