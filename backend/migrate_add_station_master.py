import os
import sqlite3

# Database path
DB_PATH = "backend/database/iras_ddh.db"

def migrate_add_station_master():
    """Add station_master table and populate with default stations"""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at: {DB_PATH}")
        print("Please run the application first to create the database.")
        return
    
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if station_master table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='station_master'")
        table_exists = cursor.fetchone()
        
        if table_exists:
            print("✅ station_master table already exists")
        else:
            # Create station_master table
            print("🔄 Creating station_master table...")
            cursor.execute("""
                CREATE TABLE station_master (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    station_name TEXT NOT NULL,
                    station_code TEXT UNIQUE NOT NULL,
                    city TEXT NOT NULL,
                    state TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            print("✅ station_master table created")
        
        # Default stations data
        default_stations = [
            ("New Delhi", "NDLS", "New Delhi", "Delhi"),
            ("Mumbai Central", "BCT", "Mumbai", "Maharashtra"),
            ("Chennai Central", "MAS", "Chennai", "Tamil Nadu"),
            ("Howrah", "HWH", "Kolkata", "West Bengal"),
            ("Bangalore City", "SBC", "Bangalore", "Karnataka"),
            ("Hyderabad", "HYB", "Hyderabad", "Telangana"),
            ("Ahmedabad", "ADI", "Ahmedabad", "Gujarat"),
            ("Pune", "PUNE", "Pune", "Maharashtra"),
            ("Jaipur", "JP", "Jaipur", "Rajasthan"),
            ("Lucknow", "LKO", "Lucknow", "Uttar Pradesh"),
            ("Patna", "PNBE", "Patna", "Bihar"),
            ("Bhubaneswar", "BBS", "Bhubaneswar", "Odisha"),
            ("Ghaziabad", "GZB", "Ghaziabad", "Uttar Pradesh"),
            ("Firozpur", "FZR", "Firozpur", "Punjab"),
            ("Jammu Tawi", "JAT", "Jammu", "Jammu and Kashmir"),
        ]
        
        # Insert default stations if they don't exist
        print("🔄 Adding default stations...")
        for station_name, station_code, city, state in default_stations:
            cursor.execute("SELECT id FROM station_master WHERE station_code = ?", (station_code,))
            existing = cursor.fetchone()
            
            if not existing:
                cursor.execute("""
                    INSERT INTO station_master (station_name, station_code, city, state)
                    VALUES (?, ?, ?, ?)
                """, (station_name, station_code, city, state))
                print(f"✅ Added station: {station_name} ({station_code})")
            else:
                print(f"ℹ️  Station already exists: {station_name} ({station_code})")
        
        conn.commit()
        print("✅ Default stations added successfully")
        
        # Show current stations
        cursor.execute("SELECT station_name, station_code, city, state FROM station_master WHERE is_active = 1")
        stations = cursor.fetchall()
        print(f"\n📋 Current active stations ({len(stations)}):")
        for station in stations:
            print(f"  • {station[0]} ({station[1]}) - {station[2]}, {station[3]}")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Starting migration to add station_master table...")
    migrate_add_station_master()
    print("🎉 Migration completed!") 