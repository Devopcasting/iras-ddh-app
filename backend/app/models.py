from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Time
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'admin' or 'operator'
    station_code = Column(String, nullable=True)  # Station code for operators
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Train(Base):
    __tablename__ = "trains"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String, unique=True, index=True, nullable=False)
    train_name = Column(String, nullable=False)
    start_station = Column(String, nullable=False)
    end_station = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to stations
    stations = relationship("Station", back_populates="train", cascade="all, delete-orphan")

class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False)
    station_name = Column(String, nullable=False)
    station_code = Column(String, nullable=False)  # Station code like NDLS, BCT, etc.
    platform_number = Column(String, nullable=False)
    sequence_order = Column(Integer, nullable=False)  # To maintain station order
    
    # Relationship to train
    train = relationship("Train", back_populates="stations") 

class StationMaster(Base):
    __tablename__ = "station_master"

    id = Column(Integer, primary_key=True, index=True)
    station_name = Column(String, nullable=False)
    station_code = Column(String, unique=True, index=True, nullable=False)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class StateLanguageMapping(Base):
    __tablename__ = "state_language_mapping"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String, unique=True, index=True, nullable=False)
    language = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AudioFile(Base):
    __tablename__ = "audio_files"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    filename = Column(String, nullable=False, unique=True)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)  # Size in bytes
    duration = Column(Integer, nullable=True)  # Duration in seconds
    language = Column(String, nullable=False)  # Language of the audio
    text_content = Column(String, nullable=False)  # Original text used to generate audio
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to user
    creator = relationship("User")

class MultiLanguageAudioFile(Base):
    __tablename__ = "multi_language_audio_files"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    original_text = Column(String, nullable=False)  # Original English text
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to user
    creator = relationship("User")
    # Relationship to language versions
    language_versions = relationship("MultiLanguageAudioVersion", back_populates="parent_audio", cascade="all, delete-orphan")

class MultiLanguageAudioVersion(Base):
    __tablename__ = "multi_language_audio_versions"

    id = Column(Integer, primary_key=True, index=True)
    parent_audio_id = Column(Integer, ForeignKey("multi_language_audio_files.id"), nullable=False)
    language_code = Column(String, nullable=False)  # 'en', 'hi', 'mr', 'gu'
    language_name = Column(String, nullable=False)  # 'English', 'Hindi', 'Marathi', 'Gujarati'
    translated_text = Column(String, nullable=False)  # Translated text
    filename = Column(String, nullable=False, unique=True)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)  # Size in bytes
    duration = Column(Integer, nullable=True)  # Duration in seconds
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to parent audio file
    parent_audio = relationship("MultiLanguageAudioFile", back_populates="language_versions") 