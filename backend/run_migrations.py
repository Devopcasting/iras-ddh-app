#!/usr/bin/env python3

import os
import sys

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def run_migrations():
    """Run all database migrations"""
    print("🚀 Starting IRAS-DDH Database Migrations...")
    print("=" * 50)
    
    # Import and run station master migration
    try:
        from migrate_add_station_master import migrate_add_station_master
        print("\n📋 Migration 1: Adding station_master table")
        migrate_add_station_master()
    except ImportError as e:
        print(f"❌ Error importing station master migration: {e}")
    except Exception as e:
        print(f"❌ Error running station master migration: {e}")
    
    print("\n" + "=" * 50)
    
    # Import and run station code migration
    try:
        from migrate_add_station_code import migrate_add_station_code
        print("\n📋 Migration 2: Adding station_code to stations table")
        migrate_add_station_code()
    except ImportError as e:
        print(f"❌ Error importing station migration: {e}")
    except Exception as e:
        print(f"❌ Error running station migration: {e}")
    
    print("\n" + "=" * 50)
    
    # Import and run user station code migration
    try:
        from migrate_add_user_station_code import migrate_add_user_station_code
        print("\n📋 Migration 3: Adding station_code to users table")
        migrate_add_user_station_code()
    except ImportError as e:
        print(f"❌ Error importing user migration: {e}")
    except Exception as e:
        print(f"❌ Error running user migration: {e}")
    
    print("\n" + "=" * 50)
    
    # Import and run template announcements migration
    try:
        from migrate_add_template_announcements import migrate_add_template_announcements
        print("\n📋 Migration 4: Adding template announcements tables")
        migrate_add_template_announcements()
    except ImportError as e:
        print(f"❌ Error importing template announcements migration: {e}")
    except Exception as e:
        print(f"❌ Error running template announcements migration: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 All migrations completed!")

if __name__ == "__main__":
    run_migrations() 