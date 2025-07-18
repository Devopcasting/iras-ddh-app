import os
import sqlite3

# Database path
DB_PATH = "backend/database/iras_ddh.db"

def migrate_add_state_language_mapping():
    """Add state_language_mapping table and populate with default mappings"""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at: {DB_PATH}")
        print("Please run the application first to create the database.")
        return
    
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if state_language_mapping table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='state_language_mapping'")
        table_exists = cursor.fetchone()
        
        if table_exists:
            print("✅ state_language_mapping table already exists")
        else:
            # Create state_language_mapping table
            print("🔄 Creating state_language_mapping table...")
            cursor.execute("""
                CREATE TABLE state_language_mapping (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    state TEXT UNIQUE NOT NULL,
                    language TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            print("✅ state_language_mapping table created")
        
        # Default state-to-language mappings
        default_mappings = [
            ("Maharashtra", "Marathi"),
            ("Gujarat", "Gujarati"),
            ("Delhi", "Hindi"),
            ("Karnataka", "Kannada"),
            ("Tamil Nadu", "Tamil"),
            ("Kerala", "Malayalam"),
            ("Andhra Pradesh", "Telugu"),
            ("Telangana", "Telugu"),
            ("West Bengal", "Bengali"),
            ("Odisha", "Odia"),
            ("Assam", "Assamese"),
            ("Punjab", "Punjabi"),
            ("Haryana", "Hindi"),
            ("Uttar Pradesh", "Hindi"),
            ("Madhya Pradesh", "Hindi"),
            ("Rajasthan", "Hindi"),
            ("Bihar", "Hindi"),
            ("Jharkhand", "Hindi"),
            ("Chhattisgarh", "Hindi"),
            ("Uttarakhand", "Hindi"),
            ("Himachal Pradesh", "Hindi"),
            ("Jammu and Kashmir", "Kashmiri"),
            ("Goa", "Konkani"),
            ("Mizoram", "Mizo"),
            ("Manipur", "Manipuri"),
            ("Meghalaya", "Khasi"),
            ("Nagaland", "Naga"),
            ("Tripura", "Bengali"),
            ("Sikkim", "Nepali"),
            ("Arunachal Pradesh", "English"),
            ("Chandigarh", "Hindi"),
            ("Dadra and Nagar Haveli", "Gujarati"),
            ("Daman and Diu", "Gujarati"),
            ("Lakshadweep", "Malayalam"),
            ("Puducherry", "Tamil"),
            ("Andaman and Nicobar Islands", "Hindi"),
        ]
        
        # Insert default mappings if they don't exist
        print("🔄 Adding default state-language mappings...")
        for state, language in default_mappings:
            cursor.execute("SELECT id FROM state_language_mapping WHERE state = ?", (state,))
            existing = cursor.fetchone()
            
            if not existing:
                cursor.execute("""
                    INSERT INTO state_language_mapping (state, language)
                    VALUES (?, ?)
                """, (state, language))
                print(f"✅ Added mapping: {state} → {language}")
            else:
                print(f"ℹ️  Mapping already exists: {state} → {language}")
        
        conn.commit()
        print("✅ Default state-language mappings added successfully")
        
        # Show current mappings
        cursor.execute("SELECT state, language FROM state_language_mapping WHERE is_active = 1 ORDER BY state")
        mappings = cursor.fetchall()
        
        print("\n📋 Current State-Language Mappings:")
        print("-" * 50)
        for state, language in mappings:
            print(f"{state:<25} → {language}")
        
        conn.close()
        print(f"\n🎉 State language mapping migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    migrate_add_state_language_mapping() 