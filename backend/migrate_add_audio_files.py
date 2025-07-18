import os
import sqlite3

# Database path
DB_PATH = "backend/database/iras_ddh.db"

def migrate_add_audio_files():
    """Add audio_files table to the database"""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at: {DB_PATH}")
        print("Please run the application first to create the database.")
        return
    
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if audio_files table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='audio_files'")
        table_exists = cursor.fetchone()
        
        if table_exists:
            print("✅ audio_files table already exists")
        else:
            # Create audio_files table
            print("🔄 Creating audio_files table...")
            cursor.execute("""
                CREATE TABLE audio_files (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    filename TEXT UNIQUE NOT NULL,
                    file_path TEXT NOT NULL,
                    file_size INTEGER,
                    duration INTEGER,
                    language TEXT NOT NULL,
                    text_content TEXT NOT NULL,
                    created_by INTEGER NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (created_by) REFERENCES users (id)
                )
            """)
            print("✅ audio_files table created")
        
        # Create index on created_by for better performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audio_files_created_by ON audio_files (created_by)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audio_files_language ON audio_files (language)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audio_files_is_active ON audio_files (is_active)")
        
        conn.commit()
        print("✅ Audio files migration completed successfully")
        
        # Show table structure
        cursor.execute("PRAGMA table_info(audio_files)")
        columns = cursor.fetchall()
        print("\n📋 audio_files table structure:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]}) {'NOT NULL' if col[3] else 'NULL'}")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_add_audio_files() 