import os
import sqlite3

# Database path
DB_PATH = "backend/database/iras_ddh.db"

def migrate_add_user_station_code():
    """Add station_code column to existing User table"""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at: {DB_PATH}")
        print("Please run the application first to create the database.")
        return
    
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if station_code column already exists in users table
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'station_code' in columns:
            print("✅ station_code column already exists in users table")
            return
        
        # Add station_code column
        print("🔄 Adding station_code column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN station_code TEXT")
        
        # Commit changes
        conn.commit()
        print("✅ Successfully added station_code column to users table")
        
        # Update existing operator users with default station code
        print("🔄 Updating existing operator users with default station code...")
        cursor.execute("""
            UPDATE users 
            SET station_code = 'NDLS' 
            WHERE role = 'operator' AND (station_code IS NULL OR station_code = '')
        """)
        
        # Update admin users to have NULL station_code
        cursor.execute("""
            UPDATE users 
            SET station_code = NULL 
            WHERE role = 'admin'
        """)
        
        conn.commit()
        print("✅ Updated existing users with appropriate station codes")
        
        # Show current users and their station codes
        cursor.execute("SELECT username, role, station_code FROM users")
        users = cursor.fetchall()
        print("\n📋 Current users and their station assignments:")
        for user in users:
            station_info = f"Station: {user[2]}" if user[2] else "No station assigned"
            print(f"  • {user[0]} ({user[1]}) - {station_info}")
        
        # Check for operators without station codes
        cursor.execute("SELECT username FROM users WHERE role = 'operator' AND (station_code IS NULL OR station_code = '')")
        operators_without_station = cursor.fetchall()
        if operators_without_station:
            print("\n⚠️  WARNING: Found operators without station codes:")
            for operator in operators_without_station:
                print(f"  • {operator[0]} - Assigned to NDLS by default")
        else:
            print("\n✅ All operators have station codes assigned")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Starting migration to add station_code to users...")
    migrate_add_user_station_code()
    print("🎉 Migration completed!") 