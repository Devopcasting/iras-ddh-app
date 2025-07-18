#!/usr/bin/env python3

import sys
import os
sys.path.append('backend')

from app.isl_video_generator import isl_generator

def test_word_extraction():
    test_text = "Attention please! Train number 2 0 9 0 1 VANDE BHARAT EXP from MUMBAI CENTRAL to GANDHI NAGAR will arrive at platform number 5. Thank you."
    
    print("Testing ISL word extraction...")
    print(f"Input text: {test_text}")
    print()
    
    # Test the new word extraction method
    words = isl_generator._extract_words_with_train_names(test_text)
    print(f"Extracted words: {words}")
    print()
    
    # Show which words will have videos
    print("Words that will have ISL videos:")
    available_words = []
    missing_words = []
    
    for word in words:
        if word in isl_generator.available_videos:
            available_words.append(word)
            print(f"✅ '{word}' - Available")
        else:
            missing_words.append(word)
            print(f"❌ '{word}' - Not available")
    
    print()
    print(f"Available words: {len(available_words)}")
    print(f"Missing words: {len(missing_words)}")
    print()
    
    # Show available videos in dataset
    print("Available videos in dataset:")
    for word in sorted(isl_generator.available_videos.keys()):
        print(f"  - {word}")
    
    print()
    print("Test completed!")

if __name__ == "__main__":
    test_word_extraction() 