from fastapi import FastAPI, Depends, HTTPException, status, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta
import os
import json
import time
from typing import List

from . import models, schemas, auth
from .database import engine, get_db
from .translation import translation_service
from .audio_generator import audio_generator
from .isl_video_generator import isl_generator

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="IRAS-DDH API",
    description="Indian Railway Announcement System for DHH - Backend API",
    version="1.0.0"
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development/remote access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# NOTE: For production, set allow_origins to your frontend domain(s) only for security.

# Create default users on startup
def create_default_users():
    db = Session(engine)
    try:
        # Check if default users already exist
        admin_user = db.query(models.User).filter(models.User.email == "admin@indianrail.gov.in").first()
        operator_user = db.query(models.User).filter(models.User.email == "operator@indianrail.gov.in").first()
        
        # Create admin user if not exists
        if not admin_user:
            admin_user = models.User(
                email="admin@indianrail.gov.in",
                username="admin",
                hashed_password=auth.get_password_hash("admin123"),
                role="admin",
                station_code=None
            )
            db.add(admin_user)
            print("✅ Default admin user created")
        
        # Create operator user if not exists
        if not operator_user:
            operator_user = models.User(
                email="operator@indianrail.gov.in",
                username="operator",
                hashed_password=auth.get_password_hash("operator123"),
                role="operator",
                station_code="NDLS"  # Default to New Delhi station
            )
            db.add(operator_user)
            print("✅ Default operator user created (assigned to NDLS station)")
        elif operator_user.role == "operator" and not operator_user.station_code:
            # Update existing operator without station code
            operator_user.station_code = "NDLS"
            print("✅ Updated existing operator with NDLS station code")
        
        db.commit()
        print("🎉 Default users setup completed!")
        
    except Exception as e:
        print(f"❌ Error creating default users: {e}")
        db.rollback()
    finally:
        db.close()

def create_default_stations():
    db = Session(engine)
    try:
        # Default stations data
        default_stations = [
            {"station_name": "New Delhi", "station_code": "NDLS", "city": "New Delhi", "state": "Delhi"},
            {"station_name": "Mumbai Central", "station_code": "BCT", "city": "Mumbai", "state": "Maharashtra"},
            {"station_name": "Chennai Central", "station_code": "MAS", "city": "Chennai", "state": "Tamil Nadu"},
            {"station_name": "Howrah", "station_code": "HWH", "city": "Kolkata", "state": "West Bengal"},
            {"station_name": "Bangalore City", "station_code": "SBC", "city": "Bangalore", "state": "Karnataka"},
            {"station_name": "Hyderabad", "station_code": "HYB", "city": "Hyderabad", "state": "Telangana"},
            {"station_name": "Ahmedabad", "station_code": "ADI", "city": "Ahmedabad", "state": "Gujarat"},
            {"station_name": "Pune", "station_code": "PUNE", "city": "Pune", "state": "Maharashtra"},
            {"station_name": "Jaipur", "station_code": "JP", "city": "Jaipur", "state": "Rajasthan"},
            {"station_name": "Lucknow", "station_code": "LKO", "city": "Lucknow", "state": "Uttar Pradesh"},
            {"station_name": "Patna", "station_code": "PNBE", "city": "Patna", "state": "Bihar"},
            {"station_name": "Bhubaneswar", "station_code": "BBS", "city": "Bhubaneswar", "state": "Odisha"},
            {"station_name": "Ghaziabad", "station_code": "GZB", "city": "Ghaziabad", "state": "Uttar Pradesh"},
            {"station_name": "Firozpur", "station_code": "FZR", "city": "Firozpur", "state": "Punjab"},
            {"station_name": "Jammu Tawi", "station_code": "JAT", "city": "Jammu", "state": "Jammu and Kashmir"},
        ]
        
        # Create stations if they don't exist
        for station_data in default_stations:
            existing_station = db.query(models.StationMaster).filter(
                models.StationMaster.station_code == station_data["station_code"]
            ).first()
            
            if not existing_station:
                station = models.StationMaster(**station_data)
                db.add(station)
                print(f"✅ Created station: {station_data['station_name']} ({station_data['station_code']})")
        
        db.commit()
        print("🎉 Default stations setup completed!")
        
    except Exception as e:
        print(f"❌ Error creating default stations: {e}")
        db.rollback()
    finally:
        db.close()

# Create default users on startup
@app.on_event("startup")
async def startup_event():
    create_default_users()

