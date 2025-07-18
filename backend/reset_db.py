import os
from app.database import engine, Base
from app.models import User, Train, Station, StationMaster, StateLanguageMapping
from app.auth import get_password_hash
from sqlalchemy.orm import Session

DB_PATH = "backend/database/iras_ddh.db"

def reset_database():
    # Remove the existing database file
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"🗑️  Removed existing database: {DB_PATH}")
    else:
        print(f"ℹ️  No existing database found at: {DB_PATH}")

    # Recreate tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database and tables created (Users, Trains, Stations, StationMaster, StateLanguageMapping).")

    # Add default users
    db = Session(engine)
    try:
        admin_user = User(
            email="admin@indianrail.gov.in",
            username="admin",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            station_code=None
        )
        # operator_user = User(
        #     email="operator@indianrail.gov.in",
        #     username="operator",
        #     hashed_password=get_password_hash("operator123"),
        #     role="operator",
        #     station_code=None  # No default station assignment
        # )
        db.add(admin_user)
        # db.add(operator_user)
        db.commit()
        print("✅ Default admin user created.")

        # Add default state-language mappings
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
            mapping = StateLanguageMapping(
                state=state,
                language=language
            )
            db.add(mapping)
        
        db.commit()
        print(f"✅ Created {len(default_mappings)} default state-language mappings.")
        print("ℹ️  No default stations created - admin will add stations as needed.")
        print("🎉 Database reset completed!")
        
    except Exception as e:
        print(f"❌ Error creating default data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()
    print("🚀 Database reset complete!") 