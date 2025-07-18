import os
import sqlite3
from app.database import engine, Base
from app.models import StateLanguageMapping

DB_PATH = "backend/database/iras_ddh.db"

def check_and_create_tables():
    """Check if StateLanguageMapping table exists and create it if needed"""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at: {DB_PATH}")
        print("Please run the application first to create the database.")
        return
    
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if state_language_mapping table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='state_language_mapping'")
        table_exists = cursor.fetchone()
        
        if table_exists:
            print("✅ state_language_mapping table already exists")
            
            # Check if table has any data
            cursor.execute("SELECT COUNT(*) FROM state_language_mapping")
            count = cursor.fetchone()[0]
            print(f"📊 Table has {count} records")
            
        else:
            print("❌ state_language_mapping table does not exist")
            print("🔄 Creating table using SQLAlchemy...")
            
            # Create table using SQLAlchemy
            Base.metadata.create_all(bind=engine, tables=[StateLanguageMapping.__table__])
            print("✅ state_language_mapping table created")
            
            # Add default mappings
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
            
            for state, language in default_mappings:
                cursor.execute("""
                    INSERT INTO state_language_mapping (state, language)
                    VALUES (?, ?)
                """, (state, language))
            
            conn.commit()
            print(f"✅ Added {len(default_mappings)} default state-language mappings")
        
        conn.close()
        print("🎉 Database check completed!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    check_and_create_tables() 