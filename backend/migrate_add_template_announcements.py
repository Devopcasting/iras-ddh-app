import os
import sqlite3

# Database path
DB_PATH = "backend/database/iras_ddh.db"

def migrate_add_template_announcements():
    """Add template announcements tables to the database"""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at: {DB_PATH}")
        print("Please run the application first to create the database.")
        return
    
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if announcement_templates table already exists
        cursor.execute("PRAGMA table_info(announcement_templates)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if columns:
            print("✅ announcement_templates table already exists")
        else:
            # Create announcement_templates table
            print("🔄 Creating announcement_templates table...")
            cursor.execute("""
                CREATE TABLE announcement_templates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title VARCHAR(255) NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    template_text TEXT NOT NULL,
                    audio_file_path VARCHAR(500),
                    filename VARCHAR(255),
                    file_size INTEGER,
                    duration INTEGER,
                    created_by INTEGER NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP,
                    FOREIGN KEY (created_by) REFERENCES users (id)
                )
            """)
            print("✅ Created announcement_templates table")
        
        # Check if template_placeholders table already exists
        cursor.execute("PRAGMA table_info(template_placeholders)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if columns:
            print("✅ template_placeholders table already exists")
        else:
            # Create template_placeholders table
            print("🔄 Creating template_placeholders table...")
            cursor.execute("""
                CREATE TABLE template_placeholders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    template_id INTEGER NOT NULL,
                    placeholder_name VARCHAR(100) NOT NULL,
                    placeholder_type VARCHAR(50) NOT NULL,
                    is_required BOOLEAN DEFAULT 1,
                    default_value VARCHAR(255),
                    description TEXT,
                    FOREIGN KEY (template_id) REFERENCES announcement_templates (id)
                )
            """)
            print("✅ Created template_placeholders table")
        
        # Check if generated_announcements table already exists
        cursor.execute("PRAGMA table_info(generated_announcements)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if columns:
            print("✅ generated_announcements table already exists")
        else:
            # Create generated_announcements table
            print("🔄 Creating generated_announcements table...")
            cursor.execute("""
                CREATE TABLE generated_announcements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    template_id INTEGER NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    final_text TEXT NOT NULL,
                    audio_file_path VARCHAR(500),
                    filename VARCHAR(255),
                    file_size INTEGER,
                    duration INTEGER,
                    placeholder_values TEXT NOT NULL,
                    created_by INTEGER NOT NULL,
                    station_code VARCHAR(50),
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP,
                    FOREIGN KEY (template_id) REFERENCES announcement_templates (id),
                    FOREIGN KEY (created_by) REFERENCES users (id)
                )
            """)
            print("✅ Created generated_announcements table")
        
        # Commit changes
        conn.commit()
        print("✅ Successfully added template announcements tables")
        
        # Show table information
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%announcement%'")
        tables = cursor.fetchall()
        print(f"\n📋 Template announcement tables: {[table[0] for table in tables]}")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_add_template_announcements() 