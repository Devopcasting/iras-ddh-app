import os
import sqlite3

# Database path
DB_PATH = "backend/database/iras_ddh.db"

def update_bvi_station():
    """Update BVI station with Maharashtra state"""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at: {DB_PATH}")
        print("Please run the application first to create the database.")
        return
    
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Update BVI station with Maharashtra state
        print("🔄 Updating BVI station with Maharashtra state...")
        cursor.execute("""
            UPDATE station_master 
            SET state = 'Maharashtra' 
            WHERE station_code = 'BVI'
        """)
        
        if cursor.rowcount > 0:
            print("✅ Successfully updated BVI station with Maharashtra state")
        else:
            print("ℹ️  BVI station not found or already has Maharashtra state")
        
        conn.commit()
        conn.close()
        print("🎉 BVI station update completed!")
        
    except Exception as e:
        print(f"❌ Error updating BVI station: {e}")
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    update_bvi_station() 