@app.get("/")
async def root():
    return {
        "message": "IRAS-DDH API is running!",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.post("/auth/login", response_model=schemas.Token)
async def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Validate that the user's role matches the requested role
    if user.role != user_credentials.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. This account has '{user.role}' role, but you requested '{user_credentials.role}' role.",
        )
    
    # For operators, ensure they have a station assigned
    if user.role == "operator" and not user.station_code:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. This operator is not assigned to any station. Please contact your administrator."
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/auth/me", response_model=schemas.User)
async def get_current_user_info(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/auth/users", response_model=list[schemas.User])
async def get_users(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Only admin can view all users
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    users = db.query(models.User).all()
    return users

@app.post("/auth/register", response_model=schemas.User)
async def register_user(
    user: schemas.UserCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Only admin can register new users
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if user already exists
    existing_user = db.query(models.User).filter(
        (models.User.email == user.email) | (models.User.username == user.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    
    # Validate station code for operators
    if user.role == "operator" and not user.station_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Station code is mandatory for operators"
        )
    
    # Create new user
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        role=user.role,
        station_code=user.station_code if user.role == "operator" else None
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.delete("/auth/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Only admin can delete users
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Prevent admin from deleting themselves
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Find the user to delete
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent deletion of other admin users (optional security measure)
    if db_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete admin users"
        )
    
    try:
        # Soft delete by setting is_active to False
        db_user.is_active = False
        db.commit()
        
        return {
            "message": f"User {db_user.username} has been successfully deleted",
            "deleted_user": {
                "id": db_user.id,
                "username": db_user.username,
                "email": db_user.email,
                "role": db_user.role
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )

# Train Timetable Management Endpoints (Admin Only)
@app.post("/trains", response_model=schemas.Train)
async def create_train(
    train: schemas.TrainCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Only admin can create trains
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if train number already exists
    existing_train = db.query(models.Train).filter(models.Train.train_number == train.train_number).first()
    if existing_train:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Train with this number already exists"
        )
    
    # Create train
    db_train = models.Train(
        train_number=train.train_number,
        train_name=train.train_name,
        start_station=train.start_station,
        end_station=train.end_station
    )
    db.add(db_train)
    db.commit()
    db.refresh(db_train)
    
    # Create stations
    for station_data in train.stations:
        db_station = models.Station(
            train_id=db_train.id,
            station_name=station_data.station_name,
            station_code=station_data.station_code,
            platform_number=station_data.platform_number,
            sequence_order=station_data.sequence_order
        )
        db.add(db_station)
    
    db.commit()
    db.refresh(db_train)
    
    # Get the train with stations
    return db.query(models.Train).filter(models.Train.id == db_train.id).first()

@app.get("/trains", response_model=list[schemas.Train])
async def get_trains(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    trains = db.query(models.Train).all()
    return trains

@app.get("/trains/station/{station_code}", response_model=List[schemas.Train])
async def get_trains_by_station(
    station_code: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all trains that pass through a specific station"""
    
    # If station_code is "ALL", return all trains
    if station_code.upper() == "ALL":
        trains = db.query(models.Train).all()
    else:
        # Find trains that have the specified station
        trains = db.query(models.Train).join(models.Station).filter(
            models.Station.station_code == station_code
        ).all()
    
    return trains

@app.get("/trains/{train_id}", response_model=schemas.Train)
async def get_train(
    train_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    train = db.query(models.Train).filter(models.Train.id == train_id).first()
    if not train:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Train not found"
        )
    return train

@app.put("/trains/{train_id}", response_model=schemas.Train)
async def update_train(
    train_id: int,
    train_update: schemas.TrainUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Only admin can update trains
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    print(f"🔍 Updating train {train_id} with data: {train_update.dict()}")
    
    db_train = db.query(models.Train).filter(models.Train.id == train_id).first()
    if not db_train:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Train not found"
        )
    
    # Update train fields (excluding stations)
    train_data = train_update.dict(exclude_unset=True, exclude={'stations'})
    print(f"🔍 Updating train fields: {train_data}")
    for field, value in train_data.items():
        setattr(db_train, field, value)
    
    # Handle station updates if provided
    if train_update.stations is not None:
        print(f"🔍 Updating {len(train_update.stations)} stations")
        # Delete existing stations for this train
        deleted_count = db.query(models.Station).filter(models.Station.train_id == train_id).delete()
        print(f"🔍 Deleted {deleted_count} existing stations")
        
        # Create new stations
        for i, station_data in enumerate(train_update.stations):
            db_station = models.Station(
                train_id=train_id,
                station_name=station_data.station_name,
                station_code=station_data.station_code,
                platform_number=station_data.platform_number,
                sequence_order=station_data.sequence_order
            )
            db.add(db_station)
            print(f"🔍 Added station {i+1}: {station_data.station_name} ({station_data.station_code})")
    
    try:
        db.commit()
        db.refresh(db_train)
        print(f"✅ Successfully updated train {train_id}")
        return db_train
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating train: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update train: {str(e)}"
        )

@app.delete("/trains/{train_id}")
async def delete_train(
    train_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Only admin can delete trains
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_train = db.query(models.Train).filter(models.Train.id == train_id).first()
    if not db_train:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Train not found"
        )
    
    db.delete(db_train)
    db.commit()
    return {"message": "Train deleted successfully"}

# Station Master Management Endpoints (Admin Only)
@app.post("/stations", response_model=schemas.StationMaster)
async def create_station(
    station: schemas.StationMasterCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Only admin can create stations
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Debug logging
        print(f"🔍 Creating station: {station.station_name} ({station.station_code}) with state: '{station.state}'")
        print(f"🔍 Station data received: {station.dict()}")
        
        # Check if station code already exists
        existing_station = db.query(models.StationMaster).filter(
            models.StationMaster.station_code == station.station_code
        ).first()
        if existing_station:
            print(f"❌ Station code {station.station_code} already exists")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Station with this code already exists"
            )
        else:
            print(f"✅ Station code {station.station_code} is available")
        
        # Create station
        db_station = models.StationMaster(
            station_name=station.station_name,
            station_code=station.station_code,
            state=station.state
        )
        db.add(db_station)
        
        # Automatically create state-language mapping if state is provided
        if station.state:
            print(f"🔍 Creating state-language mapping for: {station.state}")
            try:
                get_or_create_state_language_mapping(db, station.state)
            except Exception as e:
                print(f"⚠️  Warning: Failed to create state-language mapping: {e}")
                # Continue with station creation even if mapping fails
        else:
            print(f"⚠️  No state provided for station: {station.station_name}")
        
        try:
            db.commit()
            db.refresh(db_station)
            
            # Debug logging after creation
            print(f"✅ Created station: {db_station.station_name} with state: '{db_station.state}'")
            
            return db_station
        except Exception as e:
            db.rollback()
            print(f"❌ Error creating station: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create station: {str(e)}"
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Catch any other unexpected errors
        print(f"❌ Unexpected error in create_station: {e}")
        print(f"❌ Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error creating station: {str(e)}"
        )

@app.get("/stations", response_model=List[schemas.StationMaster])
async def get_stations(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all stations (available to all authenticated users)"""
    stations = db.query(models.StationMaster).filter(models.StationMaster.is_active == True).all()
    return stations

@app.get("/stations/{station_id}", response_model=schemas.StationMaster)
async def get_station(
    station_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    station = db.query(models.StationMaster).filter(models.StationMaster.id == station_id).first()
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station not found"
        )
    return station

@app.put("/stations/{station_id}", response_model=schemas.StationMaster)
async def update_station(
    station_id: int,
    station_update: schemas.StationMasterUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Only admin can update stations
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_station = db.query(models.StationMaster).filter(models.StationMaster.id == station_id).first()
    if not db_station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station not found"
        )
    
    # Check if new station code conflicts with existing one
    if station_update.station_code and station_update.station_code != db_station.station_code:
        existing_station = db.query(models.StationMaster).filter(
            models.StationMaster.station_code == station_update.station_code
        ).first()
        if existing_station:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Station with this code already exists"
            )
    
    # Update station fields
    for field, value in station_update.dict(exclude_unset=True).items():
        setattr(db_station, field, value)
    
    db.commit()
    db.refresh(db_station)
    return db_station

@app.delete("/stations/clear-all")
async def clear_all_stations(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Only admin can clear all stations
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Get count of active stations before clearing
        active_stations_count = db.query(models.StationMaster).filter(
            models.StationMaster.is_active == True
        ).count()
        
        # Soft delete all active stations by setting is_active to False
        db.query(models.StationMaster).filter(
            models.StationMaster.is_active == True
        ).update({"is_active": False})
        
        db.commit()
        
        return {
            "message": f"Successfully cleared {active_stations_count} stations from the database",
            "cleared_count": active_stations_count
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear stations: {str(e)}"
        )

@app.delete("/stations/{station_id}")
async def delete_station(
    station_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Only admin can delete stations
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_station = db.query(models.StationMaster).filter(models.StationMaster.id == station_id).first()
    if not db_station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Station not found"
        )
    
    # Soft delete by setting is_active to False
    db_station.is_active = False
    db.commit()
    return {"message": "Station deactivated successfully"}

# Translation Endpoint
@app.post("/translate/announcement", response_model=schemas.TranslationResponse)
async def translate_announcement(
    request: schemas.TranslationRequest,
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Translate English announcement to Hindi and local language (Gujarati/Marathi)
    """
    # Validate local language
    supported_languages = ['Gujarati', 'Marathi']
    if request.local_language not in supported_languages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Local language must be one of: {', '.join(supported_languages)}"
        )
    
    # Translate the announcement
    translations = translation_service.translate_announcement(
        request.english_text, 
        request.local_language
    )
    
    if not translations['hindi'] and not translations['local']:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Translation service unavailable or failed"
        )
    
    return schemas.TranslationResponse(
        english=translations['english'],
        hindi=translations['hindi'],
        local=translations['local'],
        local_language=request.local_language
    )

# Video Serving Endpoint
@app.get("/videos/{filename}")
async def serve_video(
    filename: str,
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Serve generated video files
    """
    try:
        # Security: only allow MP4 files
        if not filename.endswith('.mp4'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only MP4 files are allowed"
            )
        
        # Look for the video file in the current directory
        video_path = filename
        
        if not os.path.exists(video_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video file not found"
            )
        
        return FileResponse(
            video_path,
            media_type="video/mp4",
            headers={"Content-Disposition": f"inline; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error serving video: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error serving video: {str(e)}"
        )

# Audio Generation Endpoint
@app.post("/generate-audio")
async def generate_audio(
    request: dict,
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Generate multi-language audio announcement using Google Cloud Text-to-Speech
    """
    try:
        # Check if this is for "ALL" station with 4 languages
        is_all_station = request.get("is_all_station", False)
        
        if is_all_station:
            # Handle "ALL" station with 4 languages
            marathi_text = request.get("marathi_text")
            gujarati_text = request.get("gujarati_text")
            english_text = request.get("english_text")
            hindi_text = request.get("hindi_text")
            
            if not english_text and not hindi_text and not marathi_text and not gujarati_text:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="At least one language text is required"
                )
            
            print(f"🎵 Generating audio for ALL station announcement")
            print(f"Marathi: {marathi_text[:50] if marathi_text else 'None'}...")
            print(f"Gujarati: {gujarati_text[:50] if gujarati_text else 'None'}...")
            print(f"English: {english_text[:50] if english_text else 'None'}...")
            print(f"Hindi: {hindi_text[:50] if hindi_text else 'None'}...")
            
            # Prepare announcements dictionary for 4 languages
            announcements = {}
            
            # Add all languages if provided
            if marathi_text:
                announcements['mr'] = marathi_text
            if gujarati_text:
                announcements['gu'] = gujarati_text
            if english_text:
                announcements['en'] = english_text
            if hindi_text:
                announcements['hi'] = hindi_text
        else:
            # Handle specific stations with existing logic
            local_text = request.get("local_text")
            english_text = request.get("english_text")
            hindi_text = request.get("hindi_text")
            local_language = request.get("local_language")
            
            if not english_text and not hindi_text:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="At least English or Hindi text is required"
                )
            
            print(f"🎵 Generating audio for announcement")
            print(f"Local ({local_language}): {local_text[:50] if local_text else 'None'}...")
            print(f"English: {english_text[:50] if english_text else 'None'}...")
            print(f"Hindi: {hindi_text[:50] if hindi_text else 'None'}...")
            
            # Prepare announcements dictionary
            announcements = {}
            
            # Add local language if provided
            if local_text and local_language:
                # Map language name to code
                language_map = {
                    'Marathi': 'mr',
                    'Gujarati': 'gu', 
                    'Hindi': 'hi',
                    'English': 'en',
                    'Tamil': 'ta',
                    'Telugu': 'te',
                    'Kannada': 'kn',
                    'Malayalam': 'ml',
                    'Bengali': 'bn',
                    'Punjabi': 'pa',
                    'Odia': 'or',
                    'Assamese': 'as'
                }
                lang_code = language_map.get(local_language, 'en')
                announcements[lang_code] = local_text
            
            # Add English if provided
            if english_text:
                announcements['en'] = english_text
                
            # Add Hindi if provided
            if hindi_text:
                announcements['hi'] = hindi_text
        
        # Generate multi-language audio
        audio_content = audio_generator.generate_multi_language_audio(announcements)
        
        # Check if audio content is valid
        if not audio_content or len(audio_content) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Generated audio content is empty"
            )
        
        print(f"🎵 Generated audio content size: {len(audio_content)} bytes")
        
        # Save audio to file in /var/www/html/audio_preview/
        import uuid
        filename = f"announcement_{uuid.uuid4().hex[:8]}.mp3"
        
        # Create the audio preview directory if it doesn't exist
        audio_preview_dir = "/var/www/html/audio_preview"
        
        try:
            # Try to create directory with proper error handling
            if not os.path.exists(audio_preview_dir):
                os.makedirs(audio_preview_dir, exist_ok=True)
                print(f"📁 Created audio preview directory: {audio_preview_dir}")
            
            # Try to set permissions (may fail if not running as root)
            try:
                os.chmod(audio_preview_dir, 0o755)
                print(f"🔐 Set directory permissions: {audio_preview_dir}")
            except PermissionError:
                print(f"⚠️  Could not set directory permissions (not running as root): {audio_preview_dir}")
            
        except PermissionError as e:
            print(f"❌ Permission error creating directory: {e}")
            # Fallback to current directory if permission denied
            audio_preview_dir = os.path.dirname(os.path.abspath(__file__))
            print(f"🔄 Falling back to backend directory: {audio_preview_dir}")
        except Exception as e:
            print(f"❌ Error creating directory: {e}")
            # Fallback to current directory
            audio_preview_dir = os.path.dirname(os.path.abspath(__file__))
            print(f"🔄 Falling back to backend directory: {audio_preview_dir}")
        
        audio_path = os.path.join(audio_preview_dir, filename)
        
        print(f"🎵 Saving audio to: {audio_path}")
        
        try:
            with open(audio_path, 'wb') as f:
                f.write(audio_content)
            
            # Try to set file permissions (may fail if not running as root)
            try:
                os.chmod(audio_path, 0o644)
                print(f"🔐 Set file permissions: {audio_path}")
            except PermissionError:
                print(f"⚠️  Could not set file permissions (not running as root): {audio_path}")
                
        except PermissionError as e:
            print(f"❌ Permission error writing file: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Permission denied writing audio file: {str(e)}"
            )
        except Exception as e:
            print(f"❌ Error writing file: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error writing audio file: {str(e)}"
            )
        
        # Verify file was created and has content
        if not os.path.exists(audio_path):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save audio file"
            )
        
        file_size = os.path.getsize(audio_path)
        print(f"🎵 Saved audio file size: {file_size} bytes")
        
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Saved audio file is empty"
            )
        
        # Return the audio file path and URL
        audio_url = f"/audio/{filename}"
        return {
            "success": True,
            "audio_path": audio_path,
            "audio_url": audio_url,
            "message": "Multi-language audio generated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in generate_audio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating audio: {str(e)}"
        )

# Audio Serving Endpoint
@app.get("/audio/{filename}")
async def serve_audio(
    filename: str,
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Serve generated audio files
    """
    try:
        # Security: only allow MP3 files
        if not filename.endswith('.mp3'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only MP3 files are allowed"
            )
        
        # Look for the audio file in the audio preview directory or fallback to backend directory
        audio_preview_dir = "/var/www/html/audio_preview"
        audio_path = os.path.join(audio_preview_dir, filename)
        
        # If not found in audio preview directory, try backend directory
        if not os.path.exists(audio_path):
            backend_dir = os.path.dirname(os.path.abspath(__file__))
            audio_path = os.path.join(backend_dir, filename)
            print(f"🔄 Looking for audio file in backend directory: {audio_path}")
        else:
            print(f"🎵 Looking for audio file at: {audio_path}")
        
        if not os.path.exists(audio_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Audio file not found at {audio_path}"
            )
        
        return FileResponse(
            audio_path,
            media_type="audio/mpeg",
            headers={"Content-Disposition": f"inline; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error serving audio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error serving audio: {str(e)}"
        )

# Audio Cleanup Endpoint
@app.post("/audio/cleanup")
async def cleanup_audio_files(
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Clean up old audio files from the audio preview directory
    """
    try:
        audio_preview_dir = "/var/www/html/audio_preview"
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        
        cleaned_count = 0
        
        # Clean up audio preview directory if it exists
        if os.path.exists(audio_preview_dir):
            audio_files = [f for f in os.listdir(audio_preview_dir) if f.endswith('.mp3')]
            for filename in audio_files:
                file_path = os.path.join(audio_preview_dir, filename)
                try:
                    os.remove(file_path)
                    cleaned_count += 1
                    print(f"🗑️ Cleaned up audio file from preview directory: {filename}")
                except Exception as e:
                    print(f"❌ Error cleaning up {filename} from preview directory: {e}")
        
        # Also clean up backend directory
        if os.path.exists(backend_dir):
            audio_files = [f for f in os.listdir(backend_dir) if f.endswith('.mp3')]
            for filename in audio_files:
                file_path = os.path.join(backend_dir, filename)
                try:
                    os.remove(file_path)
                    cleaned_count += 1
                    print(f"🗑️ Cleaned up audio file from backend directory: {filename}")
                except Exception as e:
                    print(f"❌ Error cleaning up {filename} from backend directory: {e}")
        
        return {
            "message": f"Cleaned up {cleaned_count} audio files",
            "cleaned_count": cleaned_count
        }
        
    except Exception as e:
        print(f"❌ Error in cleanup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cleaning up audio files: {str(e)}"
        )

@app.post("/generate-isl-video")
async def generate_isl_video(
    request: dict,
    current_user: models.User = Depends(auth.get_current_user)
):
    """Generate ISL video from English text"""
    try:
        english_text = request.get("english_text", "").strip()
        
        if not english_text:
            raise HTTPException(status_code=400, detail="English text is required")
        
        # Create ISL videos directory if it doesn't exist
        isl_videos_dir = "/var/www/html/isl_videos"
        try:
            os.makedirs(isl_videos_dir, exist_ok=True)
            # Set permissions for web server access
            os.chmod(isl_videos_dir, 0o755)
            # Try to set ownership to current user if possible
            try:
                import pwd
                current_uid = os.getuid()
                os.chown(isl_videos_dir, current_uid, -1)
            except (ImportError, OSError):
                pass  # Skip ownership change if not possible
        except PermissionError:
            # Fallback to backend directory if permission denied
            isl_videos_dir = "isl_videos"
            os.makedirs(isl_videos_dir, exist_ok=True)
        
        # Generate unique filename
        import uuid
        filename = f"isl_announcement_{uuid.uuid4().hex[:8]}.mp4"
        output_path = os.path.join(isl_videos_dir, filename)
        
        # Generate audio files for all languages if requested
        audio_files = {}
        if request.get("include_audio", True):
            try:
                # Generate audio for each language
                languages = {
                    'english': 'en',
                    'hindi': 'hi', 
                    'marathi': 'mr',
                    'gujarati': 'gu'
                }
                
                for lang_name, lang_code in languages.items():
                    # Generate audio using the audio generator
                    audio_content = audio_generator.generate_audio(english_text, lang_code)
                    
                    # Save audio to temporary file
                    temp_audio_path = f"/tmp/isl_audio_{lang_name}_{uuid.uuid4().hex[:8]}.mp3"
                    with open(temp_audio_path, 'wb') as f:
                        f.write(audio_content)
                    
                    audio_files[lang_name] = temp_audio_path
                    print(f"Generated audio for {lang_name}: {temp_audio_path}")
                
            except Exception as e:
                print(f"Error generating audio files: {e}")
                # Continue without audio if there's an error
        
        # Generate ISL video with audio
        result_path = isl_generator.generate_isl_video(english_text, output_path, audio_files)
        
        if not result_path:
            raise HTTPException(status_code=500, detail="Failed to generate ISL video")
        
        # Get file size
        file_size = os.path.getsize(result_path) if os.path.exists(result_path) else 0
        
        # Clean up temporary audio files
        for audio_path in audio_files.values():
            try:
                if os.path.exists(audio_path):
                    os.unlink(audio_path)
                    print(f"Cleaned up temporary audio file: {audio_path}")
            except Exception as e:
                print(f"Error cleaning up audio file {audio_path}: {e}")
        
        return {
            "success": True,
            "filename": filename,
            "file_path": result_path,
            "file_size": file_size,
            "video_url": f"/isl-videos/{filename}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating ISL video: {str(e)}")

@app.get("/isl-videos/{filename}")
async def serve_isl_video(filename: str):
    """Serve ISL video files (public endpoint for video playback)"""
    try:
        # Security: only allow MP4 files
        if not filename.endswith('.mp4'):
            raise HTTPException(status_code=400, detail="Only MP4 files are allowed")
        
        # Security: only allow ISL announcement files
        if not filename.startswith('isl_announcement_'):
            raise HTTPException(status_code=400, detail="Invalid filename format")
        
        # Try to serve from /var/www/html/isl_videos/ first
        video_path = f"/var/www/html/isl_videos/{filename}"
        if os.path.exists(video_path):
            return FileResponse(
                video_path,
                media_type="video/mp4",
                headers={"Content-Disposition": f"inline; filename={filename}"}
            )
        
        # Fallback to backend directory
        video_path = f"isl_videos/{filename}"
        if os.path.exists(video_path):
            return FileResponse(
                video_path,
                media_type="video/mp4",
                headers={"Content-Disposition": f"inline; filename={filename}"}
            )
        
        raise HTTPException(status_code=404, detail="ISL video file not found")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error serving ISL video: {str(e)}")

@app.delete("/isl-videos/{filename}")
async def delete_isl_video(
    filename: str,
    current_user: models.User = Depends(auth.get_current_user)
):
    """Delete an ISL video file"""
    try:
        # Try to delete from /var/www/html/isl_videos/ first
        video_path = f"/var/www/html/isl_videos/{filename}"
        if os.path.exists(video_path):
            os.remove(video_path)
            return {"message": f"ISL video file {filename} deleted successfully"}
        
        # Fallback to backend directory
        video_path = f"isl_videos/{filename}"
        if os.path.exists(video_path):
            os.remove(video_path)
            return {"message": f"ISL video file {filename} deleted successfully"}
        
        raise HTTPException(status_code=404, detail="ISL video file not found")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting ISL video file: {str(e)}")

@app.post("/isl-videos/cleanup")
async def cleanup_isl_video_files(
    current_user: models.User = Depends(auth.get_current_user)
):
    """Clean up old ISL video files"""
    try:
        import time
        current_time = time.time()
        max_age = 3600  # 1 hour in seconds
        
        cleaned_files = []
        
        # Clean up from /var/www/html/isl_videos/ first
        isl_videos_dir = "/var/www/html/isl_videos"
        if os.path.exists(isl_videos_dir):
            for filename in os.listdir(isl_videos_dir):
                if filename.endswith('.mp4'):
                    file_path = os.path.join(isl_videos_dir, filename)
                    file_age = current_time - os.path.getmtime(file_path)
                    if file_age > max_age:
                        os.remove(file_path)
                        cleaned_files.append(filename)
        
        # Clean up from backend directory
        isl_videos_dir = "isl_videos"
        if os.path.exists(isl_videos_dir):
            for filename in os.listdir(isl_videos_dir):
                if filename.endswith('.mp4'):
                    file_path = os.path.join(isl_videos_dir, filename)
                    file_age = current_time - os.path.getmtime(file_path)
                    if file_age > max_age:
                        os.remove(file_path)
                        cleaned_files.append(filename)
        
        return {
            "message": f"Cleaned up {len(cleaned_files)} old ISL video files",
            "cleaned_files": cleaned_files
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cleaning up ISL video files: {str(e)}")

# Audio File Deletion Endpoint
@app.delete("/audio/{filename}")
async def delete_audio(
    filename: str,
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Delete generated audio files
    """
    try:
        # Security: only allow MP3 files
        if not filename.endswith('.mp3'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only MP3 files are allowed"
            )
        
        # Look for the audio file in the audio preview directory or fallback to backend directory
        audio_preview_dir = "/var/www/html/audio_preview"
        audio_path = os.path.join(audio_preview_dir, filename)
        
        # If not found in audio preview directory, try backend directory
        if not os.path.exists(audio_path):
            backend_dir = os.path.dirname(os.path.abspath(__file__))
            audio_path = os.path.join(backend_dir, filename)
            print(f"🔄 Looking for audio file to delete in backend directory: {audio_path}")
        else:
            print(f"🎵 Looking for audio file to delete at: {audio_path}")
        
        if not os.path.exists(audio_path):
            # File doesn't exist, but that's okay - it may have been cleaned up already
            print(f"ℹ️ Audio file not found (already deleted): {filename}")
            return {"message": "Audio file not found (may have been already deleted)"}
        
        # Delete the file
        os.remove(audio_path)
        print(f"🗑️ Deleted audio file: {filename}")
        
        return {"message": "Audio file deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting audio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting audio: {str(e)}"
        )

# Audio File Management Endpoints (Admin Only)
@app.post("/audio-files", response_model=schemas.AudioFile)
async def create_audio_file(
    audio_data: schemas.AudioFileCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new audio file from text"""
    # Only admin can create audio files
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Generate audio from text
        print(f"🎵 Generating audio for: {audio_data.title}")
        print(f"Text: {audio_data.text_content[:100]}...")
        print(f"Language: {audio_data.language}")
        
        # Map language to code
        language_map = {
            'English': 'en',
            'Hindi': 'hi',
            'Marathi': 'mr',
            'Gujarati': 'gu',
            'Tamil': 'ta',
            'Telugu': 'te',
            'Kannada': 'kn',
            'Malayalam': 'ml',
            'Bengali': 'bn',
            'Punjabi': 'pa',
            'Odia': 'or',
            'Assamese': 'as'
        }
        
        lang_code = language_map.get(audio_data.language, 'en')
        
        # Generate audio using existing audio generator
        audio_content = audio_generator.generate_audio(audio_data.text_content, lang_code)
        
        # Create unique filename
        import uuid
        filename = f"audio_db_{uuid.uuid4().hex[:8]}.mp3"
        file_path = f"static/audio_db/{filename}"
        
        # Save audio file
        with open(file_path, 'wb') as f:
            f.write(audio_content)
        
        # Get file size
        file_size = len(audio_content)
        
        # Create database record
        db_audio = models.AudioFile(
            title=audio_data.title,
            description=audio_data.description,
            filename=filename,
            file_path=file_path,
            file_size=file_size,
            language=audio_data.language,
            text_content=audio_data.text_content,
            created_by=current_user.id
        )
        
        db.add(db_audio)
        db.commit()
        db.refresh(db_audio)
        
        print(f"✅ Created audio file: {filename}")
        
        return db_audio
        
    except Exception as e:
        print(f"❌ Error creating audio file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create audio file: {str(e)}"
        )

@app.get("/audio-files", response_model=List[schemas.AudioFile])
async def get_audio_files(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all audio files (admin only)"""
    # Only admin can view audio files
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    audio_files = db.query(models.AudioFile).filter(models.AudioFile.is_active == True).all()
    return audio_files

@app.get("/audio-files/{audio_id}", response_model=schemas.AudioFile)
async def get_audio_file(
    audio_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific audio file (admin only)"""
    # Only admin can view audio files
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    audio_file = db.query(models.AudioFile).filter(models.AudioFile.id == audio_id).first()
    if not audio_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found"
        )
    
    return audio_file

@app.put("/audio-files/{audio_id}", response_model=schemas.AudioFile)
async def update_audio_file(
    audio_id: int,
    audio_update: schemas.AudioFileUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update an audio file (admin only)"""
    # Only admin can update audio files
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_audio = db.query(models.AudioFile).filter(models.AudioFile.id == audio_id).first()
    if not db_audio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found"
        )
    
    # Update fields
    for field, value in audio_update.dict(exclude_unset=True).items():
        setattr(db_audio, field, value)
    
    db.commit()
    db.refresh(db_audio)
    return db_audio

@app.delete("/audio-files/{audio_id}")
async def delete_audio_file(
    audio_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an audio file (admin only)"""
    # Only admin can delete audio files
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_audio = db.query(models.AudioFile).filter(models.AudioFile.id == audio_id).first()
    if not db_audio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found"
        )
    
    try:
        # Delete physical file
        if os.path.exists(db_audio.file_path):
            os.remove(db_audio.file_path)
            print(f"🗑️ Deleted audio file: {db_audio.filename}")
        
        # Soft delete from database
        db_audio.is_active = False
        db.commit()
        
        return {"message": f"Audio file '{db_audio.title}' deleted successfully"}
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting audio file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete audio file: {str(e)}"
        )

@app.get("/audio-files/{audio_id}/play")
async def play_audio_file(
    audio_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Serve an audio file for playback (admin only)"""
    # Only admin can access audio files
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_audio = db.query(models.AudioFile).filter(models.AudioFile.id == audio_id).first()
    if not db_audio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found"
        )
    
    try:
        if os.path.exists(db_audio.file_path):
            return FileResponse(
                db_audio.file_path,
                media_type="audio/mpeg",
                filename=db_audio.filename
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio file not found on disk"
            )
    except Exception as e:
        print(f"❌ Error serving audio file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error serving audio file: {str(e)}"
        )

# Multi-Language Audio File Management Endpoints (Admin Only)
@app.post("/multi-language-audio", response_model=schemas.MultiLanguageAudioFile)
async def create_multi_language_audio(
    audio_data: schemas.MultiLanguageAudioFileCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create multi-language audio files from English text"""
    # Only admin can create audio files
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        print(f"🎵 Generating multi-language audio for: {audio_data.title}")
        print(f"Original text: {audio_data.original_text[:100]}...")
        
        # Language configuration for 4 languages
        languages = [
            {'code': 'en', 'name': 'English'},
            {'code': 'hi', 'name': 'Hindi'},
            {'code': 'mr', 'name': 'Marathi'},
            {'code': 'gu', 'name': 'Gujarati'}
        ]
        
        # Create the main audio file record
        db_audio = models.MultiLanguageAudioFile(
            title=audio_data.title,
            description=audio_data.description,
            original_text=audio_data.original_text,
            created_by=current_user.id
        )
        
        db.add(db_audio)
        db.commit()
        db.refresh(db_audio)
        
        # Generate translations and audio for each language
        for lang in languages:
            try:
                # Get translated text
                if lang['code'] == 'en':
                    translated_text = audio_data.original_text
                else:
                    translated_text = translation_service.translate_text(audio_data.original_text, lang['code'])
                    if not translated_text:
                        print(f"⚠️ Translation failed for {lang['name']}, using original text")
                        translated_text = audio_data.original_text
                
                # Generate audio
                audio_content = audio_generator.generate_audio(translated_text, lang['code'])
                
                # Create unique filename with language code
                import uuid
                filename = f"multi_audio_{db_audio.id}_{lang['code']}_{uuid.uuid4().hex[:8]}.mp3"
                file_path = f"static/audio_db/{filename}"
                
                # Save audio file
                with open(file_path, 'wb') as f:
                    f.write(audio_content)
                
                # Get file size
                file_size = len(audio_content)
                
                # Create language version record
                db_version = models.MultiLanguageAudioVersion(
                    parent_audio_id=db_audio.id,
                    language_code=lang['code'],
                    language_name=lang['name'],
                    translated_text=translated_text,
                    filename=filename,
                    file_path=file_path,
                    file_size=file_size
                )
                
                db.add(db_version)
                print(f"✅ Created {lang['name']} version: {filename}")
                
            except Exception as e:
                print(f"❌ Error creating {lang['name']} version: {e}")
                # Continue with other languages even if one fails
        
        db.commit()
        db.refresh(db_audio)
        
        print(f"✅ Created multi-language audio file with ID: {db_audio.id}")
        return db_audio
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating multi-language audio file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create multi-language audio file: {str(e)}"
        )

@app.get("/multi-language-audio", response_model=List[schemas.MultiLanguageAudioFile])
async def get_multi_language_audio_files(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all multi-language audio files (admin only)"""
    # Only admin can view audio files
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    audio_files = db.query(models.MultiLanguageAudioFile).filter(
        models.MultiLanguageAudioFile.is_active == True
    ).all()
    return audio_files

@app.get("/multi-language-audio/{audio_id}", response_model=schemas.MultiLanguageAudioFile)
async def get_multi_language_audio_file(
    audio_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific multi-language audio file (admin only)"""
    # Only admin can view audio files
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    audio_file = db.query(models.MultiLanguageAudioFile).filter(
        models.MultiLanguageAudioFile.id == audio_id
    ).first()
    if not audio_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Multi-language audio file not found"
        )
    
    return audio_file

@app.delete("/multi-language-audio/{audio_id}")
async def delete_multi_language_audio_file(
    audio_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a multi-language audio file (admin only)"""
    # Only admin can delete audio files
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_audio = db.query(models.MultiLanguageAudioFile).filter(
        models.MultiLanguageAudioFile.id == audio_id
    ).first()
    if not db_audio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Multi-language audio file not found"
        )
    
    try:
        # Delete all language version files
        for version in db_audio.language_versions:
            if os.path.exists(version.file_path):
                os.remove(version.file_path)
                print(f"🗑️ Deleted audio file: {version.filename}")
        
        # Soft delete from database
        db_audio.is_active = False
        db.commit()
        
        return {"message": f"Multi-language audio file '{db_audio.title}' deleted successfully"}
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting multi-language audio file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete multi-language audio file: {str(e)}"
        )

@app.get("/multi-language-audio/{audio_id}/play/{language_code}")
async def play_multi_language_audio(
    audio_id: int,
    language_code: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Serve a specific language version of multi-language audio file (admin only)"""
    # Only admin can access audio files
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Find the specific language version
    version = db.query(models.MultiLanguageAudioVersion).filter(
        models.MultiLanguageAudioVersion.parent_audio_id == audio_id,
        models.MultiLanguageAudioVersion.language_code == language_code,
        models.MultiLanguageAudioVersion.is_active == True
    ).first()
    
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audio file not found for language: {language_code}"
        )
    
    try:
        if os.path.exists(version.file_path):
            return FileResponse(
                version.file_path,
                media_type="audio/mpeg",
                filename=version.filename
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio file not found on disk"
            )
    except Exception as e:
        print(f"❌ Error serving multi-language audio file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error serving multi-language audio file: {str(e)}"
        )

# State Language Mapping Endpoints
@app.get("/state-language-mappings", response_model=List[schemas.StateLanguageMapping])
async def get_state_language_mappings(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all state-language mappings (available to all authenticated users)"""
    mappings = db.query(models.StateLanguageMapping).filter(models.StateLanguageMapping.is_active == True).all()
    return mappings

@app.post("/state-language-mappings", response_model=schemas.StateLanguageMapping)
async def create_state_language_mapping(
    mapping: schemas.StateLanguageMappingCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Only admin can create mappings
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if mapping already exists
    existing_mapping = db.query(models.StateLanguageMapping).filter(
        models.StateLanguageMapping.state == mapping.state
    ).first()
    if existing_mapping:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mapping for this state already exists"
        )
    
    # Create mapping
    db_mapping = models.StateLanguageMapping(
        state=mapping.state,
        language=mapping.language
    )
    db.add(db_mapping)
    db.commit()
    db.refresh(db_mapping)
    return db_mapping

def get_or_create_state_language_mapping(db: Session, state: str) -> str:
    """
    Get language for a state, create mapping if it doesn't exist
    Returns the language name for the given state
    """
    if not state:
        return "Hindi"  # Default fallback
    
    try:
        # Check if mapping exists
        mapping = db.query(models.StateLanguageMapping).filter(
            models.StateLanguageMapping.state == state,
            models.StateLanguageMapping.is_active == True
        ).first()
        
        if mapping:
            return mapping.language
        
        # Create default mapping based on state
        default_mappings = {
            'Maharashtra': 'Marathi',
            'Gujarat': 'Gujarati',
            'Delhi': 'Hindi',
            'Karnataka': 'Kannada',
            'Tamil Nadu': 'Tamil',
            'Kerala': 'Malayalam',
            'Andhra Pradesh': 'Telugu',
            'Telangana': 'Telugu',
            'West Bengal': 'Bengali',
            'Odisha': 'Odia',
            'Assam': 'Assamese',
            'Punjab': 'Punjabi',
            'Haryana': 'Hindi',
            'Uttar Pradesh': 'Hindi',
            'Madhya Pradesh': 'Hindi',
            'Rajasthan': 'Hindi',
            'Bihar': 'Hindi',
            'Jharkhand': 'Hindi',
            'Chhattisgarh': 'Hindi',
            'Uttarakhand': 'Hindi',
            'Himachal Pradesh': 'Hindi',
            'Jammu and Kashmir': 'Kashmiri',
            'Goa': 'Konkani',
            'Mizoram': 'Mizo',
            'Manipur': 'Manipuri',
            'Meghalaya': 'Khasi',
            'Nagaland': 'Naga',
            'Tripura': 'Bengali',
            'Sikkim': 'Nepali',
            'Arunachal Pradesh': 'English',
            'Chandigarh': 'Hindi',
            'Dadra and Nagar Haveli': 'Gujarati',
            'Daman and Diu': 'Gujarati',
            'Lakshadweep': 'Malayalam',
            'Puducherry': 'Tamil',
            'Andaman and Nicobar Islands': 'Hindi',
        }
        
        language = default_mappings.get(state, 'Hindi')
        
        # Create the mapping in database
        new_mapping = models.StateLanguageMapping(
            state=state,
            language=language
        )
        db.add(new_mapping)
        db.commit()
        
        print(f"✅ Created state-language mapping: {state} → {language}")
        return language
        
    except Exception as e:
        print(f"❌ Error in get_or_create_state_language_mapping: {e}")
        # Return default language if mapping creation fails
        return "Hindi"

# Template Announcements Endpoints
@app.post("/announcement-templates", response_model=schemas.AnnouncementTemplate)
async def create_announcement_template(
    template_data: schemas.AnnouncementTemplateCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new announcement template (admin only)"""
    # Only admin can create templates
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Create template
        db_template = models.AnnouncementTemplate(
            title=template_data.title,
            category=template_data.category,
            template_text=template_data.template_text,
            created_by=current_user.id
        )
        db.add(db_template)
        db.commit()
        db.refresh(db_template)
        
        # Create placeholders
        for placeholder_data in template_data.placeholders:
            db_placeholder = models.TemplatePlaceholder(
                template_id=db_template.id,
                placeholder_name=placeholder_data.placeholder_name,
                placeholder_type=placeholder_data.placeholder_type,
                is_required=placeholder_data.is_required,
                default_value=placeholder_data.default_value,
                description=placeholder_data.description
            )
            db.add(db_placeholder)
        
        db.commit()
        db.refresh(db_template)
        
        return db_template
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating announcement template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create announcement template: {str(e)}"
        )

@app.get("/announcement-templates", response_model=List[schemas.AnnouncementTemplate])
async def get_announcement_templates(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all announcement templates (available to all authenticated users)"""
    templates = db.query(models.AnnouncementTemplate).filter(
        models.AnnouncementTemplate.is_active == True
    ).all()
    return templates

@app.get("/announcement-templates/{template_id}", response_model=schemas.AnnouncementTemplate)
async def get_announcement_template(
    template_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific announcement template"""
    template = db.query(models.AnnouncementTemplate).filter(
        models.AnnouncementTemplate.id == template_id,
        models.AnnouncementTemplate.is_active == True
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement template not found"
        )
    
    return template

@app.put("/announcement-templates/{template_id}", response_model=schemas.AnnouncementTemplate)
async def update_announcement_template(
    template_id: int,
    template_update: schemas.AnnouncementTemplateUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update an announcement template (admin only)"""
    # Only admin can update templates
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_template = db.query(models.AnnouncementTemplate).filter(
        models.AnnouncementTemplate.id == template_id
    ).first()
    
    if not db_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement template not found"
        )
    
    # Update template fields
    for field, value in template_update.dict(exclude_unset=True).items():
        setattr(db_template, field, value)
    
    db.commit()
    db.refresh(db_template)
    return db_template

@app.delete("/announcement-templates/{template_id}")
async def delete_announcement_template(
    template_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an announcement template (admin only)"""
    # Only admin can delete templates
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_template = db.query(models.AnnouncementTemplate).filter(
        models.AnnouncementTemplate.id == template_id
    ).first()
    
    if not db_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement template not found"
        )
    
    try:
        # Soft delete
        db_template.is_active = False
        db.commit()
        
        return {"message": f"Announcement template '{db_template.title}' deleted successfully"}
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting announcement template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete announcement template: {str(e)}"
        )

@app.post("/announcement-templates/{template_id}/upload-audio")
async def upload_template_audio(
    template_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Upload audio file for an announcement template (admin only)"""
    # Only admin can upload audio
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Validate file type
    if not file.content_type.startswith('audio/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an audio file"
        )
    
    db_template = db.query(models.AnnouncementTemplate).filter(
        models.AnnouncementTemplate.id == template_id
    ).first()
    
    if not db_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement template not found"
        )
    
    try:
        # Create audio directory if it doesn't exist
        audio_dir = "backend/static/template_audio"
        os.makedirs(audio_dir, exist_ok=True)
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"template_{template_id}_{int(time.time())}{file_extension}"
        file_path = os.path.join(audio_dir, filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Update template with audio file info
        db_template.audio_file_path = file_path
        db_template.filename = filename
        db_template.file_size = len(content)
        
        db.commit()
        db.refresh(db_template)
        
        return {
            "message": "Audio file uploaded successfully",
            "filename": filename,
            "file_size": len(content)
        }
        
    except Exception as e:
        print(f"❌ Error uploading template audio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload audio file: {str(e)}"
        )

@app.post("/announcements/generate", response_model=schemas.GeneratedAnnouncement)
async def generate_announcement(
    request: schemas.AnnouncementGenerationRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Generate an announcement from a template with placeholder values"""
    # Get the template
    template = db.query(models.AnnouncementTemplate).filter(
        models.AnnouncementTemplate.id == request.template_id,
        models.AnnouncementTemplate.is_active == True
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement template not found"
        )
    
    try:
        # Replace placeholders in template text
        final_text = template.template_text
        for placeholder_name, value in request.placeholder_values.items():
            placeholder_pattern = f"{{{placeholder_name}}}"
            final_text = final_text.replace(placeholder_pattern, str(value))
        
        # Create generated announcement record
        db_announcement = models.GeneratedAnnouncement(
            template_id=template.id,
            title=request.title or f"Generated from {template.title}",
            final_text=final_text,
            placeholder_values=json.dumps(request.placeholder_values),
            created_by=current_user.id,
            station_code=current_user.station_code
        )
        db.add(db_announcement)
        db.commit()
        db.refresh(db_announcement)
        
        return db_announcement
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error generating announcement: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate announcement: {str(e)}"
        )

@app.get("/generated-announcements", response_model=List[schemas.GeneratedAnnouncement])
async def get_generated_announcements(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all generated announcements (filtered by user's station if operator)"""
    query = db.query(models.GeneratedAnnouncement).filter(
        models.GeneratedAnnouncement.is_active == True
    )
    
    # If operator, only show announcements for their station or "ALL" station
    if current_user.role == "operator" and current_user.station_code != "ALL":
        query = query.filter(
            models.GeneratedAnnouncement.station_code == current_user.station_code
        )
    
    announcements = query.all()
    return announcements

@app.get("/announcement-templates/{template_id}/play")
async def play_template_audio(
    template_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Serve audio file for an announcement template"""
    template = db.query(models.AnnouncementTemplate).filter(
        models.AnnouncementTemplate.id == template_id,
        models.AnnouncementTemplate.is_active == True
    ).first()
    
    if not template or not template.audio_file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template audio file not found"
        )
    
    try:
        if os.path.exists(template.audio_file_path):
            return FileResponse(
                template.audio_file_path,
                media_type="audio/mpeg",
                filename=template.filename
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio file not found on disk"
            )
    except Exception as e:
        print(f"❌ Error serving template audio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error serving template audio: {str(e)}"
        )

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"❌ Global exception handler caught: {exc}")
    print(f"❌ Exception type: {type(exc)}")
    import traceback
    traceback.print_exc()
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal server error: {str(exc)}",
            "type": str(type(exc).__name__)
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 